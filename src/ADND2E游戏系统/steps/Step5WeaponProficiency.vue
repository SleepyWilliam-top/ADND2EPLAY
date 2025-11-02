<template>
  <div class="step5-weapon-proficiency">
    <!-- 顶部信息面板 -->
    <div class="info-panel">
      <h2>⚔️ 武器熟练选择</h2>
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
          <span class="value">{{ characterStore.characterData.languageSlotsToWeapon }}</span>
        </div>
        <div class="info-item">
          <span class="label">剩余槽位：</span>
          <span class="value" :class="{ warning: remainingSlots < 0, success: remainingSlots === 0 }">
            {{ remainingSlots }}
          </span>
        </div>
      </div>
    </div>

    <!-- 智力语言槽转换区 -->
    <div v-if="availableLanguageSlots > 0" class="language-conversion">
      <h3>智力语言槽转换</h3>
      <p class="help-text">剩余 {{ remainingLanguageSlots }} 个语言槽可转换为武器熟练槽（1:1）。</p>
      <div class="converter">
        <button class="adnd-button" :disabled="languageSlotsToWeapon <= 0" @click="convertLanguageSlot(-1)">-</button>
        <span class="convert-value">{{ languageSlotsToWeapon }}</span>
        <button class="adnd-button" :disabled="remainingLanguageSlots <= 0" @click="convertLanguageSlot(1)">+</button>
      </div>
    </div>

    <!-- 专精说明（仅战士） -->
    <div v-if="canSpecialize" class="specialization-info">
      <h3>⭐ 武器专精（仅战士可用）</h3>
      <div class="spec-details">
        <p><strong>专精效果：</strong></p>
        <ul>
          <li>攻击检定 +1</li>
          <li>伤害检定 +2</li>
          <li>弓类专精获得平射射程（6-30英尺，攻击+2）</li>
          <li>额外攻击次数（见表35）</li>
        </ul>
        <p><strong>专精成本：</strong></p>
        <ul>
          <li>近战武器/弩：2槽（1熟练+1专精）</li>
          <li>弓类：3槽（1熟练+2专精）</li>
        </ul>
      </div>
    </div>

    <!-- 武器分类标签页 -->
    <div class="weapon-categories">
      <div class="tabs">
        <button
          v-for="category in weaponCategories"
          :key="category"
          class="tab-button"
          :class="{ active: selectedCategory === category }"
          @click="selectedCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <!-- 武器列表 -->
    <div class="weapons-list">
      <div
        v-for="weapon in filteredWeapons"
        :key="weapon.id"
        class="weapon-card"
        :class="{
          selected: isWeaponSelected(weapon.id),
          specialized: isWeaponSpecialized(weapon.id),
        }"
        @click="toggleWeapon(weapon.id)"
      >
        <div class="weapon-header">
          <div class="weapon-name">
            <span class="icon">{{ getWeaponIcon(weapon.category) }}</span>
            <span class="name">{{ weapon.name }}</span>
            <span class="english">{{ weapon.englishName }}</span>
          </div>
          <div class="weapon-status">
            <span v-if="isWeaponSpecialized(weapon.id)" class="specialized-badge">专精</span>
            <span v-else-if="isWeaponSelected(weapon.id)" class="selected-badge">已选</span>
          </div>
        </div>
        <div class="weapon-details">
          <div class="stat-row">
            <span>类型：{{ weapon.type }}</span>
            <span>尺寸：{{ weapon.size }}</span>
            <span>速率：{{ weapon.speedFactor }}</span>
          </div>
          <div class="stat-row">
            <span>伤害(S-M)：{{ weapon.damageS_M }}</span>
            <span>伤害(L)：{{ weapon.damageL }}</span>
          </div>
          <div v-if="weapon.specialNotes" class="stat-row">
            <span class="special-note">{{ weapon.specialNotes }}</span>
          </div>
        </div>
        <div v-if="isWeaponSelected(weapon.id)" class="weapon-actions">
          <button
            v-if="canSpecialize && !isWeaponSpecialized(weapon.id)"
            class="adnd-button secondary"
            :disabled="!canAffordSpecialization(weapon.id)"
            @click.stop="toggleSpecialization(weapon.id)"
          >
            专精此武器
          </button>
          <button
            v-if="isWeaponSpecialized(weapon.id)"
            class="adnd-button secondary"
            @click.stop="toggleSpecialization(weapon.id)"
          >
            取消专精
          </button>
        </div>
        <!-- 相关武器提示 -->
        <div v-if="isWeaponSelected(weapon.id) && getRelatedWeaponsText(weapon.id)" class="related-weapons">
          <p><strong>相关武器：</strong>{{ getRelatedWeaponsText(weapon.id) }}</p>
          <p class="help-text">使用相关武器时，不熟练惩罚减半（往上取整）</p>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="navigation">
      <button class="adnd-button secondary" @click="goBack">返回上一步</button>
      <button class="adnd-button primary" :disabled="!canProceed" @click="goNext">
        {{ remainingSlots === 0 ? '进入下一步' : `还需选择 ${remainingSlots} 个熟练` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import toastr from 'toastr';
import { computed, ref, watch } from 'vue';
import { useCharacterStore } from '../stores/characterStore';
import { getClassById } from '../utils/classData';
import { getAllWeaponCategories, getRelatedWeapons, getWeaponById, WEAPONS } from '../utils/weaponData';

const characterStore = useCharacterStore();

// 武器分类（只显示职业可用的分类）
const weaponCategories = computed(() => {
  const classData = characterStore.getCharacterClass();
  const allowedWeapons = classData?.allowedWeapons;

  // 如果职业没有武器限制，显示所有分类
  if (!allowedWeapons) {
    return getAllWeaponCategories();
  }

  // 否则只显示有可用武器的分类
  const allCategories = getAllWeaponCategories();
  return allCategories.filter(category => {
    // 检查该分类下是否有职业可用的武器
    return WEAPONS.some(w => w.category === category && !w.isAmmunition && allowedWeapons.includes(w.id));
  });
});

const selectedCategory = ref<string>('');

// 监听分类列表变化，自动选择第一个可用分类
watch(
  weaponCategories,
  categories => {
    if (categories.length > 0 && !selectedCategory.value) {
      selectedCategory.value = categories[0];
    }
  },
  { immediate: true },
);

// 过滤后的武器列表（排除弹药）
const filteredWeapons = computed(() => {
  const classData = characterStore.getCharacterClass();
  const allowedWeapons = classData?.allowedWeapons;

  // 如果职业没有武器限制（undefined），则显示所有武器
  if (!allowedWeapons) {
    return WEAPONS.filter(w => w.category === selectedCategory.value && !w.isAmmunition);
  }

  // 否则只显示职业可用的武器
  return WEAPONS.filter(w => w.category === selectedCategory.value && !w.isAmmunition && allowedWeapons.includes(w.id));
});

// 选中的职业
const selectedClassName = computed(() => {
  if (!characterStore.characterData.class) return '';
  const classData = getClassById(characterStore.characterData.class);
  return classData?.name || '';
});

// 初始槽位
const initialSlots = computed(() => characterStore.getInitialWeaponSlots());

// 可用语言槽
const availableLanguageSlots = computed(() => characterStore.getAvailableLanguageSlots());

// 剩余可用语言槽（考虑已转到非武器的）
const remainingLanguageSlots = computed(
  () =>
    availableLanguageSlots.value -
    characterStore.characterData.languageSlotsToWeapon -
    characterStore.characterData.languageSlotsToNonweapon,
);

// 语言槽转换数量（直接从 store 读取，确保数据同步）
const languageSlotsToWeapon = computed({
  get: () => characterStore.characterData.languageSlotsToWeapon,
  set: (value: number) => {
    characterStore.characterData.languageSlotsToWeapon = value;
  },
});

// 剩余槽位
const remainingSlots = computed(() => characterStore.getRemainingWeaponSlots());

// 是否可以专精
const canSpecialize = computed(() => characterStore.canSpecialize());

// 是否可以继续
const canProceed = computed(() => remainingSlots.value === 0);

// 转换语言槽
function convertLanguageSlot(delta: number) {
  const newValue = languageSlotsToWeapon.value + delta;
  // 确保新值在有效范围内（考虑到已转到非武器的槽位）
  if (newValue >= 0 && newValue <= remainingLanguageSlots.value + languageSlotsToWeapon.value) {
    languageSlotsToWeapon.value = newValue;
  }
}

// 检查武器是否已选
function isWeaponSelected(weaponId: string): boolean {
  return characterStore.characterData.weaponProficiencies.includes(weaponId);
}

// 检查武器是否已专精
function isWeaponSpecialized(weaponId: string): boolean {
  return characterStore.characterData.weaponSpecializations.includes(weaponId);
}

// 切换武器选择
function toggleWeapon(weaponId: string) {
  const isSelected = isWeaponSelected(weaponId);
  const isSpecialized = isWeaponSpecialized(weaponId);

  if (isSelected) {
    // 取消选择（同时取消专精）
    characterStore.characterData.weaponProficiencies = characterStore.characterData.weaponProficiencies.filter(
      id => id !== weaponId,
    );
    if (isSpecialized) {
      characterStore.characterData.weaponSpecializations = characterStore.characterData.weaponSpecializations.filter(
        id => id !== weaponId,
      );
    }
  } else if (remainingSlots.value > 0) {
    // 选择武器
    characterStore.characterData.weaponProficiencies.push(weaponId);
  } else {
    toastr.warning('没有剩余的熟练槽位');
  }
}

// 切换专精
function toggleSpecialization(weaponId: string) {
  const isSpecialized = isWeaponSpecialized(weaponId);

  if (isSpecialized) {
    // 取消专精
    characterStore.characterData.weaponSpecializations = characterStore.characterData.weaponSpecializations.filter(
      id => id !== weaponId,
    );
  } else if (canAffordSpecialization(weaponId)) {
    // 专精武器
    characterStore.characterData.weaponSpecializations.push(weaponId);
  } else {
    toastr.warning('槽位不足以专精此武器');
  }
}

// 检查是否有足够槽位专精
function canAffordSpecialization(weaponId: string): boolean {
  const weapon = getWeaponById(weaponId);
  if (!weapon) return false;

  // 弓类需要额外2槽，其他武器需要额外1槽
  const isBow = weaponId.includes('bow') && !weaponId.includes('crossbow');
  const requiredSlots = isBow ? 2 : 1;

  return remainingSlots.value >= requiredSlots;
}

// 获取武器图标
function getWeaponIcon(category: string): string {
  const icons: Record<string, string> = {
    弓: '🏹',
    弩: '🎯',
    剑: '⚔️',
    斧: '🪓',
    匕首: '🗡️',
    连枷: '🔨',
    钉头锤: '⚒️',
    锤: '🔨',
    矛: '🔱',
    长柄武器: '⚡',
    叉矛: '🔱',
    简易武器: '🏑',
    投掷武器: '💨',
    特殊武器: '✨',
  };
  return icons[category] || '⚔️';
}

// 获取相关武器文本
function getRelatedWeaponsText(weaponId: string): string {
  const relatedWeapons = getRelatedWeapons(weaponId);
  if (relatedWeapons.length === 0) return '';
  return relatedWeapons.map(w => w.name).join('、');
}

// 返回上一步
function goBack() {
  characterStore.characterData.step = 4;
}

// 进入下一步
function goNext() {
  if (!canProceed.value) {
    toastr.warning('请先分配完所有熟练槽位');
    return;
  }
  characterStore.characterData.step = 6;
  toastr.success('武器熟练选择完成');
}
</script>

<style lang="scss" scoped>
.step5-weapon-proficiency {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.info-panel {
  background-color: #fff;
  border: 4px solid #000;
  padding: 20px;
  margin-bottom: 20px;
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
    font-family: 'Times New Roman', serif;
    font-size: 28px;
    font-weight: bold;
    text-align: center;
    margin: 0 0 15px 0;
    text-transform: uppercase;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .info-item {
    .label {
      font-weight: bold;
      margin-right: 8px;
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
  padding: 15px;
  margin-bottom: 20px;

  h3 {
    font-size: 20px;
    margin: 0 0 10px 0;
  }

  .help-text {
    color: #666;
    margin: 0 0 10px 0;
  }

  .converter {
    display: flex;
    align-items: center;
    gap: 15px;

    .convert-value {
      font-size: 18px;
      font-weight: bold;
      min-width: 60px;
      text-align: center;
    }
  }
}

.specialization-info {
  background-color: #fffbea;
  border: 3px solid #d4af37;
  padding: 15px;
  margin-bottom: 20px;

  h3 {
    font-size: 20px;
    margin: 0 0 10px 0;
    color: #d4af37;
  }

  .spec-details {
    p {
      margin: 10px 0 5px 0;
    }

    ul {
      margin: 5px 0;
      padding-left: 25px;
    }
  }
}

.weapon-categories {
  margin-bottom: 20px;

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .tab-button {
    padding: 10px 20px;
    border: 2px solid #000;
    background-color: #fff;
    font-weight: bold;
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

.weapons-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.weapon-card {
  border: 3px solid #666;
  background-color: #fff;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &.selected {
    border-color: #4a90e2;
    background-color: #f0f8ff;
  }

  &.specialized {
    border-color: #d4af37;
    background-color: #fffbea;
  }

  .weapon-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .weapon-name {
    display: flex;
    align-items: center;
    gap: 8px;

    .icon {
      font-size: 24px;
    }

    .name {
      font-size: 18px;
      font-weight: bold;
    }

    .english {
      font-size: 14px;
      color: #666;
    }
  }

  .weapon-status {
    .specialized-badge {
      background-color: #d4af37;
      color: #fff;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 12px;
    }

    .selected-badge {
      background-color: #4a90e2;
      color: #fff;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 12px;
    }
  }

  .weapon-details {
    font-size: 14px;
    line-height: 1.6;

    .stat-row {
      display: flex;
      gap: 15px;
      margin-bottom: 5px;

      span {
        &:not(:last-child)::after {
          content: '|';
          margin-left: 15px;
          color: #ccc;
        }
      }

      .special-note {
        color: #d4af37;
        font-style: italic;
      }
    }
  }

  .weapon-actions {
    margin-top: 10px;
    display: flex;
    gap: 10px;
  }

  .related-weapons {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    font-size: 13px;

    p {
      margin: 5px 0;
    }

    .help-text {
      color: #666;
      font-style: italic;
    }
  }
}

.navigation {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 30px;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
