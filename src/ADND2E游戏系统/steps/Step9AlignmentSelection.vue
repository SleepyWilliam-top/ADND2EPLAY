<template>
  <div class="step9-alignment-selection">
    <!-- 标题区域 -->
    <div class="selection-header">
      <h3>阵营选择</h3>
      <div class="character-info">
        <span>{{ currentClassName }}</span>
        <span v-if="currentRaceName">{{ currentRaceName }}</span>
      </div>
    </div>

    <!-- 重要提示 -->
    <div class="alignment-notice">
      <div class="notice-icon">💡</div>
      <div class="notice-content">
        <h4>关于阵营</h4>
        <p>
          你<strong>始终应该把阵营看作为工具，而非对角色行为的限制</strong>。虽然阵营决定了通常的态度，但它也不会阻止角色改变自己的观念，也不会阻止角色做出不理性的或者不同于往常的举动。
        </p>
      </div>
    </div>

    <!-- 阵营限制说明 -->
    <div v-if="classRestriction" class="restriction-notice">
      <div class="restriction-icon">⚠️</div>
      <div class="restriction-content">
        <h4>职业阵营要求</h4>
        <p>{{ classRestriction.description }}</p>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="selection-content">
      <!-- 左侧：阵营九宫格 -->
      <div class="alignment-grid-container">
        <h4>选择你的阵营</h4>
        <div class="alignment-grid">
          <!-- 第一行：善良 -->
          <div
            v-for="alignment in goodAlignments"
            :key="alignment.id"
            class="alignment-card"
            :class="{
              selected: selectedAlignment === alignment.id,
              disabled: !canSelectAlignment(alignment.id),
            }"
            @click="selectAlignment(alignment.id)"
          >
            <div class="alignment-icon">{{ alignment.icon }}</div>
            <div class="alignment-name">{{ alignment.name }}</div>
            <div class="alignment-english">{{ alignment.englishName }}</div>
            <div v-if="selectedAlignment === alignment.id" class="selected-indicator"><i class="fa-solid fa-check"></i></div>
            <div v-else-if="!canSelectAlignment(alignment.id)" class="disabled-indicator"><i class="fa-solid fa-xmark"></i></div>
          </div>

          <!-- 第二行：中立 -->
          <div
            v-for="alignment in neutralAlignments"
            :key="alignment.id"
            class="alignment-card"
            :class="{
              selected: selectedAlignment === alignment.id,
              disabled: !canSelectAlignment(alignment.id),
            }"
            @click="selectAlignment(alignment.id)"
          >
            <div class="alignment-icon">{{ alignment.icon }}</div>
            <div class="alignment-name">{{ alignment.name }}</div>
            <div class="alignment-english">{{ alignment.englishName }}</div>
            <div v-if="selectedAlignment === alignment.id" class="selected-indicator"><i class="fa-solid fa-check"></i></div>
            <div v-else-if="!canSelectAlignment(alignment.id)" class="disabled-indicator"><i class="fa-solid fa-xmark"></i></div>
          </div>

          <!-- 第三行：邪恶 -->
          <div
            v-for="alignment in evilAlignments"
            :key="alignment.id"
            class="alignment-card"
            :class="{
              selected: selectedAlignment === alignment.id,
              disabled: !canSelectAlignment(alignment.id),
            }"
            @click="selectAlignment(alignment.id)"
          >
            <div class="alignment-icon">{{ alignment.icon }}</div>
            <div class="alignment-name">{{ alignment.name }}</div>
            <div class="alignment-english">{{ alignment.englishName }}</div>
            <div v-if="selectedAlignment === alignment.id" class="selected-indicator"><i class="fa-solid fa-check"></i></div>
            <div v-else-if="!canSelectAlignment(alignment.id)" class="disabled-indicator"><i class="fa-solid fa-xmark"></i></div>
          </div>
        </div>
      </div>

      <!-- 右侧：阵营详情 -->
      <div class="alignment-details">
        <div v-if="selectedAlignmentData" class="details-content">
          <!-- 阵营标题 -->
          <div class="detail-header">
            <div class="detail-icon">{{ selectedAlignmentData.icon }}</div>
            <div>
              <h2>{{ selectedAlignmentData.name }}</h2>
              <p class="english-name">{{ selectedAlignmentData.englishName }}</p>
            </div>
          </div>

          <div class="divider"></div>

          <!-- 阵营描述 -->
          <div class="detail-section">
            <h4>阵营描述</h4>
            <p class="description">{{ selectedAlignmentData.description }}</p>
          </div>

          <!-- 典型例子 -->
          <div class="detail-section">
            <h4>典型例子</h4>
            <p class="examples">{{ selectedAlignmentData.examples }}</p>
          </div>
        </div>
        <div v-else class="no-selection">
          <p>请从左侧选择一个阵营</p>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button class="adnd-button secondary" @click="goBack">
        <span class="button-icon">←</span>
        <span>返回</span>
      </button>
      <button class="adnd-button primary" :disabled="!selectedAlignment" @click="confirmSelection">
        <span>确认选择</span>
        <span class="button-icon">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCharacterStore } from '../stores/characterStore';
import {
  alignments,
  canClassSelectAlignment,
  getAlignmentById,
  getClassAlignmentRestriction,
} from '../utils/alignmentData';
import { getClassById } from '../utils/classData';
import { getRaceById } from '../utils/raceData';

const characterStore = useCharacterStore();

// 当前选择的阵营
const selectedAlignment = ref<string | null>(characterStore.characterData.alignment);

// 获取当前职业和种族
const currentClass = computed(() => getClassById(characterStore.characterData.class || ''));
const currentClassName = computed(() => currentClass.value?.name || '');
const currentRace = computed(() => getRaceById(characterStore.characterData.race || ''));
const currentRaceName = computed(() => {
  if (!currentRace.value) return '';
  return currentRace.value.name;
});

// 获取职业的阵营限制
const classRestriction = computed(() => {
  if (!characterStore.characterData.class) return null;
  return getClassAlignmentRestriction(characterStore.characterData.class);
});

// 分组阵营（按善良/中立/邪恶）
const goodAlignments = computed(() =>
  alignments
    .filter(a => a.category.goodEvil === 'good')
    .sort((a, b) => {
      const order = { lawful: 0, neutral: 1, chaotic: 2 };
      return order[a.category.lawChaos] - order[b.category.lawChaos];
    }),
);

const neutralAlignments = computed(() =>
  alignments
    .filter(a => a.category.goodEvil === 'neutral')
    .sort((a, b) => {
      const order = { lawful: 0, neutral: 1, chaotic: 2 };
      return order[a.category.lawChaos] - order[b.category.lawChaos];
    }),
);

const evilAlignments = computed(() =>
  alignments
    .filter(a => a.category.goodEvil === 'evil')
    .sort((a, b) => {
      const order = { lawful: 0, neutral: 1, chaotic: 2 };
      return order[a.category.lawChaos] - order[b.category.lawChaos];
    }),
);

// 当前选中的阵营数据
const selectedAlignmentData = computed(() => {
  if (!selectedAlignment.value) return null;
  return getAlignmentById(selectedAlignment.value);
});

// 检查是否可以选择某个阵营
function canSelectAlignment(alignmentId: string): boolean {
  if (!characterStore.characterData.class) return false;
  return canClassSelectAlignment(characterStore.characterData.class, alignmentId);
}

// 选择阵营
function selectAlignment(alignmentId: string) {
  if (!canSelectAlignment(alignmentId)) return;
  selectedAlignment.value = alignmentId;
}

// 返回上一步
function goBack() {
  // 根据是否有施法能力决定返回哪一步
  characterStore.updateCharacterData(data => {
    if (characterStore.canCastSpellsAtLevel1()) {
      data.step = 8; // 返回法术选择
    } else {
      data.step = 7; // 返回装备购买
    }
  });
}

// 确认选择
function confirmSelection() {
  if (!selectedAlignment.value || !selectedAlignmentData.value) return;

  if (!canSelectAlignment(selectedAlignment.value)) {
    toastr.error('该阵营不符合职业要求');
    return;
  }

  // 使用 updateCharacterData 更新数据
  characterStore.updateCharacterData(data => {
    // 保存选择
    data.alignment = selectedAlignment.value;
    // 前进到下一步
    data.step = 10;
  });

  toastr.success('阵营选择成功');
}
</script>

<style lang="scss" scoped>
.step9-alignment-selection {
  width: 100%;
  min-height: 600px;
  padding: 30px;
  font-family: "临海体", serif;
}

.selection-header {
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

  .character-info {
    display: flex;
    justify-content: center;
    gap: 20px;
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

.alignment-notice,
.restriction-notice {
  display: flex;
  gap: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  border: 2px solid #000;
  background-color: #f8f9fa;

  .notice-icon,
  .restriction-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .notice-content,
  .restriction-content {
    flex: 1;

    h4 {
      font-size: 18px;
      font-weight: bold;
      margin: 0 0 8px 0;
    }

    p {
      font-size: 15px;
      line-height: 1.6;
      margin: 0;
      color: #333;

      strong {
        color: #d9534f;
        font-weight: bold;
      }
    }
  }
}

.restriction-notice {
  background-color: #fff3cd;
  border-color: #ffc107;

  .restriction-content p {
    color: #856404;
    font-weight: 500;
  }
}

.selection-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
  margin-bottom: 30px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.alignment-grid-container {
  h4 {
    font-size: 20px;
    font-weight: bold;
    margin: 0 0 20px 0;
    padding-bottom: 12px;
    border-bottom: 2px solid #000;
  }
}

.alignment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.alignment-card {
  position: relative;
  padding: 20px;
  background-color: #fff;
  border: 3px solid #000;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover:not(.disabled) {
    transform: translateY(-4px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  &.selected {
    background-color: #e3f2fd;
    border-color: #1976d2;
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background-color: #f5f5f5;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  .alignment-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }

  .alignment-name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 4px;
    color: #000;
  }

  .alignment-english {
    font-size: 12px;
    color: #666;
    font-style: italic;
  }

  .selected-indicator,
  .disabled-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
  }

  .selected-indicator {
    background-color: #1976d2;
    color: #fff;
  }

  .disabled-indicator {
    background-color: #999;
    color: #fff;
  }
}

.alignment-details {
  background-color: #fafafa;
  border: 3px solid #000;
  padding: 24px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border: 1px solid #666;
    pointer-events: none;
  }

  .details-content {
    position: relative;
    z-index: 1;
  }

  .no-selection {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: #999;
    font-size: 18px;
  }
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;

  .detail-icon {
    font-size: 48px;
  }

  h2 {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
  }

  .english-name {
    font-size: 14px;
    color: #666;
    font-style: italic;
    margin: 4px 0 0 0;
  }
}

.divider {
  height: 2px;
  background-color: #000;
  margin: 20px 0;
}

.detail-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: 16px;
    font-weight: bold;
    margin: 0 0 12px 0;
    color: #000;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .description,
  .examples {
    font-size: 15px;
    line-height: 1.7;
    color: #333;
    margin: 0;
  }

  .examples {
    font-style: italic;
    color: #666;
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
    font-family: "临海体", serif;
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
  .step9-alignment-selection {
    padding: 20px;
  }

  .selection-header h3 {
    font-size: 22px;
  }

  .selection-content {
    grid-template-columns: 1fr;
  }

  .alignment-grid {
    grid-template-columns: 1fr;
  }
}
</style>
