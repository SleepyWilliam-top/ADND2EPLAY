<template>
  <div class="step10-basic-info">
    <!-- 标题区域 -->
    <div class="info-header">
      <h3>角色基本信息</h3>
      <div class="character-summary">
        <span>{{ currentRaceName }}</span>
        <span>{{ currentClassName }}</span>
        <span>{{ currentAlignmentName }}</span>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="info-content">
      <!-- 角色名字 -->
      <div class="form-section">
        <label class="form-label">
          <span class="label-text">角色名字</span>
          <span class="label-hint">留空则使用酒馆用户名</span>
        </label>
        <input
          v-model="characterName"
          type="text"
          class="form-input"
          placeholder="请输入角色名字（留空则使用酒馆用户名）"
          maxlength="50"
        />
      </div>

      <!-- 性别选择 -->
      <div class="form-section">
        <label class="form-label">
          <span class="label-text">性别</span>
          <span class="label-required">*</span>
        </label>
        <div class="gender-options">
          <label
            v-for="option in genderOptions"
            :key="option.value"
            class="gender-option"
            :class="{ selected: gender === option.value }"
          >
            <input v-model="gender" type="radio" :value="option.value" class="gender-radio" />
            <span class="gender-icon">{{ option.icon }}</span>
            <span class="gender-label">{{ option.label }}</span>
          </label>
        </div>
      </div>

      <!-- 阴茎大小（仅男性） -->
      <div v-if="gender === 'male'" class="form-section">
        <label class="form-label">
          <span class="label-text">阴茎大小</span>
          <span class="label-hint">{{ isLargeCreature ? '大型生物通常更大' : '可选' }}</span>
        </label>
        <select v-model="penisSize" class="form-select">
          <option value="">不填写</option>
          <optgroup v-if="!isLargeCreature" label="标准体型">
            <option value="tiny">微小（5-8厘米）</option>
            <option value="small">偏小（8-12厘米）</option>
            <option value="average">平均（12-16厘米）</option>
            <option value="above_average">偏大（16-20厘米）</option>
            <option value="large">较大（20-25厘米）</option>
            <option value="huge">巨大（25-30厘米）</option>
          </optgroup>
          <optgroup v-else label="大型生物体型">
            <option value="large_small">偏小（25-30厘米）</option>
            <option value="large_average">平均（30-40厘米）</option>
            <option value="large_above_average">偏大（40-50厘米）</option>
            <option value="large_huge">巨大（50-65厘米）</option>
            <option value="large_massive">极巨（65-80厘米）</option>
            <option value="large_monstrous">怪兽级（80厘米以上）</option>
          </optgroup>
        </select>
      </div>

      <!-- 外貌描述 -->
      <div class="form-section">
        <label class="form-label">
          <span class="label-text">外貌描述</span>
          <span class="label-hint">描述角色的外貌特征</span>
        </label>
        <textarea
          v-model="appearance"
          class="form-textarea"
          placeholder="例如：身材魁梧，留着一头乌黑长发，眼神坚毅。左臂有一道醒目的伤疤..."
          rows="4"
          maxlength="500"
        ></textarea>
        <div class="char-count">{{ appearance?.length || 0 }} / 500</div>
      </div>

      <!-- 背景故事 -->
      <div class="form-section">
        <label class="form-label">
          <span class="label-text">背景故事</span>
          <span class="label-hint">描述角色的过去和动机</span>
        </label>
        <textarea
          v-model="background"
          class="form-textarea"
          placeholder="例如：出生于北方的雪山村落，自幼便对冒险充满向往。在一次兽人袭击中失去了家人，发誓要成为强大的战士..."
          rows="6"
          maxlength="1000"
        ></textarea>
        <div class="char-count">{{ background?.length || 0 }} / 1000</div>
      </div>

      <!-- 提示信息 -->
      <div class="info-notice">
        <div class="notice-icon">💡</div>
        <div class="notice-content">
          <p>
            所有信息均为可选（除性别外），你可以随时在游戏中通过修改酒馆变量来更新这些信息。如果暂时没有想法，可以先跳过，后续再补充。
          </p>
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
        <span>确认并继续</span>
        <span class="button-icon">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCharacterStore } from '../stores/characterStore';
import { getAlignmentById } from '../utils/alignmentData';
import { getClassById } from '../utils/classData';
import { getRaceById } from '../utils/raceData';

const characterStore = useCharacterStore();

// 表单数据
const characterName = ref<string>(characterStore.characterData.characterName || '');
const gender = ref<'male' | 'female' | 'other' | null>(characterStore.characterData.gender);
const appearance = ref<string>(characterStore.characterData.appearance || '');
const background = ref<string>(characterStore.characterData.background || '');
const penisSize = ref<string>(characterStore.characterData.penisSize || '');

// 性别选项
const genderOptions = [
  { value: 'male', label: '男性', icon: '♂️' },
  { value: 'female', label: '女性', icon: '♀️' },
  { value: 'other', label: '其他', icon: '⚧️' },
];

// 获取当前角色信息
const currentRace = computed(() => getRaceById(characterStore.characterData.race || ''));
const currentRaceName = computed(() => currentRace.value?.name || '');
const currentClass = computed(() => getClassById(characterStore.characterData.class || ''));
const currentClassName = computed(() => currentClass.value?.name || '');
const currentAlignment = computed(() => getAlignmentById(characterStore.characterData.alignment || ''));
const currentAlignmentName = computed(() => currentAlignment.value?.name || '');

// 判断是否为大型生物
const isLargeCreature = computed(() => {
  const race = currentRace.value;
  if (!race) return false;

  // 大型生物种族列表
  const largeCreatureRaces = [
    'alaghi', // 阿拉吉
    'bugbear', // 熊地精
    'centaur', // 半人马
    'giff', // 基弗人
    'gnoll', // 鬣狗人
    'minotaur', // 牛头人
    'ogre', // 食人魔
    'wemic', // 半人狮
    'bearfolk', // 熊裔
    'tigerfolk', // 虎裔
  ];

  return largeCreatureRaces.includes(race.id);
});

// 检查是否可以继续
const canProceed = computed(() => {
  // 性别必须选择
  return gender.value !== null;
});

// 返回上一步
function goBack() {
  characterStore.characterData.step = 9;
}

// 确认并继续
function confirmAndProceed() {
  if (!canProceed.value) {
    toastr.error('请选择性别');
    return;
  }

  // 保存数据（确保空字符串被转换为 null）
  characterStore.characterData.characterName = characterName.value?.trim() || null;
  characterStore.characterData.gender = gender.value;
  characterStore.characterData.appearance = appearance.value?.trim() || null;
  characterStore.characterData.background = background.value?.trim() || null;

  // 只有男性才保存阴茎大小
  if (gender.value === 'male') {
    characterStore.characterData.penisSize = penisSize.value || null;
  } else {
    characterStore.characterData.penisSize = null;
  }

  // 前进到下一步
  characterStore.characterData.step = 11;
  toastr.success('基本信息填写完成');
}
</script>

<style lang="scss" scoped>
.step10-basic-info {
  width: 100%;
  min-height: 600px;
  padding: 30px;
  font-family: 'Times New Roman', serif;
}

.info-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 3px solid #000;

  h3 {
    font-size: 28px;
    font-weight: bold;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .character-summary {
    display: flex;
    justify-content: center;
    gap: 15px;
    font-size: 16px;
    color: #666;

    span {
      padding: 6px 12px;
      background-color: #f5f5f5;
      border: 2px solid #ddd;
      border-radius: 4px;
    }
  }
}

.info-content {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 24px;

  &:last-of-type {
    margin-bottom: 30px;
  }
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: bold;

  .label-text {
    color: #000;
  }

  .label-hint {
    font-size: 14px;
    font-weight: normal;
    color: #666;
  }

  .label-required {
    color: #d9534f;
    font-size: 18px;
  }
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-family: 'Times New Roman', serif;
  border: 2px solid #000;
  background-color: #fff;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }

  &::placeholder {
    color: #999;
  }
}

.form-select {
  cursor: pointer;

  optgroup {
    font-weight: bold;
    font-style: italic;
  }

  option {
    padding: 8px;
  }
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-family: 'Times New Roman', serif;
  line-height: 1.6;
  border: 2px solid #000;
  background-color: #fff;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }

  &::placeholder {
    color: #999;
  }
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.gender-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.gender-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 3px solid #000;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    background-color: #e3f2fd;
    border-color: #1976d2;
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
  }

  .gender-radio {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .gender-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .gender-label {
    font-size: 16px;
    font-weight: bold;
    color: #000;
  }
}

.info-notice {
  display: flex;
  gap: 16px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #f8f9fa;
  border: 2px solid #000;
  border-radius: 8px;

  .notice-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .notice-content {
    flex: 1;

    p {
      font-size: 15px;
      line-height: 1.6;
      margin: 0;
      color: #333;
    }
  }
}

.bottom-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 30px;
  border-top: 3px solid #000;

  .adnd-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 32px;
    font-size: 16px;
    font-family: 'Times New Roman', serif;
    font-weight: bold;
    border: 3px solid #000;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 1px;

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
    }
  }
}

@media (max-width: 768px) {
  .step10-basic-info {
    padding: 20px;
  }

  .info-header h3 {
    font-size: 22px;
  }

  .character-summary {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
