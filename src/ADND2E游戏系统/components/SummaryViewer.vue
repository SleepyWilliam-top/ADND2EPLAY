<template>
  <div v-if="visible" class="summary-viewer-overlay" @click.self="handleClose">
    <div class="summary-viewer-panel">
      <div class="panel-header">
        <h2><i class="fas fa-book-open"></i> 剧情总结</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <div class="panel-body">
        <div v-if="summaries.length === 0" class="empty-state">
          <i class="fas fa-file-alt"></i>
          <p>暂无剧情总结</p>
          <p class="hint">AI 回复时会自动生成总结</p>
        </div>

        <div v-else class="summary-list">
          <div v-for="(summary, index) in reversedSummaries" :key="index" class="summary-item">
            <div class="summary-header">
              <span class="summary-index">#{{ summary.messageIndex }}</span>
              <span class="summary-time">{{ formatTime(summary.timestamp) }}</span>
            </div>

            <!-- 大总结 -->
            <div v-if="summary.largeSummary" class="large-summary">
              <div class="summary-label">概要</div>
              <div class="summary-content">{{ summary.largeSummary }}</div>
            </div>

            <!-- 小总结 -->
            <div v-if="summary.smallSummary" class="small-summary">
              <div class="summary-label">详情</div>
              <div class="summary-content">{{ summary.smallSummary }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue';
import { useGameStateStore } from '../stores/gameStateStore';

// Props
const props = defineProps<{
  visible: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

// Store
const gameStateStore = useGameStateStore();

// Computed
const summaries = computed(() => {
  return gameStateStore.gameState?.summaries || [];
});

const reversedSummaries = computed(() => {
  return [...summaries.value].reverse();
});

// Methods
function handleClose() {
  emit('update:visible', false);
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  // 如果在1小时内
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }

  // 如果在今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 否则显示完整日期
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped lang="scss">
.summary-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.summary-viewer-panel {
  background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
  border: 2px solid #4a4a4a;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid #3a3a3a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);

  h2 {
    margin: 0;
    font-size: 1.3em;
    color: #fff;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      color: #ffa500;
    }
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #999;
    font-size: 1.5em;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
    transition: all 0.2s;
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;

  i {
    font-size: 4em;
    margin-bottom: 20px;
    color: #666;
  }

  p {
    margin: 8px 0;
    font-size: 1.1em;

    &.hint {
      font-size: 0.9em;
      color: #777;
    }
  }
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: #4a4a4a;
  }
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;

  .summary-index {
    font-weight: 600;
    color: #ffa500;
    font-size: 0.95em;
  }

  .summary-time {
    font-size: 0.85em;
    color: #999;
  }
}

.large-summary,
.small-summary {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.summary-label {
  font-size: 0.85em;
  color: #999;
  margin-bottom: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.large-summary .summary-content {
  color: #fff;
  font-size: 1.05em;
  font-weight: 500;
  line-height: 1.4;
}

.small-summary .summary-content {
  color: #ccc;
  font-size: 0.95em;
  line-height: 1.6;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
