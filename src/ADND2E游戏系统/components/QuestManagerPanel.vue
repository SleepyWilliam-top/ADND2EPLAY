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
  border: 4px solid #000;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #000;
  border-bottom: 3px solid #000;

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
    border: 2px solid #fff;
    background-color: #000;
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0;
    transition: all 0.2s;

    &:hover {
      background-color: #fff;
      color: #000;
      border-color: #fff;
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
    border: 3px solid #000;
    border-radius: 0;
    text-align: center;
    transition: all 0.2s;

    &:hover {
      background-color: #000;

      .stat-label {
        color: #fff;
      }

      .stat-value {
        color: #fff !important;
      }
    }

    .stat-label {
      display: block;
      font-size: 13px;
      color: #000;
      margin-bottom: 8px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .stat-value {
      display: block;
      font-size: 32px;
      font-weight: bold;
      color: #000;
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
    border: 3px solid #000;
    background-color: #fff;
    color: #000;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0;
    transition: all 0.2s;
    text-transform: uppercase;

    &:hover {
      background-color: #e0e0e0;
    }

    &.active {
      background-color: #000;
      color: #fff;
      border-color: #000;
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
    border: 3px solid #000;
    border-radius: 0;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: #f5f5f5;
      border-width: 4px;
    }

    &:last-child {
      margin-bottom: 0;
    }

    &.active-quest {
      border-left-width: 6px;
    }

    &.completed-quest {
      opacity: 0.6;
    }

    &.failed-quest {
      opacity: 0.5;
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
        border-radius: 0;
        border: 2px solid #000;
        text-transform: uppercase;

        &.status-active {
          background-color: #000;
          color: #fff;
        }

        &.status-completed {
          background-color: #fff;
          color: #000;
        }

        &.status-failed {
          background-color: #666;
          color: #fff;
          border-color: #666;
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
      color: #000;
      padding: 8px;
      background-color: #f5f5f5;
      border-left: 4px solid #000;
      border-radius: 0;

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
  border: 4px solid #000;
  border-radius: 0;
  display: flex;
  flex-direction: column;

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background-color: #000;
    border-bottom: 3px solid #000;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: bold;
      color: #fff;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: 2px solid #fff;
      background-color: #000;
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      border-radius: 0;
      transition: all 0.2s;

      &:hover {
        background-color: #fff;
        color: #000;
        border-color: #fff;
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
        color: #000;
        padding-bottom: 8px;
        border-bottom: 3px solid #000;
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
</style>
