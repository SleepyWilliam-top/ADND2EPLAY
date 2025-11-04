<template>
  <div v-if="visible" class="performance-panel" :class="{ minimized: isMinimized }">
    <div class="panel-header" @click="toggleMinimize">
      <h3><i class="fa-solid fa-gauge-high"></i> 性能监控</h3>
      <button class="minimize-btn" :title="isMinimized ? '展开' : '最小化'">
        <i :class="isMinimized ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
      </button>
    </div>

    <div v-if="!isMinimized" class="panel-body">
      <!-- FPS 监控 -->
      <div class="metric-item">
        <span class="metric-label">FPS:</span>
        <span class="metric-value" :class="getFPSClass(metrics.fps)">{{ metrics.fps }}</span>
      </div>

      <!-- 内存使用 -->
      <div v-if="metrics.memory" class="metric-item">
        <span class="metric-label">内存:</span>
        <span class="metric-value">
          {{ metrics.memory.usedJSHeapSize }} / {{ metrics.memory.totalJSHeapSize }} MB
        </span>
      </div>

      <!-- 长任务数量 -->
      <div class="metric-item">
        <span class="metric-label">长任务:</span>
        <span class="metric-value" :class="{ warning: metrics.longTasks > 5 }">{{ metrics.longTasks }}</span>
      </div>

      <!-- 操作按钮 -->
      <div class="panel-actions">
        <button class="action-btn" @click="clearMetrics"><i class="fa-solid fa-broom"></i> 清空</button>
        <button class="action-btn" @click="downloadReport"><i class="fa-solid fa-download"></i> 导出</button>
        <button class="action-btn danger" @click="closePanel"><i class="fa-solid fa-times"></i> 关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePerformanceMonitor } from '../composables/usePerformanceMonitor';

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const monitor = usePerformanceMonitor();
const isMinimized = ref(false);

// 启动性能监控
monitor.startMonitoring(1000);

const { metrics } = monitor;

// 获取 FPS 样式类
function getFPSClass(fps: number): string {
  if (fps >= 55) return 'good';
  if (fps >= 30) return 'medium';
  return 'bad';
}

// 切换最小化
function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

// 清空指标
function clearMetrics() {
  monitor.clear();
  toastr.success('性能指标已清空');
}

// 下载性能报告
function downloadReport() {
  const report = monitor.getReport();
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-report-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toastr.success('性能报告已导出');
}

// 关闭面板
function closePanel() {
  emit('close');
}
</script>

<style lang="scss" scoped>
.performance-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 300px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #4caf50;
  color: #fff;
  font-family: 'Courier New', monospace;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;

  &.minimized {
    width: 200px;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #333;
  border-bottom: 2px solid #4caf50;
  cursor: pointer;
  user-select: none;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .minimize-btn {
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.2);
    }
  }
}

.panel-body {
  padding: 15px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #444;

  &:last-of-type {
    border-bottom: none;
  }

  .metric-label {
    font-size: 12px;
    color: #aaa;
  }

  .metric-value {
    font-size: 14px;
    font-weight: bold;
    color: #fff;

    &.good {
      color: #4caf50;
    }

    &.medium {
      color: #ff9800;
    }

    &.bad {
      color: #f44336;
    }

    &.warning {
      color: #ff9800;
    }
  }
}

.panel-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #444;

  .action-btn {
    flex: 1;
    padding: 6px 10px;
    font-size: 11px;
    background: #555;
    color: #fff;
    border: 1px solid #666;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    i {
      margin-right: 4px;
    }

    &:hover {
      background: #666;
      border-color: #777;
    }

    &.danger {
      background: #f44336;
      border-color: #d32f2f;

      &:hover {
        background: #d32f2f;
      }
    }
  }
}

// 移动端适配
@media (max-width: 992px) {
  .performance-panel {
    width: 90%;
    max-width: 90%;
    right: 5%;
    top: 80px;
    max-height: 70vh;
  }

  .panel-header {
    padding: 8px 10px;

    h3 {
      font-size: 12px;
    }

    .close-btn {
      width: 24px;
      height: 24px;
      font-size: 16px;
    }
  }

  .panel-content {
    padding: 10px;
  }

  .perf-section {
    margin-bottom: 12px;
    padding-bottom: 12px;

    h4 {
      font-size: 11px;
      margin-bottom: 8px;
    }
  }

  .metric-item {
    padding: 6px 8px;
    font-size: 10px;

    .metric-label {
      font-size: 10px;
    }

    .metric-value {
      font-size: 12px;
    }
  }

  .chart-container {
    height: 80px;
  }

  .panel-actions {
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    flex-wrap: wrap;

    .action-btn {
      flex: 1 1 calc(50% - 3px);
      padding: 8px;
      font-size: 10px;
      min-height: 40px;

      i {
        margin-right: 3px;
      }
    }
  }
}

@media (max-width: 480px) {
  .performance-panel {
    width: 95%;
    max-width: 95%;
    right: 2.5%;
    top: 70px;
  }

  .panel-header h3 {
    font-size: 11px;
  }

  .metric-item {
    font-size: 9px;

    .metric-value {
      font-size: 11px;
    }
  }

  .chart-container {
    height: 60px;
  }

  .panel-actions .action-btn {
    flex: 1 1 100%;
    font-size: 9px;
  }
}
</style>
