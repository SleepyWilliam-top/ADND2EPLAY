<template>
  <div class="npc-manager-panel">
    <div class="panel-header">
      <h3><i class="fas fa-users"></i> 在场人物管理</h3>
      <button class="refresh-btn" @click="refreshNpcs" title="刷新列表">
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>

    <div v-if="npcList.length === 0" class="empty-state">
      <i class="fas fa-user-slash"></i>
      <p>当前没有检测到 NPC</p>
      <p class="hint">AI 输出包含 NPC 信息时会自动显示</p>
    </div>

    <div v-else class="npc-list">
      <div v-for="npc in sortedNpcs" :key="npc.id" class="npc-item" @click="selectNpc(npc)">
        <div class="npc-header">
          <div class="npc-name">
            {{ npc.name }}
            <i v-if="npc.favorite" class="fas fa-heart favorite-icon" title="特别关心"></i>
          </div>
          <div class="npc-basic-stats">
            <span class="stat">AC {{ npc.ac }}</span>
            <span class="stat">HP {{ npc.hp }}</span>
          </div>
        </div>
        <div class="npc-info">
          <span v-if="npc.race" class="info-tag">{{ npc.race }}</span>
          <span v-if="npc.class" class="info-tag">{{ npc.class }}</span>
          <span v-if="npc.location" class="info-tag"><i class="fas fa-map-marker-alt"></i> {{ npc.location }}</span>
        </div>
      </div>
    </div>

    <!-- NPC 详情弹窗 -->
    <div v-if="selectedNpc" class="npc-detail-modal" @click.self="closeDetail">
      <div class="npc-detail-content">
        <div class="detail-header">
          <h2>{{ selectedNpc.name }}</h2>
          <button class="close-btn" @click="closeDetail">✕</button>
        </div>

        <div class="detail-body">
          <!-- 战斗属性 -->
          <div class="detail-section">
            <h4><i class="fas fa-sword"></i> 战斗属性</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">AC:</span>
                <span class="stat-value">{{ selectedNpc.ac }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">MV:</span>
                <span class="stat-value">{{ selectedNpc.mv }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">HD:</span>
                <span class="stat-value">{{ selectedNpc.hd }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">HP:</span>
                <span class="stat-value">{{ selectedNpc.hp }}/{{ selectedNpc.maxHp }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">THAC0:</span>
                <span class="stat-value">{{ selectedNpc.thac0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">#AT:</span>
                <span class="stat-value">{{ selectedNpc.at }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Dmg:</span>
                <span class="stat-value">{{ selectedNpc.dmg }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">SZ:</span>
                <span class="stat-value">{{ selectedNpc.sz }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Int:</span>
                <span class="stat-value">{{ selectedNpc.int }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">AL:</span>
                <span class="stat-value">{{ selectedNpc.al }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">ML:</span>
                <span class="stat-value">{{ selectedNpc.ml }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">XP:</span>
                <span class="stat-value">{{ selectedNpc.xp }}</span>
              </div>
            </div>
          </div>

          <!-- 特殊能力 -->
          <div v-if="hasSpecialAbilities" class="detail-section">
            <h4><i class="fas fa-magic"></i> 特殊能力</h4>
            <div class="abilities-list">
              <div v-if="selectedNpc.sa" class="ability-item"><strong>特殊攻击:</strong> {{ selectedNpc.sa }}</div>
              <div v-if="selectedNpc.sd" class="ability-item"><strong>特殊防御:</strong> {{ selectedNpc.sd }}</div>
              <div v-if="selectedNpc.sw" class="ability-item"><strong>特殊弱点:</strong> {{ selectedNpc.sw }}</div>
              <div v-if="selectedNpc.sp" class="ability-item"><strong>法术能力:</strong> {{ selectedNpc.sp }}</div>
              <div v-if="selectedNpc.mr" class="ability-item"><strong>魔法抗力:</strong> {{ selectedNpc.mr }}</div>
              <div v-if="selectedNpc.magicItems" class="ability-item">
                <strong>魔法物品:</strong> {{ selectedNpc.magicItems }}
              </div>
            </div>
          </div>

          <!-- 描述信息 -->
          <div v-if="hasDescription" class="detail-section">
            <h4><i class="fas fa-book"></i> 描述信息</h4>
            <div v-if="selectedNpc.appearance" class="description-item">
              <strong>外貌:</strong> {{ selectedNpc.appearance }}
            </div>
            <div v-if="selectedNpc.personality" class="description-item">
              <strong>性格:</strong> {{ selectedNpc.personality }}
            </div>
            <div v-if="selectedNpc.background" class="description-item">
              <strong>背景:</strong> {{ selectedNpc.background }}
            </div>
            <div v-if="selectedNpc.motivation" class="description-item">
              <strong>动机:</strong> {{ selectedNpc.motivation }}
            </div>
          </div>

          <!-- 关系 -->
          <div v-if="selectedNpc.relationship !== undefined" class="detail-section">
            <h4><i class="fas fa-heart"></i> 关系</h4>
            <div class="relationship-bar">
              <div
                class="relationship-fill"
                :style="{ width: `${(selectedNpc.relationship + 100) / 2}%` }"
                :class="relationshipClass"
              ></div>
            </div>
            <div class="relationship-info">
              <span>关系值: {{ selectedNpc.relationship }}</span>
              <span class="attitude-tag" :class="`attitude-${selectedNpc.attitude}`">{{
                attitudeText(selectedNpc.attitude)
              }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="detail-actions">
            <button class="action-btn favorite-btn" @click="toggleFavorite">
              <i :class="selectedNpc.favorite ? 'fas fa-heart' : 'far fa-heart'"></i>
              {{ selectedNpc.favorite ? '取消特别关心' : '标记为特别关心' }}
            </button>
            <button class="action-btn remove-btn" @click="confirmRemove">
              <i class="fas fa-trash-alt"></i>
              移除此 NPC
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useNpcAutoDetection } from '../composables/useNpcAutoDetection';
import type { NPC } from '../composables/useNpcAutoDetection';

const npcDetection = useNpcAutoDetection();
const { npcList, toggleNpcFavorite, removeNpc } = npcDetection;

const selectedNpc = ref<NPC | null>(null);

// 排序后的 NPC 列表（特别关心的在前）
const sortedNpcs = computed(() => {
  return [...npcList.value].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return b.lastSeen - a.lastSeen; // 最近出现的在前
  });
});

// 是否有特殊能力
const hasSpecialAbilities = computed(() => {
  if (!selectedNpc.value) return false;
  const npc = selectedNpc.value;
  return !!(npc.sa || npc.sd || npc.sw || npc.sp || npc.mr || npc.magicItems);
});

// 是否有描述信息
const hasDescription = computed(() => {
  if (!selectedNpc.value) return false;
  const npc = selectedNpc.value;
  return !!(npc.appearance || npc.personality || npc.background || npc.motivation);
});

// 关系条样式
const relationshipClass = computed(() => {
  if (!selectedNpc.value) return '';
  const rel = selectedNpc.value.relationship || 0;
  if (rel >= 50) return 'rel-positive';
  if (rel <= -50) return 'rel-negative';
  return 'rel-neutral';
});

// 态度文本
function attitudeText(attitude?: string): string {
  const map: Record<string, string> = {
    hostile: '敌对',
    unfriendly: '不友好',
    neutral: '中立',
    friendly: '友好',
    helpful: '乐于助人',
  };
  return map[attitude || 'neutral'] || '未知';
}

function selectNpc(npc: NPC) {
  selectedNpc.value = npc;
}

function closeDetail() {
  selectedNpc.value = null;
}

function refreshNpcs() {
  npcDetection.loadNpcList();
  toastr.success('NPC 列表已刷新');
}

function toggleFavorite() {
  if (selectedNpc.value) {
    toggleNpcFavorite(selectedNpc.value.name);
    // 更新本地引用
    selectedNpc.value.favorite = !selectedNpc.value.favorite;
  }
}

async function confirmRemove() {
  if (!selectedNpc.value) return;

  const confirmed = confirm(`确定要移除 NPC "${selectedNpc.value.name}" 吗？`);
  if (confirmed) {
    removeNpc(selectedNpc.value.name);
    toastr.success(`已移除 ${selectedNpc.value.name}`);
    closeDetail();
  }
}
</script>

<style lang="scss" scoped>
.npc-manager-panel {
  background-color: #fff;
  border: 3px solid #000;
  margin-bottom: 20px;
  font-family: 'Times New Roman', serif;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 5px;
    left: 5px;
    right: 5px;
    bottom: 5px;
    border: 1px solid #666;
    pointer-events: none;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-bottom: 2px solid #000;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: #666;
    }
  }

  .refresh-btn {
    background: none;
    border: 2px solid #000;
    width: 30px;
    height: 30px;
    cursor: pointer;
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

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #999;

  i {
    font-size: 48px;
    margin-bottom: 15px;
  }

  p {
    margin: 5px 0;
    font-size: 14px;
  }

  .hint {
    font-size: 12px;
    font-style: italic;
  }
}

.npc-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.npc-item {
  padding: 12px;
  margin-bottom: 8px;
  background-color: #f8f8f8;
  border: 2px solid #ddd;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e8e8e8;
    border-color: #000;
  }
}

.npc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.npc-name {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.favorite-icon {
  color: #ff6b6b;
  font-size: 14px;
}

.npc-basic-stats {
  display: flex;
  gap: 10px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;

  .stat {
    padding: 2px 6px;
    background-color: #000;
    color: #fff;
  }
}

.npc-info {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  .info-tag {
    padding: 2px 8px;
    background-color: #e0e0e0;
    border: 1px solid #999;
    font-size: 11px;
    color: #333;

    i {
      margin-right: 3px;
    }
  }
}

// 弹窗样式
.npc-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.npc-detail-content {
  background-color: #f5f5dc;
  border: 4px solid #000;
  max-width: 700px;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);

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

.detail-header {
  background-color: #fff;
  border-bottom: 3px solid #000;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
    letter-spacing: 2px;
    text-transform: uppercase;
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

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-section {
  margin-bottom: 20px;

  h4 {
    font-size: 16px;
    font-weight: bold;
    margin: 0 0 12px 0;
    padding-bottom: 6px;
    border-bottom: 2px solid #000;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: #666;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background-color: #fff;
  border: 2px solid #000;
  font-family: 'Courier New', monospace;

  .stat-label {
    font-weight: bold;
  }

  .stat-value {
    font-weight: bold;
    color: #2e7d32;
  }
}

.abilities-list,
.description-item {
  margin-bottom: 10px;
}

.ability-item,
.description-item {
  padding: 10px;
  background-color: #fff;
  border: 2px solid #ddd;
  font-size: 13px;
  margin-bottom: 8px;

  strong {
    color: #666;
    display: inline-block;
    min-width: 80px;
  }
}

.relationship-bar {
  width: 100%;
  height: 30px;
  background-color: #ddd;
  border: 2px solid #000;
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
}

.relationship-fill {
  height: 100%;
  transition: width 0.3s;

  &.rel-positive {
    background-color: #4caf50;
  }

  &.rel-neutral {
    background-color: #ffa000;
  }

  &.rel-negative {
    background-color: #f44336;
  }
}

.relationship-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;

  .attitude-tag {
    padding: 4px 10px;
    border: 2px solid;
    font-weight: bold;

    &.attitude-hostile {
      background-color: #ffebee;
      border-color: #f44336;
      color: #f44336;
    }

    &.attitude-unfriendly {
      background-color: #fff3e0;
      border-color: #ff9800;
      color: #ff9800;
    }

    &.attitude-neutral {
      background-color: #f5f5f5;
      border-color: #9e9e9e;
      color: #666;
    }

    &.attitude-friendly {
      background-color: #e8f5e9;
      border-color: #4caf50;
      color: #4caf50;
    }

    &.attitude-helpful {
      background-color: #e3f2fd;
      border-color: #2196f3;
      color: #2196f3;
    }
  }
}

.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid #000;
  background-color: #fff;
  cursor: pointer;
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background-color: #000;
    color: #fff;
  }

  &.favorite-btn {
    border-color: #ff6b6b;
    color: #ff6b6b;

    &:hover {
      background-color: #ff6b6b;
      color: #fff;
    }
  }

  &.remove-btn {
    border-color: #e57373;
    color: #e57373;

    &:hover {
      background-color: #e57373;
      color: #fff;
    }
  }
}
</style>
