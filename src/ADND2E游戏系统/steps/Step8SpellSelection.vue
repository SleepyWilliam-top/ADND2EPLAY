<template>
  <div class="step8-spell-selection">
    <!-- 标题区域 -->
    <div class="selection-header">
      <h3>法术选择与记忆</h3>
      <div class="character-info">
        <span>{{ currentClassName }}</span>
        <span v-if="isWizard">智力 {{ characterStore.adjustedAbilities.int }}</span>
        <span v-if="isPriest">灵知 {{ characterStore.adjustedAbilities.wis }}</span>
      </div>
    </div>

    <!-- 法师流程 -->
    <div v-if="isWizard" class="wizard-spell-selection">
      <!-- 第一阶段：掷法术书数量 -->
      <div v-if="!spellbookRolled" class="spellbook-roll-phase phase-container">
        <div class="phase-content">
          <h4><i class="fa-solid fa-book"></i> 法术书初始化</h4>
          <p class="instruction">
            作为一名初入门的法师，你需要确定你的法术书中有多少法术。<br />
            掷3d4来确定初始法术数量，侦测魔法和阅读魔法会自动加入。
          </p>
          <div class="dice-roll-area">
            <button class="adnd-button primary large" @click="rollSpellbook">
              <i class="fa-solid fa-dice-d20"></i> 掷骰确定法术书大小
            </button>
          </div>
        </div>
      </div>

      <!-- 第二阶段：选择法术进法术书 -->
      <div v-else-if="!spellbookComplete" class="spellbook-selection-phase phase-container">
        <div class="phase-header">
          <h4>📚 选择法术进入法术书</h4>
          <div class="progress-info">
            <span class="count">已选择：{{ selectedSpellsCount }} / {{ totalSpellsNeeded }}</span>
            <span class="hint">（侦测魔法和阅读魔法已自动加入）</span>
          </div>
        </div>

        <div class="spell-grid">
          <SpellCard
            v-for="spell in availableWizardSpells"
            :key="spell.id"
            :spell="spell"
            :selected="isSpellInSpellbook(spell.id)"
            :disabled="!canAddToSpellbook(spell.id)"
            @click="toggleSpellInSpellbook(spell.id)"
          />
        </div>

        <div class="phase-actions">
          <button class="adnd-button secondary" @click="resetSpellbookSelection">重新选择</button>
          <button
            class="adnd-button primary"
            :disabled="selectedSpellsCount !== totalSpellsNeeded"
            @click="confirmSpellbook"
          >
            确认法术书
          </button>
        </div>
      </div>

      <!-- 第三阶段：记忆法术 -->
      <div v-else class="memorization-phase phase-container">
        <div class="phase-header">
          <h4>🧠 记忆法术</h4>
          <p class="hint">从法术书中选择要记忆的法术，你可以选择不记满所有法术位。</p>
        </div>

        <div class="memorization-content">
          <!-- 法术位显示 -->
          <div class="spell-slots-section">
            <h5>可用法术位</h5>
            <div class="spell-slots-list">
              <div
                v-for="level in maxSpellLevel"
                :key="level"
                class="slot-level"
                :class="{ 'has-slots': getSpellSlots(level) > 0 }"
              >
                <div class="slot-header">
                  <span class="level-label">{{ level }}级法术</span>
                  <span class="slot-count">{{ getMemorizedCount(level) }} / {{ getSpellSlots(level) }}</span>
                </div>
                <div v-if="getSpellSlots(level) > 0" class="memorized-spells">
                  <div v-for="(spellId, idx) in getMemorizedSpells(level)" :key="idx" class="memorized-spell-item">
                    <span class="spell-name">{{ getSpellName(spellId) }}</span>
                    <button class="remove-btn" @click="removeMemorizedSpell(level, idx)">×</button>
                  </div>
                  <div
                    v-for="n in getSpellSlots(level) - getMemorizedCount(level)"
                    :key="'empty-' + n"
                    class="empty-slot"
                  >
                    空槽位
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 法术书显示 -->
          <div class="spellbook-section">
            <h5>你的法术书</h5>
            <div class="spell-grid compact">
              <SpellCard
                v-for="spellId in characterStore.characterData.spells?.spellbook"
                :key="spellId"
                :spell="getWizardSpellById(spellId)!"
                @click="addMemorizedSpell(spellId)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 非施法职业提示 -->
    <div v-else-if="!isWizard && !isPriest" class="non-caster-notice phase-container">
      <div class="phase-content">
        <h4><i class="fa-solid fa-khanda"></i> 非施法职业</h4>
        <p class="instruction">
          {{ currentClassName }}不具有施法能力，无需选择法术。<br />
          请点击"下一步"继续角色创建流程。
        </p>
      </div>
    </div>

    <!-- 祭司流程 -->
    <div v-else-if="isPriest" class="priest-spell-selection phase-container">
      <div class="phase-header">
        <h4>🙏 祭司法术记忆</h4>
        <p class="hint">从你的领域中选择要记忆的法术。</p>

        <!-- 法术领域信息栏 -->
        <div v-if="currentClass?.spellSpheres" class="spell-spheres-info">
          <div class="spheres-header">
            <span class="spheres-icon">✨</span>
            <span class="spheres-title">法术领域权能</span>
          </div>
          <div class="spheres-content">
            <div v-if="currentClass.spellSpheres.major.length > 0" class="sphere-group-info">
              <span class="sphere-label">主要领域:</span>
              <span class="sphere-list">{{ currentClass.spellSpheres.major.join('、') }}</span>
            </div>
            <div v-if="currentClass.spellSpheres.minor.length > 0" class="sphere-group-info">
              <span class="sphere-label">次要领域:</span>
              <span class="sphere-list minor">{{ currentClass.spellSpheres.minor.join('、') }}</span>
            </div>
          </div>
        </div>

        <div v-if="spellFailureChance > 0" class="warning-box">
          ⚠️ 你的灵知较低（{{ characterStore.adjustedAbilities.wis }}），施法失败率：{{ spellFailureChance }}%
        </div>
      </div>

      <div class="memorization-content">
        <!-- 法术位显示 -->
        <div class="spell-slots-section">
          <h5>可用法术位</h5>
          <div class="spell-slots-list">
            <div v-for="level in 7" :key="level" class="slot-level" :class="{ 'has-slots': getTotalSlots(level) > 0 }">
              <div class="slot-header">
                <span class="level-label">{{ level }}级法术</span>
                <span class="slot-count">
                  {{ getMemorizedCount(level) }} / {{ getTotalSlots(level) }}
                  <span v-if="getBonusSlots(level) > 0" class="bonus-indicator">
                    (+{{ getBonusSlots(level) }} 灵知奖励)
                  </span>
                </span>
              </div>
              <div v-if="getTotalSlots(level) > 0" class="memorized-spells">
                <div v-for="(spellId, idx) in getMemorizedSpells(level)" :key="idx" class="memorized-spell-item">
                  <span class="spell-name">{{ getSpellName(spellId) }}</span>
                  <button class="remove-btn" @click="removeMemorizedSpell(level, idx)">×</button>
                </div>
                <div
                  v-for="n in getTotalSlots(level) - getMemorizedCount(level)"
                  :key="'empty-' + n"
                  class="empty-slot"
                >
                  空槽位
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 可用法术列表（按领域分组） -->
        <div class="available-spells-section">
          <h5>可用法术</h5>
          <div v-for="sphere in availableSpheres" :key="sphere" class="sphere-group">
            <h6 class="sphere-title">{{ sphere }}领域</h6>
            <div class="spell-grid compact">
              <SpellCard
                v-for="spell in getSpellsBySphere(sphere)"
                :key="spell.id"
                :spell="spell"
                @click="addMemorizedSpell(spell.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button class="adnd-button secondary" @click="goBack">
        <span class="button-icon">←</span>
        <span>返回</span>
      </button>
      <button class="adnd-button primary" :disabled="!canProceed" @click="confirmAndProceed">
        <span>下一步</span>
        <span class="button-icon">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import SpellCard from '../components/SpellCard.vue';
import { useCharacterStore } from '../stores/characterStore';
import { getClassById } from '../utils/classData';
import { getPriestSpellById, getPriestSpellsBySphere } from '../utils/priestSpellData';
import { getAllWizardLevel1Spells, getWizardSpellById } from '../utils/wizardSpellData';

const characterStore = useCharacterStore();

// 职业类型判断
const currentClass = computed(() => getClassById(characterStore.characterData.class || ''));
const currentClassName = computed(() => currentClass.value?.name || '');
const isWizard = computed(() => currentClass.value?.spellcasting?.type === 'wizard');
const isPriest = computed(() => currentClass.value?.spellcasting?.type === 'priest');

// 法师相关状态
const spellbookRolled = ref(false);
const spellbookComplete = ref(false);
const spellbookSize = ref(0);
const maxSpellLevel = computed(() => characterStore.getMaxSpellLevelForWizard());

// 祭司相关状态
const spellFailureChance = computed(() => characterStore.getSpellFailureChance());

// 初始化
onMounted(() => {
  // 如果不是施法职业，直接跳过法术选择步骤
  if (!isWizard.value && !isPriest.value) {
    // 非施法职业不需要选择法术，不显示任何提示直接跳过
    // 注意：不要立即跳转，等待用户点击下一步或返回
    return;
  }

  characterStore.initializeSpellData();

  // 检查是否已经掷过骰子
  if (characterStore.characterData.spells?.spellbookRoll) {
    spellbookRolled.value = true;
    spellbookSize.value = characterStore.characterData.spells.spellbookRoll;

    // 检查是否已经选好法术书
    if (characterStore.characterData.spells.spellbook && characterStore.characterData.spells.spellbook.length > 0) {
      spellbookComplete.value = true;
    }
  }
});

// ==================== 法师相关函数 ====================

// 掷法术书大小
function rollSpellbook() {
  const roll = characterStore.rollInitialSpellbookSize();
  spellbookSize.value = roll;
  spellbookRolled.value = true;

  // 初始化法术书，加入侦测魔法和阅读魔法
  characterStore.updateCharacterData(data => {
    if (!data.spells) {
      characterStore.initializeSpellData();
    }
    data.spells!.spellbookRoll = roll;
    data.spells!.spellbook = ['detect_magic', 'read_magic'];
  });

  toastr.info(`你掷出了 ${roll}，法术书可以容纳 ${roll + 2} 个1级法术（含侦测魔法和阅读魔法）`);
}

// 可用的1级法师法术
const availableWizardSpells = computed(() => {
  return getAllWizardLevel1Spells().filter(spell => spell.id !== 'detect_magic' && spell.id !== 'read_magic');
});

// 已选择的法术数量（不含自动加入的两个）
const selectedSpellsCount = computed(() => {
  const spellbook = characterStore.characterData.spells?.spellbook || [];
  return spellbook.filter(id => id !== 'detect_magic' && id !== 'read_magic').length;
});

// 需要选择的总数
const totalSpellsNeeded = computed(() => spellbookSize.value);

// 判断法术是否在法术书中
function isSpellInSpellbook(spellId: string): boolean {
  return characterStore.characterData.spells?.spellbook?.includes(spellId) || false;
}

// 判断是否可以添加到法术书
function canAddToSpellbook(spellId: string): boolean {
  if (isSpellInSpellbook(spellId)) return true;
  return selectedSpellsCount.value < totalSpellsNeeded.value;
}

// 切换法术在法术书中的状态
function toggleSpellInSpellbook(spellId: string) {
  if (!characterStore.characterData.spells?.spellbook) return;

  characterStore.updateCharacterData(data => {
    if (!data.spells?.spellbook) return;

    const spellbook = data.spells.spellbook;
    const index = spellbook.indexOf(spellId);

    if (index !== -1) {
      // 移除（但不能移除侦测魔法和阅读魔法）
      if (spellId !== 'detect_magic' && spellId !== 'read_magic') {
        spellbook.splice(index, 1);
      }
    } else if (canAddToSpellbook(spellId)) {
      // 添加
      spellbook.push(spellId);
    }
  });
}

// 重置法术书选择
function resetSpellbookSelection() {
  characterStore.updateCharacterData(data => {
    if (data.spells) {
      data.spells.spellbook = ['detect_magic', 'read_magic'];
    }
  });
}

// 确认法术书
function confirmSpellbook() {
  spellbookComplete.value = true;
  toastr.success('法术书确认完成！现在选择要记忆的法术。');
}

// ==================== 祭司相关函数 ====================

// 可用领域
const availableSpheres = computed(() => {
  const spheres = new Set<string>();

  // 添加主要权能领域的所有法术
  currentClass.value?.spellSpheres?.major.forEach(sphere => {
    spheres.add(sphere);
  });

  // 添加次要权能领域（仅3级及以下）
  currentClass.value?.spellSpheres?.minor.forEach(sphere => {
    spheres.add(sphere);
  });

  return Array.from(spheres);
});

// 根据领域获取法术
function getSpellsBySphere(sphere: string) {
  const spells = getPriestSpellsBySphere(sphere, 1);

  // 如果是次要权能领域，只返回3级及以下法术（不过1级法术都满足）
  const isMinor = currentClass.value?.spellSpheres?.minor.includes(sphere);
  if (isMinor) {
    return spells.filter(s => s.level <= 3);
  }

  return spells;
}

// ==================== 通用法术记忆函数 ====================

// 获取法术位数量
function getSpellSlots(level: number): number {
  return characterStore.getSpellSlotsForLevel(level);
}

// 获取奖励法术位（仅祭司）
function getBonusSlots(level: number): number {
  return characterStore.getBonusSpellSlots(level);
}

// 获取总法术位（祭司：基础+奖励）
function getTotalSlots(level: number): number {
  const base = getSpellSlots(level);
  const bonus = getBonusSlots(level);
  return base + bonus;
}

// 获取已记忆的法术
function getMemorizedSpells(level: number): string[] {
  if (!characterStore.characterData.spells) return [];
  const levelKey = `level${level}` as keyof typeof characterStore.characterData.spells.memorizedSpells;
  return characterStore.characterData.spells.memorizedSpells[levelKey] || [];
}

// 获取已记忆数量
function getMemorizedCount(level: number): number {
  return getMemorizedSpells(level).length;
}

// 获取法术名称
function getSpellName(spellId: string): string {
  if (isWizard.value) {
    return getWizardSpellById(spellId)?.name || spellId;
  } else {
    return getPriestSpellById(spellId)?.name || spellId;
  }
}

// 添加记忆法术
function addMemorizedSpell(spellId: string) {
  // 确定法术等级
  let spellLevel = 1; // 目前只有1级法术

  if (isWizard.value) {
    const spell = getWizardSpellById(spellId);
    if (!spell) return;
    spellLevel = spell.level;

    // 检查是否在法术书中
    if (!characterStore.characterData.spells?.spellbook?.includes(spellId)) {
      toastr.warning('该法术不在你的法术书中！');
      return;
    }
  } else if (isPriest.value) {
    const spell = getPriestSpellById(spellId);
    if (!spell) return;
    spellLevel = spell.level;
  } else {
    return;
  }

  // 检查法术位是否已满
  const maxSlots = isPriest.value ? getTotalSlots(spellLevel) : getSpellSlots(spellLevel);
  if (getMemorizedCount(spellLevel) >= maxSlots) {
    toastr.warning(`${spellLevel}级法术位已满！`);
    return;
  }

  // 添加到记忆列表
  characterStore.updateCharacterData(data => {
    if (!data.spells) return;
    const levelKey = `level${spellLevel}` as keyof typeof data.spells.memorizedSpells;
    data.spells.memorizedSpells[levelKey].push(spellId);
  });
}

// 移除记忆法术
function removeMemorizedSpell(level: number, index: number) {
  characterStore.updateCharacterData(data => {
    if (!data.spells) return;
    const levelKey = `level${level}` as keyof typeof data.spells.memorizedSpells;
    data.spells.memorizedSpells[levelKey].splice(index, 1);
  });
}

// ==================== 导航函数 ====================

// 返回上一步
function goBack() {
  characterStore.updateCharacterData(data => {
    data.step = 7;
  });
}

// 检查是否可以继续
const canProceed = computed(() => {
  if (isWizard.value) {
    // 法师需要完成法术书选择
    return spellbookComplete.value;
  } else if (isPriest.value) {
    // 祭司可以不记忆法术
    return true;
  }
  // 非施法职业可以直接继续
  return true;
});

// 确认并进入下一步
function confirmAndProceed() {
  // 进入第9步（阵营选择）
  characterStore.updateCharacterData(data => {
    data.step = 9;
  });
  toastr.success('法术选择完成，请选择阵营');
}
</script>

<style lang="scss" scoped>
.step8-spell-selection {
  width: 100%;
  min-height: 600px;
  padding: 30px;
  font-family: '临海体', serif;

  @media (max-width: 992px) {
    padding: 15px 10px;
    min-height: 400px;
  }
}

.selection-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 3px solid #000;

  @media (max-width: 992px) {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom-width: 2px;
  }

  h3 {
    font-size: 28px;
    font-weight: bold;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 2px;

    @media (max-width: 992px) {
      font-size: 20px;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
  }

  .character-info {
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 16px;
    color: #666;
    flex-wrap: wrap;

    @media (max-width: 992px) {
      gap: 10px;
      font-size: 14px;
    }

    span {
      padding: 6px 12px;
      background-color: #f5f5f5;
      border: 2px solid #ddd;
      border-radius: 4px;

      @media (max-width: 992px) {
        padding: 5px 10px;
      }
    }
  }
}

.phase-container {
  background-color: #fafafa;
  border: 3px solid #000;
  padding: 30px;
  margin-bottom: 20px;
  position: relative;

  @media (max-width: 992px) {
    padding: 15px;
    margin-bottom: 15px;
    border-width: 2px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border: 1px solid #666;
    pointer-events: none;

    @media (max-width: 992px) {
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
    }
  }
}

.phase-header {
  margin-bottom: 24px;

  @media (max-width: 992px) {
    margin-bottom: 16px;
  }

  h4 {
    font-size: 24px;
    font-weight: bold;
    margin: 0 0 12px 0;

    @media (max-width: 992px) {
      font-size: 18px;
      margin-bottom: 10px;
    }
  }

  .hint {
    color: #666;
    font-size: 16px;
    line-height: 1.6;

    @media (max-width: 992px) {
      font-size: 14px;
    }
  }

  .progress-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    flex-wrap: wrap;

    @media (max-width: 992px) {
      gap: 8px;
      margin-top: 10px;
      flex-direction: column;
      align-items: flex-start;
    }

    .count {
      font-size: 18px;
      font-weight: bold;
      color: #000;

      @media (max-width: 992px) {
        font-size: 16px;
      }
    }

    .hint {
      font-size: 14px;
      color: #999;

      @media (max-width: 992px) {
        font-size: 13px;
      }
    }
  }
}

.spellbook-roll-phase,
.non-caster-notice {
  .phase-content {
    text-align: center;

    h4 {
      font-size: 24px;
      margin-bottom: 20px;

      @media (max-width: 992px) {
        font-size: 18px;
        margin-bottom: 15px;
      }
    }

    .instruction {
      font-size: 16px;
      line-height: 1.8;
      color: #666;
      margin-bottom: 30px;

      @media (max-width: 992px) {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
    }

    .dice-roll-area {
      .large {
        padding: 16px 40px;
        font-size: 18px;

        @media (max-width: 992px) {
          padding: 12px 24px;
          font-size: 16px;
          min-height: 44px;
          width: 100%;
          max-width: 300px;
        }
      }
    }
  }
}

.spell-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 15px;
  }

  &.compact {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;

    @media (max-width: 992px) {
    grid-template-columns: 1fr;
      gap: 12px;
    }
  }
}

.phase-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #ddd;
  gap: 15px;

  @media (max-width: 992px) {
    margin-top: 20px;
    padding-top: 15px;
    gap: 10px;
    flex-wrap: wrap;

    button {
      flex: 1;
      min-width: calc(50% - 5px);
    }
  }
}

.memorization-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 30px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.spell-slots-section,
.spellbook-section,
.available-spells-section {
  h5 {
    font-size: 20px;
    font-weight: bold;
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 2px solid #000;

    @media (max-width: 992px) {
      font-size: 18px;
      margin-bottom: 12px;
      padding-bottom: 10px;
    }
  }
}

.spell-slots-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 992px) {
    gap: 12px;
  }
}

.slot-level {
  background-color: #fff;
  border: 2px solid #ddd;
  padding: 12px;
  border-radius: 4px;

  @media (max-width: 992px) {
    padding: 10px;
  }

  &.has-slots {
    border-color: #000;
  }

  .slot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    @media (max-width: 992px) {
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 5px;
    }

    .level-label {
      font-weight: bold;
      font-size: 16px;

      @media (max-width: 992px) {
        font-size: 15px;
      }
    }

    .slot-count {
      font-size: 14px;
      color: #666;

      @media (max-width: 992px) {
        font-size: 13px;
      }

      .bonus-indicator {
        color: #5cb85c;
        font-weight: bold;

        @media (max-width: 992px) {
          display: block;
          font-size: 12px;
        }
      }
    }
  }

  .memorized-spells {
    display: flex;
    flex-direction: column;
    gap: 8px;

    @media (max-width: 992px) {
      gap: 6px;
    }
  }

  .memorized-spell-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #e3f2fd;
    border: 1px solid #1976d2;
    border-radius: 4px;

    @media (max-width: 992px) {
      padding: 10px;
    }

    .spell-name {
      font-size: 14px;
      font-weight: 500;
      flex: 1;
      word-break: break-word;

      @media (max-width: 992px) {
        font-size: 13px;
      }
    }

    .remove-btn {
      width: 24px;
      height: 24px;
      border: none;
      background-color: #d9534f;
      color: #fff;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      transition: background-color 0.2s;
      flex-shrink: 0;
      margin-left: 8px;

      @media (max-width: 992px) {
        width: 32px;
        height: 32px;
        font-size: 20px;
      }

      &:hover {
        background-color: #c9302c;
      }
    }
  }

  .empty-slot {
    padding: 8px 12px;
    background-color: #f5f5f5;
    border: 1px dashed #ccc;
    border-radius: 4px;
    text-align: center;
    color: #999;
    font-size: 14px;

    @media (max-width: 992px) {
      padding: 10px;
      font-size: 13px;
    }
  }
}

.sphere-group {
  margin-bottom: 30px;

  @media (max-width: 992px) {
    margin-bottom: 20px;
  }

  .sphere-title {
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 16px 0;
    padding: 8px 12px;
    background-color: #fff3e0;
    border-left: 4px solid #e65100;

    @media (max-width: 992px) {
      font-size: 16px;
      margin-bottom: 12px;
      padding: 6px 10px;
    }
  }
}

// 法术领域信息栏
.spell-spheres-info {
  margin-top: 16px;
  margin-bottom: 16px;
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
    font-size: 16px;
    font-weight: bold;

    .spheres-icon {
      font-size: 20px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
  }

  .spheres-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sphere-group-info {
    display: flex;
    align-items: baseline;
    gap: 8px;
    line-height: 1.6;

    .sphere-label {
      font-weight: 600;
      font-size: 13px;
      white-space: nowrap;
      color: rgba(255, 255, 255, 0.9);
    }

    .sphere-list {
      flex: 1;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.95);

      &.minor {
        font-style: italic;
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }
}

.warning-box {
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-weight: 500;

  @media (max-width: 992px) {
    margin-top: 12px;
    padding: 10px 12px;
    font-size: 14px;
  }
}

.bottom-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 30px;
  border-top: 3px solid #000;
  gap: 15px;

  @media (max-width: 992px) {
    padding-top: 20px;
    border-top-width: 2px;
    gap: 10px;
  }

  .adnd-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 32px;
    font-size: 16px;
    font-family: '临海体', serif;
    font-weight: bold;
    border: 3px solid #000;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 1px;

    @media (max-width: 992px) {
      flex: 1;
      padding: 12px 20px;
      font-size: 14px;
      border-width: 2px;
      min-height: 44px;
      justify-content: center;
    }

    &.primary {
      background-color: #000;
      color: #fff;

      &:hover:not(:disabled) {
        background-color: #333;
      }

      &:disabled {
        background-color: #ccc;
        border-color: #999;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    &.secondary {
      background-color: #fff;
      color: #000;

      &:hover {
        background-color: #f5f5f5;
      }
    }

    .button-icon {
      font-size: 20px;

      @media (max-width: 992px) {
        font-size: 18px;
  }
    }
  }
}
</style>
