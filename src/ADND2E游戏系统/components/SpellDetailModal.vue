<template>
  <div v-if="visible" class="spell-detail-overlay" @click.self="handleClose">
    <div class="spell-detail-modal">
      <!-- 标题栏 -->
      <div class="modal-header">
        <h2>{{ spell?.name || '法术详情' }}</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <!-- 法术信息 -->
      <div v-if="spell" class="modal-body">
        <!-- 基本信息 -->
        <div class="spell-header">
          <div class="spell-title-row">
            <h3 class="spell-name">{{ spell.name }}</h3>
            <span class="spell-level-badge">{{ spell.level }}级法术</span>
          </div>
          <p class="spell-english">{{ spell.englishName }}</p>
        </div>

        <!-- 法术属性表格 -->
        <div class="spell-properties">
          <div class="property-row">
            <span class="property-label">学派/领域:</span>
            <span class="property-value">{{ getSchoolOrSphere() }}</span>
          </div>
          <div class="property-row">
            <span class="property-label">施法距离:</span>
            <span class="property-value">{{ spell.range }}</span>
          </div>
          <div class="property-row">
            <span class="property-label">施法时间:</span>
            <span class="property-value">{{ spell.castingTime }}</span>
          </div>
          <div class="property-row">
            <span class="property-label">持续时间:</span>
            <span class="property-value">{{ spell.duration }}</span>
          </div>
          <div class="property-row">
            <span class="property-label">影响区域:</span>
            <span class="property-value">{{ spell.areaOfEffect }}</span>
          </div>
          <div class="property-row">
            <span class="property-label">豁免检定:</span>
            <span class="property-value">{{ spell.savingThrow }}</span>
          </div>
          <div class="property-row">
            <span class="property-label">施法成分:</span>
            <span class="property-value">{{ getComponents() }}</span>
          </div>
          <div v-if="spell.materialComponents" class="property-row">
            <span class="property-label">材料:</span>
            <span class="property-value material">{{ spell.materialComponents }}</span>
          </div>
          <div v-if="spell.reversible" class="property-row">
            <span class="property-label">可逆:</span>
            <span class="property-value reversible">是</span>
          </div>
        </div>

        <!-- 法术描述 -->
        <div class="spell-description">
          <h4>法术描述</h4>
          <p>{{ spell.description }}</p>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="modal-body empty">
        <p>无法找到法术信息</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PriestSpell } from '../utils/priestSpellData';
import type { WizardSpell } from '../utils/wizardSpellData';

interface Props {
  visible: boolean;
  spell: WizardSpell | PriestSpell | null;
  spellType: 'wizard' | 'priest';
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function handleClose() {
  emit('close');
}

function getSchoolOrSphere() {
  if (!props.spell) return '';
  if (props.spellType === 'wizard') {
    return (props.spell as WizardSpell).school;
  } else {
    return (props.spell as PriestSpell).sphere?.join(', ') || '';
  }
}

function getComponents() {
  if (!props.spell) return '';
  const c = props.spell.components;
  const parts = [];
  if (c.verbal) parts.push('言语(V)');
  if (c.somatic) parts.push('姿势(S)');
  if (c.material) parts.push('材料(M)');
  return parts.join(', ');
}
</script>

<style lang="scss" scoped>
.spell-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.spell-detail-modal {
  background-color: #f5f5dc;
  border: 4px solid #000;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  position: relative;

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
  z-index: 2;

  h2 {
    font-family: 'Times New Roman', serif;
    font-size: 22px;
    font-weight: bold;
    margin: 0;
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #fff;

  &.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-style: italic;
  }
}

.spell-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 3px solid #000;

  .spell-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .spell-name {
      font-family: 'Times New Roman', serif;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      color: #9370db;
    }

    .spell-level-badge {
      padding: 5px 15px;
      background-color: #9370db;
      color: #fff;
      border: 2px solid #000;
      font-weight: bold;
      font-size: 14px;
    }
  }

  .spell-english {
    font-size: 14px;
    color: #666;
    font-style: italic;
    margin: 0;
  }
}

.spell-properties {
  background-color: #f9f9f9;
  border: 2px solid #000;
  padding: 15px;
  margin-bottom: 20px;

  .property-row {
    display: flex;
    padding: 8px 0;
    border-bottom: 1px solid #ddd;

    &:last-child {
      border-bottom: none;
    }

    .property-label {
      font-weight: bold;
      min-width: 100px;
      color: #333;
    }

    .property-value {
      flex: 1;
      color: #666;

      &.material {
        color: #8b4513;
        font-style: italic;
      }

      &.reversible {
        color: #9370db;
        font-weight: bold;
      }
    }
  }
}

.spell-description {
  h4 {
    font-family: 'Times New Roman', serif;
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 15px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #000;
  }

  p {
    font-family: Georgia, serif;
    font-size: 15px;
    line-height: 1.8;
    color: #333;
    text-align: justify;
    margin: 0;
    white-space: pre-wrap;
  }
}
</style>
