<template>
  <div v-if="visible" class="spellbook-overlay">
    <div class="spellbook-modal">
      <!-- 标题栏 -->
      <div class="modal-header">
        <div class="header-content">
          <h2><i class="fa-solid fa-book"></i> 法术书</h2>
          <p class="class-info">{{ classInfo }}</p>
        </div>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <!-- 标签页切换 -->
      <div class="tabs-bar">
        <button
          v-if="isWizard"
          :class="['tab-btn', { active: activeTab === 'spellbook' }]"
          @click="activeTab = 'spellbook'"
        >
          📚 法术书
        </button>
        <button :class="['tab-btn', { active: activeTab === 'memorize' }]" @click="activeTab = 'memorize'">
          🧠 记忆法术
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="modal-body">
        <!-- 法术书标签页（仅法师） -->
        <div v-if="activeTab === 'spellbook' && isWizard" class="tab-content">
          <div class="spellbook-content">
            <!-- 顶部信息栏 -->
            <div class="info-bar">
              <div class="info-item">
                <span class="label">习得率:</span>
                <span class="value">{{ learnChance }}%</span>
              </div>
              <div class="info-item">
                <span class="label">最高可学等级:</span>
                <span class="value">{{ maxSpellLevel }}级</span>
              </div>
              <div class="info-item">
                <span class="label">每级上限:</span>
                <span class="value">{{ maxSpellsPerLevel === 999 ? '无限' : maxSpellsPerLevel }}个</span>
              </div>
            </div>

            <!-- 学习新法术按钮 -->
            <div class="action-bar">
              <button class="primary-btn" @click="showLearnSpellDialog = true">
                <span>✨</span>
                学习新法术
              </button>
            </div>

            <!-- 已学法术列表（按等级分组） -->
            <div class="learned-spells">
              <div v-if="spellbookByLevel && Object.keys(spellbookByLevel).length === 0" class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-book"></i></div>
                <p>法术书是空的</p>
                <p class="hint">点击"学习新法术"按钮开始学习</p>
              </div>

              <div v-for="level in availableSpellLevels" :key="level" class="spell-level-group">
                <div v-if="spellbookByLevel[level] && spellbookByLevel[level].length > 0">
                  <div class="level-header">
                    <span class="level">{{ level }}级法术</span>
                    <span class="count"
                      >{{ spellbookByLevel[level].length }}/{{
                        maxSpellsPerLevel === 999 ? '∞' : maxSpellsPerLevel
                      }}</span
                    >
                  </div>
                  <div class="spell-list">
                    <div
                      v-for="spellId in spellbookByLevel[level]"
                      :key="spellId"
                      class="spell-item"
                      @click="showSpellDetail(spellId, 'wizard')"
                    >
                      <div class="spell-name">{{ getWizardSpellName(spellId) }}</div>
                      <div class="spell-school">{{ getWizardSpellSchool(spellId) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 记忆法术标签页 -->
        <div v-if="activeTab === 'memorize'" class="tab-content">
          <div class="memorize-content">
            <!-- 祭司法术领域信息栏 -->
            <div v-if="!isWizard && priestSpellSpheres" class="spell-spheres-info">
              <div class="spheres-header">
                <span class="spheres-icon">✨</span>
                <span class="spheres-title">法术领域权能</span>
              </div>
              <div class="spheres-content">
                <div v-if="priestSpellSpheres.major.length > 0" class="sphere-group">
                  <span class="sphere-label">主要领域:</span>
                  <span class="sphere-list">{{ priestSpellSpheres.major.join('、') }}</span>
                </div>
                <div v-if="priestSpellSpheres.minor.length > 0" class="sphere-group">
                  <span class="sphere-label">次要领域:</span>
                  <span class="sphere-list minor">{{ priestSpellSpheres.minor.join('、') }}</span>
                </div>
              </div>
            </div>

            <!-- 顶部提示栏 -->
            <div class="info-banner">
              <span class="info-icon">ℹ️</span>
              <span class="info-text">已记忆的法术需要在游戏中使用后才会被清除</span>
            </div>

            <!-- 顶部操作栏 -->
            <div class="action-bar">
              <button class="primary-btn" @click="saveMemorizedSpells">
                <span><i class="fa-solid fa-floppy-disk"></i></span>
                保存
              </button>
            </div>

            <!-- 法术槽位（按等级） -->
            <div class="spell-slots">
              <div v-for="level in availableMemorizeLevels" :key="level" class="slot-level-group">
                <div class="slot-header">
                  <span class="level">{{ level }}级法术槽</span>
                  <span class="slot-count">{{ getMemorizedCount(level) }}/{{ getTotalSlots(level) }}</span>
                </div>

                <!-- 已记忆的法术 -->
                <div class="memorized-spells">
                  <div
                    v-for="(spellId, index) in getMemorizedSpells(level)"
                    :key="`${spellId}-${index}`"
                    class="memorized-spell"
                    @click="showMemorizedSpellDetail(spellId)"
                  >
                    <div class="spell-name">{{ getSpellName(spellId) }}</div>
                    <span class="view-icon" title="查看详情">👁️</span>
                  </div>

                  <!-- 空槽位 -->
                  <div
                    v-for="i in getEmptySlots(level)"
                    :key="`empty-${i}`"
                    class="empty-slot"
                    @click="openSpellSelector(level)"
                  >
                    <span class="plus-icon">+</span>
                    <span class="hint">点击选择法术</span>
                  </div>
                </div>
              </div>

              <!-- 无可用槽位提示 -->
              <div v-if="availableMemorizeLevels.length === 0" class="empty-state">
                <div class="empty-icon">🧠</div>
                <p>当前等级没有可用的法术槽位</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习法术对话框 -->
    <div v-if="showLearnSpellDialog" class="dialog-overlay" @click.self="showLearnSpellDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>学习新法术</h3>
          <button class="close-btn" @click="showLearnSpellDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <!-- 等级选择 -->
          <div class="level-selector">
            <button
              v-for="lvl in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
              :key="lvl"
              :class="[
                'level-btn',
                {
                  active: selectedLearnLevel === lvl,
                  disabled: !canLearnSpellLevel(lvl),
                },
              ]"
              :disabled="!canLearnSpellLevel(lvl)"
              :title="getSpellLevelTooltip(lvl)"
              @click="selectedLearnLevel = lvl"
            >
              {{ lvl }}级
            </button>
          </div>

          <!-- 可学习的法术列表 -->
          <div class="spell-selection-list">
            <div
              v-for="spell in getAvailableSpellsToLearn(selectedLearnLevel)"
              :key="spell.id"
              class="selectable-spell"
            >
              <div class="spell-info" @click="showSpellDetailForLearning(spell.id)">
                <div class="spell-name">{{ spell.name }} <span class="view-hint">👁️ 点击查看详情</span></div>
                <div class="spell-meta">{{ spell.school }} | {{ spell.englishName }}</div>
              </div>
              <button class="learn-btn" @click="attemptLearnSpell(spell.id)">学习</button>
            </div>

            <div v-if="getAvailableSpellsToLearn(selectedLearnLevel).length === 0" class="empty-hint">
              {{
                canLearnSpellLevel(selectedLearnLevel) ? '该等级没有可学习的法术' : '角色等级不足，无法学习该等级法术'
              }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 法术选择对话框 -->
    <div v-if="showSpellSelector" class="dialog-overlay" @click.self="showSpellSelector = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>选择 {{ selectingLevel }}级法术</h3>
          <button class="close-btn" @click="showSpellSelector = false">✕</button>
        </div>
        <div class="dialog-body">
          <div class="spell-selection-list">
            <div
              v-for="spell in getAvailableSpellsToMemorize(selectingLevel)"
              :key="spell.id"
              class="selectable-spell"
              @click="memorizeSelectedSpell(spell.id)"
            >
              <div class="spell-info">
                <div class="spell-name">{{ spell.name }}</div>
                <div class="spell-meta">
                  {{ 'school' in spell ? spell.school : spell.sphere?.join(', ') || '' }} | {{ spell.englishName }}
                </div>
              </div>
              <button class="select-btn">选择</button>
            </div>

            <div v-if="getAvailableSpellsToMemorize(selectingLevel).length === 0" class="empty-hint">
              {{ isWizard ? '法术书中没有该等级的法术' : '没有可用的该等级法术' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 法术详情弹窗 -->
    <SpellDetailModal
      :visible="showSpellDetailModal"
      :spell="currentDetailSpell"
      :spell-type="currentDetailSpellType"
      @close="showSpellDetailModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useCharacterStore } from '../stores/characterStore';
import { useGameStateStore } from '../stores/gameStateStore';
import type { PriestSpell } from '../utils/priestSpellData';
import { getPriestSpellById } from '../utils/priestSpellData';
import type { WizardSpell } from '../utils/wizardSpellData';
import {
  getAllWizardLevel1Spells,
  getAllWizardLevel2Spells,
  getAllWizardLevel3Spells,
  getAllWizardLevel4Spells,
  getAllWizardLevel5Spells,
  getAllWizardLevel6Spells,
  getAllWizardLevel7Spells,
  getAllWizardLevel8Spells,
  getAllWizardLevel9Spells,
  getWizardSpellById,
} from '../utils/wizardSpellData';
import SpellDetailModal from './SpellDetailModal.vue';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const characterStore = useCharacterStore();
const gameStateStore = useGameStateStore();
const activeTab = ref<'spellbook' | 'memorize'>('memorize');
const showLearnSpellDialog = ref(false);
const forceUpdateKey = ref(0); // 🔧 用于强制刷新界面
const showSpellSelector = ref(false);
const showSpellDetailModal = ref(false);
const selectedLearnLevel = ref(1);
const selectingLevel = ref(1);
const currentDetailSpell = ref<WizardSpell | PriestSpell | null>(null);
const currentDetailSpellType = ref<'wizard' | 'priest'>('wizard');

// 获取角色职业信息
const characterClass = computed(() => characterStore.getCharacterClass());
const isWizard = computed(() => characterClass.value?.spellcasting?.type === 'wizard');
const classInfo = computed(() => {
  const cls = characterClass.value;
  if (!cls) return '未知职业';
  return `${cls.name} - ${isWizard.value ? '奥术施法者' : '神术施法者'}`;
});

// 法师相关
const learnChance = computed(() => characterStore.getSpellLearnChance());
const maxSpellLevel = computed(() => characterStore.getMaxSpellLevelForWizard());
const maxSpellsPerLevel = computed(() => characterStore.getMaxSpellsPerLevel());
const spellbookByLevel = computed(() => characterStore.getWizardSpellbookByLevel());
const availableSpellLevels = computed(() => {
  return Array.from({ length: maxSpellLevel.value }, (_, i) => i + 1);
});

// 祭司法术领域
const priestSpellSpheres = computed(() => {
  const cls = characterClass.value;
  if (!cls || cls.spellcasting?.type !== 'priest') return null;
  return cls.spellSpheres;
});

// 记忆法术相关
const availableMemorizeLevels = computed(() => {
  const levels: number[] = [];
  for (let i = 1; i <= 9; i++) {
    const slots = characterStore.getSpellSlotsForLevel(i);
    const bonus = characterClass.value?.spellcasting?.type === 'priest' ? characterStore.getBonusSpellSlots(i) : 0;
    if (slots + bonus > 0) {
      levels.push(i);
    }
  }
  return levels;
});

// 初始化法术数据
// 🔧 监听游戏数据更新事件，自动刷新法术列表
let cleanupFunctions: Array<() => void> = [];

onMounted(() => {
  // 监听游戏数据更新
  eventOn('adnd2e_game_data_updated', () => {
    console.log('[SpellbookModal] 收到游戏数据更新事件，刷新法术列表');
    forceUpdateKey.value++;
  });

  console.log('[SpellbookModal] 已注册事件监听器');
});

onUnmounted(() => {
  cleanupFunctions.forEach(cleanup => cleanup());
  console.log('[SpellbookModal] 组件卸载，已清理事件监听器');
});

watch(
  () => props.visible,
  visible => {
    if (visible) {
      characterStore.initializeSpellData();
      // 祭司默认显示记忆标签页，法师默认显示法术书
      activeTab.value = isWizard.value ? 'spellbook' : 'memorize';
    }
  },
);

function handleClose() {
  emit('close');
}

// 获取法术名称
function getWizardSpellName(spellId: string): string {
  const spell = getWizardSpellById(spellId);
  return spell?.name || spellId;
}

function getWizardSpellSchool(spellId: string): string {
  const spell = getWizardSpellById(spellId);
  return spell?.school || '';
}

function getSpellName(spellId: string): string {
  if (isWizard.value) {
    return getWizardSpellName(spellId);
  } else {
    const spell = getPriestSpellById(spellId);
    return spell?.name || spellId;
  }
}

// 显示法术详情
function showSpellDetail(spellId: string, type: 'wizard' | 'priest') {
  if (type === 'wizard') {
    const spell = getWizardSpellById(spellId);
    if (spell) {
      currentDetailSpell.value = spell;
    } else {
      toastr.error('找不到法术信息');
      return;
    }
  } else {
    const spell = getPriestSpellById(spellId);
    if (spell) {
      currentDetailSpell.value = spell;
    } else {
      toastr.error('找不到法术信息');
      return;
    }
  }
  currentDetailSpellType.value = type;
  showSpellDetailModal.value = true;
}

// 显示已记忆法术的详情
function showMemorizedSpellDetail(spellId: string) {
  if (isWizard.value) {
    showSpellDetail(spellId, 'wizard');
  } else {
    showSpellDetail(spellId, 'priest');
  }
}

// 学习法术时显示详情
function showSpellDetailForLearning(spellId: string) {
  showSpellDetail(spellId, 'wizard');
}

// 获取可学习的法术
function getAvailableSpellsToLearn(level: number) {
  const allSpells = getAllWizardSpellsByLevel(level);
  const spellbook = characterStore.characterData.spells?.spellbook || [];

  return allSpells.filter(spell => !spellbook.includes(spell.id));
}

function getAllWizardSpellsByLevel(level: number) {
  switch (level) {
    case 1:
      return getAllWizardLevel1Spells();
    case 2:
      return getAllWizardLevel2Spells();
    case 3:
      return getAllWizardLevel3Spells();
    case 4:
      return getAllWizardLevel4Spells();
    case 5:
      return getAllWizardLevel5Spells();
    case 6:
      return getAllWizardLevel6Spells();
    case 7:
      return getAllWizardLevel7Spells();
    case 8:
      return getAllWizardLevel8Spells();
    case 9:
      return getAllWizardLevel9Spells();
    default:
      return [];
  }
}

// 尝试学习法术
function attemptLearnSpell(spellId: string) {
  const result = characterStore.learnSpell(spellId);

  if (result.success) {
    toastr.success(`成功学习法术！(掷骰: ${result.roll}/${result.chance})`);
    showLearnSpellDialog.value = false;
  } else if (result.roll !== undefined) {
    toastr.error(`学习失败！(掷骰: ${result.roll}/${result.chance}) - ${result.reason}`);
  } else {
    toastr.error(`无法学习: ${result.reason}`);
  }
}

// 记忆法术相关
function getTotalSlots(level: number): number {
  const base = characterStore.getSpellSlotsForLevel(level);
  const bonus = characterClass.value?.spellcasting?.type === 'priest' ? characterStore.getBonusSpellSlots(level) : 0;
  return base + bonus;
}

function getMemorizedCount(level: number): number {
  const spells = characterStore.characterData.spells;
  if (!spells) return 0;
  const levelKey = `level${level}` as keyof typeof spells.memorizedSpells;
  return spells.memorizedSpells[levelKey]?.length || 0;
}

function getMemorizedSpells(level: number): string[] {
  // 🔧 依赖 forceUpdateKey 确保响应式更新
  void forceUpdateKey.value;

  const spells = characterStore.characterData.spells;
  const charSpells = spells ? spells.memorizedSpells[`level${level}` as keyof typeof spells.memorizedSpells] || [] : [];

  // 🔧 合并来自 gameStateStore 的已记忆法术
  const stateSpells =
    gameStateStore.gameState?.spells?.filter(s => s.level === level && s.memorized).map(s => s.id) || [];

  return [...charSpells, ...stateSpells];
}

function getEmptySlots(level: number): number {
  return getTotalSlots(level) - getMemorizedCount(level);
}

function openSpellSelector(level: number) {
  selectingLevel.value = level;
  showSpellSelector.value = true;
}

function getAvailableSpellsToMemorize(level: number): (WizardSpell | PriestSpell)[] {
  if (isWizard.value) {
    // 法师：从法术书中选择
    const spellbook = characterStore.characterData.spells?.spellbook || [];
    const levelSpells = spellbook.filter(id => {
      const spell = getWizardSpellById(id);
      return spell && spell.level === level;
    });
    return levelSpells.map(id => getWizardSpellById(id)).filter((s): s is WizardSpell => s !== undefined);
  } else {
    // 祭司：从可用领域中选择
    const availableIds = characterStore.getAvailablePriestSpells(level);
    return availableIds.map(id => getPriestSpellById(id)).filter((s): s is PriestSpell => s !== undefined);
  }
}

function memorizeSelectedSpell(spellId: string) {
  const result = characterStore.memorizeSpell(selectingLevel.value, spellId);

  if (result.success) {
    toastr.success('已记忆法术');
    showSpellSelector.value = false;
  } else {
    toastr.error('记忆失败: ' + result.reason);
  }
}

// 检查是否可以学习某个等级的法术（基于职业法术进程表）
function canLearnSpellLevel(spellLevel: number): boolean {
  const cls = characterClass.value;
  if (!cls || !cls.spellcasting) return false;

  // 对于法师，检查智力限制
  if (cls.spellcasting.type === 'wizard') {
    const maxLevel = characterStore.getMaxSpellLevelForWizard();
    if (spellLevel > maxLevel) return false;
  }

  // 检查法术进程表：角色当前等级是否能施展该等级的法术
  // 角色在角色创建时是1级
  const characterLevel = characterStore.characterData.step === 11 ? 1 : 1; // 角色创建完成时是1级

  // 查找该角色等级的法术进程
  const progression = cls.spellcasting.spellProgression.find(p => p.level === characterLevel);

  if (!progression) return false; // 该等级还不能施法

  // 检查该法术等级的槽位数是否大于0
  const slots = progression.spells[spellLevel - 1];
  return slots !== undefined && slots > 0;
}

// 获取法术等级提示文本
function getSpellLevelTooltip(spellLevel: number): string {
  if (!canLearnSpellLevel(spellLevel)) {
    const cls = characterClass.value;
    if (cls?.spellcasting?.type === 'wizard') {
      const maxLevel = characterStore.getMaxSpellLevelForWizard();
      if (spellLevel > maxLevel) {
        return `智力不足，无法学习${spellLevel}级法术（最高可学${maxLevel}级）`;
      }
    }
    return `角色等级不足，无法学习${spellLevel}级法术`;
  }
  return `选择${spellLevel}级法术`;
}

function saveMemorizedSpells() {
  characterStore.saveToTavern();
  toastr.success('已保存法术记忆');
}
</script>

<style lang="scss" scoped>
.spellbook-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.spellbook-modal {
  background-color: #fff;
  border: 4px solid #000;
  width: 90%;
  max-width: 1000px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border: 2px solid #666;
    pointer-events: none;
  }
}

.modal-header {
  background-color: #fff;
  border-bottom: 3px solid #000;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-content {
    h2 {
      font-family: '临海体', serif;
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 5px 0;
    }

    .class-info {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
  }

  .close-btn {
    background: none;
    border: 2px solid #000;
    width: 40px;
    height: 40px;
    cursor: pointer;
    font-size: 20px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background-color: #000;
      color: #fff;
    }
  }
}

.tabs-bar {
  background-color: #e8e8d0;
  border-bottom: 2px solid #000;
  display: flex;
  gap: 5px;
  padding: 10px;

  .tab-btn {
    flex: 1;
    padding: 10px 20px;
    border: 2px solid #000;
    background-color: #fff;
    font-family: '临海体', serif;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: #f0f0f0;
    }

    &.active {
      background-color: #9370db;
      color: #fff;
      border-color: #000;
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// 信息栏
.info-bar {
  display: flex;
  gap: 20px;
  padding: 15px;
  background-color: #fff;
  border: 2px solid #000;
  margin-bottom: 20px;

  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      font-weight: bold;
      color: #666;
    }

    .value {
      color: #9370db;
      font-weight: bold;
      font-size: 16px;
    }
  }
}

// 法术领域信息栏
.spell-spheres-info {
  margin-bottom: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 16px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  .spheres-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 18px;
    font-weight: bold;

    .spheres-icon {
      font-size: 24px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
  }

  .spheres-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sphere-group {
    display: flex;
    align-items: baseline;
    gap: 8px;
    line-height: 1.6;

    .sphere-label {
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
      color: rgba(255, 255, 255, 0.9);
    }

    .sphere-list {
      flex: 1;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.95);

      &.minor {
        font-style: italic;
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }
}

// 信息横幅
.info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  background-color: #fff3cd;
  border: 2px solid #ffc107;
  margin-bottom: 15px;
  border-radius: 4px;

  .info-icon {
    font-size: 20px;
  }

  .info-text {
    flex: 1;
    color: #856404;
    font-weight: 500;
  }
}

// 操作栏
.action-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;

  .primary-btn,
  .danger-btn {
    padding: 10px 20px;
    border: 2px solid #000;
    font-family: '临海体', serif;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;

    span {
      font-size: 16px;
    }
  }

  .primary-btn {
    background-color: #9370db;
    color: #fff;

    &:hover {
      background-color: #7b68ee;
    }
  }

  .danger-btn {
    background-color: #fff;
    color: #dc3545;
    border-color: #dc3545;

    &:hover {
      background-color: #dc3545;
      color: #fff;
    }
  }
}

// 已学法术列表
.learned-spells {
  .spell-level-group {
    margin-bottom: 20px;

    .level-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: #9370db;
      color: #fff;
      border: 2px solid #000;
      font-family: '临海体', serif;
      font-weight: bold;

      .level {
        font-size: 16px;
      }

      .count {
        font-size: 14px;
      }
    }

    .spell-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 10px;
      padding: 10px;
      background-color: #fff;
      border: 2px solid #000;
      border-top: none;

      .spell-item {
        padding: 10px;
        border: 2px solid #9370db;
        background-color: #f9f9f9;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background-color: #e6d8f5;
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(147, 112, 219, 0.3);
        }

        .spell-name {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .spell-school {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
}

// 法术槽位
.spell-slots {
  .slot-level-group {
    margin-bottom: 20px;

    .slot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: #4682b4;
      color: #fff;
      border: 2px solid #000;
      font-family: '临海体', serif;
      font-weight: bold;

      .level {
        font-size: 16px;
      }

      .slot-count {
        font-size: 14px;
      }
    }

    .memorized-spells {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
      padding: 10px;
      background-color: #fff;
      border: 2px solid #000;
      border-top: none;

      .memorized-spell {
        padding: 10px;
        border: 2px solid #4682b4;
        background-color: #e3f2fd;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background-color: #bbdefb;
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(70, 130, 180, 0.3);
        }

        .spell-name {
          font-weight: bold;
          flex: 1;
        }

        .view-icon {
          font-size: 16px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        &:hover .view-icon {
          opacity: 1;
        }
      }

      .empty-slot {
        padding: 10px;
        border: 2px dashed #999;
        background-color: #f9f9f9;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        min-height: 60px;
        transition: all 0.2s;

        &:hover {
          border-color: #4682b4;
          background-color: #e3f2fd;
        }

        .plus-icon {
          font-size: 24px;
          color: #999;
        }

        .hint {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
      }
    }
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background-color: #fff;
  border: 3px dashed #ccc;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }

  p {
    font-family: '临海体', serif;
    font-size: 16px;
    margin: 10px 0;
    color: #666;

    &.hint {
      font-size: 13px;
      color: #999;
      font-style: italic;
    }
  }
}

// 对话框样式
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
}

.dialog {
  background-color: #fff;
  border: 4px solid #000;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  .dialog-header {
    background-color: #fff;
    border-bottom: 3px solid #000;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      font-family: '临海体', serif;
      font-size: 20px;
      margin: 0;
    }
  }

  .dialog-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;

    .level-selector {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;

      .level-btn {
        padding: 8px 16px;
        border: 2px solid #000;
        background-color: #fff;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(.disabled) {
          background-color: #f0f0f0;
        }

        &.active {
          background-color: #9370db;
          color: #fff;
        }

        &.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .spell-selection-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .selectable-spell {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        border: 2px solid #000;
        background-color: #fff;
        transition: all 0.2s;

        &:hover {
          background-color: #f9f9f9;
        }

        .spell-info {
          flex: 1;
          cursor: pointer;
          padding-right: 15px;

          &:hover {
            .spell-name {
              color: #9370db;
            }
          }

          .spell-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
            transition: color 0.2s;

            .view-hint {
              font-size: 12px;
              color: #999;
              font-weight: normal;
              margin-left: 8px;
            }
          }

          .spell-meta {
            font-size: 12px;
            color: #666;
          }
        }

        .learn-btn,
        .select-btn {
          padding: 8px 20px;
          border: 2px solid #000;
          background-color: #9370db;
          color: #fff;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;

          &:hover {
            background-color: #7b68ee;
          }
        }
      }

      .empty-hint {
        text-align: center;
        padding: 40px 20px;
        color: #999;
        font-style: italic;
      }
    }
  }
}

// 移动端适配
@media (max-width: 992px) {
  .spellbook-overlay {
    padding: 10px;
  }

  .spellbook-modal {
    width: 100%;
    max-width: 100%;
    max-height: 95vh;
    border-width: 3px;

    &::before {
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
    }
  }

  .modal-header {
    padding: 12px 15px;
    border-bottom-width: 2px;

    .header-content {
      h2 {
        font-size: 20px;
      }

      .class-info {
        font-size: 12px;
      }
    }

    .close-btn {
      width: 36px;
      height: 36px;
      font-size: 18px;
    }
  }

  .tabs-bar {
    padding: 8px;
    gap: 4px;

    .tab-btn {
      padding: 10px 12px;
      font-size: 13px;
      min-height: 44px; // 触摸友好
    }
  }

  .modal-body {
    padding: 12px;
  }

  .info-bar {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    margin-bottom: 15px;

    .info-item {
      .label {
        font-size: 12px;
      }

      .value {
        font-size: 14px;
      }
    }
  }

  .info-banner {
    padding: 10px 12px;
    margin-bottom: 12px;

    .info-icon {
      font-size: 18px;
    }

    .info-text {
      font-size: 13px;
    }
  }

  .action-bar {
    flex-direction: column;
    gap: 8px;
    margin-bottom: 15px;

    .primary-btn,
    .danger-btn {
      width: 100%;
      padding: 10px 15px;
      justify-content: center;
      min-height: 44px; // 触摸友好

      span {
        font-size: 14px;
      }
    }
  }

  .learned-spells {
    .spell-level-group {
      margin-bottom: 15px;

      .level-header {
        padding: 8px 12px;
        border-width: 2px;

        .level {
          font-size: 14px;
        }

        .count {
          font-size: 12px;
        }
      }

      .spell-list {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 8px;
        border-width: 2px;

        .spell-item {
          padding: 10px;
          border-width: 2px;

          .spell-name {
            font-size: 14px;
          }

          .spell-school {
            font-size: 11px;
          }
        }
      }
    }
  }

  .spell-slots {
    .slot-level-group {
      margin-bottom: 15px;

      .slot-header {
        padding: 8px 12px;
        border-width: 2px;

        .level {
          font-size: 14px;
        }

        .slot-count {
          font-size: 12px;
        }
      }

      .memorized-spells {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 8px;
        border-width: 2px;

        .memorized-spell {
          padding: 10px;
          border-width: 2px;

          .spell-name {
            font-size: 14px;
          }

          .view-icon {
            font-size: 14px;
          }
        }

        .empty-slot {
          padding: 10px;
          min-height: 50px;
          border-width: 2px;

          .plus-icon {
            font-size: 20px;
          }

          .hint {
            font-size: 11px;
          }
        }
      }
    }
  }

  .empty-state {
    padding: 40px 15px;
    border-width: 2px;

    .empty-icon {
      font-size: 40px;
    }

    p {
      font-size: 14px;

      &.hint {
        font-size: 12px;
      }
    }
  }

  .dialog {
    width: 100%;
    max-width: 100%;
    max-height: 90vh;
    border-width: 3px;

    .dialog-header {
      padding: 12px 15px;
      border-bottom-width: 2px;

      h3 {
        font-size: 18px;
      }
    }

    .dialog-body {
      padding: 15px;

      .level-selector {
        gap: 6px;
        margin-bottom: 15px;

        .level-btn {
          flex: 1 1 calc(33.33% - 4px);
          padding: 8px 10px;
          font-size: 13px;
          border-width: 2px;
          min-height: 44px; // 触摸友好
        }
      }

      .spell-selection-list {
        gap: 8px;

        .selectable-spell {
          flex-direction: column;
          align-items: stretch;
          padding: 12px;
          border-width: 2px;

          .spell-info {
            padding-right: 0;
            margin-bottom: 10px;

            .spell-name {
              font-size: 14px;

              .view-hint {
                font-size: 11px;
              }
            }

            .spell-meta {
              font-size: 11px;
            }
          }

          .learn-btn,
          .select-btn {
            width: 100%;
            padding: 10px;
            font-size: 13px;
            border-width: 2px;
            min-height: 44px; // 触摸友好
          }
        }

        .empty-hint {
          padding: 30px 15px;
          font-size: 13px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .spellbook-modal {
    border-width: 2px;

    &::before {
      border-width: 1px;
    }
  }

  .modal-header {
    .header-content h2 {
      font-size: 18px;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      font-size: 16px;
    }
  }

  .tabs-bar .tab-btn {
    font-size: 12px;
    padding: 8px 10px;
  }

  .learned-spells .spell-level-group .spell-list .spell-item {
    .spell-name {
      font-size: 13px;
    }
  }

  .dialog .dialog-body .level-selector .level-btn {
    flex: 1 1 calc(50% - 3px);
    font-size: 12px;
  }
}
</style>
