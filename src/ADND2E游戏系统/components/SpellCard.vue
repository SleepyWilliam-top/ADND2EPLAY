<template>
  <div
    class="spell-card"
    :class="{
      selected: selected,
      disabled: disabled,
      'is-wizard': 'school' in spell,
      'is-priest': 'sphere' in spell,
    }"
    @click="handleClick"
  >
    <div class="spell-header">
      <h4 class="spell-name">
        {{ spell.name }}
        <span v-if="spell.reversible" class="reversible-tag">可逆</span>
      </h4>
      <span class="spell-english">{{ spell.englishName }}</span>
    </div>

    <div class="spell-meta">
      <span v-if="'school' in spell" class="spell-school">{{ spell.school }}</span>
      <span v-if="'sphere' in spell" class="spell-sphere">{{ spell.sphere.join('、') }}</span>
      <span class="spell-level">{{ spell.level }}级</span>
    </div>

    <div v-if="showDetails" class="spell-details">
      <div class="detail-row">
        <span class="label">距离：</span>
        <span class="value">{{ spell.range }}</span>
      </div>
      <div class="detail-row">
        <span class="label">成分：</span>
        <span class="value">{{ getComponentsText() }}</span>
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
      <div class="spell-description">
        <p>{{ spell.description }}</p>
      </div>
    </div>

    <div class="spell-actions">
      <button v-if="!disabled" class="toggle-details-btn" @click.stop="showDetails = !showDetails">
        {{ showDetails ? '收起' : '详情' }}
      </button>
    </div>

    <div v-if="selected" class="selected-indicator">✓</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { PriestSpell } from '../utils/priestSpellData';
import type { WizardSpell } from '../utils/wizardSpellData';

interface Props {
  spell: WizardSpell | PriestSpell;
  selected?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
});

const emit = defineEmits<{
  click: [];
}>();

const showDetails = ref(false);

function getComponentsText(): string {
  const components = [];
  if (props.spell.components.verbal) components.push('言语');
  if (props.spell.components.somatic) components.push('姿势');
  if (props.spell.components.material) components.push('材料');
  return components.join('、');
}

function handleClick() {
  if (!props.disabled) {
    emit('click');
  }
}
</script>

<style lang="scss" scoped>
.spell-card {
  background-color: #fff;
  border: 3px solid #000;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  font-family: '临海体', serif;

  &:hover:not(.disabled) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: #5cb85c;
    background-color: #f0fff0;

    .selected-indicator {
      display: flex;
    }
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.is-wizard {
    border-left: 6px solid #4a90e2;
  }

  &.is-priest {
    border-left: 6px solid #f5a623;
  }
}

.spell-header {
  margin-bottom: 8px;

  .spell-name {
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;

    .reversible-tag {
      font-size: 12px;
      background-color: #d9534f;
      color: #fff;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: normal;
    }
  }

  .spell-english {
    font-size: 14px;
    color: #666;
    font-style: italic;
  }
}

.spell-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  font-size: 14px;

  span {
    padding: 4px 8px;
    border-radius: 4px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
  }

  .spell-school {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .spell-sphere {
    background-color: #fff3e0;
    color: #e65100;
  }

  .spell-level {
    background-color: #f3e5f5;
    color: #7b1fa2;
    font-weight: bold;
  }
}

.spell-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #ddd;
  animation: slideDown 0.3s ease;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;

  // 自定义滚动条样式，与项目主题一致
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #fff;
    border: 1px solid #ddd;
  }

  &::-webkit-scrollbar-thumb {
    background: #666;
    border: 1px solid #333;

    &:hover {
      background: #333;
    }
  }

  .detail-row {
    display: flex;
    margin-bottom: 8px;
    font-size: 14px;

    .label {
      font-weight: bold;
      min-width: 80px;
      color: #333;
    }

    .value {
      flex: 1;
      color: #666;
    }

    &.material {
      .value {
        color: #d9534f;
        font-style: italic;
      }
    }
  }

  .spell-description {
    margin-top: 16px;
    padding: 12px;
    background-color: #fafafa;
    border-left: 4px solid #000;
    font-size: 14px;
    line-height: 1.6;

    p {
      margin: 0;
      text-align: justify;
    }
  }
}

.spell-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;

  .toggle-details-btn {
    padding: 6px 16px;
    background-color: #fff;
    border: 2px solid #000;
    font-family: '临海体', serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: #000;
      color: #fff;
    }
  }
}

.selected-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background-color: #5cb85c;
  color: #fff;
  border-radius: 50%;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .spell-card {
    padding: 12px;
  }

  .spell-header .spell-name {
    font-size: 16px;
  }

  .spell-details .detail-row {
    flex-direction: column;

    .label {
      margin-bottom: 4px;
    }
  }
}
</style>
