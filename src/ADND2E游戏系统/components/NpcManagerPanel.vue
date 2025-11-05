<template>
  <div class="npc-manager-panel">
    <div class="panel-header">
      <h3><i class="fa-solid fa-users"></i> 在场人物管理</h3>
      <div class="header-actions">
        <button class="icon-btn" title="筛选" @click="toggleFilter">
          <i class="fa-solid fa-filter"></i>
        </button>
        <button class="icon-btn" title="刷新列表" @click="refreshNpcs">
          <i class="fa-solid fa-arrows-rotate"></i>
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div v-if="showFilter" class="filter-panel">
      <div class="filter-group">
        <label>
          <input v-model="filterOptions.showFavorite" type="checkbox" />
          <i class="fa-solid fa-heart"></i> 仅显示特别关心
        </label>
        <label>
          <input v-model="filterOptions.showUpdated" type="checkbox" />
          <i class="fa-solid fa-bell"></i> 仅显示有更新
        </label>
      </div>
      <div class="filter-group">
        <select v-model="filterOptions.attitude" class="filter-select">
          <option value="">全部态度</option>
          <option value="hostile">敌对</option>
          <option value="unfriendly">不友好</option>
          <option value="neutral">中立</option>
          <option value="friendly">友好</option>
          <option value="helpful">乐于助人</option>
        </select>
      </div>
    </div>

    <div v-if="filteredNpcs.length === 0" class="empty-state">
      <i class="fa-solid fa-user-slash"></i>
      <p v-if="npcList.length === 0">当前没有检测到 NPC</p>
      <p v-else>没有符合筛选条件的 NPC</p>
      <p class="hint">AI 输出包含 NPC 信息时会自动显示</p>
    </div>

    <div v-else class="npc-list">
      <div
        v-for="npc in filteredNpcs"
        :key="npc.id"
        class="npc-card"
        :class="{ bonded: npc.favorite, updated: npc.isUpdated }"
        @click="selectNpc(npc)"
      >
        <!-- 头像区域 -->
        <div class="npc-avatar">
          <div
            v-if="'avatar' in npc && npc.avatar"
            class="avatar-img"
            :style="{ backgroundImage: `url(${npc.avatar})` }"
          ></div>
          <div v-else class="avatar-placeholder">
            <i class="fa-solid fa-user-ninja"></i>
          </div>
          <span v-if="npc.isUpdated" class="update-badge" title="状态已更新">
            <i class="fa-solid fa-bell"></i>
          </span>
        </div>

        <!-- 信息区域 -->
        <div class="npc-content">
          <div class="npc-header">
            <div class="npc-name">
              {{ npc.name }}
              <i v-if="npc.favorite" class="fa-solid fa-heart favorite-icon" title="特别关心"></i>
            </div>
            <div class="npc-meta">
              <span v-if="npc.race" class="meta-tag"> <i class="fa-solid fa-dragon"></i> {{ npc.race }} </span>
              <span v-if="npc.class" class="meta-tag"> <i class="fa-solid fa-shield-halved"></i> {{ npc.class }} </span>
            </div>
          </div>

          <div class="npc-stats">
            <span class="stat-badge ac"> <i class="fa-solid fa-shield"></i> AC {{ npc.ac }} </span>
            <span class="stat-badge hp" :class="getHpClass(npc)">
              <i class="fa-solid fa-heart-pulse"></i> HP {{ npc.hp }}
            </span>
            <span v-if="npc.status" class="stat-badge status">
              <i class="fa-solid fa-notes-medical"></i> {{ npc.status }}
            </span>
          </div>

          <div v-if="npc.location || npc.attitude" class="npc-footer">
            <span v-if="npc.location" class="location">
              <i class="fa-solid fa-location-dot"></i> {{ npc.location }}
            </span>
            <span v-if="npc.attitude" class="attitude" :class="`attitude-${npc.attitude}`">
              {{ attitudeText(npc.attitude) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- NPC 详情弹窗 -->
    <div v-if="selectedNpc" class="npc-detail-modal" @click.self="closeDetail">
      <div class="npc-detail-content">
        <div class="detail-header">
          <!-- 左侧头像 -->
          <div class="detail-avatar-section">
            <div class="detail-avatar">
              <div
                v-if="selectedNpc.avatar"
                class="avatar-img"
                :style="{ backgroundImage: `url(${selectedNpc.avatar})` }"
              ></div>
              <div v-else class="avatar-placeholder">
                <i class="fa-solid fa-user-ninja"></i>
              </div>
            </div>
            <button v-if="selectedNpc.isBonded" class="bonded-badge" title="重要NPC，不会被自动删除">
              <i class="fa-solid fa-star"></i> 重要NPC
            </button>
          </div>

          <!-- 右侧信息 -->
          <div class="detail-info-section">
            <h2>{{ selectedNpc.name }}</h2>
            <div class="detail-meta">
              <span v-if="selectedNpc.race"> <i class="fa-solid fa-dragon"></i> {{ selectedNpc.race }} </span>
              <span v-if="selectedNpc.class"> <i class="fa-solid fa-shield-halved"></i> {{ selectedNpc.class }} </span>
              <span v-if="selectedNpc.gender">
                <i class="fa-solid fa-person"></i>
                {{ selectedNpc.gender === 'male' ? '男' : selectedNpc.gender === 'female' ? '女' : '其他' }}
              </span>
            </div>
            <div v-if="selectedNpc.location" class="detail-location">
              <i class="fa-solid fa-location-dot"></i> {{ selectedNpc.location }}
            </div>
            <div v-if="selectedNpc.status" class="detail-status">
              <i class="fa-solid fa-notes-medical"></i> {{ selectedNpc.status }}
            </div>
          </div>

          <button class="close-btn" @click="closeDetail">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- 标签页导航 -->
        <div class="detail-tabs">
          <button class="tab-btn" :class="{ active: activeTab === 'combat' }" @click="activeTab = 'combat'">
            <i class="fa-solid fa-swords"></i> 战斗
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'description' }" @click="activeTab = 'description'">
            <i class="fa-solid fa-book"></i> 描述
          </button>
          <button
            v-if="hasSpecialAbilities"
            class="tab-btn"
            :class="{ active: activeTab === 'abilities' }"
            @click="activeTab = 'abilities'"
          >
            <i class="fa-solid fa-wand-sparkles"></i> 能力
          </button>
          <button
            v-if="selectedNpc.relationship !== undefined"
            class="tab-btn"
            :class="{ active: activeTab === 'relationship' }"
            @click="activeTab = 'relationship'"
          >
            <i class="fa-solid fa-heart"></i> 关系
          </button>
        </div>

        <div class="detail-body">
          <!-- 战斗属性标签页 -->
          <div v-show="activeTab === 'combat'" class="detail-section">
            <h4><i class="fa-solid fa-swords"></i> 战斗属性</h4>
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

          <!-- 特殊能力标签页 -->
          <div v-show="activeTab === 'abilities'" v-if="hasSpecialAbilities" class="detail-section">
            <h4><i class="fa-solid fa-wand-sparkles"></i> 特殊能力</h4>
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

          <!-- 描述信息标签页 -->
          <div v-show="activeTab === 'description'" class="detail-section">
            <h4><i class="fa-solid fa-book"></i> 描述信息</h4>
            <div v-if="!hasDescription" class="empty-description">
              <i class="fa-solid fa-circle-info"></i>
              <p>暂无描述信息</p>
            </div>
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

          <!-- 关系标签页 -->
          <div
            v-show="activeTab === 'relationship'"
            v-if="selectedNpc.relationship !== undefined"
            class="detail-section"
          >
            <h4><i class="fa-solid fa-heart"></i> 关系</h4>
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
            <button class="action-btn favorite-btn" :class="{ active: selectedNpc.isBonded }" @click="toggleBonded">
              <i :class="selectedNpc.isBonded ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
              {{ selectedNpc.isBonded ? '取消重要NPC' : '标记为重要NPC' }}
            </button>
            <button class="action-btn edit-btn" @click="showEditModal">
              <i class="fa-solid fa-pen-to-square"></i>
              编辑 NPC
            </button>
            <button class="action-btn remove-btn" @click="confirmRemove">
              <i class="fa-solid fa-trash-can"></i>
              移除此 NPC
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- NPC 编辑弹窗 -->
    <div v-if="editingNpc" class="npc-edit-modal" @click.self="closeEditModal">
      <div class="npc-edit-content">
        <div class="edit-header">
          <h3><i class="fa-solid fa-pen-to-square"></i> 编辑 NPC</h3>
          <button class="close-btn" @click="closeEditModal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="edit-body">
          <!-- 基本信息 -->
          <div class="edit-section">
            <h4>基本信息</h4>
            <div class="edit-grid">
              <div class="edit-field">
                <label>名称</label>
                <input v-model="editForm.name" type="text" />
              </div>
              <div class="edit-field">
                <label>种族</label>
                <input v-model="editForm.race" type="text" />
              </div>
              <div class="edit-field">
                <label>职业</label>
                <input v-model="editForm.class" type="text" />
              </div>
              <div class="edit-field">
                <label>位置</label>
                <input v-model="editForm.location" type="text" />
              </div>
              <div class="edit-field">
                <label>状态</label>
                <input v-model="editForm.status" type="text" placeholder="健康/受伤/中毒等" />
              </div>
              <div class="edit-field">
                <label>态度</label>
                <select v-model="editForm.attitude">
                  <option value="hostile">敌对</option>
                  <option value="unfriendly">不友好</option>
                  <option value="neutral">中立</option>
                  <option value="friendly">友好</option>
                  <option value="helpful">乐于助人</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 战斗属性 -->
          <div class="edit-section">
            <h4>战斗属性</h4>
            <div class="edit-grid">
              <div class="edit-field">
                <label>AC (护甲等级)</label>
                <input v-model="editForm.ac" type="text" />
              </div>
              <div class="edit-field">
                <label>MV (移动速度)</label>
                <input v-model="editForm.mv" type="text" />
              </div>
              <div class="edit-field">
                <label>HD (生命骰)</label>
                <input v-model="editForm.hd" type="text" placeholder="如: 1-1, 5+2" />
              </div>
              <div class="edit-field">
                <label>HP (生命值)</label>
                <input v-model="editForm.hp" type="text" placeholder="当前/最大" />
              </div>
              <div class="edit-field">
                <label>THAC0 (命中值)</label>
                <input v-model="editForm.thac0" type="text" />
              </div>
              <div class="edit-field">
                <label>#AT (攻击次数)</label>
                <input v-model="editForm.at" type="text" />
              </div>
              <div class="edit-field">
                <label>Dmg (伤害)</label>
                <input v-model="editForm.dmg" type="text" placeholder="如: 1d6, 2d4+2" />
              </div>
              <div class="edit-field">
                <label>SZ (体型)</label>
                <select v-model="editForm.sz">
                  <option value="T">T (微型)</option>
                  <option value="S">S (小型)</option>
                  <option value="M">M (中型)</option>
                  <option value="L">L (大型)</option>
                  <option value="H">H (巨型)</option>
                  <option value="G">G (超巨型)</option>
                </select>
              </div>
              <div class="edit-field">
                <label>Int (智力)</label>
                <input v-model="editForm.int" type="text" placeholder="如: 高(13-14)" />
              </div>
              <div class="edit-field">
                <label>AL (阵营)</label>
                <input v-model="editForm.al" type="text" placeholder="如: LG, CE, N" />
              </div>
              <div class="edit-field">
                <label>ML (士气)</label>
                <input v-model="editForm.ml" type="text" placeholder="2-20" />
              </div>
              <div class="edit-field">
                <label>XP (经验值)</label>
                <input v-model="editForm.xp" type="text" />
              </div>
            </div>
          </div>

          <!-- 特殊能力 -->
          <div class="edit-section">
            <h4>特殊能力 (选填)</h4>
            <div class="edit-grid">
              <div class="edit-field full-width">
                <label>SA (特殊攻击)</label>
                <input v-model="editForm.sa" type="text" placeholder="如: 背刺×2" />
              </div>
              <div class="edit-field full-width">
                <label>SD (特殊防御)</label>
                <input v-model="editForm.sd" type="text" placeholder="如: 免疫魅惑" />
              </div>
              <div class="edit-field full-width">
                <label>SW (特殊弱点)</label>
                <input v-model="editForm.sw" type="text" placeholder="如: 畏惧阳光" />
              </div>
              <div class="edit-field full-width">
                <label>SP (法术能力)</label>
                <input v-model="editForm.sp" type="text" placeholder="如: 可使用1级法术" />
              </div>
              <div class="edit-field full-width">
                <label>MR (魔法抗力)</label>
                <input v-model="editForm.mr" type="text" placeholder="如: 15%, 70%" />
              </div>
            </div>
          </div>

          <!-- 描述信息 -->
          <div class="edit-section">
            <h4>描述信息 (选填)</h4>
            <div class="edit-field full-width">
              <label>外貌描述</label>
              <textarea v-model="editForm.appearance" rows="2"></textarea>
            </div>
            <div class="edit-field full-width">
              <label>性格描述</label>
              <textarea v-model="editForm.personality" rows="2"></textarea>
            </div>
            <div class="edit-field full-width">
              <label>背景故事</label>
              <textarea v-model="editForm.background" rows="2"></textarea>
            </div>
            <div class="edit-field full-width">
              <label>动机/目标</label>
              <textarea v-model="editForm.motivation" rows="2"></textarea>
            </div>
            <div class="edit-field full-width">
              <label>备注 (内心想法等)</label>
              <textarea v-model="editForm.notes" rows="2"></textarea>
            </div>
          </div>
        </div>

        <div class="edit-footer">
          <button class="btn-secondary" @click="closeEditModal"><i class="fa-solid fa-xmark"></i> 取消</button>
          <button class="btn-primary" @click="saveNpcEdits"><i class="fa-solid fa-check"></i> 保存更改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { GameState } from '../stores/gameStateStore';
import { useGameStateStore } from '../stores/gameStateStore';
import { eventBus } from '../utils/eventBus';

// 直接从 gameStateStore 读取 NPC 列表（确保与快照同步）
const gameStateStore = useGameStateStore();

// 监听游戏数据更新事件，触发重新计算
const forceUpdateKey = ref(0);
let updateListener: (() => void) | null = null;
const cleanupFunctions: Array<() => void> = [];

// 🔧 新增：筛选和标签页状态
const showFilter = ref(false);
const filterOptions = ref({
  showFavorite: false,
  showUpdated: false,
  attitude: '',
});
const activeTab = ref<'combat' | 'description' | 'abilities' | 'relationship'>('combat');

// 🔧 编辑NPC状态
const editingNpc = ref(false);
const editForm = ref<Partial<GameState['npcs'][number]>>({});

onMounted(() => {
  // 🔧 使用双事件系统监听（DOM + 酒馆助手）
  updateListener = () => {
    forceUpdateKey.value++;
    console.log('[NpcManager] 收到游戏数据更新事件，NPC 数量:', gameStateStore.gameState.npcs.length);
  };

  // 监听旧系统事件（兼容）
  eventOn('adnd2e_game_data_updated', updateListener);
  eventOn('adnd2e_character_data_synced', updateListener);

  // 🔧 监听新的双事件系统
  cleanupFunctions.push(
    eventBus.on('adnd2e:npc-added', detail => {
      console.log(`[NpcManager] 🔵 NPC 添加事件: ${detail.npcName}`);
      forceUpdateKey.value++;
    }),
  );

  cleanupFunctions.push(
    eventBus.on('adnd2e:npc-updated', detail => {
      console.log(`[NpcManager] 🔵 NPC 更新事件: ${detail.npcName}`, detail.changes);
      forceUpdateKey.value++;
    }),
  );

  cleanupFunctions.push(
    eventBus.on('adnd2e:npc-removed', detail => {
      console.log(`[NpcManager] 🔵 NPC 移除事件: ${detail.npcName}`);
      forceUpdateKey.value++;
    }),
  );

  console.log('[NpcManager] 已注册双事件系统监听器 (DOM + 酒馆助手)');
});

onUnmounted(() => {
  // 🔧 清理双事件系统监听器
  cleanupFunctions.forEach(cleanup => cleanup());
  console.log('[NpcManager] 组件卸载，已清理所有事件监听器');
});

// 🔧 新增：NPC 更新追踪（学习 lucklyjkop 的 updatedCharacterIds）
const updatedNpcIds = ref<Set<string>>(new Set());

// 🔧 新增：上次查看的 NPC 数据快照
const lastNpcSnapshot = ref<Map<string, string>>(new Map());

// NPC 类型（从 GameState 中提取，并添加前端扩展字段）
type GameStateNPC = GameState['npcs'][number];
type NPC = GameStateNPC & {
  favorite: boolean;
  lastSeen: number;
  isUpdated?: boolean;
  avatar?: string; // 🔧 新增：头像 URL
  gender?: 'male' | 'female' | 'other'; // 🔧 新增：性别
};

// 🔧 优化：追踪 NPC 变更并标记（学习 lucklyjkop 的 updatedCharacterIds）
function trackNpcChanges() {
  gameStateStore.gameState.npcs.forEach(npc => {
    const currentSnapshot = JSON.stringify({ hp: npc.hp, location: npc.location, status: npc.status });
    const lastSnapshot = lastNpcSnapshot.value.get(npc.id);

    if (lastSnapshot && lastSnapshot !== currentSnapshot) {
      updatedNpcIds.value.add(npc.id);
      console.log(`[NpcManager] 🔴 NPC "${npc.name}" 已更新`);
    }

    lastNpcSnapshot.value.set(npc.id, currentSnapshot);
  });
}

// 将 gameState 中的 NPC 转换为前端显示格式
const npcList = computed(() => {
  // 使用 forceUpdateKey 确保在事件触发时重新计算
  void forceUpdateKey.value; // 触发响应式更新

  // 🔧 每次计算时追踪变更
  trackNpcChanges();

  return gameStateStore.gameState.npcs.map(npc => ({
    ...npc,
    favorite: npc.isBonded || false, // 🔧 修复：从 isBonded 读取特别关心状态（学习 SettingsPanel）
    lastSeen: Date.now(), // TODO: 从历史记录中获取
    isUpdated: updatedNpcIds.value.has(npc.id), // 🔧 新增：标记是否更新
  }));
});

const selectedNpc = ref<NPC | null>(null);

// 🔧 优化：排序后的 NPC 列表（学习 lucklyjkop 的排序逻辑）
// 1. 特别关心的在最前面
// 2. 有更新的在前面
// 3. 按最后出现时间排序
const sortedNpcs = computed(() => {
  return [...npcList.value].sort((a, b) => {
    // 优先级1：特别关心（学习 lucklyjkop 的 isBonded 优先）
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;

    // 优先级2：有更新的在前面
    if (a.isUpdated && !b.isUpdated) return -1;
    if (!a.isUpdated && b.isUpdated) return 1;

    // 优先级3：最近出现的在前
    return b.lastSeen - a.lastSeen;
  });
});

// 🔧 新增：筛选后的 NPC 列表
const filteredNpcs = computed(() => {
  let result = sortedNpcs.value;

  if (filterOptions.value.showFavorite) {
    result = result.filter(npc => npc.favorite);
  }

  if (filterOptions.value.showUpdated) {
    result = result.filter(npc => npc.isUpdated);
  }

  if (filterOptions.value.attitude) {
    result = result.filter(npc => npc.attitude === filterOptions.value.attitude);
  }

  return result;
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

// 🔧 优化：选择 NPC 时清除更新标记（学习 lucklyjkop 的红点清除机制）
function selectNpc(npc: NPC) {
  selectedNpc.value = npc;
  activeTab.value = 'combat'; // 重置到第一个标签页

  // 清除该 NPC 的更新标记
  if (updatedNpcIds.value.has(npc.id)) {
    updatedNpcIds.value.delete(npc.id);
    console.log(`[NpcManager] 已清除 "${npc.name}" 的更新标记`);
  }
}

// 🔧 新增：切换筛选器显示
function toggleFilter() {
  showFilter.value = !showFilter.value;
}

// 🔧 新增：根据 HP 获取样式类
function getHpClass(npc: NPC) {
  if (typeof npc.hp === 'string' && npc.hp.includes('/')) {
    const [current, max] = npc.hp.split('/').map(s => parseInt(s.trim()));
    if (isNaN(current) || isNaN(max)) return '';

    const percent = (current / max) * 100;
    if (percent <= 25) return 'hp-critical';
    if (percent <= 50) return 'hp-warning';
  }
  return '';
}

// 🔧 新增：编辑 NPC
function closeDetail() {
  selectedNpc.value = null;
}

function refreshNpcs() {
  // NPC 列表现在直接从 gameStateStore 读取，无需手动刷新
  // 输出调试信息
  console.log('[NpcManager] 当前 NPC 数量:', gameStateStore.gameState.npcs.length);
  console.log(
    '[NpcManager] NPC 列表:',
    gameStateStore.gameState.npcs.map(n => n.name),
  );
  toastr.info(`NPC 列表实时同步（当前 ${gameStateStore.gameState.npcs.length} 个）`);
}

// 🔧 切换重要NPC标记（isBonded）
function toggleBonded() {
  if (selectedNpc.value) {
    const index = gameStateStore.gameState.npcs.findIndex(n => n.id === selectedNpc.value!.id);
    if (index !== -1) {
      const currentValue = gameStateStore.gameState.npcs[index].isBonded;
      gameStateStore.gameState.npcs[index].isBonded = !currentValue;

      // 同步到角色卡变量
      gameStateStore.syncToCharacterVariables();

      toastr.success(
        !currentValue ? `已标记 ${selectedNpc.value.name} 为重要NPC` : `已取消 ${selectedNpc.value.name} 的重要NPC标记`,
      );
      forceUpdateKey.value++;
    }
  }
}

// 🔧 显示编辑模态框
function showEditModal() {
  if (selectedNpc.value) {
    // 复制当前NPC的所有属性到编辑表单
    editForm.value = { ...selectedNpc.value };
    editingNpc.value = true;
  }
}

// 🔧 关闭编辑模态框
function closeEditModal() {
  editingNpc.value = false;
  editForm.value = {};
}

// 🔧 保存NPC编辑
function saveNpcEdits() {
  if (!editForm.value || !editForm.value.id) {
    toastr.error('编辑数据无效');
    return;
  }

  const index = gameStateStore.gameState.npcs.findIndex(n => n.id === editForm.value.id);
  if (index !== -1) {
    // 构建变更对象（只包含被修改的字段）
    const changes: Record<string, any> = {};
    const originalNpc = gameStateStore.gameState.npcs[index];

    // 比较并收集变更
    for (const key in editForm.value) {
      const editValue = editForm.value[key as keyof typeof editForm.value];
      const originalValue = originalNpc[key as keyof typeof originalNpc];
      if (editValue !== originalValue && editValue !== undefined) {
        changes[key] = editValue;
      }
    }

    // 应用更改
    gameStateStore.gameState.npcs[index] = {
      ...originalNpc,
      ...editForm.value,
    } as GameState['npcs'][number];

    // 同步到角色卡变量
    gameStateStore.syncToCharacterVariables();

    toastr.success(`已更新 ${editForm.value.name} 的信息`);
    console.log('[NpcManager] NPC 编辑完成:', changes);

    // 关闭编辑模态框并刷新
    closeEditModal();
    forceUpdateKey.value++;
  } else {
    toastr.error('未找到该 NPC');
  }
}

async function confirmRemove() {
  if (!selectedNpc.value) return;

  // 如果是重要NPC，给予额外警告
  if (selectedNpc.value.isBonded) {
    const confirmed = confirm(
      `"${selectedNpc.value.name}" 是重要NPC！\n\n确定要移除吗？这将从游戏状态中永久删除该 NPC。`,
    );
    if (!confirmed) return;
  } else {
    const confirmed = confirm(`确定要移除 NPC "${selectedNpc.value.name}" 吗？\n\n提示：这将从游戏状态中删除该 NPC。`);
    if (!confirmed) return;
  }

  try {
    // 从 gameState 中删除 NPC
    const index = gameStateStore.gameState.npcs.findIndex(n => n.id === selectedNpc.value!.id);
    if (index !== -1) {
      const removedNpc = gameStateStore.gameState.npcs[index];
      const isBonded = removedNpc.isBonded;
      const removedName = removedNpc.name;

      // 1. 从游戏状态中删除
      gameStateStore.gameState.npcs.splice(index, 1);
      console.log(`[NpcManager] 已从游戏状态删除 NPC: ${removedName} (ID: ${removedNpc.id})`);

      // 2. 同步到角色卡变量（学习 lucklyjkop: syncStateFromTables）
      gameStateStore.syncToCharacterVariables();
      console.log('[NpcManager] 已同步到角色卡变量');

      // 3. 立即保存到 IndexedDB（学习 lucklyjkop: await saveCurrentState）
      await nextTick(); // 等待 Vue 响应式更新

      const { saveGameData } = await import('../composables/usePersistence');
      const { useGameStore } = await import('../stores/gameStore');
      const gameStore = useGameStore();

      await saveGameData({
        messages: gameStore.messages,
        gameState: gameStateStore.exportGameState(),
      });
      console.log('[NpcManager] 已保存到 IndexedDB');

      // 4. 如果是重要NPC，同时从IndexedDB名册中删除（学习 lucklyjkop: delete bondedCharacters[char.id]）
      if (isBonded) {
        const { deleteBondedNpc } = await import('../composables/usePersistence');
        await deleteBondedNpc(removedNpc.id);
        console.log(`[NpcManager] 已从重要NPC名册删除: ${removedName}`);
      }

      // 5. 触发更新事件，通知其他组件（学习 lucklyjkop 的事件系统）
      console.log('[NpcManager] 🔔 触发 NPC 移除事件');
      eventEmit('adnd2e_game_data_updated');
      eventEmit('adnd2e_character_data_synced');

      toastr.success(`已移除 ${removedName}${isBonded ? '（已从重要NPC名册删除）' : ''}`);
      closeDetail();
      forceUpdateKey.value++; // 强制刷新列表
    } else {
      toastr.error('未找到该 NPC');
    }
  } catch (error) {
    console.error('[NpcManager] 删除 NPC 失败:', error);
    toastr.error('删除失败: ' + (error as Error).message);
  }
}
</script>

<style lang="scss" scoped>
.npc-manager-panel {
  background-color: #fff;
  border: 3px solid #000;
  margin-bottom: 20px;
  font-family: '临海体', serif;
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

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    background: none;
    border: 2px solid #000;
    width: 30px;
    height: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 14px;

    &:hover {
      background-color: #000;
      color: #fff;
    }
  }
}

// 🔧 新增：筛选面板
.filter-panel {
  padding: 10px 15px;
  background-color: #fafafa;
  border-bottom: 1px solid #ddd;
  animation: slideDown 0.3s ease;

  .filter-group {
    display: flex;
    gap: 15px;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      cursor: pointer;

      input[type='checkbox'] {
        cursor: pointer;
      }

      i {
        font-size: 12px;
        color: #666;
      }
    }
  }

  .filter-select {
    padding: 4px 8px;
    border: 2px solid #ddd;
    background: #fff;
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: #000;
    }
  }
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
  max-height: 500px;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

// 🔧 新增：卡片式 NPC 布局（学习 lucklyjkop）
.npc-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background-color: #fff;
  border: 2px solid #ddd;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #ddd;
    transition: background 0.25s ease;
  }

  &:hover {
    border-color: #666;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);

    &::before {
      background: #666;
    }
  }

  // 特别关心的 NPC（学习 lucklyjkop 的 bonded-character）
  &.bonded {
    border-color: #ff6b6b;
    background-color: #fff5f5;

    &::before {
      background: linear-gradient(180deg, #ff6b6b 0%, #ff8787 100%);
    }

    &:hover {
      border-color: #ff5252;
      box-shadow: 0 2px 12px rgba(255, 107, 107, 0.3);
    }
  }

  // 有更新的 NPC
  &.updated {
    animation: cardPulse 2s ease-in-out infinite;
  }
}

@keyframes cardPulse {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(255, 68, 68, 0);
  }
  50% {
    box-shadow: 0 0 8px rgba(255, 68, 68, 0.3);
  }
}

// 头像区域
.npc-avatar {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  position: relative;

  .avatar-img,
  .avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    border: 2px solid #000;
  }

  .avatar-img {
    background-size: cover;
    background-position: center;
  }

  .avatar-placeholder {
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 24px;
      color: #999;
    }
  }

  .update-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 18px;
    height: 18px;
    background: #ff4444;
    border: 2px solid #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: badgePulse 1.5s infinite;

    i {
      font-size: 10px;
      color: #fff;
    }
  }
}

@keyframes badgePulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 68, 68, 0);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 6px rgba(255, 68, 68, 0.6);
  }
}

// 内容区域
.npc-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.npc-header {
  .npc-name {
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    color: #1a1a1a;

    .favorite-icon {
      color: #ff6b6b;
      font-size: 14px;
      animation: heartbeat 1.5s ease-in-out infinite;
    }
  }

  .npc-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .meta-tag {
      font-size: 11px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 3px;

      i {
        font-size: 10px;
      }
    }
  }
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(1);
  }
}

.npc-stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  .stat-badge {
    padding: 2px 6px;
    font-size: 11px;
    font-weight: bold;
    border: 1px solid;
    display: flex;
    align-items: center;
    gap: 3px;
    white-space: nowrap;

    i {
      font-size: 10px;
    }

    &.ac {
      background-color: #e3f2fd;
      border-color: #2196f3;
      color: #1976d2;
    }

    &.hp {
      background-color: #ffebee;
      border-color: #f44336;
      color: #c62828;

      &.hp-warning {
        background-color: #fff3e0;
        border-color: #ff9800;
        color: #e65100;
        animation: hpBlink 1.5s infinite;
      }

      &.hp-critical {
        background-color: #ffcdd2;
        border-color: #d32f2f;
        color: #b71c1c;
        animation: hpBlink 0.8s infinite;
      }
    }

    &.status {
      background-color: #f3e5f5;
      border-color: #9c27b0;
      color: #6a1b9a;
    }
  }
}

@keyframes hpBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.npc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #666;
  margin-top: auto;

  .location {
    display: flex;
    align-items: center;
    gap: 3px;

    i {
      font-size: 10px;
    }
  }

  .attitude {
    padding: 2px 6px;
    border-radius: 2px;
    font-weight: bold;
    font-size: 10px;

    &.attitude-hostile {
      background-color: #ffebee;
      color: #c62828;
    }

    &.attitude-unfriendly {
      background-color: #fff3e0;
      color: #e65100;
    }

    &.attitude-neutral {
      background-color: #f5f5f5;
      color: #666;
    }

    &.attitude-friendly {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    &.attitude-helpful {
      background-color: #e3f2fd;
      color: #1565c0;
    }
  }
}

// 🔧 优化：弹窗样式（学习 lucklyjkop）
.npc-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.npc-detail-content {
  background-color: #fff;
  border: 4px solid #000;
  max-width: 800px;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: scaleIn 0.3s ease;

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

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

// 详情页头部（学习 lucklyjkop 的双列布局）
.detail-header {
  background-color: #f8f8f8;
  border-bottom: 3px solid #000;
  padding: 20px;
  display: flex;
  gap: 20px;
  position: relative;

  .detail-avatar-section {
    flex-shrink: 0;

    .detail-avatar {
      width: 100px;
      height: 100px;
      position: relative;

      .avatar-img,
      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        border: 3px solid #000;
      }

      .avatar-img {
        background-size: cover;
        background-position: center;
      }

      .avatar-placeholder {
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 40px;
          color: #999;
        }
      }
    }
  }

  .detail-info-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;

    h2 {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #1a1a1a;
    }

    .detail-meta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 13px;
      color: #666;

      span {
        display: flex;
        align-items: center;
        gap: 4px;

        i {
          font-size: 12px;
        }
      }
    }

    .detail-location,
    .detail-status {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 5px;

      i {
        font-size: 12px;
        color: #999;
      }
    }

    .detail-status {
      color: #9c27b0;
      font-weight: 500;
    }
  }

  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: 2px solid #000;
    width: 36px;
    height: 36px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background-color: #000;
      color: #fff;
      transform: rotate(90deg);
    }
  }
}

// 标签页导航
.detail-tabs {
  display: flex;
  border-bottom: 2px solid #ddd;
  background-color: #fafafa;

  .tab-btn {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: none;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #666;
    position: relative;

    i {
      font-size: 14px;
    }

    &:hover {
      background-color: #f0f0f0;
      color: #333;
    }

    &.active {
      background-color: #fff;
      color: #000;
      font-weight: bold;

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background-color: #000;
      }
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
  font-family: '临海体', serif;

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

.empty-description {
  padding: 40px 20px;
  text-align: center;
  color: #999;

  i {
    font-size: 32px;
    margin-bottom: 10px;
    display: block;
  }
}

.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #000;
  background-color: #fff;
  cursor: pointer;
  font-family: '临海体', serif;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  i {
    transition: transform 0.2s;
  }

  &:hover {
    background-color: #f5f5f5;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    i {
      transform: scale(1.1);
    }
  }

  &:active {
    transform: translateY(0);
  }

  &.favorite-btn {
    border-color: #ff6b6b;
    color: #ff6b6b;

    &.active {
      background-color: #fff5f5;
      font-weight: bold;

      i {
        animation: heartbeat 1.5s ease-in-out infinite;
      }
    }

    &:hover {
      background-color: #ffebee;
      border-color: #ff5252;
      color: #ff5252;
    }
  }

  &.edit-btn {
    border-color: #2196f3;
    color: #2196f3;

    &:hover {
      background-color: #e3f2fd;
      border-color: #1976d2;
      color: #1976d2;
    }
  }

  &.remove-btn {
    border-color: #e57373;
    color: #e57373;

    &:hover {
      background-color: #ffebee;
      border-color: #d32f2f;
      color: #d32f2f;
    }
  }
}

// 🔧 重要NPC徽章
.bonded-badge {
  margin-top: 10px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border: 2px solid #f4c430;
  color: #8b6914;
  font-size: 11px;
  font-weight: bold;
  border-radius: 4px;
  cursor: default;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);

  i {
    font-size: 12px;
    animation: starTwinkle 2s ease-in-out infinite;
  }

  @keyframes starTwinkle {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
}

// 🔧 NPC编辑模态框
.npc-edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
  overflow-y: auto;
}

.npc-edit-content {
  background: #fff;
  border: 3px solid #000;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  font-family: '临海体', serif;
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

.edit-header {
  padding: 15px 20px;
  background: #f5f5f5;
  border-bottom: 2px solid #000;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    font-size: 18px;
    font-weight: bold;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;

    i {
      color: #2196f3;
    }
  }

  .close-btn {
    width: 30px;
    height: 30px;
    border: 2px solid #666;
    background: #fff;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;

    &:hover {
      background: #f44336;
      color: #fff;
      border-color: #d32f2f;
    }
  }
}

.edit-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.edit-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ddd;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  h4 {
    font-size: 16px;
    font-weight: bold;
    margin: 0 0 15px 0;
    color: #333;
  }
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  &.full-width {
    grid-column: 1 / -1;
  }

  label {
    font-size: 13px;
    font-weight: bold;
    color: #555;
  }

  input,
  select,
  textarea {
    padding: 8px 10px;
    border: 2px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: '临海体', serif;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #2196f3;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
    }

    &::placeholder {
      color: #aaa;
      font-size: 12px;
    }
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }
}

.edit-footer {
  padding: 15px 20px;
  background: #f5f5f5;
  border-top: 2px solid #000;
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  button {
    padding: 10px 20px;
    border: 2px solid #000;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;

    &.btn-secondary {
      background: #fff;
      color: #666;

      &:hover {
        background: #f5f5f5;
        color: #333;
      }
    }

    &.btn-primary {
      background: #2196f3;
      color: #fff;
      border-color: #1976d2;

      &:hover {
        background: #1976d2;
        box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
      }
    }
  }
}

// 移动端适配
@media (max-width: 992px) {
  .npc-manager-panel {
    border-width: 2px;
    margin-bottom: 15px;

    &::before {
      display: none;
    }
  }

  .panel-header {
    padding: 10px 12px;

    h3 {
      font-size: 14px;
      gap: 6px;

      i {
        font-size: 14px;
      }
    }

    .icon-btn {
      width: 28px;
      height: 28px;
      font-size: 13px;
    }
  }

  .filter-panel {
    padding: 8px 12px;

    .filter-group {
      gap: 10px;

      label {
        font-size: 12px;
      }
    }

    .filter-select {
      font-size: 12px;
    }
  }

  .empty-state {
    padding: 30px 15px;

    i {
      font-size: 36px;
      margin-bottom: 12px;
    }

    p {
      font-size: 13px;
    }

    .hint {
      font-size: 11px;
    }
  }

  .npc-list {
    max-height: 400px;
    padding: 8px;
    grid-template-columns: 1fr;
  }

  .npc-card {
    padding: 10px;
    gap: 10px;

    &::before {
      width: 3px;
    }
  }

  .npc-avatar {
    width: 50px;
    height: 50px;

    .avatar-placeholder i {
      font-size: 20px;
    }

    .update-badge {
      width: 16px;
      height: 16px;

      i {
        font-size: 9px;
      }
    }
  }

  .npc-header {
    .npc-name {
      font-size: 14px;
      gap: 5px;

      .favorite-icon {
        font-size: 12px;
      }
    }

    .npc-meta {
      gap: 6px;

      .meta-tag {
        font-size: 10px;
      }
    }
  }

  .npc-stats {
    gap: 5px;

    .stat-badge {
      font-size: 10px;
      padding: 2px 5px;

      i {
        font-size: 9px;
      }
    }
  }

  .npc-footer {
    font-size: 10px;

    .attitude {
      font-size: 9px;
    }
  }

  .npc-detail-modal {
    padding: 10px;
  }

  .npc-detail-content {
    border-width: 3px;
    max-width: 100%;
    max-height: 95vh;

    &::before {
      top: 5px;
      left: 5px;
      right: 5px;
      bottom: 5px;
    }
  }

  .detail-header {
    padding: 15px;
    gap: 15px;
    flex-direction: column;

    .detail-avatar-section {
      .detail-avatar {
        width: 80px;
        height: 80px;

        .avatar-img,
        .avatar-placeholder {
          border-width: 2px;
        }

        .avatar-placeholder i {
          font-size: 32px;
        }
      }
    }

    .detail-info-section {
      h2 {
        font-size: 18px;
        letter-spacing: 1px;
      }

      .detail-meta {
        font-size: 12px;
        gap: 8px;
      }

      .detail-location,
      .detail-status {
        font-size: 12px;
      }
    }

    .close-btn {
      width: 32px;
      height: 32px;
      font-size: 16px;
    }
  }

  .detail-tabs {
    .tab-btn {
      padding: 10px 12px;
      font-size: 12px;
      gap: 4px;

      i {
        font-size: 12px;
      }
    }
  }

  .detail-body {
    padding: 15px;
  }

  .detail-section {
    margin-bottom: 16px;

    h4 {
      font-size: 14px;
      margin-bottom: 10px;
      gap: 6px;
    }
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stat-item {
    padding: 6px 8px;
    border-width: 2px;
    font-size: 12px;

    .stat-label {
      font-size: 11px;
    }

    .stat-value {
      font-size: 12px;
    }
  }

  .ability-item,
  .description-item {
    padding: 8px;
    font-size: 12px;
    margin-bottom: 6px;
    border-width: 2px;

    strong {
      font-size: 11px;
      min-width: 70px;
    }
  }

  .empty-description {
    padding: 30px 15px;

    i {
      font-size: 28px;
    }

    p {
      font-size: 12px;
    }
  }

  .relationship-bar {
    height: 25px;
    border-width: 2px;
    margin-bottom: 8px;
  }

  .relationship-info {
    font-size: 12px;

    .attitude-tag {
      padding: 3px 8px;
      font-size: 11px;
    }
  }

  .detail-actions {
    gap: 8px;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 10px 12px;
    font-size: 13px;
    gap: 6px;
    border-width: 2px;
    min-height: 44px;
    flex: 1 1 calc(50% - 4px);

    &.remove-btn {
      flex-basis: 100%;
    }
  }
}

// 极小屏幕适配
@media (max-width: 480px) {
  .panel-header h3 {
    font-size: 13px;
  }

  .npc-list {
    padding: 6px;
  }

  .npc-card {
    padding: 8px;
    gap: 8px;
  }

  .npc-header .npc-name {
    font-size: 13px;
  }

  .npc-stats {
    gap: 4px;

    .stat-badge {
      font-size: 9px;
    }
  }

  .detail-header {
    .detail-avatar-section .detail-avatar {
      width: 70px;
      height: 70px;

      .avatar-placeholder i {
        font-size: 28px;
      }
    }

    .detail-info-section h2 {
      font-size: 16px;
    }
  }

  .detail-tabs .tab-btn {
    padding: 8px 10px;
    font-size: 11px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .stat-item {
    font-size: 11px;
  }

  .detail-section h4 {
    font-size: 13px;
  }

  .ability-item,
  .description-item {
    font-size: 11px;
  }

  .action-btn {
    font-size: 12px;
    padding: 8px 10px;
  }

  // 🔧 编辑模态框移动端适配
  .npc-edit-modal {
    padding: 10px;
  }

  .npc-edit-content {
    max-width: 100%;
    max-height: 95vh;
  }

  .edit-header {
    padding: 12px 15px;

    h3 {
      font-size: 15px;
    }

    .close-btn {
      width: 26px;
      height: 26px;
      font-size: 14px;
    }
  }

  .edit-body {
    padding: 15px;
  }

  .edit-section {
    margin-bottom: 20px;
    padding-bottom: 15px;

    h4 {
      font-size: 14px;
      margin-bottom: 10px;
    }
  }

  .edit-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .edit-field {
    label {
      font-size: 12px;
    }

    input,
    select,
    textarea {
      font-size: 13px;
      padding: 8px;
    }
  }

  .edit-footer {
    padding: 12px 15px;
    flex-direction: column;

    button {
      width: 100%;
      font-size: 13px;
      padding: 10px 15px;
      justify-content: center;
    }
  }

  .bonded-badge {
    font-size: 10px;
    padding: 5px 10px;

    i {
      font-size: 11px;
    }
  }
}
</style>
