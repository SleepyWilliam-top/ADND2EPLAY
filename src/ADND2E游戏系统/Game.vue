<template>
  <div class="game-container">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>正在初始化游戏...</p>
      </div>
    </div>

    <div v-else class="game-panel" :class="{ 'left-visible': leftPanelVisible, 'right-visible': rightPanelVisible }">
      <!-- 移动端遮罩层 -->
      <div
        class="mobile-overlay"
        :class="{ visible: leftPanelVisible || rightPanelVisible }"
        @click="closeAllPanels"
      ></div>

      <!-- 左侧头像面板 -->
      <CharacterAvatarPanel :class="{ visible: leftPanelVisible }" />

      <!-- 中间消息区域 -->
      <div class="center-pane">
        <!-- 移动端头部栏 -->
        <div class="mobile-header">
          <button class="mobile-toggle-btn" @click="toggleLeftPanel">
            <i class="fas fa-user"></i>
          </button>
          <span class="mobile-title">ADND 2E 冒险</span>
          <button class="mobile-toggle-btn" @click="toggleRightPanel">
            <i class="fas fa-cog"></i>
          </button>
        </div>

        <MessageArea />
      </div>

      <!-- 右侧设置面板 -->
      <SettingsPanel :class="{ visible: rightPanelVisible }" />
    </div>

    <!-- 手动补充分段记忆弹窗 -->
    <ManualSegmentedMemoryModal
      :visible="gameStore.showManualSegmentedMemoryModal"
      @close="gameStore.closeManualSegmentedMemoryModal"
      @save="handleSaveSegmentedMemory"
    />

    <!-- 🔧 性能监控面板（可通过快捷键 Ctrl+Shift+P 开启/关闭） -->
    <PerformancePanel :visible="showPerformancePanel" @close="showPerformancePanel = false" />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import MessageArea from './components/MessageArea.vue';
import { useNpcAutoDetection } from './composables/useNpcAutoDetection';
import { useGameStore } from './stores/gameStore';

// 🔧 性能优化：懒加载非关键组件（学习自 lucklyjkop）
const CharacterAvatarPanel = defineAsyncComponent(() => import('./components/CharacterAvatarPanel.vue'));
const SettingsPanel = defineAsyncComponent(() => import('./components/SettingsPanel.vue'));
const ManualSegmentedMemoryModal = defineAsyncComponent(() => import('./components/ManualSegmentedMemoryModal.vue'));
const PerformancePanel = defineAsyncComponent(() => import('./components/PerformancePanel.vue'));

const gameStore = useGameStore();
const npcDetection = useNpcAutoDetection();
const isLoading = ref(true);
const leftPanelVisible = ref(false);
const rightPanelVisible = ref(false);
const showPerformancePanel = ref(false);

function toggleLeftPanel() {
  leftPanelVisible.value = !leftPanelVisible.value;
  rightPanelVisible.value = false;
}

function toggleRightPanel() {
  rightPanelVisible.value = !rightPanelVisible.value;
  leftPanelVisible.value = false;
}

function closeAllPanels() {
  leftPanelVisible.value = false;
  rightPanelVisible.value = false;
}

// 处理手动补充分段记忆
function handleSaveSegmentedMemory({ smallSummary, largeSummary }: { smallSummary: string; largeSummary: string }) {
  gameStore.supplementSegmentedMemory(smallSummary, largeSummary);
}

// 保存当前路由到角色卡变量（用于退出后重进时恢复）
function saveCurrentRoute(route: string) {
  try {
    const variables = getVariables({ type: 'character' });
    if (variables?.adnd2e) {
      variables.adnd2e.lastRoute = route;
      replaceVariables(variables, { type: 'character' });
      console.log('[Game] 已保存当前路由:', route);
    }
  } catch (error) {
    console.error('[Game] 保存路由失败:', error);
  }
}

onMounted(async () => {
  try {
    console.log('[Game] 开始初始化游戏界面');

    // 保存当前路由状态（用于重进时恢复）
    saveCurrentRoute('/game');

    // 初始化游戏数据
    await gameStore.initializeGame();

    // 初始化 NPC 自动检测
    npcDetection.initialize();

    // 监听流式传输事件
    eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamTokenFully);
    eventOn(iframe_events.GENERATION_ENDED, handleGenerationEnded);

    // 🔧 性能优化：监听快捷键 Ctrl+Shift+P 开启/关闭性能监控
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        showPerformancePanel.value = !showPerformancePanel.value;
        console.log('[Game] 性能监控面板:', showPerformancePanel.value ? '开启' : '关闭');
      }
    };
    window.addEventListener('keydown', handleKeydown);

    // 在卸载时移除监听器
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeydown);
    });

    isLoading.value = false;
    console.log('[Game] 游戏界面初始化完成');
  } catch (error) {
    console.error('[Game] 游戏初始化失败:', error);
    toastr.error('游戏初始化失败: ' + (error as Error).message);
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  // 清理事件监听器
  eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamTokenFully);
  eventRemoveListener(iframe_events.GENERATION_ENDED, handleGenerationEnded);

  // 清理 NPC 自动检测
  npcDetection.cleanup();

  // 停止自动同步并清理资源
  gameStore.cleanup();
});

function handleStreamTokenFully(fullText: string, id: string) {
  if (id === 'adnd2e-game') {
    gameStore.streamingText = fullText;
  }
}

function handleGenerationEnded(_text: string, id: string) {
  if (id === 'adnd2e-game') {
    gameStore.streamingText = '';
  }
}
</script>

<style lang="scss" scoped>
.game-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  background-color: #fff;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  padding: 40px;
  border: 4px solid #000;
  background-color: #fff;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border: 1px solid #000;
    pointer-events: none;
  }

  p {
    font-family: '临海体', serif;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 1px;
    margin: 20px 0 0 0;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #000;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 游戏主面板
.game-panel {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 1200px;
  background-color: #fff;
  border: 2px solid #000;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
}

// 中间内容区域
.center-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 移动端头部栏（桌面端也显示）
.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #fff;
  border-bottom: 2px solid #000;
  position: relative;
  z-index: 100;

  .mobile-toggle-btn {
    width: 40px;
    height: 40px;
    border: 2px solid #000;
    background-color: #fff;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    transition: all 0.2s;

    &:hover {
      background-color: #f0f0f0;
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .mobile-title {
    font-family: '临海体', serif;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 1px;
  }
}

// 移动端遮罩层
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;

  &.visible {
    opacity: 1;
    pointer-events: auto;
  }
}

// 移动端响应式布局
@media (max-width: 992px) {
  .game-panel {
    flex-direction: column;
    border: none;
  }

  .mobile-overlay {
    display: block;
  }

  .center-pane {
    width: 100%;
    height: 100%;
  }
}
</style>
