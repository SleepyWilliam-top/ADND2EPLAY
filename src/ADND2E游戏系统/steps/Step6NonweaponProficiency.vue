<template>
  <div class="step6-nonweapon-proficiency">
    <div class="main-container">
      <!-- 左侧：信息面板和熟练列表 -->
      <div class="left-panel">
        <!-- 信息面板 -->
        <div class="info-panel">
          <h2>📚 非武器熟练选择</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">职业：</span>
              <span class="value">{{ selectedClassName }}</span>
            </div>
            <div class="info-item">
              <span class="label">初始槽位：</span>
              <span class="value">{{ initialSlots }}</span>
            </div>
            <div class="info-item">
              <span class="label">语言槽转换：</span>
              <span class="value">{{ characterStore.characterData.languageSlotsToNonweapon }}</span>
            </div>
            <div class="info-item">
              <span class="label">剩余槽位：</span>
              <span class="value" :class="{ warning: remainingSlots < 0, success: remainingSlots === 0 }">
                {{ remainingSlots }}
              </span>
            </div>
          </div>
        </div>

        <!-- 语言槽转换 -->
        <div v-if="availableLanguageSlots > 0" class="language-conversion">
          <h3>智力语言槽转换</h3>
          <p class="help-text">剩余 {{ remainingLanguageSlots }} 个语言槽可转换为非武器熟练槽</p>
          <div class="converter">
            <button class="adnd-button" :disabled="languageSlotsToNonweapon <= 0" @click="convertLanguageSlot(-1)">
              -
            </button>
            <span class="convert-value">{{ languageSlotsToNonweapon }}</span>
            <button class="adnd-button" :disabled="remainingLanguageSlots <= 0" @click="convertLanguageSlot(1)">
              +
            </button>
          </div>
        </div>

        <!-- 分组标签 -->
        <div class="group-tabs">
          <button
            v-for="group in allGroups"
            :key="group"
            class="tab-button"
            :class="{ active: selectedGroup === group }"
            @click="selectedGroup = group"
          >
            {{ getGroupName(group) }}
          </button>
        </div>

        <!-- 熟练列表 -->
        <div class="proficiency-list">
          <div
            v-for="prof in filteredProficiencies"
            :key="prof.id"
            class="prof-item"
            :class="{ selected: isProfSelected(prof.id), highlight: selectedProf?.id === prof.id }"
            @click="selectProf(prof)"
          >
            <div class="prof-header">
              <span class="prof-name">{{ prof.name }}</span>
              <span class="prof-cost">
                {{ getProficiencyCostDisplay(prof) }}
                <span v-if="isProfSelected(prof.id)" class="selected-count">×{{ getSelectedSlots(prof.id) }}</span>
              </span>
            </div>
            <div class="prof-meta">
              <span>{{ prof.englishName }}</span>
              <span
                >{{ getAbilityName(prof.relatedAbility) }}{{ prof.checkModifier >= 0 ? '+' : ''
                }}{{ prof.checkModifier }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：详情面板 -->
      <div class="right-panel">
        <div v-if="selectedProf" class="prof-details">
          <div class="details-header">
            <h2>{{ selectedProf.name }}</h2>
            <span class="english-name">{{ selectedProf.englishName }}</span>
          </div>

          <div class="details-stats">
            <div class="stat-item">
              <span class="label">所需槽位：</span>
              <span class="value">{{ selectedProf.slots }}</span>
            </div>
            <div class="stat-item">
              <span class="label">跨组成本：</span>
              <span class="value">{{ selectedProf.slots + 1 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">相关属性：</span>
              <span class="value">{{ getAbilityName(selectedProf.relatedAbility) }}</span>
            </div>
            <div class="stat-item">
              <span class="label">检定调整：</span>
              <span class="value"
                >{{ selectedProf.checkModifier >= 0 ? '+' : '' }}{{ selectedProf.checkModifier }}</span
              >
            </div>
          </div>

          <div class="details-description">
            <h3>描述</h3>
            <div class="description-text" v-html="formatDescription(selectedProf.description)"></div>
          </div>

          <div class="details-actions">
            <div v-if="isProfSelected(selectedProf.id)" class="selected-info">
              <p>已投入槽位：{{ getSelectedSlots(selectedProf.id) }}</p>
              <p class="help-text">每额外投入1个槽位，检定获得+1奖励</p>
              <div class="action-buttons">
                <button class="adnd-button danger" @click="removeProficiency(selectedProf.id)">移除</button>
              </div>
            </div>
            <div v-else>
              <button
                class="adnd-button primary"
                :disabled="!canAddProficiency(selectedProf)"
                @click="addProficiency(selectedProf.id)"
              >
                {{
                  canAddProficiency(selectedProf)
                    ? `选择 (消耗${getProficiencyCostForCharacter(selectedProf)}槽)`
                    : '槽位不足'
                }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="no-selection">
          <p>← 请从左侧列表选择一个熟练查看详情</p>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="navigation">
      <button class="adnd-button secondary" @click="goBack">返回上一步</button>
      <button class="adnd-button primary" :disabled="!canProceed" @click="goNext">
        {{ remainingSlots === 0 ? '下一步' : `还需选择 ${remainingSlots} 个槽位` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import toastr from 'toastr';
import { computed, ref } from 'vue';
import { useCharacterStore } from '../stores/characterStore';
import { getClassById } from '../utils/classData';
import {
  getAllGroups,
  getGroupName,
  getProficienciesByGroup,
  getProficiencyById,
  getProficiencyCost,
  type ProficiencyGroup,
} from '../utils/proficiencyData';

const characterStore = useCharacterStore();

// 所有分组
const allGroups = computed(() => getAllGroups());
const selectedGroup = ref<ProficiencyGroup>('general');

// 过滤后的熟练列表
const filteredProficiencies = computed(() => {
  return getProficienciesByGroup(selectedGroup.value);
});

// 选中的熟练（右侧显示）
const selectedProf = ref(filteredProficiencies.value[0] || null);

// 选中的职业
const selectedClassName = computed(() => {
  if (!characterStore.characterData.class) return '';
  const classData = getClassById(characterStore.characterData.class);
  return classData?.name || '';
});

// 初始槽位
const initialSlots = computed(() => characterStore.getInitialNonweaponSlots());

// 可用语言槽
const availableLanguageSlots = computed(() => characterStore.getAvailableLanguageSlots());
const remainingLanguageSlots = computed(
  () =>
    availableLanguageSlots.value -
    characterStore.characterData.languageSlotsToWeapon -
    characterStore.characterData.languageSlotsToNonweapon,
);

// 语言槽转换数量（直接从 store 读取，确保数据同步）
const languageSlotsToNonweapon = computed({
  get: () => characterStore.characterData.languageSlotsToNonweapon,
  set: (value: number) => {
    characterStore.updateCharacterData(data => {
      data.languageSlotsToNonweapon = value;
    });
  },
});

// 剩余槽位
const remainingSlots = computed(() => characterStore.getRemainingNonweaponSlots());

// 是否可以继续
const canProceed = computed(() => remainingSlots.value === 0);

// 是否可以增加槽位
const canIncreaseSlots = computed(() => remainingSlots.value > 0);

// 转换语言槽
function convertLanguageSlot(delta: number) {
  const newValue = languageSlotsToNonweapon.value + delta;
  if (newValue >= 0 && newValue <= remainingLanguageSlots.value + languageSlotsToNonweapon.value) {
    languageSlotsToNonweapon.value = newValue;
  }
}

// 选择熟练（显示详情）
function selectProf(prof: any) {
  selectedProf.value = prof;
}

// 检查熟练是否已选
function isProfSelected(profId: string): boolean {
  return characterStore.characterData.nonweaponProficiencies.some(p => p.id === profId);
}

// 获取已选熟练的槽位数
function getSelectedSlots(profId: string): number {
  const found = characterStore.characterData.nonweaponProficiencies.find(p => p.id === profId);
  return found?.slots || 0;
}

// 获取角色的熟练组（用于计算成本）
function getCharacterGroups(): ProficiencyGroup[] {
  if (!characterStore.characterData.class) return ['general'];

  const classData = getClassById(characterStore.characterData.class);
  if (!classData) return ['general'];

  // 根据表38确定角色的熟练组
  const groups: ProficiencyGroup[] = ['general'];

  switch (classData.id) {
    case 'fighter':
      groups.push('warrior');
      break;
    case 'paladin':
      groups.push('warrior', 'priest');
      break;
    case 'ranger':
      groups.push('warrior', 'wizard');
      break;
    case 'cleric':
    case 'druid':
      groups.push('priest');
      if (classData.id === 'druid') groups.push('warrior');
      break;
    case 'mage':
      groups.push('wizard');
      break;
    case 'thief':
      groups.push('rogue');
      break;
    case 'bard':
      groups.push('rogue', 'warrior', 'wizard');
      break;
  }

  return groups;
}

// 获取熟练的实际成本（考虑跨组）
function getProficiencyCostForCharacter(prof: any): number {
  return getProficiencyCost(prof.id, getCharacterGroups());
}

// 获取熟练成本显示
function getProficiencyCostDisplay(prof: any): string {
  const cost = getProficiencyCostForCharacter(prof);
  const baseCost = prof.slots;
  if (cost > baseCost) {
    return `${baseCost}槽(跨组${cost})`;
  }
  return `${baseCost}槽`;
}

// 检查是否可以添加熟练
function canAddProficiency(prof: any): boolean {
  const cost = getProficiencyCostForCharacter(prof);
  return remainingSlots.value >= cost;
}

// 添加熟练
function addProficiency(profId: string) {
  const prof = getProficiencyById(profId);
  if (!prof) return;

  const cost = getProficiencyCostForCharacter(prof);
  if (remainingSlots.value >= cost) {
    characterStore.updateCharacterData(data => {
      data.nonweaponProficiencies.push({
        id: profId,
        slots: cost,
      });
    });
    toastr.success(`选择了 ${prof.name}`);
  } else {
    toastr.warning('槽位不足');
  }
}

// 移除熟练
function removeProficiency(profId: string) {
  characterStore.updateCharacterData(data => {
    data.nonweaponProficiencies = data.nonweaponProficiencies.filter(p => p.id !== profId);
  });
  const prof = getProficiencyById(profId);
  if (prof) {
    toastr.info(`移除了 ${prof.name}`);
  }
}

// 获取属性名称
function getAbilityName(ability: string): string {
  const names: Record<string, string> = {
    str: '力量',
    dex: '敏捷',
    con: '体质',
    int: '智力',
    wis: '灵知',
    cha: '魅力',
    none: '无',
  };
  return names[ability] || ability;
}

// 格式化描述（将换行符转换为<br>）
function formatDescription(desc: string): string {
  return desc.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}

// 返回上一步
function goBack() {
  characterStore.updateCharacterData(data => {
    data.step = 5;
  });
}

// 进入下一步（装备购买）
function goNext() {
  if (!canProceed.value) {
    toastr.warning('请先分配完所有熟练槽位');
    return;
  }
  characterStore.updateCharacterData(data => {
    data.step = 7;
  });
  toastr.success('非武器熟练选择完成，进入装备购买');
}
</script>

<style lang="scss" scoped>
.step6-nonweapon-proficiency {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.main-container {
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-panel {
  background-color: #fff;
  border: 4px solid #000;
  padding: 15px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    border: 1px solid #666;
    pointer-events: none;
  }

  h2 {
    font-family: '临海体', serif;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    margin: 0 0 10px 0;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    font-size: 14px;
  }

  .info-item {
    .label {
      font-weight: bold;
      margin-right: 5px;
    }

    .value {
      &.warning {
        color: #c00;
        font-weight: bold;
      }

      &.success {
        color: #0a0;
        font-weight: bold;
      }
    }
  }
}

.language-conversion {
  background-color: #f9f9f9;
  border: 2px solid #666;
  padding: 12px;

  h3 {
    font-size: 16px;
    margin: 0 0 8px 0;
  }

  .help-text {
    color: #666;
    font-size: 13px;
    margin: 0 0 8px 0;
  }

  .converter {
    display: flex;
    align-items: center;
    gap: 10px;

    .convert-value {
      font-size: 16px;
      font-weight: bold;
      min-width: 40px;
      text-align: center;
    }
  }
}

.group-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .tab-button {
    padding: 8px 16px;
    border: 2px solid #000;
    background-color: #fff;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: #f0f0f0;
    }

    &.active {
      background-color: #000;
      color: #fff;
    }
  }
}

.proficiency-list {
  background-color: #fff;
  border: 3px solid #000;
  max-height: 600px;
  overflow-y: auto;
}

.prof-item {
  padding: 12px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f8f8;
  }

  &.selected {
    background-color: #e8f4ff;
  }

  &.highlight {
    background-color: #fff4cc;
    border-left: 4px solid #d4af37;
  }

  .prof-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;

    .prof-name {
      font-weight: bold;
      font-size: 15px;
    }

    .prof-cost {
      font-size: 13px;
      color: #666;

      .selected-count {
        color: #4a90e2;
        font-weight: bold;
      }
    }
  }

  .prof-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #888;
  }
}

.right-panel {
  background-color: #fff;
  border: 4px solid #000;
  padding: 20px;
  max-height: 800px;
  overflow-y: auto;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    border: 1px solid #666;
    pointer-events: none;
  }
}

.prof-details {
  .details-header {
    margin-bottom: 15px;

    h2 {
      font-family: '临海体', serif;
      font-size: 28px;
      font-weight: bold;
      margin: 0 0 5px 0;
    }

    .english-name {
      font-size: 16px;
      color: #666;
      font-style: italic;
    }
  }

  .details-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f9f9f9;
    border: 2px solid #ddd;

    .stat-item {
      .label {
        font-weight: bold;
        margin-right: 5px;
      }
    }
  }

  .details-description {
    margin-bottom: 20px;

    h3 {
      font-size: 20px;
      margin: 0 0 10px 0;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }

    .description-text {
      line-height: 1.8;
      font-size: 15px;

      ::v-deep(p) {
        margin-bottom: 10px;
      }
    }
  }

  .details-actions {
    .selected-info {
      p {
        margin: 5px 0;
        font-weight: bold;

        &.help-text {
          font-weight: normal;
          color: #666;
          font-size: 13px;
        }
      }

      .action-buttons {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }
    }
  }
}

.no-selection {
  text-align: center;
  padding: 100px 20px;
  color: #999;
  font-size: 18px;
}

.navigation {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;
}

.adnd-button {
  padding: 12px 24px;
  border: 3px solid #000;
  background-color: #fff;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    background-color: #f0f0f0;
    transform: translateY(-2px);
  }

  &.primary {
    background-color: #000;
    color: #fff;

    &:hover:not(:disabled) {
      background-color: #333;
    }
  }

  &.secondary {
    background-color: #666;
    color: #fff;
    border-color: #666;

    &:hover:not(:disabled) {
      background-color: #888;
    }
  }

  &.danger {
    background-color: #c00;
    color: #fff;
    border-color: #c00;

    &:hover:not(:disabled) {
      background-color: #e00;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
