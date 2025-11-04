<template>
  <div class="step2-race-selection">
    <!-- 自定义种族创建器 -->
    <CustomRaceCreator v-if="showCustomRaceCreator" @save="saveCustomRace" @cancel="cancelCustomRace" />

    <!-- 第一级：种族分类选择 -->
    <div v-else-if="!selectedCategory" class="category-selection">
      <div class="current-abilities">
        <h3>你的属性</h3>
        <div class="abilities-display">
          <span>力量 {{ characterStore.characterData.abilities.str }}</span>
          <span>敏捷 {{ characterStore.characterData.abilities.dex }}</span>
          <span>体质 {{ characterStore.characterData.abilities.con }}</span>
          <span>智力 {{ characterStore.characterData.abilities.int }}</span>
          <span>灵知 {{ characterStore.characterData.abilities.wis }}</span>
          <span>魅力 {{ characterStore.characterData.abilities.cha }}</span>
        </div>
      </div>

      <div class="category-prompt">
        <p>请选择种族分类：</p>
      </div>

      <div class="category-cards">
        <div
          v-for="category in raceCategories"
          :key="category.id"
          class="category-card"
          @click="selectCategory(category.id)"
        >
          <h2>{{ category.name }}</h2>
          <h3>{{ category.englishName }}</h3>
          <p>{{ category.description }}</p>
          <div class="card-action">点击选择</div>
        </div>
      </div>

      <div class="bottom-actions">
        <button class="adnd-button secondary" @click="goToPreviousStep">
          <span class="button-icon">←</span>
          <span>上一步</span>
        </button>
      </div>
    </div>

    <!-- 第二级：具体种族选择 -->
    <div v-else-if="!showSubraceSelection" class="race-selection">
      <div class="selection-header">
        <h3>种族选择 > {{ currentCategory?.name }}</h3>
        <div class="abilities-display">
          <span>力量 {{ characterStore.characterData.abilities.str }}</span>
          <span>敏捷 {{ characterStore.characterData.abilities.dex }}</span>
          <span>体质 {{ characterStore.characterData.abilities.con }}</span>
          <span>智力 {{ characterStore.characterData.abilities.int }}</span>
          <span>灵知 {{ characterStore.characterData.abilities.wis }}</span>
          <span>魅力 {{ characterStore.characterData.abilities.cha }}</span>
        </div>
      </div>

      <div class="selection-content">
        <!-- 左侧：种族列表 -->
        <div class="race-list">
          <div
            v-for="race in availableRaces"
            :key="race.id"
            class="race-card"
            :class="{
              selected: selectedRace === race.id,
              disabled: !canSelectRaceData(race),
            }"
            @click="selectRace(race.id)"
          >
            <div class="race-icon">{{ race.icon }}</div>
            <div class="race-info">
              <div class="race-name">{{ race.name }}</div>
              <div class="race-adjustments">
                {{ getRaceAdjustmentText(race) }}
              </div>
            </div>
            <div v-if="selectedRace === race.id" class="selected-indicator"><i class="fa-solid fa-check"></i></div>
            <div v-else-if="!characterStore.canSelectRace(race.id)" class="disabled-indicator">
              <i class="fa-solid fa-xmark"></i>
            </div>
          </div>

          <!-- 创建新种族按钮（仅在自定义种族分类时显示） -->
          <div v-if="selectedCategory === 'custom'" class="create-race-button" @click="showCreator">
            <div class="race-icon"><i class="fa-solid fa-plus"></i></div>
            <div class="race-info">
              <div class="race-name">创建新种族</div>
              <div class="race-adjustments">使用ADND2E规则创建自定义种族</div>
            </div>
          </div>
        </div>

        <!-- 右侧：种族详情 -->
        <div class="race-details">
          <div v-if="selectedRaceData" class="details-content">
            <!-- 种族标题 -->
            <div class="detail-header">
              <h2>{{ selectedRaceData.name }} ({{ selectedRaceData.englishName }})</h2>
              <p class="lifespan">寿命：{{ selectedRaceData.lifespan }}</p>
            </div>

            <div class="divider"></div>

            <!-- 种族图片 -->
            <div v-if="selectedRaceData.image" class="detail-section race-image-section">
              <img :src="selectedRaceData.image" :alt="selectedRaceData.name" class="race-image" />
              <p v-if="selectedRaceData.imageCredit" class="image-credit">
                图片来自：{{ selectedRaceData.imageCredit }}
              </p>
            </div>

            <!-- 种族描述 -->
            <div class="detail-section">
              <h4>种族描述</h4>
              <p class="description">{{ selectedRaceData.description }}</p>
            </div>

            <!-- 属性要求 -->
            <div class="detail-section">
              <h4>属性要求</h4>
              <div class="ability-requirements">
                <div v-for="(ability, key) in abilityLabels" :key="key" class="ability-requirement">
                  <span class="ability-label">{{ ability }}</span>
                  <span class="requirement-value">{{ getRequirementText(selectedRaceData, key) }}</span>
                  <span
                    class="requirement-status"
                    :class="{
                      met: checkRequirement(selectedRaceData.id, key),
                      unmet: !checkRequirement(selectedRaceData.id, key),
                    }"
                  >
                    <i
                      :class="checkRequirement(selectedRaceData.id, key) ? 'fa-solid fa-check' : 'fa-solid fa-xmark'"
                    ></i>
                  </span>
                </div>
              </div>
            </div>

            <!-- 属性调整 -->
            <div class="detail-section">
              <h4>属性调整</h4>
              <div class="ability-adjustments">
                <p v-if="Object.keys(selectedRaceData.abilityAdjustments).length === 0">无属性调整</p>
                <p v-else>
                  {{ getAdjustmentText(selectedRaceData) }}
                </p>
                <div v-if="Object.keys(selectedRaceData.abilityAdjustments).length > 0">
                  <p class="adjusted-preview">调整后属性：</p>
                  <div class="adjusted-abilities">
                    <span
                      v-for="(ability, key) in abilityLabels"
                      :key="key"
                      :class="{ adjusted: getAdjustmentForAbility(selectedRaceData, key) !== 0 }"
                    >
                      {{ ability }} {{ getAdjustedValue(key) }}
                      <span v-if="getAdjustmentForAbility(selectedRaceData, key) !== 0" class="change">
                        ({{ getAdjustmentForAbility(selectedRaceData, key) > 0 ? '+' : ''
                        }}{{ getAdjustmentForAbility(selectedRaceData, key) }})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 可选职业与等级上限 -->
            <div class="detail-section">
              <h4>可选职业与等级上限</h4>
              <div class="class-limits">
                <span v-for="(classLimit, index) in selectedRaceData.classLimits" :key="index" class="class-limit">
                  {{ classLimit.className }}({{ classLimit.levelLimit }})
                </span>
              </div>
            </div>

            <!-- 种族能力 -->
            <div class="detail-section">
              <h4>种族能力</h4>
              <ul class="abilities-list">
                <li v-for="(ability, index) in selectedRaceData.abilities" :key="index">
                  <strong>{{ ability.name }}</strong>
                  <span v-if="ability.hasTooltip" class="tooltip-icon" :title="ability.tooltipText"> [?] </span>
                  <span>：{{ ability.description }}</span>
                </li>
              </ul>
            </div>

            <!-- 起始语言 -->
            <div class="detail-section">
              <h4>起始语言</h4>
              <p class="languages">{{ selectedRaceData.languages.join('、') }}</p>
            </div>

            <!-- 特殊优势 -->
            <div v-if="selectedRaceData.specialAdvantages" class="detail-section advantage-section">
              <h4>特殊收益</h4>
              <p class="special-text advantage-text">{{ selectedRaceData.specialAdvantages }}</p>
            </div>

            <!-- 特殊劣势 -->
            <div v-if="selectedRaceData.specialDisadvantages" class="detail-section disadvantage-section">
              <h4>特殊劣势</h4>
              <p class="special-text disadvantage-text">{{ selectedRaceData.specialDisadvantages }}</p>
            </div>

            <!-- 提示：如果有亚种 -->
            <div
              v-if="selectedRaceData.subraces && selectedRaceData.subraces.length > 0"
              class="detail-section subrace-hint-section"
            >
              <div class="divider"></div>
              <p class="subrace-notice">
                <span class="notice-icon">ℹ</span>
                该种族拥有 {{ selectedRaceData.subraces.length }} 个亚种可供选择，确认后将进入亚种选择。
              </p>
            </div>
          </div>
          <div v-else class="no-selection">
            <p>请从左侧选择一个种族</p>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="bottom-actions">
        <button class="adnd-button secondary" @click="backToCategory">
          <span class="button-icon">←</span>
          <span>返回分类</span>
        </button>
        <button class="adnd-button secondary" @click="resetSelection">重置选择</button>
        <button
          class="adnd-button primary"
          :disabled="!selectedRace || !characterStore.canSelectRace(selectedRace)"
          @click="confirmSelection"
        >
          <span>{{ getConfirmButtonText() }}</span>
          <span class="button-icon">→</span>
        </button>
      </div>
    </div>

    <!-- 第三级：亚种选择 -->
    <div v-else class="subrace-selection">
      <div class="selection-header">
        <h3>种族选择 > {{ currentCategory?.name }} > {{ selectedRaceData?.name }}</h3>
        <div class="abilities-display">
          <span>力量 {{ characterStore.characterData.abilities.str }}</span>
          <span>敏捷 {{ characterStore.characterData.abilities.dex }}</span>
          <span>体质 {{ characterStore.characterData.abilities.con }}</span>
          <span>智力 {{ characterStore.characterData.abilities.int }}</span>
          <span>灵知 {{ characterStore.characterData.abilities.wis }}</span>
          <span>魅力 {{ characterStore.characterData.abilities.cha }}</span>
        </div>
      </div>

      <div class="subrace-content-wrapper">
        <!-- 左侧：亚种列表 -->
        <div class="subrace-list">
          <!-- 不使用亚种选项 -->
          <div class="subrace-card" :class="{ selected: selectedSubrace === null }" @click="selectNoSubrace">
            <div class="subrace-card-header">
              <div class="subrace-name">不使用亚种</div>
              <div class="subrace-english">No Subrace</div>
            </div>
            <div v-if="selectedSubrace === null" class="selected-indicator">✓</div>
          </div>

          <!-- 亚种选项 -->
          <div
            v-for="subrace in selectedRaceData?.subraces"
            :key="subrace.id"
            class="subrace-card"
            :class="{
              selected: selectedSubrace === subrace.id,
              disabled: !canSelectCurrentSubrace(subrace.id),
            }"
            @click="selectSubrace(subrace.id)"
          >
            <div class="subrace-card-header">
              <div class="subrace-name">{{ subrace.name }}</div>
              <div class="subrace-english">{{ subrace.englishName }}</div>
            </div>
            <div v-if="selectedSubrace === subrace.id" class="selected-indicator">
              <i class="fa-solid fa-check"></i>
            </div>
            <div v-else-if="!canSelectCurrentSubrace(subrace.id)" class="disabled-indicator">
              <i class="fa-solid fa-xmark"></i>
            </div>
          </div>
        </div>

        <!-- 右侧：亚种详情 -->
        <div class="subrace-details">
          <div v-if="selectedSubrace === null" class="no-subrace-details">
            <h2>不使用亚种</h2>
            <p class="hint">使用{{ selectedRaceData?.name }}的标准能力，不选择特定亚种。</p>

            <div class="divider"></div>

            <!-- 标准种族能力 -->
            <div class="detail-section">
              <h4>种族能力</h4>
              <p class="section-hint">将使用基础{{ selectedRaceData?.name }}的所有标准能力</p>
              <ul class="abilities-list">
                <li v-for="(ability, index) in selectedRaceData?.abilities" :key="index">
                  <strong>{{ ability.name }}</strong>
                  <span v-if="ability.hasTooltip" class="tooltip-icon" :title="ability.tooltipText"> [?] </span>
                  <span>：{{ ability.description }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div v-else-if="selectedSubraceData" class="subrace-details-content">
            <!-- 亚种标题 -->
            <div class="detail-header">
              <h2>{{ selectedSubraceData.name }} ({{ selectedSubraceData.englishName }})</h2>
              <p class="description">{{ selectedSubraceData.description }}</p>
            </div>

            <div class="divider"></div>

            <!-- 种族图片（来自基础种族） -->
            <div v-if="selectedRaceData?.image" class="detail-section race-image-section">
              <img :src="selectedRaceData.image" :alt="selectedRaceData.name" class="race-image" />
              <p v-if="selectedRaceData.imageCredit" class="image-credit">
                图片来自：{{ selectedRaceData.imageCredit }}
              </p>
            </div>

            <!-- 属性调整与预览 -->
            <div class="detail-section">
              <h4>属性调整</h4>
              <div class="ability-adjustments">
                <p v-if="Object.keys(selectedSubraceData.abilityAdjustments).length === 0">无属性调整</p>
                <p v-else>
                  {{ getSubraceAdjustmentText(selectedSubraceData) }}
                </p>
                <div v-if="Object.keys(selectedSubraceData.abilityAdjustments).length > 0">
                  <p class="adjusted-preview">调整后属性：</p>
                  <div class="adjusted-abilities">
                    <span
                      v-for="(ability, key) in abilityLabels"
                      :key="key"
                      :class="{ adjusted: getSubraceAdjustmentForAbility(selectedSubraceData, key) !== 0 }"
                    >
                      {{ ability }} {{ getSubraceAdjustedValue(key) }}
                      <span v-if="getSubraceAdjustmentForAbility(selectedSubraceData, key) !== 0" class="change">
                        ({{ getSubraceAdjustmentForAbility(selectedSubraceData, key) > 0 ? '+' : ''
                        }}{{ getSubraceAdjustmentForAbility(selectedSubraceData, key) }})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 属性要求 -->
            <div class="detail-section">
              <h4>属性要求</h4>
              <div class="ability-requirements">
                <div v-for="(ability, key) in abilityLabels" :key="key" class="ability-requirement">
                  <span class="ability-label">{{ ability }}</span>
                  <span class="requirement-value">{{ getSubraceRequirementText(selectedSubraceData, key) }}</span>
                  <span
                    class="requirement-status"
                    :class="{
                      met: checkSubraceRequirement(selectedSubraceData.id, key),
                      unmet: !checkSubraceRequirement(selectedSubraceData.id, key),
                    }"
                  >
                    <i
                      :class="
                        checkSubraceRequirement(selectedSubraceData.id, key) ? 'fa-solid fa-check' : 'fa-solid fa-xmark'
                      "
                    ></i>
                  </span>
                </div>
              </div>
            </div>

            <!-- 热感视觉 -->
            <div class="detail-section">
              <h4>热感视觉</h4>
              <p class="infravision">{{ selectedSubraceData.infravision }}</p>
            </div>

            <!-- 继承的标准种族能力 -->
            <div class="detail-section inherited-abilities-section">
              <h4>继承的标准{{ selectedRaceData?.name }}能力</h4>
              <p class="section-hint">以下能力继承自基础{{ selectedRaceData?.name }}种族</p>
              <ul class="abilities-list inherited">
                <li v-for="(ability, index) in getInheritedAbilities()" :key="index">
                  <strong>{{ ability.name }}</strong>
                  <span v-if="ability.hasTooltip" class="tooltip-icon" :title="ability.tooltipText"> [?] </span>
                  <span>：{{ ability.description }}</span>
                </li>
              </ul>
            </div>

            <!-- 亚种特有/修改的能力 -->
            <div
              v-if="getSubraceSpecificAbilities().length > 0"
              class="detail-section subrace-specific-abilities-section"
            >
              <h4>亚种特有能力</h4>
              <p class="section-hint">以下能力是{{ selectedSubraceData.name }}特有的，或对标准能力的修改</p>
              <ul class="abilities-list subrace-specific">
                <li v-for="(ability, index) in getSubraceSpecificAbilities()" :key="index">
                  <strong>{{ ability.name }}</strong>
                  <span v-if="ability.hasTooltip" class="tooltip-icon" :title="ability.tooltipText"> [?] </span>
                  <span>：{{ ability.description }}</span>
                  <span v-if="isModifiedAbility(ability.name)" class="modified-badge">已修改</span>
                  <span v-else class="new-badge">新增</span>
                </li>
              </ul>
            </div>
            <div v-else class="detail-section">
              <h4>亚种特有能力</h4>
              <p class="section-hint no-special-abilities">
                {{ selectedSubraceData.name }}完全使用标准精灵能力，无特殊或修改的能力
              </p>
            </div>

            <!-- 起始语言 -->
            <div class="detail-section">
              <h4>起始语言</h4>
              <p class="languages">{{ selectedSubraceData.languages.join('、') }}</p>
            </div>

            <!-- 特殊优势 -->
            <div v-if="selectedSubraceData.specialAdvantages" class="detail-section advantage-section">
              <h4>特殊优势</h4>
              <p class="special-text advantage-text">{{ selectedSubraceData.specialAdvantages }}</p>
            </div>

            <!-- 特殊劣势 -->
            <div v-if="selectedSubraceData.specialDisadvantages" class="detail-section disadvantage-section">
              <h4>特殊劣势</h4>
              <p class="special-text disadvantage-text">{{ selectedSubraceData.specialDisadvantages }}</p>
            </div>

            <!-- 经验惩罚 -->
            <div
              v-if="selectedSubraceData.xpPenalty && selectedSubraceData.xpPenalty > 0"
              class="detail-section xp-penalty-section"
            >
              <h4>额外经验消耗</h4>
              <p class="xp-penalty-text">
                +{{ selectedSubraceData.xpPenalty }}%
                <span class="xp-explanation">（升级所需经验值增加{{ selectedSubraceData.xpPenalty }}%）</span>
              </p>
            </div>
          </div>

          <div v-else class="no-selection">
            <p>请从左侧选择一个亚种</p>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="bottom-actions">
        <button class="adnd-button secondary" @click="backToRaceSelection">
          <span class="button-icon">←</span>
          <span>返回种族选择</span>
        </button>
        <button
          class="adnd-button primary"
          :disabled="selectedSubrace !== null && !canSelectCurrentSubrace(selectedSubrace)"
          @click="confirmSubraceSelection"
        >
          <span>确认选择</span>
          <span class="button-icon">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import CustomRaceCreator from '../components/CustomRaceCreator.vue';
import type { Abilities } from '../stores/characterStore';
import { useCharacterStore } from '../stores/characterStore';
import type { Race, Subrace } from '../utils/raceData';
import { getRaceById, getRacesByCategory, getSubraceById, raceCategories } from '../utils/raceData';

const characterStore = useCharacterStore();

// 当前选择的分类
const selectedCategory = ref<string | null>(null);
const selectedRace = ref<string | null>(null);
const selectedSubrace = ref<string | null>(null);
const showSubraceSelection = ref<boolean>(false); // 是否显示亚种选择界面
const showCustomRaceCreator = ref<boolean>(false); // 是否显示自定义种族创建器
const customRaces = ref<Race[]>([]); // 用户创建的自定义种族列表

// 计算属性
const currentCategory = computed(() => {
  return raceCategories.find(c => c.id === selectedCategory.value);
});

const availableRaces = computed(() => {
  if (!selectedCategory.value) return [];
  const baseRaces = getRacesByCategory(selectedCategory.value);
  // 如果是自定义种族分类，则添加用户创建的自定义种族
  if (selectedCategory.value === 'custom') {
    return [...baseRaces, ...customRaces.value];
  }
  return baseRaces;
});

const selectedRaceData = computed(() => {
  if (!selectedRace.value) return null;
  // 先从基础种族中查找
  const baseRace = getRaceById(selectedRace.value);
  if (baseRace) return baseRace;
  // 如果没找到，从自定义种族中查找
  return customRaces.value.find(r => r.id === selectedRace.value) || null;
});

const selectedSubraceData = computed(() => {
  if (!selectedRace.value || !selectedSubrace.value) return null;
  return getSubraceById(selectedRace.value, selectedSubrace.value);
});

// 属性标签
const abilityLabels: Record<keyof Abilities, string> = {
  str: '力量',
  dex: '敏捷',
  con: '体质',
  int: '智力',
  wis: '灵知',
  cha: '魅力',
};

// 方法
function goToPreviousStep() {
  // 回退到上一步（属性掷骰）
  characterStore.updateCharacterData(data => {
    data.step = 1;
  });
}

function selectCategory(categoryId: string) {
  selectedCategory.value = categoryId;
}

function canSelectRaceData(race: Race): boolean {
  // 人类无属性要求
  if (Object.keys(race.abilityRequirements).length === 0) return true;

  const abilities = characterStore.characterData.abilities;
  const abilityMap: Record<string, keyof Abilities> = {
    str: 'str',
    dex: 'dex',
    con: 'con',
    int: 'int',
    wis: 'wis',
    cha: 'cha',
  };

  // 检查所有属性要求
  for (const [key, requirement] of Object.entries(race.abilityRequirements)) {
    // 如果 min 和 max 都是 0，表示无此属性，跳过检查
    if (requirement.min === 0 && requirement.max === 0) continue;

    const abilityKey = abilityMap[key];
    const abilityValue = abilities[abilityKey];
    if (abilityValue === null) return false;
    if (abilityValue < requirement.min || abilityValue > requirement.max) {
      return false;
    }
  }

  return true;
}

function selectRace(raceId: string) {
  // 使用 availableRaces 来检查，因为它包含自定义种族
  const race = availableRaces.value.find(r => r.id === raceId);
  if (!race || !canSelectRaceData(race)) return;
  selectedRace.value = raceId;
  // 不再在这里设置亚种，而是在进入第三级时设置
}

function selectSubrace(subraceId: string) {
  if (!canSelectCurrentSubrace(subraceId)) return;
  selectedSubrace.value = subraceId;
}

function selectNoSubrace() {
  selectedSubrace.value = null;
}

// 检查是否可以选择某个亚种
function canSelectCurrentSubrace(subraceId: string): boolean {
  if (!selectedRace.value) return false;
  return characterStore.canSelectSubrace(selectedRace.value, subraceId);
}

// 检查亚种的单个属性要求
function checkSubraceRequirement(subraceId: string, abilityKey: keyof Abilities): boolean {
  if (!selectedRace.value) return false;
  const result = characterStore.checkSubraceAbilityRequirement(selectedRace.value, subraceId, abilityKey);
  return result?.met ?? false;
}

function backToCategory() {
  selectedCategory.value = null;
  selectedRace.value = null;
  selectedSubrace.value = null;
  showSubraceSelection.value = false;
}

function resetSelection() {
  selectedRace.value = null;
  selectedSubrace.value = null;
  showSubraceSelection.value = false;
}

function confirmSelection() {
  if (!selectedRace.value) return;

  // 从 availableRaces 中查找种族（包含自定义种族）
  const race = availableRaces.value.find(r => r.id === selectedRace.value);
  if (!race || !canSelectRaceData(race)) {
    toastr.error('不满足该种族的属性要求');
    return;
  }

  // 如果种族有亚种，进入亚种选择界面
  if (race?.subraces && race.subraces.length > 0) {
    showSubraceSelection.value = true;
    // 默认选择第一个满足属性要求的亚种
    const defaultSubrace = race.subraces.find(s => canSelectCurrentSubrace(s.id));
    selectedSubrace.value = defaultSubrace?.id || null;
  } else {
    // 没有亚种，直接完成选择
    finishSelection();
  }
}

function backToRaceSelection() {
  showSubraceSelection.value = false;
  // 重置为默认亚种
  const race = getRaceById(selectedRace.value!);
  if (race?.subraces && race.subraces.length > 0) {
    const defaultSubrace = race.subraces.find(s => canSelectCurrentSubrace(s.id));
    selectedSubrace.value = defaultSubrace?.id || null;
  }
}

function confirmSubraceSelection() {
  // selectedSubrace 可以是 null（不使用亚种）或具体的亚种ID
  finishSelection();
}

function finishSelection() {
  // 检查是否更改了种族或亚种
  const previousRace = characterStore.characterData.race;
  const previousSubrace = characterStore.characterData.subrace;
  const raceChanged = previousRace !== selectedRace.value || previousSubrace !== selectedSubrace.value;

  // 使用 updateCharacterData 更新数据
  characterStore.updateCharacterData(data => {
    // 保存选择
    data.raceCategory = selectedCategory.value;
    data.race = selectedRace.value;
    data.subrace = selectedSubrace.value;

    // 如果种族改变，清空后续步骤的相关数据
    if (raceChanged) {
      // 清空职业选择
      data.class = null;

      // 清空超凡力量
      data.exceptionalStrength = null;

      // 清空武器熟练数据
      data.weaponProficiencies = [];
      data.weaponSpecializations = [];

      // 清空非武器熟练数据
      data.nonweaponProficiencies = [];
      data.languageSlotsToWeapon = 0;
      data.languageSlotsToNonweapon = 0;

      // 清空装备购买数据
      data.startingMoney = 0;
      data.currentMoney = 0;
      data.purchasedEquipment = [];

      // 清空法术数据
      if (data.spells) {
        data.spells = {
          memorizedSpells: {
            level1: [],
            level2: [],
            level3: [],
            level4: [],
            level5: [],
            level6: [],
            level7: [],
            level8: [],
            level9: [],
          },
        };
      }
    }

    // 前进到下一步
    data.step = 3;
  });

  toastr.success('种族选择成功');
}

function getConfirmButtonText(): string {
  if (!selectedRace.value) return '确认选择';
  const race = getRaceById(selectedRace.value);
  if (race?.subraces && race.subraces.length > 0) {
    return '下一步（选择亚种）';
  }
  return '确认选择';
}

// 辅助函数
function getRaceAdjustmentText(race: Race): string {
  const adjustments = Object.entries(race.abilityAdjustments);
  if (adjustments.length === 0) return '无调整';

  return adjustments
    .map(([key, value]) => {
      const label = abilityLabels[key as keyof Abilities];
      const sign = value > 0 ? '+' : '';
      return `${sign}${value}${label.charAt(0)}`;
    })
    .join(' ');
}

function getRequirementText(race: Race, abilityKey: keyof Abilities): string {
  const keyMap: Record<keyof Abilities, string> = {
    str: 'str',
    dex: 'dex',
    con: 'con',
    int: 'int',
    wis: 'wis',
    cha: 'cha',
  };

  const req = race.abilityRequirements[keyMap[abilityKey]];
  if (!req) return '无限制';
  if (req.min === 0 && req.max === 0) return '无此属性';
  return `${req.min}/${req.max}`;
}

function checkRequirement(raceId: string, abilityKey: keyof Abilities): boolean {
  const result = characterStore.checkAbilityRequirement(raceId, abilityKey);
  return result?.met ?? false;
}

function getAdjustmentText(race: Race): string {
  const adjustments = Object.entries(race.abilityAdjustments);
  return adjustments
    .map(([key, value]) => {
      const label = abilityLabels[key as keyof Abilities];
      const sign = value > 0 ? '+' : '';
      return `${sign}${value} ${label}`;
    })
    .join('，');
}

function getAdjustmentForAbility(race: Race, abilityKey: keyof Abilities): number {
  return race.abilityAdjustments[abilityKey] || 0;
}

function getAdjustedValue(abilityKey: keyof Abilities): number {
  const adjusted = characterStore.adjustedAbilities;
  return adjusted[abilityKey] ?? 0;
}

// 亚种相关的辅助方法
function getSubraceAdjustmentText(subrace: Subrace): string {
  const adjustments = Object.entries(subrace.abilityAdjustments);
  return adjustments
    .map(([key, value]) => {
      const label = abilityLabels[key as keyof Abilities];
      const sign = value > 0 ? '+' : '';
      return `${sign}${value} ${label}`;
    })
    .join('，');
}

function getSubraceAdjustmentForAbility(subrace: Subrace, abilityKey: keyof Abilities): number {
  return subrace.abilityAdjustments[abilityKey] || 0;
}

function getSubraceAdjustedValue(abilityKey: keyof Abilities): number {
  if (!selectedSubraceData.value) return characterStore.characterData.abilities[abilityKey] ?? 0;

  const baseValue = characterStore.characterData.abilities[abilityKey] ?? 0;
  const adjustment = selectedSubraceData.value.abilityAdjustments[abilityKey] || 0;
  return baseValue + adjustment;
}

function getSubraceRequirementText(subrace: Subrace, abilityKey: keyof Abilities): string {
  const keyMap: Record<keyof Abilities, string> = {
    str: 'str',
    dex: 'dex',
    con: 'con',
    int: 'int',
    wis: 'wis',
    cha: 'cha',
  };

  const req = subrace.abilityRequirements[keyMap[abilityKey]];
  if (!req) return '无限制';
  if (req.min === 0 && req.max === 0) return '无此属性';
  return `${req.min}/${req.max}`;
}

// 获取继承自基础种族的能力（不冲突的部分）
function getInheritedAbilities() {
  if (!selectedRaceData.value || !selectedSubraceData.value) return [];

  const baseAbilities = selectedRaceData.value.abilities;
  const subraceAbilityNames = new Set(selectedSubraceData.value.abilities.map(a => a.name));

  // 基础种族中有，但亚种中没有明确覆盖的能力
  return baseAbilities.filter(ability => !subraceAbilityNames.has(ability.name));
}

// 获取亚种特有或修改的能力
function getSubraceSpecificAbilities() {
  if (!selectedSubraceData.value) return [];
  return selectedSubraceData.value.abilities;
}

// 判断某个能力是否是对基础能力的修改（而非新增）
function isModifiedAbility(abilityName: string): boolean {
  if (!selectedRaceData.value) return false;

  const baseAbilityNames = new Set(selectedRaceData.value.abilities.map(a => a.name));
  return baseAbilityNames.has(abilityName);
}

// ========== 自定义种族相关方法 ==========

// 从酒馆变量加载自定义种族列表
function loadCustomRaces() {
  try {
    const savedRaces = getVariables({ type: 'global' });
    if (savedRaces && savedRaces['adnd2e_custom_races']) {
      customRaces.value = savedRaces['adnd2e_custom_races'] as Race[];
    }
  } catch (error) {
    console.error('加载自定义种族失败:', error);
  }
}

// 保存自定义种族列表到酒馆变量
function saveCustomRaces() {
  try {
    replaceVariables(
      {
        adnd2e_custom_races: customRaces.value,
      },
      { type: 'global' },
    );
  } catch (error) {
    console.error('保存自定义种族失败:', error);
  }
}

// 显示自定义种族创建器
function showCreator() {
  showCustomRaceCreator.value = true;
}

// 保存新创建的种族
function saveCustomRace(race: Race) {
  // 检查是否已存在相同ID的种族
  const existingIndex = customRaces.value.findIndex(r => r.id === race.id);
  if (existingIndex >= 0) {
    // 如果存在，则更新
    customRaces.value[existingIndex] = race;
  } else {
    // 否则添加新种族
    customRaces.value.push(race);
  }

  // 保存到酒馆变量
  saveCustomRaces();

  // 关闭创建器
  showCustomRaceCreator.value = false;

  // 自动选择新创建的种族
  selectedRace.value = race.id;
}

// 取消创建
function cancelCustomRace() {
  showCustomRaceCreator.value = false;
}

// 组件挂载时加载自定义种族
onMounted(() => {
  loadCustomRaces();
});
</script>

<style lang="scss" scoped>
.step2-race-selection {
  width: 100%;
  font-family: '临海体', serif;
}

// ========== 第一级：分类选择 ==========
.category-selection {
  padding: 40px;

  .current-abilities {
    margin-bottom: 40px;
    text-align: center;

    h3 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .abilities-display {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;

      span {
        font-size: 16px;
        padding: 5px 10px;
        border: 1px solid #666;
      }
    }
  }

  .category-prompt {
    text-align: center;
    margin-bottom: 30px;

    p {
      font-size: 20px;
      font-weight: bold;
    }
  }

  .category-cards {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 800px;
    margin: 0 auto 40px;
  }

  .category-card {
    background-color: #fff;
    border: 3px solid #000;
    padding: 40px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
      border: 1px solid #999;
      pointer-events: none;
    }

    h2 {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
      text-align: center;
    }

    h3 {
      font-size: 18px;
      color: #666;
      margin-bottom: 20px;
      text-align: center;
    }

    p {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 20px;
      text-align: center;
    }

    .card-action {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      color: #666;
    }

    &:hover {
      border-width: 4px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// ========== 第二级和第三级：种族选择 ==========
.race-selection {
  display: flex;
  flex-direction: column;
  height: 100%;

  .selection-header {
    padding: 20px 30px;
    border-bottom: 2px solid #000;
    background-color: #f5f5f5;

    h3 {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .abilities-display {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;

      span {
        font-size: 14px;
        padding: 3px 8px;
        border: 1px solid #666;
      }
    }
  }

  .selection-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  // 左侧：种族列表
  .race-list {
    width: 250px;
    border-right: 2px solid #000;
    overflow-y: auto;
    background-color: #f9f9f9;
    padding: 15px;

    .race-card {
      background-color: #fff;
      border: 2px solid #000;
      padding: 15px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;

      .race-icon {
        font-size: 32px;
      }

      .race-info {
        flex: 1;

        .race-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .race-adjustments {
          font-size: 12px;
          color: #666;
        }
      }

      .selected-indicator,
      .disabled-indicator {
        font-size: 18px;
        font-weight: bold;
      }

      .selected-indicator {
        color: #5cb85c;
      }

      .disabled-indicator {
        color: #d9534f;
      }

      &.selected {
        background-color: #000;
        color: #fff;
        border-width: 3px;

        .race-adjustments {
          color: #ccc;
        }
      }

      &.disabled {
        background-color: #e0e0e0;
        color: #999;
        cursor: not-allowed;
        border-color: #999;

        .race-adjustments {
          color: #bbb;
        }
      }

      &:not(.disabled):not(.selected):hover {
        border-width: 3px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }

    // 创建新种族按钮
    .create-race-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 2px solid #667eea;
      padding: 15px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
      border-radius: 8px;

      .race-icon {
        font-size: 32px;
      }

      .race-info {
        flex: 1;

        .race-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .race-adjustments {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.9);
        }
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        border-color: #764ba2;
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  // 右侧：种族详情
  .race-details {
    flex: 1;
    overflow-y: auto;
    padding: 30px;
    background-color: #fff;

    .no-selection {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #999;
      font-size: 18px;
    }

    .details-content {
      max-width: 900px;
    }

    .detail-header {
      margin-bottom: 20px;

      h2 {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .lifespan {
        font-size: 14px;
        color: #666;
      }
    }

    .divider {
      height: 2px;
      background-color: #000;
      margin: 20px 0;
    }

    .detail-section {
      margin-bottom: 25px;

      h4 {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 12px;
        padding-bottom: 5px;
        border-bottom: 1px solid #ddd;
      }

      .description {
        line-height: 1.8;
        text-align: justify;
      }

      .ability-requirements {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;

        @media (max-width: 992px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 480px) {
          grid-template-columns: 1fr;
        }

        .ability-requirement {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #ddd;

          .ability-label {
            font-weight: bold;
            min-width: 40px;
          }

          .requirement-value {
            flex: 1;
            color: #666;
          }

          .requirement-status {
            font-weight: bold;
            font-size: 16px;

            &.met {
              color: #5cb85c;
            }

            &.unmet {
              color: #d9534f;
            }
          }
        }
      }

      .ability-adjustments {
        p {
          margin-bottom: 10px;
        }

        .adjusted-preview {
          font-weight: bold;
          margin-top: 15px;
        }

        .adjusted-abilities {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;

          span {
            padding: 5px 10px;
            border: 1px solid #ddd;

            &.adjusted {
              background-color: #fffacd;
              border-color: #000;
              font-weight: bold;

              .change {
                color: #d9534f;
                font-size: 12px;
              }
            }
          }
        }
      }

      .class-limits {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .class-limit {
          padding: 5px 12px;
          border: 1px solid #000;
          font-size: 14px;
        }
      }

      .abilities-list {
        list-style: none;
        padding: 0;

        li {
          margin-bottom: 12px;
          line-height: 1.6;

          .tooltip-icon {
            display: inline-block;
            width: 18px;
            height: 18px;
            line-height: 18px;
            text-align: center;
            border-radius: 50%;
            background-color: #666;
            color: #fff;
            font-size: 12px;
            cursor: help;
            margin: 0 3px;
          }
        }
      }

      .languages {
        line-height: 1.6;
      }

      // 特殊优势/劣势样式
      &.advantage-section {
        h4 {
          color: #2e7d32;
          border-bottom-color: #4caf50;
        }

        .advantage-text {
          padding: 12px;
          background-color: #e8f5e9;
          border-left: 4px solid #4caf50;
          line-height: 1.7;
        }
      }

      &.disadvantage-section {
        h4 {
          color: #c62828;
          border-bottom-color: #f44336;
        }

        .disadvantage-text {
          padding: 12px;
          background-color: #ffebee;
          border-left: 4px solid #f44336;
          line-height: 1.7;
        }
      }
    }

    // 种族图片区域
    .race-image-section {
      text-align: center;
      margin-bottom: 30px;

      .race-image {
        max-width: 100%;
        max-height: 500px;
        height: auto;
        border: 2px solid #000;
        border-radius: 4px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        display: block;
        margin: 0 auto;
      }

      .image-credit {
        margin-top: 8px;
        font-size: 12px;
        color: #666;
        font-style: italic;
      }
    }

    // 亚种提示区域
    .subrace-hint-section {
      .subrace-notice {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 15px;
        background-color: #fffacd;
        border: 2px solid #f0e68c;
        border-radius: 4px;
        font-size: 15px;
        line-height: 1.6;

        .notice-icon {
          font-size: 20px;
          font-weight: bold;
          color: #666;
        }
      }
    }
  }
}

// ========== 第三级：亚种选择 ==========
.subrace-selection {
  display: flex;
  flex-direction: column;
  height: 100%;

  .selection-header {
    padding: 20px 30px;
    border-bottom: 2px solid #000;
    background-color: #f5f5f5;

    h3 {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .abilities-display {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;

      span {
        font-size: 14px;
        padding: 3px 8px;
        border: 1px solid #666;
      }
    }
  }

  .subrace-content-wrapper {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  // 左侧：亚种列表
  .subrace-list {
    width: 280px;
    border-right: 2px solid #000;
    overflow-y: auto;
    background-color: #f9f9f9;
    padding: 15px;

    .subrace-card {
      background-color: #fff;
      border: 2px solid #000;
      padding: 15px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;

      .subrace-card-header {
        .subrace-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .subrace-english {
          font-size: 13px;
          color: #666;
          font-style: italic;
        }
      }

      .selected-indicator,
      .disabled-indicator {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 18px;
        font-weight: bold;
      }

      .selected-indicator {
        color: #5cb85c;
      }

      .disabled-indicator {
        color: #d9534f;
      }

      &.selected {
        background-color: #000;
        color: #fff;
        border-width: 3px;

        .subrace-english {
          color: #ccc;
        }
      }

      &.disabled {
        background-color: #e0e0e0;
        color: #999;
        cursor: not-allowed;
        border-color: #999;

        .subrace-english {
          color: #bbb;
        }
      }

      &:not(.disabled):not(.selected):hover {
        border-width: 3px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
  }

  // 右侧：亚种详情
  .subrace-details {
    flex: 1;
    overflow-y: auto;
    padding: 30px;
    background-color: #fff;

    .no-selection {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #999;
      font-size: 18px;
    }

    .no-subrace-details,
    .subrace-details-content {
      max-width: 900px;
    }

    .no-subrace-details {
      h2 {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .hint {
        font-size: 16px;
        color: #666;
        line-height: 1.6;
        margin-bottom: 20px;
      }

      .section-hint {
        color: #666;
        font-style: italic;
      }
    }

    .detail-header {
      margin-bottom: 20px;

      h2 {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .description {
        font-size: 15px;
        line-height: 1.8;
        color: #333;
        text-align: justify;
      }
    }

    .divider {
      height: 2px;
      background-color: #000;
      margin: 20px 0;
    }

    .detail-section {
      margin-bottom: 25px;

      h4 {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 12px;
        padding-bottom: 5px;
        border-bottom: 1px solid #ddd;
      }

      .ability-adjustments {
        p {
          margin-bottom: 10px;
        }

        .adjusted-preview {
          font-weight: bold;
          margin-top: 15px;
        }

        .adjusted-abilities {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;

          span {
            padding: 5px 10px;
            border: 1px solid #ddd;

            &.adjusted {
              background-color: #fffacd;
              border-color: #000;
              font-weight: bold;

              .change {
                color: #d9534f;
                font-size: 12px;
              }
            }
          }
        }
      }

      .ability-requirements {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;

        @media (max-width: 992px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 480px) {
          grid-template-columns: 1fr;
        }

        .ability-requirement {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #ddd;

          .ability-label {
            font-weight: bold;
            min-width: 40px;
          }

          .requirement-value {
            flex: 1;
            color: #666;
          }

          .requirement-status {
            font-weight: bold;
            font-size: 16px;

            &.met {
              color: #5cb85c;
            }

            &.unmet {
              color: #d9534f;
            }
          }
        }
      }

      .infravision,
      .languages {
        line-height: 1.6;
      }

      .section-hint {
        font-size: 14px;
        color: #666;
        font-style: italic;
        margin-bottom: 12px;

        &.no-special-abilities {
          padding: 10px;
          background-color: #f5f5f5;
          border-left: 3px solid #999;
          margin-bottom: 0;
        }
      }

      .abilities-list {
        list-style: none;
        padding: 0;

        li {
          margin-bottom: 12px;
          line-height: 1.6;
          position: relative;
          padding-left: 15px;

          &::before {
            content: '•';
            position: absolute;
            left: 0;
            color: #666;
            font-weight: bold;
          }

          .tooltip-icon {
            display: inline-block;
            width: 18px;
            height: 18px;
            line-height: 18px;
            text-align: center;
            border-radius: 50%;
            background-color: #666;
            color: #fff;
            font-size: 12px;
            cursor: help;
            margin: 0 3px;
          }

          .modified-badge,
          .new-badge {
            display: inline-block;
            padding: 2px 8px;
            margin-left: 8px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 3px;
          }

          .modified-badge {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffc107;
          }

          .new-badge {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #17a2b8;
          }
        }

        &.inherited {
          li {
            &::before {
              color: #4caf50;
            }
          }
        }

        &.subrace-specific {
          li {
            &::before {
              color: #2196f3;
            }
          }
        }
      }

      // 继承能力部分样式
      &.inherited-abilities-section {
        h4 {
          color: #2e7d32;
          border-bottom-color: #4caf50;
        }

        background-color: #f1f8f4;
        padding: 15px;
        border-left: 4px solid #4caf50;
        margin-left: -15px;
        margin-right: -15px;
        padding-left: 15px;
        padding-right: 15px;
      }

      // 亚种特有能力部分样式
      &.subrace-specific-abilities-section {
        h4 {
          color: #1565c0;
          border-bottom-color: #2196f3;
        }

        background-color: #e3f2fd;
        padding: 15px;
        border-left: 4px solid #2196f3;
        margin-left: -15px;
        margin-right: -15px;
        padding-left: 15px;
        padding-right: 15px;
      }

      // 特殊优势/劣势样式
      &.advantage-section {
        h4 {
          color: #2e7d32;
          border-bottom-color: #4caf50;
        }

        .advantage-text {
          padding: 12px;
          background-color: #e8f5e9;
          border-left: 4px solid #4caf50;
          line-height: 1.7;
        }
      }

      &.disadvantage-section {
        h4 {
          color: #c62828;
          border-bottom-color: #f44336;
        }

        .disadvantage-text {
          padding: 12px;
          background-color: #ffebee;
          border-left: 4px solid #f44336;
          line-height: 1.7;
        }
      }

      // 经验惩罚样式
      &.xp-penalty-section {
        h4 {
          color: #d84315;
          border-bottom-color: #ff5722;
        }

        .xp-penalty-text {
          font-size: 18px;
          font-weight: bold;
          color: #d84315;

          .xp-explanation {
            font-size: 14px;
            font-weight: normal;
            color: #666;
            margin-left: 8px;
          }
        }
      }
    }
  }
}

// ========== 底部操作按钮 ==========
.bottom-actions {
  display: flex;
  justify-content: space-between;
  padding: 20px 30px;
  border-top: 2px solid #000;
  background-color: #f5f5f5;
  gap: 15px;

  @media (max-width: 992px) {
    padding: 15px;
    gap: 10px;
  }

  button {
    display: flex;
    align-items: center;
    gap: 8px;

    @media (max-width: 992px) {
      flex: 1;
      justify-content: center;
      min-height: 44px;
    }

    .button-icon {
      font-size: 16px;
    }

    &.primary {
      margin-left: auto;

      @media (max-width: 992px) {
        margin-left: 0;
      }
    }
  }
}

// ========== 响应式 ==========
@media (max-width: 992px) {
  .category-selection {
    padding: 20px 15px;

    @media (max-width: 480px) {
      padding: 15px 10px;
    }
  }

  .race-selection .selection-content {
    flex-direction: column;

    .race-list {
      width: 100%;
      border-right: none;
      border-bottom: 2px solid #000;
      max-height: 300px;
    }
  }

  .race-selection .race-details {
    padding: 20px 15px;

    @media (max-width: 480px) {
      padding: 15px 10px;
    }
  }

  .subrace-selection .subrace-content-wrapper {
    flex-direction: column;

    .subrace-list {
      width: 100%;
      border-right: none;
      border-bottom: 2px solid #000;
      max-height: 250px;
    }

    .subrace-details {
      padding: 20px 15px;

      @media (max-width: 480px) {
        padding: 15px 10px;
      }
    }
  }

  .subrace-selection .subrace-details {
    .detail-section .ability-requirements {
      grid-template-columns: 1fr;
    }
  }

  .bottom-actions {
    flex-wrap: wrap;
  }
}
</style>
