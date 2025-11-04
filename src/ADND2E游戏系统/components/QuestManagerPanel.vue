<template>
  <div v-if="visible" class="quest-manager-overlay" @click.self="handleClose">
    <div class="quest-manager-panel">
      <div class="panel-header">
        <h2><i class="fas fa-scroll"></i> 任务管理</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <div class="panel-body">
        <!-- 任务统计 -->
        <div class="quest-stats">
          <div class="stat-item">
            <span class="stat-label">进行中</span>
            <span class="stat-value active">{{ activeQuests.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已完成</span>
            <span class="stat-value completed">{{ completedQuests.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已失败</span>
            <span class="stat-value failed">{{ failedQuests.length }}</span>
          </div>
        </div>

        <!-- 任务列表 -->
        <div class="quest-tabs">
          <button class="tab-btn" :class="{ active: activeTab === 'active' }" @click="activeTab = 'active'">
            进行中 ({{ activeQuests.length }})
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">
            已完成 ({{ completedQuests.length }})
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'failed' }" @click="activeTab = 'failed'">
            已失败 ({{ failedQuests.length }})
          </button>
        </div>

        <div class="quest-list">
          <!-- 进行中的任务 -->
          <div v-if="activeTab === 'active'">
            <div v-if="activeQuests.length === 0" class="empty-state">
              <i class="fas fa-clipboard-list"></i>
              <p>暂无进行中的任务</p>
            </div>
            <div
              v-for="quest in activeQuests"
              :key="quest.id"
              class="quest-card active-quest"
              @click="selectQuest(quest)"
            >
              <div class="quest-header">
                <h3 class="quest-title">{{ quest.title }}</h3>
                <span class="quest-status status-active">进行中</span>
              </div>
              <p class="quest-description">{{ quest.description }}</p>
              <div v-if="quest.progress" class="quest-progress">
                <span class="progress-label">进度：</span>
                <span class="progress-text">{{ quest.progress }}</span>
              </div>
            </div>
          </div>

          <!-- 已完成的任务 -->
          <div v-if="activeTab === 'completed'">
            <div v-if="completedQuests.length === 0" class="empty-state">
              <i class="fas fa-check-circle"></i>
              <p>暂无已完成的任务</p>
            </div>
            <div
              v-for="quest in completedQuests"
              :key="quest.id"
              class="quest-card completed-quest"
              @click="selectQuest(quest)"
            >
              <div class="quest-header">
                <h3 class="quest-title">{{ quest.title }}</h3>
                <span class="quest-status status-completed">已完成</span>
              </div>
              <p class="quest-description">{{ quest.description }}</p>
              <div v-if="quest.progress" class="quest-progress">
                <span class="progress-label">最终进度：</span>
                <span class="progress-text">{{ quest.progress }}</span>
              </div>
            </div>
          </div>

          <!-- 已失败的任务 -->
          <div v-if="activeTab === 'failed'">
            <div v-if="failedQuests.length === 0" class="empty-state">
              <i class="fas fa-times-circle"></i>
              <p>暂无已失败的任务</p>
            </div>
            <div
              v-for="quest in failedQuests"
              :key="quest.id"
              class="quest-card failed-quest"
              @click="selectQuest(quest)"
            >
              <div class="quest-header">
                <h3 class="quest-title">{{ quest.title }}</h3>
                <span class="quest-status status-failed">已失败</span>
              </div>
              <p class="quest-description">{{ quest.description }}</p>
              <div v-if="quest.progress" class="quest-progress">
                <span class="progress-label">失败时进度：</span>
                <span class="progress-text">{{ quest.progress }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 任务详情弹窗 -->
      <div v-if="selectedQuest" class="quest-detail-modal" @click.self="closeDetail">
        <div class="quest-detail-content">
          <div class="detail-header">
            <h2>{{ selectedQuest.title }}</h2>
            <button class="close-btn" @click="closeDetail">✕</button>
          </div>

          <div class="detail-body">
            <div class="detail-section">
              <span class="detail-label">状态：</span>
              <span
                class="quest-status"
                :class="{
                  'status-active': selectedQuest.status === 'active',
                  'status-completed': selectedQuest.status === 'completed',
                  'status-failed': selectedQuest.status === 'failed',
                }"
              >
                {{ statusText(selectedQuest.status) }}
              </span>
            </div>

            <div class="detail-section">
              <h3>任务描述</h3>
              <p class="detail-text">{{ selectedQuest.description }}</p>
            </div>

            <div v-if="selectedQuest.progress" class="detail-section">
              <h3>任务进度</h3>
              <p class="detail-text">{{ selectedQuest.progress }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'close'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const activeTab = ref<'active' | 'completed' | 'failed'>('active');
const selectedQuest = ref<any>(null);

// 从角色卡变量读取任务列表
const questList = ref<any[]>([]);

function loadQuests() {
  const charVars = getVariables({ type: 'character' });
  questList.value = charVars?.adnd2e?.quests || [];
  console.log('[QuestManager] 任务列表已更新，共', questList.value.length, '个任务');
}

// 初始加载
loadQuests();

// 监听角色数据更新事件
eventOn('adnd2e_character_data_synced', () => {
  loadQuests();
});

// 监听消息接收事件
eventOn(tavern_events.MESSAGE_RECEIVED, () => {
  setTimeout(() => {
    loadQuests();
  }, 100);
});

// 进行中的任务
const activeQuests = computed(() => {
  return questList.value.filter(q => q.status === 'active');
});

// 已完成的任务
const completedQuests = computed(() => {
  return questList.value.filter(q => q.status === 'completed');
});

// 已失败的任务
const failedQuests = computed(() => {
  return questList.value.filter(q => q.status === 'failed');
});

function handleClose() {
  emit('close');
}

function selectQuest(quest: any) {
  selectedQuest.value = quest;
}

function closeDetail() {
  selectedQuest.value = null;
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    failed: '已失败',
  };
  return map[status] || status;
}
</script>

<style lang="scss" scoped>
.quest-manager-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
}

.quest-manager-panel {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%); // 黑色渐变
  border-bottom: none;
  border-radius: 12px 12px 0 0;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: bold;
    color: #fff;

    i {
      margin-right: 10px;
      color: #fff;
    }
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border: none;
    background-color: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

// 任务统计
.quest-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .stat-item {
    padding: 16px;
    background-color: #fff;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    text-align: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    }

    .stat-label {
      display: block;
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .stat-value {
      display: block;
      font-size: 32px;
      font-weight: bold;

      &.active {
        color: #333; // 深灰色（进行中）
      }

      &.completed {
        color: #666; // 中灰色（已完成）
      }

      &.failed {
        color: #999; // 浅灰色（已失败）
      }
    }
  }
}

// 任务标签页
.quest-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 2px solid #000;
  padding-bottom: 8px;

  .tab-btn {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background-color: #fff;
    color: #666;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;
    text-transform: uppercase;

    &:hover {
      background-color: #f5f5f5;
      transform: translateY(-2px);
    }

    &.active {
      background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%); // 黑色渐变
      color: #fff;
      border-color: transparent;
    }
  }
}

// 任务列表
.quest-list {
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #999;

    i {
      font-size: 64px;
      margin-bottom: 20px;
      opacity: 0.3;
    }

    p {
      font-size: 16px;
      margin: 0;
    }
  }

  .quest-card {
    padding: 16px;
    margin-bottom: 12px;
    background-color: #fff;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    &:last-child {
      margin-bottom: 0;
    }

    &.active-quest {
      border-left: 4px solid #333; // 深灰色（进行中）
    }

    &.completed-quest {
      opacity: 0.7;
      border-left: 4px solid #666; // 中灰色（已完成）
    }

    &.failed-quest {
      opacity: 0.6;
      border-left: 4px solid #999; // 浅灰色（已失败）
      text-decoration: line-through;
    }

    .quest-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .quest-title {
        margin: 0;
        font-size: 16px;
        font-weight: bold;
        color: #000;
      }

      .quest-status {
        padding: 4px 12px;
        font-size: 11px;
        font-weight: bold;
        border-radius: 12px;
        border: none;
        text-transform: uppercase;

        &.status-active {
          background-color: #333; // 深灰色（进行中）
          color: #fff;
        }

        &.status-completed {
          background-color: #666; // 中灰色（已完成）
          color: #fff;
        }

        &.status-failed {
          background-color: #999; // 浅灰色（已失败）
          color: #fff;
        }
      }
    }

    .quest-description {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #555;
      line-height: 1.5;
    }

    .quest-progress {
      display: flex;
      align-items: center;
      font-size: 13px;
      color: #666;
      padding: 8px;
      background-color: #f9f9f9;
      border-left: 3px solid #333; // 深灰色
      border-radius: 4px;

      .progress-label {
        font-weight: bold;
        margin-right: 8px;
      }

      .progress-text {
        flex: 1;
      }
    }
  }
}

// 任务详情弹窗
.quest-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
  padding: 20px;
}

.quest-detail-content {
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%); // 黑色渐变
    border-bottom: none;
    border-radius: 12px 12px 0 0;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: bold;
      color: #fff;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background-color: rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }
    }
  }

  .detail-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;

    .detail-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: bold;
        color: #333; // 深灰色
        padding-bottom: 8px;
        border-bottom: 2px solid rgba(0, 0, 0, 0.1); // 黑色半透明
        text-transform: uppercase;
      }

      .detail-label {
        font-weight: bold;
        margin-right: 8px;
        color: #555;
      }

      .detail-text {
        margin: 0;
        font-size: 14px;
        line-height: 1.8;
        color: #333;
        white-space: pre-wrap;
      }
    }
  }
}

// 移动端适配
@media (max-width: 992px) {
  .quest-manager-panel {
    padding: 15px;

    .panel-header {
      padding: 12px 0;

      h3 {
        font-size: 16px;

        i {
          font-size: 16px;
        }
      }

      .action-btn {
        width: 32px;
        height: 32px;
        font-size: 14px;
      }
    }

    .quest-tabs {
      gap: 6px;
      margin-bottom: 12px;
      flex-wrap: wrap;

      .tab-btn {
        flex: 1 1 calc(50% - 3px);
        padding: 8px 12px;
        font-size: 12px;
        border-radius: 6px;
        min-height: 44px; // 触摸友好

        &:hover {
          transform: translateY(-1px);
        }
      }
    }

    .quest-list {
      .empty-state {
        padding: 40px 15px;

        i {
          font-size: 48px;
        }

        p {
          font-size: 14px;
        }
      }

      .quest-card {
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 6px;

        &:hover {
          transform: translateY(-1px);
        }

        .quest-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 10px;

          .quest-title {
            font-size: 15px;
          }

          .quest-status {
            padding: 3px 10px;
            font-size: 10px;
            border-radius: 10px;
          }
        }

        .quest-description {
          font-size: 13px;
          margin-bottom: 10px;
        }

        .quest-progress {
          font-size: 12px;
          padding: 6px 8px;
          border-radius: 3px;

          .progress-label {
            margin-right: 6px;
            font-size: 11px;
          }

          .progress-text {
            font-size: 11px;
          }
        }
      }
    }

    .quest-detail-modal {
      padding: 15px;
    }

    .quest-detail-content {
      max-width: 100%;
      max-height: 90vh;
      border-radius: 8px;

      .detail-header {
        padding: 15px 18px;
        border-radius: 8px 8px 0 0;

        h2 {
          font-size: 18px;
        }

        .close-btn {
          width: 30px;
          height: 30px;
          font-size: 16px;
          border-radius: 6px;
        }
      }

      .detail-body {
        padding: 15px;

        .detail-section {
          margin-bottom: 16px;

          h3 {
            font-size: 14px;
            margin-bottom: 10px;
            padding-bottom: 6px;
          }

          .detail-label {
            font-size: 12px;
            margin-right: 6px;
          }

          .detail-text {
            font-size: 13px;
            line-height: 1.6;
          }
        }
      }
    }
  }
}

// 极小屏幕适配
@media (max-width: 480px) {
  .quest-manager-panel {
    padding: 12px;

    .panel-header h3 {
      font-size: 15px;
    }

    .quest-tabs .tab-btn {
      flex: 1 1 100%;
      font-size: 11px;
      padding: 8px 10px;
    }

    .quest-card {
      .quest-header .quest-title {
        font-size: 14px;
      }

      .quest-description {
        font-size: 12px;
      }
    }

    .quest-detail-content {
      .detail-header h2 {
        font-size: 16px;
      }

      .detail-body .detail-section {
        h3 {
          font-size: 13px;
        }

        .detail-text {
          font-size: 12px;
        }
      }
    }
  }
}
</style>
