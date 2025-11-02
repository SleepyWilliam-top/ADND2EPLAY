<template>
  <div v-if="npc" class="npc-detail-panel">
    <!-- 返回按钮 -->
    <button class="back-button" @click="$emit('back')">
      <i class="fas fa-arrow-left"></i>
      返回列表
    </button>

    <!-- 头部信息 -->
    <div class="npc-header">
      <div class="npc-avatar-section">
        <div class="npc-avatar-large" @click="$emit('change-avatar', npc)">
          <img :src="npc.avatar || defaultAvatar" :alt="npc.name" />
          <div class="avatar-overlay">
            <i class="fas fa-camera"></i>
          </div>
        </div>
        <div v-if="!npc.avatar" class="avatar-credit">来自 Lust Desires</div>
      </div>

      <div class="npc-header-info">
        <div class="npc-name-row">
          <h2
            class="npc-name"
            :class="{
              'name-male': npc.gender === 'male',
              'name-female': npc.gender === 'female',
            }"
          >
            {{ npc.name }}
          </h2>
          <button
            class="favorite-button"
            :class="{ active: npc.favorite }"
            :title="npc.favorite ? '取消特别关心' : '特别关心此NPC'"
            @click="$emit('toggle-favorite', npc)"
          >
            <i :class="npc.favorite ? 'fas fa-star' : 'far fa-star'"></i>
          </button>
        </div>

        <div class="npc-meta-info">
          <span v-if="npc.gender" class="meta-item"><i class="fas fa-venus-mars"></i> {{ genderText }}</span>
          <span v-if="npc.race" class="meta-item"><i class="fas fa-dragon"></i> {{ npc.race }}</span>
          <span v-if="npc.class" class="meta-item"><i class="fas fa-shield-alt"></i> {{ npc.class }}</span>
          <span v-if="npc.location" class="meta-item"><i class="fas fa-map-marker-alt"></i> {{ npc.location }}</span>
        </div>

        <!-- 关系条 -->
        <div v-if="npc.relationship !== undefined" class="relationship-section">
          <div class="relationship-label">
            <span>关系值: {{ npc.relationship }}</span>
            <span class="attitude-badge" :class="`attitude-${npc.attitude || 'neutral'}`">{{ attitudeText }}</span>
          </div>
          <div class="relationship-bar">
            <div class="relationship-fill" :style="{ width: relationshipBarWidth }"></div>
          </div>
        </div>

        <!-- 状态 -->
        <div v-if="npc.status" class="status-badge">
          <i class="fas fa-info-circle"></i>
          {{ npc.status }}
        </div>

        <!-- 标签 -->
        <div v-if="npc.tags && npc.tags.length > 0" class="npc-tags">
          <span v-for="tag in npc.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="tab-navigation">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <i :class="tab.icon"></i>
        {{ tab.label }}
      </button>
    </div>

    <!-- 标签内容 -->
    <div class="tab-content">
      <!-- 基本信息 -->
      <div v-show="activeTab === 'basic'" class="tab-pane">
        <div class="info-section">
          <h3><i class="fas fa-id-card"></i> 基本属性</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">AC (护甲等级):</span>
              <span class="value">{{ npc.ac }}</span>
            </div>
            <div class="info-item">
              <span class="label">MV (移动力):</span>
              <span class="value">{{ npc.mv }}</span>
            </div>
            <div class="info-item">
              <span class="label">HD (生命骰):</span>
              <span class="value">{{ npc.hd }}</span>
            </div>
            <div class="info-item">
              <span class="label">HP (生命值):</span>
              <span class="value">{{ npc.hp }}{{ npc.maxHp ? `/${npc.maxHp}` : '' }}</span>
            </div>
            <div class="info-item">
              <span class="label">THAC0:</span>
              <span class="value">{{ npc.thac0 }}</span>
            </div>
            <div class="info-item">
              <span class="label">#AT (攻击次数):</span>
              <span class="value">{{ npc.at }}</span>
            </div>
            <div class="info-item">
              <span class="label">Dmg (伤害):</span>
              <span class="value">{{ npc.dmg }}</span>
            </div>
            <div class="info-item">
              <span class="label">SZ (体型):</span>
              <span class="value">{{ npc.sz }}</span>
            </div>
            <div class="info-item">
              <span class="label">Int (智力):</span>
              <span class="value">{{ npc.int }}</span>
            </div>
            <div class="info-item">
              <span class="label">AL (阵营):</span>
              <span class="value">{{ npc.al }}</span>
            </div>
            <div class="info-item">
              <span class="label">ML (士气):</span>
              <span class="value">{{ npc.ml }}</span>
            </div>
            <div class="info-item">
              <span class="label">XP (经验值):</span>
              <span class="value">{{ npc.xp }}</span>
            </div>
          </div>
        </div>

        <div v-if="npc.sa || npc.sd || npc.sw || npc.sp || npc.mr" class="info-section">
          <h3><i class="fas fa-magic"></i> 特殊能力</h3>
          <div class="special-abilities">
            <p v-if="npc.sa"><strong>特殊攻击 (SA):</strong> {{ npc.sa }}</p>
            <p v-if="npc.sd"><strong>特殊防御 (SD):</strong> {{ npc.sd }}</p>
            <p v-if="npc.sw"><strong>豁免检定 (SW):</strong> {{ npc.sw }}</p>
            <p v-if="npc.sp"><strong>法术能力 (SP):</strong> {{ npc.sp }}</p>
            <p v-if="npc.mr"><strong>魔法抗性 (MR):</strong> {{ npc.mr }}</p>
          </div>
        </div>

        <div v-if="npc.magicItems" class="info-section">
          <h3><i class="fas fa-gem"></i> 魔法物品</h3>
          <p>{{ npc.magicItems }}</p>
        </div>
      </div>

      <!-- 描述信息 -->
      <div v-show="activeTab === 'description'" class="tab-pane">
        <div v-if="npc.appearance" class="info-section">
          <h3><i class="fas fa-user"></i> 外貌</h3>
          <p class="description-text">{{ npc.appearance }}</p>
        </div>
        <div v-if="npc.personality" class="info-section">
          <h3><i class="fas fa-smile"></i> 性格</h3>
          <p class="description-text">{{ npc.personality }}</p>
        </div>
        <div v-if="npc.background" class="info-section">
          <h3><i class="fas fa-book"></i> 背景</h3>
          <p class="description-text">{{ npc.background }}</p>
        </div>
        <div v-if="npc.motivation" class="info-section">
          <h3><i class="fas fa-bullseye"></i> 动机/目标</h3>
          <p class="description-text">{{ npc.motivation }}</p>
        </div>
        <div v-if="!npc.appearance && !npc.personality && !npc.background && !npc.motivation" class="empty-state">
          <i class="fas fa-question-circle"></i>
          <p>暂无详细描述信息</p>
        </div>
      </div>

      <!-- 装备 -->
      <div v-show="activeTab === 'equipment'" class="tab-pane">
        <div v-if="npc.equipment" class="info-section">
          <h3><i class="fas fa-shield"></i> 装备</h3>
          <div class="equipment-list">
            <div v-if="npc.equipment.weapon" class="equipment-item">
              <i class="fas fa-sword"></i>
              <strong>武器:</strong> {{ npc.equipment.weapon }}
            </div>
            <div v-if="npc.equipment.armor" class="equipment-item">
              <i class="fas fa-vest"></i>
              <strong>护甲:</strong> {{ npc.equipment.armor }}
            </div>
            <div v-if="npc.equipment.shield" class="equipment-item">
              <i class="fas fa-shield-alt"></i>
              <strong>盾牌:</strong> {{ npc.equipment.shield }}
            </div>
            <div v-if="npc.equipment.accessories && npc.equipment.accessories.length > 0">
              <i class="fas fa-ring"></i>
              <strong>配饰:</strong> {{ npc.equipment.accessories.join(', ') }}
            </div>
          </div>
        </div>

        <div v-if="npc.inventory && npc.inventory.length > 0" class="info-section">
          <h3><i class="fas fa-box"></i> 物品清单</h3>
          <div class="inventory-grid">
            <div v-for="(item, index) in npc.inventory" :key="index" class="inventory-item">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-quantity">×{{ item.quantity }}</div>
              <div v-if="item.description" class="item-description">{{ item.description }}</div>
            </div>
          </div>
        </div>

        <div v-if="!npc.equipment && (!npc.inventory || npc.inventory.length === 0)" class="empty-state">
          <i class="fas fa-box-open"></i>
          <p>暂无装备和物品信息</p>
        </div>
      </div>

      <!-- 笔记 -->
      <div v-show="activeTab === 'notes'" class="tab-pane">
        <div class="info-section">
          <h3><i class="fas fa-sticky-note"></i> 玩家笔记</h3>
          <textarea
            v-model="localNotes"
            class="notes-textarea"
            placeholder="在这里记录关于这个NPC的笔记..."
            @blur="saveNotes"
          ></textarea>
        </div>

        <div class="info-section">
          <h3><i class="fas fa-chart-line"></i> 统计信息</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <i class="fas fa-clock"></i>
              <div>
                <strong>首次出现:</strong>
                <span>{{ formatDate(npc.firstSeen) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <i class="fas fa-history"></i>
              <div>
                <strong>最后出现:</strong>
                <span>{{ formatDate(npc.lastSeen) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <i class="fas fa-comment-dots"></i>
              <div>
                <strong>交互次数:</strong>
                <span>{{ npc.interactionCount || 0 }} 次</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="action-btn interact-btn" @click="$emit('interact', 'talk', npc)">
        <i class="fas fa-comments"></i>
        对话
      </button>
      <button class="action-btn interact-btn" @click="$emit('interact', 'give', npc)">
        <i class="fas fa-gift"></i>
        赠礼
      </button>
      <button class="action-btn interact-btn" @click="$emit('interact', 'trade', npc)">
        <i class="fas fa-handshake"></i>
        交易
      </button>
      <button class="action-btn interact-btn" @click="$emit('interact', 'fight', npc)">
        <i class="fas fa-fist-raised"></i>
        战斗
      </button>
      <button class="action-btn delete-btn" @click="$emit('delete', npc)">
        <i class="fas fa-trash-alt"></i>
        删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { NPC } from '../composables/useNpcAutoDetection';

interface Props {
  npc: NPC | null;
  defaultAvatar?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultAvatar: 'https://p.sda1.dev/28/26ccf8affeadc8c3e471a7176924b79e/icon_bed_happy.png',
});

const emit = defineEmits<{
  back: [];
  'change-avatar': [npc: NPC];
  'toggle-favorite': [npc: NPC];
  interact: [action: string, npc: NPC];
  delete: [npc: NPC];
  'update-notes': [npc: NPC, notes: string];
}>();

const activeTab = ref('basic');
const localNotes = ref('');

const tabs = [
  { id: 'basic', label: '基本', icon: 'fas fa-id-card' },
  { id: 'description', label: '描述', icon: 'fas fa-book' },
  { id: 'equipment', label: '装备', icon: 'fas fa-shield' },
  { id: 'notes', label: '笔记', icon: 'fas fa-sticky-note' },
];

const genderText = computed(() => {
  if (!props.npc?.gender) return '';
  const map = { male: '男性', female: '女性', other: '其他' };
  return map[props.npc.gender] || '';
});

const attitudeText = computed(() => {
  if (!props.npc?.attitude) return '中立';
  const map = {
    hostile: '敌对',
    unfriendly: '不友好',
    neutral: '中立',
    friendly: '友好',
    helpful: '乐于助人',
  };
  return map[props.npc.attitude] || '中立';
});

const relationshipBarWidth = computed(() => {
  if (props.npc?.relationship === undefined) return '50%';
  // -100 到 100 映射到 0% 到 100%
  return `${((props.npc.relationship + 100) / 200) * 100}%`;
});

watch(
  () => props.npc,
  npc => {
    if (npc) {
      localNotes.value = npc.notes || '';
      activeTab.value = 'basic';
    }
  },
  { immediate: true },
);

function saveNotes() {
  if (props.npc && localNotes.value !== props.npc.notes) {
    emit('update-notes', props.npc, localNotes.value);
  }
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return '未知';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style lang="scss" scoped>
.npc-detail-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  background-color: #fff;
}

.back-button {
  align-self: flex-start;
  padding: 8px 16px;
  border: 2px solid #000;
  background-color: #fff;
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s;

  i {
    margin-right: 8px;
  }

  &:hover {
    background-color: #000;
    color: #fff;
  }
}

.npc-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 3px solid #000;
}

.npc-avatar-section {
  flex-shrink: 0;
  text-align: center;
}

.npc-avatar-large {
  width: 150px;
  height: 150px;
  border: 3px solid #000;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s;

    i {
      color: #fff;
      font-size: 32px;
    }
  }

  &:hover .avatar-overlay {
    opacity: 1;
  }
}

.avatar-credit {
  font-size: 10px;
  color: #666;
  margin-top: 5px;
}

.npc-header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.npc-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.npc-name {
  font-family: 'Times New Roman', serif;
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  letter-spacing: 1px;

  &.name-male {
    color: #4682b4;
  }

  &.name-female {
    color: #ff69b4;
  }
}

.favorite-button {
  width: 40px;
  height: 40px;
  border: 2px solid #000;
  background-color: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;

  &:hover {
    background-color: #ffd700;
    border-color: #ffd700;
  }

  &.active {
    background-color: #ffd700;
    color: #000;
  }
}

.npc-meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 14px;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;

  i {
    color: #000;
  }
}

.relationship-section {
  margin-top: 5px;
}

.relationship-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 14px;
  font-weight: bold;
}

.attitude-badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;

  &.attitude-hostile {
    background-color: #ff4444;
    color: #fff;
  }
  &.attitude-unfriendly {
    background-color: #ff9944;
    color: #fff;
  }
  &.attitude-neutral {
    background-color: #999;
    color: #fff;
  }
  &.attitude-friendly {
    background-color: #44ff44;
    color: #000;
  }
  &.attitude-helpful {
    background-color: #4444ff;
    color: #fff;
  }
}

.relationship-bar {
  height: 20px;
  background-color: #ddd;
  border: 2px solid #000;
  position: relative;
  overflow: hidden;
}

.relationship-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4444 0%, #ffff44 50%, #44ff44 100%);
  transition: width 0.3s;
}

.status-badge {
  padding: 8px 12px;
  background-color: #ffe4b5;
  border: 2px solid #000;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  i {
    color: #ff8c00;
  }
}

.npc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 10px;
  background-color: #e0e0e0;
  border: 1px solid #000;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.tab-navigation {
  display: flex;
  border-bottom: 3px solid #000;
  margin-bottom: 20px;
}

.tab-button {
  flex: 1;
  padding: 12px;
  border: none;
  background-color: #f5f5f5;
  border-right: 1px solid #000;
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:last-child {
    border-right: none;
  }

  i {
    margin-right: 6px;
  }

  &.active {
    background-color: #fff;
    border-bottom: 3px solid #fff;
    margin-bottom: -3px;
  }

  &:hover:not(.active) {
    background-color: #e0e0e0;
  }
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section {
  h3 {
    font-family: 'Times New Roman', serif;
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 15px 0;
    padding-bottom: 10px;
    border-bottom: 2px solid #000;

    i {
      margin-right: 8px;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: #f5f5f5;
  border: 1px solid #000;

  .label {
    font-weight: bold;
  }

  .value {
    font-family: 'Courier New', monospace;
  }
}

.special-abilities,
.description-text {
  line-height: 1.8;
  font-size: 14px;

  p {
    margin: 8px 0;
  }
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.equipment-item {
  padding: 10px;
  background-color: #f5f5f5;
  border: 1px solid #000;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    font-size: 20px;
    color: #666;
  }
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.inventory-item {
  padding: 12px;
  background-color: #f5f5f5;
  border: 2px solid #000;
  text-align: center;

  .item-name {
    font-weight: bold;
    margin-bottom: 5px;
  }

  .item-quantity {
    color: #666;
    font-size: 12px;
    margin-bottom: 5px;
  }

  .item-description {
    font-size: 11px;
    color: #666;
    margin-top: 5px;
    border-top: 1px solid #ccc;
    padding-top: 5px;
  }
}

.notes-textarea {
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 2px solid #000;
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  resize: vertical;
  line-height: 1.6;

  &:focus {
    outline: none;
    border-color: #4682b4;
  }
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background-color: #f5f5f5;
  border: 1px solid #000;

  i {
    font-size: 24px;
    color: #666;
  }

  div {
    strong {
      display: block;
      margin-bottom: 3px;
    }

    span {
      color: #666;
      font-size: 14px;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;

  i {
    font-size: 48px;
    margin-bottom: 15px;
  }

  p {
    font-size: 16px;
  }
}

.action-buttons {
  display: flex;
  gap: 10px;
  padding-top: 20px;
  border-top: 3px solid #000;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 100px;
  padding: 12px 16px;
  border: 2px solid #000;
  background-color: #fff;
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &.interact-btn:hover {
    background-color: #4682b4;
    border-color: #4682b4;
    color: #fff;
  }

  &.delete-btn {
    border-color: #dc3545;
    color: #dc3545;

    &:hover {
      background-color: #dc3545;
      color: #fff;
    }
  }
}
</style>
