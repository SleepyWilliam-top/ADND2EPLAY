<template>
  <div class="custom-race-creator">
    <div class="creator-header">
      <h2>自定义种族创建器</h2>
      <p class="rules-summary">
        根据ADND2E规则创建新种族。种族必须：类人形态、陆行、有智慧、无过强能力、乐于交际。职业等级最高12级（由首要属性决定）。
      </p>
    </div>

    <div class="creator-content">
      <!-- 基本信息 -->
      <section class="creator-section">
        <h3>基本信息</h3>
        <div class="form-group">
          <label>种族名称：</label>
          <input v-model="customRace.name" type="text" placeholder="例如：狼人" />
        </div>
        <div class="form-group">
          <label>英文名称：</label>
          <input v-model="customRace.englishName" type="text" placeholder="例如：Werewolf" />
        </div>
        <div class="form-group">
          <label>图标（Emoji）：</label>
          <input v-model="customRace.icon" type="text" placeholder="例如：🐺" maxlength="2" />
        </div>
        <div class="form-group">
          <label>种族描述：</label>
          <textarea v-model="customRace.description" rows="4" placeholder="描述种族的外观、文化和特点..."></textarea>
        </div>
        <div class="form-group">
          <label>寿命：</label>
          <input v-model="customRace.lifespan" type="text" placeholder="例如：80+2d20年" />
        </div>
      </section>

      <!-- 体型选择 -->
      <section class="creator-section">
        <h3>体型</h3>
        <div class="size-options">
          <label v-for="size in sizeOptions" :key="size.id" class="size-option">
            <input type="radio" v-model="customRace.size" :value="size.id" />
            <span class="size-label">
              {{ size.name }} ({{ size.id }})
              <span class="size-desc">{{ size.description }}</span>
            </span>
          </label>
        </div>
        <div v-if="sizeAdjustment" class="size-adjustment-info"><strong>体型调整：</strong>{{ sizeAdjustment }}</div>
      </section>

      <!-- 属性调整 -->
      <section class="creator-section">
        <h3>属性调整</h3>
        <p class="section-note">增减必须平衡。除力量外，任何属性调整不超过±2。力量调整由体型决定。</p>
        <div class="ability-adjustments">
          <div v-for="ability in abilities" :key="ability.key" class="adjustment-item">
            <label>{{ ability.name }}：</label>
            <select v-model.number="customRace.abilityAdjustments[ability.key]" :disabled="ability.key === 'str'">
              <option :value="0">无调整 (0)</option>
              <option :value="-2">-2</option>
              <option :value="-1">-1</option>
              <option :value="1">+1</option>
              <option :value="2">+2</option>
            </select>
          </div>
        </div>
        <div class="adjustment-balance" :class="{ balanced: isAdjustmentBalanced, unbalanced: !isAdjustmentBalanced }">
          <strong>平衡状态：</strong>
          总和 = {{ adjustmentSum }} ({{ isAdjustmentBalanced ? '✓ 平衡' : '✗ 未平衡' }})
        </div>
      </section>

      <!-- 属性要求 -->
      <section class="creator-section">
        <h3>属性要求</h3>
        <p class="section-note">设置该种族的属性最小值和最大值。大型生物力量最低11，敏捷最高17。</p>
        <div class="ability-requirements">
          <div v-for="ability in abilities" :key="ability.key" class="requirement-item">
            <label>{{ ability.name }}：</label>
            <div class="min-max-inputs">
              <input
                type="number"
                v-model.number="customRace.abilityRequirements[ability.key].min"
                min="3"
                max="18"
                placeholder="最小"
              />
              <span>-</span>
              <input
                type="number"
                v-model.number="customRace.abilityRequirements[ability.key].max"
                min="3"
                max="20"
                placeholder="最大"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 职业限制 -->
      <section class="creator-section">
        <h3>职业限制</h3>
        <p class="section-note">
          选择该种族可选的职业。等级上限由首要属性决定（3-12级）。兼职需要在每个职业的首要属性上都有14+。
        </p>
        <div class="class-limits">
          <div v-for="cls in availableClasses" :key="cls" class="class-item">
            <label>
              <input type="checkbox" v-model="selectedClasses" :value="cls" />
              {{ cls }}
            </label>
          </div>
        </div>
      </section>

      <!-- 特殊能力 -->
      <section class="creator-section">
        <h3>特殊能力</h3>
        <p class="section-note">添加种族特殊能力。不要添加过强的能力（如天生施法、魔法抗力等）。</p>
        <div class="abilities-list">
          <div v-for="(ability, index) in customRace.abilities" :key="index" class="ability-item">
            <div class="ability-inputs">
              <input v-model="ability.name" type="text" placeholder="能力名称" />
              <input v-model="ability.description" type="text" placeholder="能力描述" />
              <button @click="removeAbility(index)" class="btn-remove">删除</button>
            </div>
            <div class="ability-tooltip">
              <label>
                <input type="checkbox" v-model="ability.hasTooltip" />
                添加详细说明
              </label>
              <textarea
                v-if="ability.hasTooltip"
                v-model="ability.tooltipText"
                placeholder="详细说明..."
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>
        <button @click="addAbility" class="btn-add">+ 添加能力</button>
      </section>

      <!-- 语言 -->
      <section class="creator-section">
        <h3>语言</h3>
        <div class="languages-list">
          <div v-for="(lang, index) in customRace.languages" :key="index" class="language-item">
            <input v-model="customRace.languages[index]" type="text" placeholder="语言名称" />
            <button @click="removeLanguage(index)" class="btn-remove">删除</button>
          </div>
        </div>
        <button @click="addLanguage" class="btn-add">+ 添加语言</button>
      </section>

      <!-- 优势与劣势 -->
      <section class="creator-section">
        <h3>特殊优势与劣势</h3>
        <div class="form-group">
          <label>特殊优势：</label>
          <textarea v-model="customRace.specialAdvantages" rows="2" placeholder="总结该种族的主要优势..."></textarea>
        </div>
        <div class="form-group">
          <label>特殊劣势：</label>
          <textarea v-model="customRace.specialDisadvantages" rows="2" placeholder="总结该种族的主要劣势..."></textarea>
        </div>
      </section>
    </div>

    <!-- 底部按钮 -->
    <div class="creator-footer">
      <button @click="validateAndSave" class="btn-primary" :disabled="!canSave">保存种族</button>
      <button @click="cancel" class="btn-secondary">取消</button>
    </div>

    <!-- 验证错误提示 -->
    <div v-if="validationErrors.length > 0" class="validation-errors">
      <h4>请修正以下问题：</h4>
      <ul>
        <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Race } from '../utils/raceData';

interface Emit {
  (e: 'save', race: Race): void;
  (e: 'cancel'): void;
}

const emit = defineEmits<Emit>();

// 体型选项
const sizeOptions = [
  { id: 'T', name: '微型', description: '2英尺或更小，力量-3' },
  { id: 'S', name: '小型', description: '2-4英尺，力量-1' },
  { id: 'M', name: '中型', description: '4-7英尺，无调整' },
  { id: 'L', name: '大型', description: '7-12英尺，力量+1，敏捷上限17' },
  { id: 'H', name: '巨型', description: '12-25英尺，力量+2，敏捷上限17' },
  { id: 'G', name: '超巨型', description: '25英尺以上，力量+4，敏捷上限17' },
];

// 属性列表
const abilities = [
  { key: 'str', name: '力量' },
  { key: 'dex', name: '敏捷' },
  { key: 'con', name: '体质' },
  { key: 'int', name: '智力' },
  { key: 'wis', name: '感知' },
  { key: 'cha', name: '魅力' },
];

// 可用职业
const availableClasses = [
  '战士',
  '游侠',
  '圣武士',
  '牧师',
  '德鲁伊',
  '巫师',
  '幻术师',
  '盗贼',
  '吟游诗人',
  '战士/牧师',
  '战士/盗贼',
  '战士/巫师',
  '牧师/游侠',
  '牧师/巫师',
  '盗贼/巫师',
];

// 自定义种族数据
const customRace = ref<Partial<Race> & { size: string }>({
  id: '', // 将在保存时生成
  name: '',
  englishName: '',
  icon: '',
  category: 'custom',
  description: '',
  lifespan: '',
  size: 'M',
  abilityRequirements: {
    str: { min: 3, max: 18 },
    dex: { min: 3, max: 18 },
    con: { min: 3, max: 18 },
    int: { min: 3, max: 18 },
    wis: { min: 3, max: 18 },
    cha: { min: 3, max: 18 },
  },
  abilityAdjustments: {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  },
  classLimits: [],
  abilities: [],
  languages: [],
  specialAdvantages: '',
  specialDisadvantages: '',
});

const selectedClasses = ref<string[]>([]);
const validationErrors = ref<string[]>([]);

// 根据体型自动设置力量调整
watch(
  () => customRace.value.size,
  newSize => {
    const sizeMap: Record<string, number> = {
      T: -3,
      S: -1,
      M: 0,
      L: 1,
      H: 2,
      G: 4,
    };
    customRace.value.abilityAdjustments!.str = sizeMap[newSize] || 0;

    // 大型及以上生物的敏捷上限为17
    if (['L', 'H', 'G'].includes(newSize)) {
      customRace.value.abilityRequirements!.dex.max = 17;
    } else {
      customRace.value.abilityRequirements!.dex.max = 18;
    }

    // 大型生物力量最低11
    if (newSize === 'L') {
      customRace.value.abilityRequirements!.str.min = 11;
    } else {
      customRace.value.abilityRequirements!.str.min = 3;
    }
  },
);

// 体型调整说明
const sizeAdjustment = computed(() => {
  const size = customRace.value.size;
  const option = sizeOptions.find(s => s.id === size);
  return option ? option.description : '';
});

// 计算调整总和（不包括力量，因为力量由体型决定）
const adjustmentSum = computed(() => {
  const adjustments = customRace.value.abilityAdjustments!;
  return Object.entries(adjustments).reduce((sum, [key, value]) => sum + value, 0);
});

// 检查调整是否平衡
const isAdjustmentBalanced = computed(() => {
  return adjustmentSum.value === 0;
});

// 检查是否可以保存
const canSave = computed(() => {
  return (
    customRace.value.name &&
    customRace.value.englishName &&
    isAdjustmentBalanced.value &&
    selectedClasses.value.length > 0
  );
});

// 添加能力
function addAbility() {
  customRace.value.abilities!.push({
    name: '',
    description: '',
    hasTooltip: false,
    tooltipText: '',
  });
}

// 删除能力
function removeAbility(index: number) {
  customRace.value.abilities!.splice(index, 1);
}

// 添加语言
function addLanguage() {
  customRace.value.languages!.push('');
}

// 删除语言
function removeLanguage(index: number) {
  customRace.value.languages!.splice(index, 1);
}

// 验证并保存
function validateAndSave() {
  validationErrors.value = [];

  // 验证基本信息
  if (!customRace.value.name) validationErrors.value.push('请输入种族名称');
  if (!customRace.value.englishName) validationErrors.value.push('请输入英文名称');
  if (!customRace.value.icon) validationErrors.value.push('请输入图标');
  if (!customRace.value.description) validationErrors.value.push('请输入种族描述');
  if (!customRace.value.lifespan) validationErrors.value.push('请输入寿命');

  // 验证属性调整平衡
  if (!isAdjustmentBalanced.value) {
    validationErrors.value.push('属性调整必须平衡（总和为0）');
  }

  // 验证属性调整范围
  const adjustments = customRace.value.abilityAdjustments!;
  for (const [key, value] of Object.entries(adjustments)) {
    if (key !== 'str' && Math.abs(value) > 2) {
      validationErrors.value.push(`${abilities.find(a => a.key === key)?.name}调整超出范围（±2）`);
    }
  }

  // 验证属性要求
  const requirements = customRace.value.abilityRequirements!;
  for (const [key, range] of Object.entries(requirements)) {
    if (range.min > range.max) {
      validationErrors.value.push(`${abilities.find(a => a.key === key)?.name}的最小值不能大于最大值`);
    }
  }

  // 验证职业选择
  if (selectedClasses.value.length === 0) {
    validationErrors.value.push('请至少选择一个职业');
  }

  // 验证能力
  if (customRace.value.abilities!.length === 0) {
    validationErrors.value.push('请至少添加一个特殊能力');
  } else {
    customRace.value.abilities!.forEach((ability, index) => {
      if (!ability.name || !ability.description) {
        validationErrors.value.push(`第${index + 1}个能力的名称和描述不能为空`);
      }
    });
  }

  // 验证语言
  if (customRace.value.languages!.length === 0) {
    validationErrors.value.push('请至少添加一个语言');
  }

  if (validationErrors.value.length > 0) {
    return;
  }

  // 生成ID（使用名称的拼音或英文名的小写）
  const id = customRace.value.englishName!.toLowerCase().replace(/\s+/g, '-');

  // 生成职业限制（所有职业等级上限都是12）
  const classLimits = selectedClasses.value.map(className => ({
    className,
    levelLimit: 12 as const,
  }));

  // 构建完整的Race对象
  const race: Race = {
    id,
    name: customRace.value.name!,
    englishName: customRace.value.englishName!,
    icon: customRace.value.icon!,
    category: 'custom',
    description: customRace.value.description!,
    lifespan: customRace.value.lifespan!,
    abilityRequirements: customRace.value.abilityRequirements!,
    abilityAdjustments: customRace.value.abilityAdjustments!,
    classLimits,
    abilities: customRace.value.abilities!.filter(a => a.name && a.description),
    languages: customRace.value.languages!.filter(l => l),
    specialAdvantages: customRace.value.specialAdvantages,
    specialDisadvantages: customRace.value.specialDisadvantages,
  };

  emit('save', race);
}

// 取消
function cancel() {
  emit('cancel');
}
</script>

<style scoped lang="scss">
.custom-race-creator {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.creator-header {
  text-align: center;
  margin-bottom: 30px;

  h2 {
    font-size: 28px;
    color: #8b4513;
    margin-bottom: 10px;
  }

  .rules-summary {
    color: #666;
    font-size: 14px;
    line-height: 1.6;
  }
}

.creator-content {
  background: #f9f7f4;
  padding: 20px;
  border: 2px solid #8b4513;
  border-radius: 8px;
}

.creator-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #ccc;

  &:last-child {
    border-bottom: none;
  }

  h3 {
    font-size: 20px;
    color: #8b4513;
    margin-bottom: 15px;
  }

  .section-note {
    font-size: 13px;
    color: #666;
    margin-bottom: 15px;
    font-style: italic;
  }
}

.form-group {
  margin-bottom: 15px;

  label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
    color: #333;
  }

  input[type='text'],
  textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #8b4513;
    }
  }
}

.size-options {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .size-option {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;

    input[type='radio'] {
      cursor: pointer;
    }

    .size-label {
      .size-desc {
        color: #666;
        font-size: 13px;
        margin-left: 8px;
      }
    }
  }
}

.size-adjustment-info {
  margin-top: 15px;
  padding: 10px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  color: #856404;
}

.ability-adjustments,
.ability-requirements {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.adjustment-item,
.requirement-item {
  display: flex;
  align-items: center;
  gap: 10px;

  label {
    font-weight: bold;
    min-width: 60px;
  }

  select {
    flex: 1;
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;

    &:disabled {
      background: #e9ecef;
      cursor: not-allowed;
    }
  }

  .min-max-inputs {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;

    input[type='number'] {
      width: 60px;
      padding: 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }
  }
}

.adjustment-balance {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;

  &.balanced {
    background: #d4edda;
    border: 1px solid #28a745;
    color: #155724;
  }

  &.unbalanced {
    background: #f8d7da;
    border: 1px solid #dc3545;
    color: #721c24;
  }
}

.class-limits {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  .class-item {
    label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      input[type='checkbox'] {
        cursor: pointer;
      }
    }
  }
}

.abilities-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ability-item {
  background: white;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;

  .ability-inputs {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;

    input[type='text'] {
      flex: 1;
      padding: 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }
  }

  .ability-tooltip {
    label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      cursor: pointer;

      input[type='checkbox'] {
        cursor: pointer;
      }
    }

    textarea {
      width: 100%;
      padding: 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 13px;
    }
  }
}

.languages-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.language-item {
  display: flex;
  gap: 10px;

  input[type='text'] {
    flex: 1;
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }
}

.btn-add {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #218838;
  }
}

.btn-remove {
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #c82333;
  }
}

.creator-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;

  button {
    padding: 12px 30px;
    font-size: 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;

    &.btn-primary {
      background: #8b4513;
      color: white;

      &:hover:not(:disabled) {
        background: #6d3410;
      }

      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    }

    &.btn-secondary {
      background: #6c757d;
      color: white;

      &:hover {
        background: #5a6268;
      }
    }
  }
}

.validation-errors {
  margin-top: 20px;
  padding: 15px;
  background: #f8d7da;
  border: 1px solid #dc3545;
  border-radius: 4px;
  color: #721c24;

  h4 {
    margin-bottom: 10px;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 5px;
    }
  }
}

@media (max-width: 768px) {
  .ability-adjustments,
  .ability-requirements {
    grid-template-columns: 1fr;
  }

  .class-limits {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
