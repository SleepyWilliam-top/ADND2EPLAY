<template>
  <div class="settings-panel" :class="$attrs.class">
    <div class="panel-header">
      <h3 class="panel-title">设置</h3>
    </div>

    <div class="panel-content">
      <!-- 游戏管理 -->
      <div class="settings-section">
        <h4 class="section-title">游戏管理</h4>

        <button class="action-button chat-button" @click="showChatRecordManager">
          <span class="button-icon"><i class="fa-solid fa-comments"></i></span>
          <span>聊天记录管理</span>
        </button>

        <button class="action-button npc-button" @click="showNpcManager">
          <span class="button-icon"><i class="fa-solid fa-users"></i></span>
          <span>在场NPC管理</span>
        </button>

        <button class="action-button quest-button" @click="showQuestManager">
          <span class="button-icon"><i class="fa-solid fa-clipboard-list"></i></span>
          <span>任务管理</span>
        </button>
      </div>

      <!-- 分隔线 -->
      <div class="divider"></div>

      <!-- 图鉴与资料 -->
      <div class="settings-section">
        <h4 class="section-title">图鉴与资料</h4>

        <button class="action-button spell-button" @click="showSpellCompendium">
          <span class="button-icon"><i class="fa-solid fa-scroll"></i></span>
          <span>法术图鉴</span>
        </button>

        <button class="action-button worldbook-button" @click="showWorldbookManager">
          <span class="button-icon"><i class="fa-solid fa-book-atlas"></i></span>
          <span>世界书管理</span>
        </button>

        <button class="action-button monster-button" @click="showMonsterEncyclopedia">
          <span class="button-icon"><i class="fa-solid fa-dragon"></i></span>
          <span>怪物图鉴</span>
        </button>
      </div>

      <!-- 分隔线 -->
      <div class="divider"></div>

      <!-- 角色能力 -->
      <div v-if="canShowSpellbook" class="settings-section">
        <h4 class="section-title">角色能力</h4>

        <button class="action-button spell-button" @click="showSpellbook">
          <span class="button-icon"><i class="fa-solid fa-book"></i></span>
          <span>法术书</span>
        </button>
      </div>

      <!-- 分隔线 -->
      <div v-if="canShowSpellbook" class="divider"></div>
      <!-- 系统设置 -->
      <div class="settings-section">
        <h4 class="section-title">系统设置</h4>

        <button class="action-button system-button" @click="showSystemSettings">
          <span class="button-icon"><i class="fa-solid fa-gear"></i></span>
          <span>系统设置</span>
        </button>
      </div>

      <!-- 分隔线 -->
      <div class="divider"></div>

      <!-- 数据导出 -->
      <div class="settings-section">
        <h4 class="section-title">数据导出</h4>

        <button class="action-button export-button" @click="handleExportToFile">
          <span class="button-icon"><i class="fa-solid fa-file-export"></i></span>
          <span>导出为文件</span>
        </button>
      </div>

      <!-- 分隔线 -->
      <div class="divider"></div>

      <!-- 系统操作 -->
      <div class="settings-section">
        <h4 class="section-title">系统操作</h4>

        <button class="action-button" @click="returnToMenu">
          <span class="button-icon"><i class="fa-solid fa-house"></i></span>
          <span>返回主菜单</span>
        </button>
      </div>
    </div>
  </div>

  <!-- NPC管理弹窗（全屏，双视图） -->
  <div v-if="showNpcModal" class="npc-modal-overlay">
    <div class="npc-modal-fullscreen">
      <div class="modal-header">
        <h2>在场NPC管理</h2>
        <button class="close-button" @click="closeNpcManager">✕</button>
      </div>

      <div class="modal-body">
        <!-- 列表视图 -->
        <div v-show="!selectedNpc" class="npc-list-view">
          <!-- 顶部装饰图片 -->
          <div class="npc-header-image">
            <img src="https://p.sda1.dev/28/7ebd1e1910de6dc67c3e0565e9bc3bfc/NPCs.jpg" alt="NPCs" />
          </div>

          <!-- NPC列表 -->
          <div class="npc-simple-list">
            <div v-if="sortedNpcList.length === 0" v-once class="empty-state">
              <i class="fas fa-users"></i>
              <p>暂无在场NPC</p>
              <p class="hint">AI将根据剧情自动记录出现的NPC</p>
            </div>

            <!-- 🔧 性能优化：使用 v-memo 缓存 NPC 列表项 -->
            <div
              v-for="npc in sortedNpcList"
              :key="`npc-${npc.id}`"
              v-memo="[npc.name, npc.hp, npc.ac, npc.favorite, npc.relationship, npc.location]"
              class="npc-list-item"
              :class="{ 'favorite-npc': npc.favorite }"
              @click="selectNpcForDetail(npc)"
            >
              <div class="npc-list-avatar">
                <img :src="npc.avatar || defaultNpcAvatar" :alt="npc.name" loading="lazy" />
              </div>
              <div class="npc-list-info">
                <div class="npc-list-name" :class="getNpcNameClass(npc)">
                  {{ npc.name }}
                  <i v-if="npc.favorite" class="fas fa-star favorite-icon"></i>
                </div>
                <div class="npc-list-meta">
                  <span v-if="npc.race">{{ npc.race }}</span>
                  <span v-if="npc.class">{{ npc.class }}</span>
                  <span v-if="npc.location"><i class="fas fa-map-marker-alt"></i> {{ npc.location }}</span>
                </div>
                <div v-if="npc.relationship !== undefined" class="npc-list-relationship">
                  <span class="attitude-badge" :class="`attitude-${npc.attitude || 'neutral'}`">{{
                    getAttitudeText(npc)
                  }}</span>
                  <span class="relationship-value">关系: {{ npc.relationship }}</span>
                </div>
              </div>
              <div class="npc-list-stats">
                <span>HP: {{ npc.hp }}</span>
                <span>AC: {{ npc.ac }}</span>
              </div>
            </div>
          </div>

          <!-- 底部提示 -->
          <div class="npc-hint-section">
            <div class="hint-box">
              <i class="fas fa-info-circle"></i>
              <div class="hint-text">
                <p><strong>使用说明：</strong></p>
                <p>• <strong>自动记录：</strong>AI 在输出中使用 <code>&lt;npc&gt;</code> 标签即可自动记录NPC</p>
                <p>
                  • <strong>增强标签：</strong>支持更多属性如 gender, race, class, location, status, relationship,
                  attitude 等
                </p>
                <p>• <strong>自动清理：</strong>连续30条消息中未提及的NPC会自动离场</p>
                <p>• <strong>永久保留：</strong>标记为特别关心的NPC永不离场</p>
                <p>• <strong>交互系统：</strong>点击NPC可查看详情并进行交互</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 详情视图 -->
        <NpcDetailPanel
          v-show="selectedNpc"
          :npc="selectedNpc"
          :default-avatar="defaultNpcAvatar"
          @back="selectedNpc = null"
          @change-avatar="handleChangeAvatar"
          @toggle-favorite="handleToggleFavorite"
          @interact="handleInteract"
          @delete="handleDeleteNpc"
          @update-notes="handleUpdateNotes"
        />
      </div>
    </div>
  </div>

  <!-- 图片图库弹窗 -->
  <ImageLibraryModal v-model="showImageLibraryModal" :category="imageLibraryCategory" @select="handleImageSelect" />

  <!-- 法术图鉴弹窗 -->
  <SpellCompendium :visible="showSpellModal" @close="closeSpellCompendium" />

  <!-- 任务管理弹窗 -->
  <QuestManagerPanel :visible="showQuestModal" @close="closeQuestManager" />

  <!-- 聊天记录管理弹窗 -->
  <ChatRecordManager :visible="showChatRecordModal" @close="closeChatRecordManager" />

  <!-- 系统设置弹窗 -->
  <SystemSettingsModal
    :visible="showSystemSettingsModal"
    @close="closeSystemSettings"
    @open-text-regex="openTextRegexSettings"
    @open-summary="openSummarySettings"
    @open-gameplay="openGameplaySettings"
  />

  <!-- 正文与正则设置弹窗 -->
  <TextRegexSettingsModal :visible="showTextRegexModal" @close="closeTextRegexSettings" />

  <!-- 总结设置弹窗 -->
  <SummarySettingsModal :visible="showSummaryModal" @close="closeSummarySettings" />

  <!-- 法术书弹窗 -->
  <SpellbookModal :visible="showSpellbookModal" @close="closeSpellbook" />

  <!-- 世界书管理弹窗 -->
  <WorldbookManager :visible="showWorldbookModal" @close="closeWorldbookManager" />

  <!-- 怪物图鉴弹窗 -->
  <MonsterEncyclopediaModal v-model="showMonsterEncyclopediaModal" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { NPC } from '../composables/useNpcAutoDetection';
import { useNpcAutoDetection } from '../composables/useNpcAutoDetection';
import { useCharacterStore } from '../stores/characterStore';
import { useGameStateStore } from '../stores/gameStateStore';
import { useGameStore } from '../stores/gameStore';
import ChatRecordManager from './ChatRecordManager.vue';
import ImageLibraryModal from './ImageLibraryModal.vue';
import MonsterEncyclopediaModal from './MonsterEncyclopediaModal.vue';
import NpcDetailPanel from './NpcDetailPanel.vue';
import QuestManagerPanel from './QuestManagerPanel.vue';
import SpellCompendium from './SpellCompendium.vue';
import SpellbookModal from './SpellbookModal.vue';
import SummarySettingsModal from './SummarySettingsModal.vue';
import SystemSettingsModal from './SystemSettingsModal.vue';
import TextRegexSettingsModal from './TextRegexSettingsModal.vue';
import WorldbookManager from './WorldbookManager.vue';

// 禁用属性自动继承，因为我们手动处理了 class
defineOptions({
  inheritAttrs: false,
});

const router = useRouter();
const characterStore = useCharacterStore();
const gameStore = useGameStore();
const showNpcModal = ref(false);
const showSpellModal = ref(false);
const showSpellbookModal = ref(false);
const showChatRecordModal = ref(false);
const showSystemSettingsModal = ref(false);
const showTextRegexModal = ref(false);
const showSummaryModal = ref(false);
const showQuestModal = ref(false);
const showWorldbookModal = ref(false);
const showImageLibraryModal = ref(false);
const showMonsterEncyclopediaModal = ref(false);
const imageLibraryCategory = ref<'character' | 'npc' | 'other'>('npc');
const selectedNpc = ref<NPC | null>(null);

const defaultNpcAvatar = 'https://p.sda1.dev/28/26ccf8affeadc8c3e471a7176924b79e/icon_bed_happy.png';

// 初始化 NPC 自动检测
const gameStateStore = useGameStateStore();
const npcAuto = useNpcAutoDetection();

// 在组件挂载时加载角色数据
onMounted(() => {
  npcAuto.initialize();

  // 尝试从酒馆变量加载角色数据
  try {
    characterStore.loadFromTavern();
  } catch (error) {
    console.log('[SettingsPanel] 无法加载角色数据:', error);
  }
});

// 使用 NPC 自动检测的列表
// 🔧 修复：合并两套NPC系统的数据（autoDetection + gameState）
const npcList = computed(() => {
  // 从两个来源获取 NPC
  const autoNpcs = npcAuto.npcList.value;
  const gameStateNpcs = gameStateStore.gameState.npcs.map(npc => ({
    ...npc,
    favorite: npc.isBonded || false, // 🔧 从 isBonded 读取特别关心状态
    lastSeen: Date.now(),
  }));

  // 合并并去重（以 id 为准）
  const npcMap = new Map<string, NPC>();

  // 先添加 autoDetection 的 NPC
  autoNpcs.forEach(npc => npcMap.set(npc.id, npc));

  // 再添加 gameState 的 NPC（会覆盖重复的）
  gameStateNpcs.forEach(npc => {
    if (!npcMap.has(npc.id)) {
      npcMap.set(npc.id, npc as NPC);
    } else {
      // 如果已存在，合并数据（gameState 优先）
      const existing = npcMap.get(npc.id)!;
      npcMap.set(npc.id, { ...existing, ...npc, favorite: npc.favorite } as NPC);
    }
  });

  return Array.from(npcMap.values());
});

// 排序后的 NPC 列表（特别关心的在前）
const sortedNpcList = computed(() => {
  return [...npcList.value].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return 0;
  });
});

// 检查是否可以显示法术书按钮
const canShowSpellbook = computed(() => {
  const character = characterStore.characterData;

  // 检查是否有职业信息（游戏中或角色创建完成）
  if (!character.class) return false;

  const cls = characterStore.getCharacterClass();
  if (!cls) return false;

  // 检查是否是施法职业
  return !!cls.spellcasting;
});

// 导出为文件
async function handleExportToFile() {
  await gameStore.exportToFile();
}

function returnToMenu() {
  if (confirm('确定要返回主菜单吗？')) {
    // 清除路由记录，防止自动恢复游戏
    try {
      const variables = getVariables({ type: 'character' });
      if (variables?.adnd2e) {
        variables.adnd2e.lastRoute = undefined;
        replaceVariables(variables, { type: 'character' });
        console.log('[SettingsPanel] 已清除路由记录');
      }
    } catch (error) {
      console.error('[SettingsPanel] 清除路由记录失败:', error);
    }

    router.push('/');
    toastr.info('已返回主菜单');
  }
}

function showNpcManager() {
  showNpcModal.value = true;
  selectedNpc.value = null;
}

function closeNpcManager() {
  showNpcModal.value = false;
  selectedNpc.value = null;
}

function showQuestManager() {
  showQuestModal.value = true;
}

function closeQuestManager() {
  showQuestModal.value = false;
}

// 法术图鉴功能
function showSpellCompendium() {
  showSpellModal.value = true;
}

function closeSpellCompendium() {
  showSpellModal.value = false;
}

// 聊天记录管理功能
function showChatRecordManager() {
  showChatRecordModal.value = true;
}

function closeChatRecordManager() {
  showChatRecordModal.value = false;
}

// 系统设置功能
function showSystemSettings() {
  showSystemSettingsModal.value = true;
}

function closeSystemSettings() {
  showSystemSettingsModal.value = false;
}

function openTextRegexSettings() {
  showSystemSettingsModal.value = false;
  showTextRegexModal.value = true;
}

function closeTextRegexSettings() {
  showTextRegexModal.value = false;
}

function openSummarySettings() {
  showSystemSettingsModal.value = false;
  showSummaryModal.value = true;
}

function closeSummarySettings() {
  showSummaryModal.value = false;
}

function openGameplaySettings() {
  showSystemSettingsModal.value = false;
  toastr.info('游戏玩法设置功能开发中...');
}

// 法术书功能
function showSpellbook() {
  showSpellbookModal.value = true;
}

function closeSpellbook() {
  showSpellbookModal.value = false;
}

// 世界书管理功能
function showWorldbookManager() {
  showWorldbookModal.value = true;
}

function closeWorldbookManager() {
  showWorldbookModal.value = false;
}

// 怪物图鉴功能
function showMonsterEncyclopedia() {
  showMonsterEncyclopediaModal.value = true;
}

// 选择 NPC 查看详情
function selectNpcForDetail(npc: NPC) {
  selectedNpc.value = npc;
}

// 获取 NPC 名称样式类
function getNpcNameClass(npc: NPC) {
  if (npc.gender === 'male') return 'name-male';
  if (npc.gender === 'female') return 'name-female';
  return '';
}

// 获取态度文本
function getAttitudeText(npc: NPC) {
  const map = {
    hostile: '敌对',
    unfriendly: '不友好',
    neutral: '中立',
    friendly: '友好',
    helpful: '乐于助人',
  };
  return map[npc.attitude || 'neutral'] || '中立';
}

// 处理更换头像 - 使用图库
function handleChangeAvatar(npc: NPC) {
  selectedNpc.value = npc;
  imageLibraryCategory.value = 'npc';
  showImageLibraryModal.value = true;
}

// 处理图库选择
function handleImageSelect(imageData: string, imageId: string) {
  if (!selectedNpc.value) return;

  // 更新NPC头像
  const npc = npcAuto.getNpcById(selectedNpc.value.id);
  if (npc) {
    npc.avatar = imageData;
    npcAuto.saveNpcList();
    toastr.success('头像已更新');

    // 更新选中的 NPC 引用
    if (selectedNpc.value) {
      selectedNpc.value.avatar = imageData;
    }

    console.log('[SettingsPanel] NPC头像已从图库更新:', imageId);
  }
}

// 切换特别关心状态
function handleToggleFavorite(npc: NPC) {
  // 切换前端状态
  npc.favorite = !npc.favorite;

  // 🔧 同步到 gameState.npcs 中的 isBonded 字段
  const gameStateNpc = gameStateStore.gameState.npcs.find(n => n.id === npc.id);
  if (gameStateNpc) {
    gameStateNpc.isBonded = npc.favorite;
    console.log(`[SettingsPanel] 已更新 NPC "${npc.name}" 的 isBonded 状态: ${npc.favorite}`);
  }

  // 也更新 autoDetection 系统的数据（保持兼容性）
  npcAuto.toggleNpcFavorite(npc.name);

  if (npc.favorite) {
    toastr.success(`已特别关心 ${npc.name}，即使离场也会保留`);
  } else {
    toastr.info(`已取消特别关心 ${npc.name}`);
  }
}

// 处理交互
function handleInteract(action: string, npc: NPC) {
  npcAuto.recordInteraction(npc.id);

  switch (action) {
    case 'talk':
      toastr.info(`开始与 ${npc.name} 对话...`);
      // TODO: 实现对话系统
      break;
    case 'give':
      toastr.info(`准备向 ${npc.name} 赠送物品...`);
      // TODO: 实现赠礼系统
      break;
    case 'trade':
      toastr.info(`开始与 ${npc.name} 交易...`);
      // TODO: 实现交易系统
      break;
    case 'fight':
      if (confirm(`确定要与 ${npc.name} 战斗吗？`)) {
        toastr.warning(`与 ${npc.name} 的战斗开始！`);
        npcAuto.updateNpcRelationship(npc.id, -20);
        // TODO: 实现战斗系统
      }
      break;
  }
}

// 处理删除NPC
function handleDeleteNpc(npc: NPC) {
  if (confirm(`确定要删除 NPC "${npc.name}" 吗？此操作不可逆。`)) {
    npcAuto.removeNpc(npc.name);
    selectedNpc.value = null;
    toastr.success(`已删除 NPC: ${npc.name}`);
  }
}

// 处理更新笔记
function handleUpdateNotes(npc: NPC, notes: string) {
  npcAuto.updateNpcNotes(npc.id, notes);
  toastr.success('笔记已保存');
}
</script>

<style lang="scss" scoped>
.settings-panel {
  width: 220px;
  flex-shrink: 0;
  height: 100%;
  max-height: 100vh;
  background-color: #fff;
  border-left: 4px solid #000;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  overflow: hidden; // 防止整个面板滚动

  @media (max-width: 992px) {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    height: 100vh;
    max-height: 100vh;
    width: 220px !important; // 确保移动端也有宽度
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    z-index: 1200;
    background: #fff;
    box-shadow: -4px 0 15px rgba(0, 0, 0, 0.5);
    overflow: hidden; // 面板本身不滚动

    &.visible {
      transform: translateX(0);
    }
  }

  @media (max-width: 480px) {
    width: 200px !important; // 小屏幕稍微窄一点
  }
}

.panel-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  border-bottom: 3px solid #000;
  background-color: #f5f5f5;
  flex-shrink: 0; // 防止头部被压缩

  @media (max-width: 992px) {
    padding: 12px;
  }

  @media (max-width: 480px) {
    padding: 10px;
  }
}

.panel-title {
  font-family: '临海体', serif;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 1px;
  margin: 0;

  @media (max-width: 992px) {
    font-size: 16px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    letter-spacing: 0.5px;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 15px;
  min-height: 0; // 重要：确保 flex 容器可以正确滚动
  -webkit-overflow-scrolling: touch; // iOS 平滑滚动

  @media (max-width: 992px) {
    padding: 12px;
  }

  @media (max-width: 480px) {
    padding: 10px;
  }
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 5px;

  @media (max-width: 992px) {
    gap: 8px;
  }
}

.section-title {
  font-family: '临海体', serif;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #666;
  margin: 0 0 10px 0;
  padding-bottom: 5px;
  border-bottom: 2px solid #ddd;

  @media (max-width: 992px) {
    font-size: 12px;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
    letter-spacing: 0.8px;
  }
}

.divider {
  height: 2px;
  background-color: #ddd;
  margin: 20px 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 6px;
    background-color: #fff;
  }

  @media (max-width: 992px) {
    margin: 15px 0;
  }

  @media (max-width: 480px) {
    margin: 12px 0;
  }
}

.action-button {
  width: 100%;
  font-family: '临海体', serif;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  &.danger {
    border-color: #dc3545;
    color: #dc3545;

    &:hover {
      background-color: #dc3545;
      color: #fff;
      border-color: #dc3545;
    }
  }

  @media (max-width: 992px) {
    min-height: 44px; // 触摸友好的最小高度
    padding: 12px 14px;
    font-size: 11px;
  }

  @media (max-width: 480px) {
    min-height: 40px;
    padding: 10px 12px;
    font-size: 10px;
    gap: 6px;
  }
}

.button-icon {
  font-size: 15px;

  @media (max-width: 992px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
}

.chat-button {
  &:hover {
    background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
    border-color: rgba(74, 144, 226, 0.3);
    color: #fff;
  }
}

.npc-button {
  &:hover {
    background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
    border-color: rgba(40, 167, 69, 0.3);
    color: #fff;
  }
}

.quest-button {
  &:hover {
    background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
    border-color: rgba(108, 117, 125, 0.3);
    color: #fff;
  }
}

.spell-button {
  &:hover {
    background: linear-gradient(135deg, #9370db 0%, #7b5fc9 100%);
    border-color: rgba(147, 112, 219, 0.3);
    color: #fff;
  }
}

.worldbook-button {
  &:hover {
    background: linear-gradient(135deg, #20b2aa 0%, #178f88 100%);
    border-color: rgba(32, 178, 170, 0.3);
    color: #fff;
  }
}

.system-button {
  &:hover {
    background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
    border-color: rgba(108, 117, 125, 0.3);
    color: #fff;
  }
}

.export-button {
  &:hover {
    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
    border-color: rgba(23, 162, 184, 0.3);
    color: #fff;
  }
}

.monster-button {
  &:hover {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    border-color: rgba(220, 53, 69, 0.3);
    color: #fff;
  }
}

// NPC管理弹窗（卡片样式，非全屏）
.npc-modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  overflow: auto;
}

.npc-modal-fullscreen {
  background-color: #fff;
  border: 4px solid #000;
  width: 90%;
  max-width: 1200px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  margin: auto;

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border: 2px solid #666;
    pointer-events: none;
    z-index: 1;
  }
}

.modal-header {
  background-color: #fff;
  border-bottom: 3px solid #000;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  cursor: move;
  user-select: none;

  h2 {
    font-family: '临海体', serif;
    font-size: 20px;
    font-weight: bold;
    letter-spacing: 2px;
    margin: 0;
    text-transform: uppercase;
  }
}

.close-button {
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
}

// 顶部装饰图片
.npc-header-image {
  width: 100%;
  margin-bottom: 20px;
  border: 3px solid #000;
  overflow: hidden;
  background-color: #fff;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

// 列表视图
.npc-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

// 简单NPC列表
.npc-simple-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

// NPC列表项（紧凑行式布局）
.npc-list-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  background-color: #fff;
  border: 2px solid #000;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f0f0e0;
    border-color: #000;
    transform: translateX(5px);
  }

  &.favorite-npc {
    border-left: 5px solid #ffd700;
    background-color: #fffef5;
  }
}

.npc-list-avatar {
  width: 60px;
  height: 60px;
  border: 2px solid #000;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.npc-list-info {
  flex: 1;
  min-width: 0;
}

.npc-list-name {
  font-family: '临海体', serif;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;

  &.name-male {
    color: #4682b4;
  }

  &.name-female {
    color: #ff69b4;
  }

  .favorite-icon {
    color: #ffd700;
    font-size: 14px;
  }
}

.npc-list-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 5px;

  span {
    &::after {
      content: '|';
      margin-left: 10px;
      color: #ccc;
    }

    &:last-child::after {
      display: none;
    }
  }

  i {
    margin-right: 3px;
  }
}

.npc-list-relationship {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.attitude-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
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

.relationship-value {
  color: #666;
  font-weight: bold;
}

.npc-list-stats {
  display: flex;
  flex-direction: column;
  gap: 5px;
  text-align: right;
  font-family: '临海体', serif;
  font-size: 12px;
  font-weight: bold;
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background-color: #fff;
  border: 3px dashed #ccc;

  i {
    font-size: 48px;
    color: #ccc;
    margin-bottom: 15px;
  }

  p {
    font-family: '临海体', serif;
    font-size: 16px;
    margin: 10px 0;
    color: #666;

    &.hint {
      font-size: 13px;
      color: #999;
      font-style: italic;
    }
  }
}

// 提示信息区域
.npc-hint-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #000;
}

.hint-box {
  background-color: #fff;
  border: 3px solid #000;
  padding: 15px;
  display: flex;
  gap: 12px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    border: 1px solid #666;
    pointer-events: none;
  }

  > i {
    font-size: 24px;
    color: #000;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .hint-text {
    flex: 1;
    font-family: '临海体', serif;
    font-size: 11px;
    line-height: 1.6;
    color: #333;

    p {
      margin: 4px 0;

      strong {
        font-size: 12px;
        color: #000;
      }

      i {
        color: #3b3b36;
        margin: 0 2px;
      }
    }
  }
}

// 默认头像来源说明
.avatar-credit {
  font-family: '临海体', serif;
  font-size: 9px;
  color: #999;
  text-align: center;
  margin-top: 5px;
  font-style: italic;
}

.memory-button {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(21, 101, 192, 0.2) 100%);
  border-color: #2196f3;
}

.memory-button:hover {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.3) 0%, rgba(21, 101, 192, 0.3) 100%);
  border-color: #2196f3;
  box-shadow: 0 0 15px rgba(33, 150, 243, 0.4);
}

// 移动端响应式
@media (max-width: 768px) {
  .npc-modal-overlay {
    padding: 10px;
  }

  .npc-modal-card {
    max-width: 95%;
    width: 95%;
    max-height: 95vh;
  }

  .modal-body {
    padding: 12px;
  }

  .npc-card {
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 12px;
  }

  .npc-avatar-wrapper {
    width: 100%;
    align-items: center;
  }

  .npc-info {
    width: 100%;
  }
}
</style>
