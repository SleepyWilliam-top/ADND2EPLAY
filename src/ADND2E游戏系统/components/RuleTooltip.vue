<template>
  <Teleport to="body">
    <div v-if="visible" class="rule-tooltip-overlay" @click.self="close">
      <div class="rule-tooltip" :style="positionStyle" @click.stop>
        <div class="tooltip-header">
          <h4>{{ ruleName }}</h4>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div class="tooltip-content">
          <p>{{ ruleContent }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

interface Props {
  visible: boolean;
  ruleName: string;
  ruleContent: string;
  x: number;
  y: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

// 计算位置
const positionStyle = computed(() => {
  const maxWidth = 450;
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
  const estimatedHeight = 500;
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
.rule-tooltip-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 9999;
}

.rule-tooltip {
  position: fixed;
  width: 450px;
  max-height: 60vh;
  background-color: #fffef0;
  border: 3px solid #000;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  font-family: 'Times New Roman', serif;
  display: flex;
  flex-direction: column;
  z-index: 10000;

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    border: 1px solid #999;
    pointer-events: none;
  }
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 2px solid #000;
  background-color: #f5f5dc;

  h4 {
    font-size: 18px;
    font-weight: bold;
    margin: 0;
    letter-spacing: 1px;
  }
}

.close-btn {
  background: none;
  border: 2px solid #000;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: #000;
    color: #fff;
  }
}

.tooltip-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  p {
    font-size: 13px;
    line-height: 1.8;
    text-align: justify;
    color: #222;
    margin: 0;
    white-space: pre-wrap;
  }
}

@media (max-width: 768px) {
  .rule-tooltip {
    width: 90%;
    max-width: 400px;
  }
}
</style>
