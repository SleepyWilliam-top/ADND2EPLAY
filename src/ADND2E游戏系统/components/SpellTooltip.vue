<template>
  <Teleport to="body">
    <div v-if="visible" class="spell-tooltip-overlay" @click.self="close">
      <div class="spell-tooltip" :style="positionStyle" @click.stop>
        <div class="tooltip-header">
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div v-if="spell" class="tooltip-content">
          <div class="spell-title">
            <h3>{{ spell.name }}</h3>
            <span class="spell-english">{{ spell.englishName }}</span>
          </div>

          <div class="spell-meta">
            <span v-if="'school' in spell" class="meta-tag school">{{ spell.school }}</span>
            <span v-if="'sphere' in spell" class="meta-tag sphere">{{ (spell as any).sphere.join('、') }}</span>
            <span class="meta-tag level">{{ spell.level }}级</span>
            <span v-if="spell.reversible" class="meta-tag reversible">可逆</span>
          </div>

          <div class="spell-details">
            <div class="detail-row">
              <span class="label">距离：</span>
              <span class="value">{{ spell.range }}</span>
            </div>
            <div class="detail-row">
              <span class="label">成分：</span>
              <span class="value">{{ getComponents() }}</span>
            </div>
            <div class="detail-row">
              <span class="label">持续时间：</span>
              <span class="value">{{ spell.duration }}</span>
            </div>
            <div class="detail-row">
              <span class="label">施法时间：</span>
              <span class="value">{{ spell.castingTime }}</span>
            </div>
            <div class="detail-row">
              <span class="label">影响区域：</span>
              <span class="value">{{ spell.areaOfEffect }}</span>
            </div>
            <div class="detail-row">
              <span class="label">豁免检定：</span>
              <span class="value">{{ spell.savingThrow }}</span>
            </div>
            <div v-if="spell.materialComponents" class="detail-row material">
              <span class="label">材料成分：</span>
              <span class="value">{{ spell.materialComponents }}</span>
            </div>
          </div>

          <div class="spell-description">
            <div class="description-label">法术描述</div>
            <p>{{ spell.description }}</p>
          </div>
        </div>

        <div v-else class="tooltip-content">
          <p class="error-message">未找到法术信息</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { WizardSpell } from '../utils/wizardSpellData';
import type { PriestSpell } from '../utils/priestSpellData';
import {
  wizardLevel1Spells,
  wizardLevel2Spells,
  wizardLevel3Spells,
  wizardLevel4Spells,
  wizardLevel5Spells,
  wizardLevel6Spells,
  wizardLevel7Spells,
  wizardLevel8Spells,
  wizardLevel9Spells,
} from '../utils/wizardSpellData';
import {
  priestLevel1Spells,
  priestLevel2Spells,
  priestLevel3Spells,
  priestLevel4Spells,
  priestLevel5Spells,
  priestLevel6Spells,
  priestLevel7Spells,
} from '../utils/priestSpellData';

interface Props {
  visible: boolean;
  spellName: string;
  spellType: 'wizard' | 'priest';
  x: number;
  y: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

// 合并所有法术数据
const allWizardSpells = [
  ...wizardLevel1Spells,
  ...wizardLevel2Spells,
  ...wizardLevel3Spells,
  ...wizardLevel4Spells,
  ...wizardLevel5Spells,
  ...wizardLevel6Spells,
  ...wizardLevel7Spells,
  ...wizardLevel8Spells,
  ...wizardLevel9Spells,
];

const allPriestSpells = [
  ...priestLevel1Spells,
  ...priestLevel2Spells,
  ...priestLevel3Spells,
  ...priestLevel4Spells,
  ...priestLevel5Spells,
  ...priestLevel6Spells,
  ...priestLevel7Spells,
];

// 查找法术
const spell = computed<WizardSpell | PriestSpell | null>(() => {
  if (!props.spellName) return null;

  const spellList = props.spellType === 'wizard' ? allWizardSpells : allPriestSpells;

  return spellList.find(s => s.name === props.spellName || s.englishName === props.spellName) || null;
});

// 计算位置
const positionStyle = computed(() => {
  const maxWidth = 500;
  const padding = 20;
  let left = props.x + 10;
  let top = props.y + 10;

  // 防止超出右边界
  if (left + maxWidth > window.innerWidth - padding) {
    left = window.innerWidth - maxWidth - padding;
  }

  // 防止超出左边界
  if (left < padding) {
    left = padding;
  }

  // 防止超出下边界
  const estimatedHeight = 600; // 预估高度
  if (top + estimatedHeight > window.innerHeight - padding) {
    top = window.innerHeight - estimatedHeight - padding;
  }

  // 防止超出上边界
  if (top < padding) {
    top = padding;
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
  };
});

// 获取成分文本
function getComponents(): string {
  if (!spell.value) return '';
  const components = [];
  if (spell.value.components.verbal) components.push('言语');
  if (spell.value.components.somatic) components.push('姿势');
  if (spell.value.components.material) components.push('材料');
  return components.join('、');
}

function close() {
  emit('close');
}

// 按ESC关闭
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          close();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  },
);
</script>

<style lang="scss" scoped>
.spell-tooltip-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spell-tooltip {
  position: fixed;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  background-color: #fff;
  border: 4px solid #000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: "临海体", serif;
  display: flex;
  flex-direction: column;
  z-index: 10000;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    right: 3px;
    bottom: 3px;
    border: 2px solid #666;
    pointer-events: none;
  }
}

.tooltip-header {
  display: flex;
  justify-content: flex-end;
  padding: 10px;
  border-bottom: 3px solid #000;
  background-color: #f5f5f5;
}

.close-btn {
  background: none;
  border: 2px solid #000;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 16px;
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

.tooltip-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.spell-title {
  margin-bottom: 12px;

  h3 {
    font-size: 22px;
    font-weight: bold;
    margin: 0 0 4px 0;
  }

  .spell-english {
    font-size: 14px;
    color: #666;
    font-style: italic;
  }
}

.spell-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;

  .meta-tag {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 13px;
    border: 2px solid;

    &.school {
      background-color: #e3f2fd;
      color: #1976d2;
      border-color: #1976d2;
    }

    &.sphere {
      background-color: #fff3e0;
      color: #e65100;
      border-color: #e65100;
    }

    &.level {
      background-color: #f3e5f5;
      color: #7b1fa2;
      border-color: #7b1fa2;
      font-weight: bold;
    }

    &.reversible {
      background-color: #ffebee;
      color: #c62828;
      border-color: #c62828;
    }
  }
}

.spell-details {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f9f9f9;
  border: 2px solid #ddd;

  .detail-row {
    display: flex;
    margin-bottom: 6px;
    font-size: 14px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-weight: bold;
      min-width: 90px;
      color: #333;
    }

    .value {
      flex: 1;
      color: #555;
    }

    &.material {
      flex-direction: column;

      .value {
        margin-top: 4px;
        color: #d9534f;
        font-style: italic;
      }
    }
  }
}

.spell-description {
  .description-label {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 2px solid #000;
  }

  p {
    font-size: 14px;
    line-height: 1.7;
    text-align: justify;
    color: #333;
    margin: 0;
  }
}

.error-message {
  text-align: center;
  color: #d9534f;
  font-size: 16px;
  padding: 40px 20px;
}

@media (max-width: 768px) {
  .spell-tooltip {
    width: 90%;
    max-width: 400px;
  }
}
</style>
