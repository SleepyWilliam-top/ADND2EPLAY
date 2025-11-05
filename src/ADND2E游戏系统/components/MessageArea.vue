<template>
  <div class="message-area">
    <div ref="messagesContainer" class="messages-container">
      <!-- 🔧 性能优化：使用 v-memo 缓存已渲染的消息 -->
      <div
        v-for="(message, index) in gameStore.messages"
        :key="`msg-${index}-${message.timestamp}`"
        v-memo="[message.content, message.role, message.name]"
        class="message"
        :class="`message-${message.role}`"
        :data-message-index="index"
        @contextmenu.prevent="handleContextMenu($event, index)"
        @touchstart="handleTouchStart($event, index)"
        @touchend="handleTouchEnd"
        @touchmove="handleTouchMove"
      >
        <div v-if="message.name" v-once class="message-name">{{ message.name }}</div>
        <div class="message-content" v-html="formatMessage(message.content)"></div>
      </div>

      <!-- 流式传输中的消息 -->
      <div v-if="gameStore.isGenerating && gameStore.streamingText" class="message message-assistant streaming">
        <div class="message-content" v-html="formatMessage(gameStore.streamingText)"></div>
        <div class="typing-indicator">▌</div>
      </div>
    </div>

    <div class="input-area">
      <button v-if="gameStore.isGenerating" class="stop-button-icon" title="停止生成" @click="handleStop">
        <i class="fas fa-stop"></i>
      </button>
      <textarea
        v-model="userInput"
        class="input-textarea"
        placeholder="输入你的行动..."
        :disabled="gameStore.isGenerating"
        @keydown.enter.exact="handleSend"
        @keydown.enter.shift.prevent="userInput += '\n'"
      ></textarea>
      <button
        class="send-button-icon"
        title="发送"
        :disabled="!userInput.trim() || gameStore.isGenerating"
        @click="handleSend"
      >
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>

    <!-- 右键菜单（桌面端）/ 长按菜单（移动端） -->
    <div
      v-show="contextMenuVisible"
      ref="contextMenu"
      class="message-context-menu"
      :style="contextMenuStyle"
      @click="hideContextMenu"
    >
      <button class="ctx-menu-btn" @click="handleEdit"><i class="fas fa-edit"></i> 编辑消息</button>
      <button class="ctx-menu-btn" @click="handleRegenerate"><i class="fas fa-redo"></i> 重新发送</button>
      <button class="ctx-menu-btn" @click="handleCopy"><i class="fas fa-copy"></i> 复制消息</button>
      <button class="ctx-menu-btn" @click="handleDelete"><i class="fas fa-trash"></i> 删除消息</button>
      <button class="ctx-menu-btn" @click="handleRevert"><i class="fas fa-history"></i> 回溯到此</button>
    </div>

    <!-- 消息编辑弹窗 -->
    <div v-if="editModalVisible" class="edit-modal-overlay" @click.self="closeEditModal">
      <div class="edit-modal">
        <div class="edit-modal-header">
          <h3>编辑消息</h3>
          <button class="modal-close-btn" @click="closeEditModal">&times;</button>
        </div>
        <div class="edit-modal-body">
          <textarea v-model="editingContent" class="edit-textarea" rows="10"></textarea>
        </div>
        <div class="edit-modal-footer">
          <button class="modal-action-btn cancel" @click="closeEditModal">取消</button>
          <button class="modal-action-btn confirm" @click="confirmEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThrottleFn } from '@vueuse/core';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { formatMessageWithRegex } from '../utils/regexProcessor';

const gameStore = useGameStore();
const userInput = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenu = ref<HTMLElement | null>(null);
const contextMenuStyle = ref({});
const currentMessageIndex = ref(-1);
const currentMessageRole = ref<'system' | 'assistant' | 'user'>('user');

// 编辑弹窗相关
const editModalVisible = ref(false);
const editingContent = ref('');
const editingIndex = ref(-1);

// 长按相关（移动端）
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let touchStartX = 0;
let touchStartY = 0;
const LONG_PRESS_DURATION = 500; // 长按触发时间（毫秒）
const TOUCH_MOVE_THRESHOLD = 10; // 触摸移动阈值（像素）

// 🔧 性能优化：使用节流优化滚动操作（避免频繁计算）
const scrollToBottom = useThrottleFn(async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}, 100); // 100ms 节流

// 🔧 性能优化：使用防抖优化消息格式化缓存
const formatMessageCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100; // 最多缓存100条消息的格式化结果

function formatMessage(content: string): string {
  // 检查缓存
  if (formatMessageCache.has(content)) {
    return formatMessageCache.get(content)!;
  }

  // 格式化并缓存
  const formatted = formatMessageWithRegex(content);

  // 限制缓存大小
  if (formatMessageCache.size >= MAX_CACHE_SIZE) {
    // 删除最旧的缓存项（FIFO）
    const firstKey = formatMessageCache.keys().next().value;
    if (firstKey !== undefined) {
      formatMessageCache.delete(firstKey);
    }
  }

  formatMessageCache.set(content, formatted);
  return formatted;
}

// 🔧 清除格式化缓存（当正则规则更新时调用）
function clearFormatCache() {
  formatMessageCache.clear();
  console.log('[MessageArea] 格式化缓存已清除');
}

// 🔧 监听正则规则更新事件，清除缓存
let clearCacheHandler: (() => void) | null = null;

// 监听消息变化，自动滚动（修复删除消息后空白问题）
watch(
  () => [gameStore.messages.length, gameStore.streamingText],
  async (newVal, oldVal) => {
    // 如果消息数量减少（删除消息），立即滚动到底部
    if (newVal[0] < oldVal[0]) {
      await nextTick();
      scrollToBottom();
    } else {
      // 正常情况（新增消息或流式传输），滚动到底部
      scrollToBottom();
    }
  },
  // 🔧 性能优化：移除 deep watch，仅监听数组长度变化
);

// 处理发送
async function handleSend() {
  if (!userInput.value.trim() || gameStore.isGenerating) return;

  const input = userInput.value;
  userInput.value = '';

  await gameStore.sendUserInput(input);
}

// 处理停止生成
function handleStop() {
  gameStore.stopGeneration();
}

// ==================== 右键菜单 & 长按菜单处理 ====================

/**
 * 显示右键菜单（桌面端）
 */
function handleContextMenu(event: MouseEvent, index: number) {
  event.preventDefault();

  const message = gameStore.messages[index];
  if (!message) return;

  currentMessageIndex.value = index;
  currentMessageRole.value = message.role;

  // 计算菜单位置（智能定位，避免遮挡内容）
  const x = event.clientX;
  const y = event.clientY;

  // 菜单预估尺寸
  const menuWidth = 200;
  const menuHeight = 220; // 固定高度，包含所有按钮

  // 视口尺寸
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 智能调整位置
  let finalX = x;
  let finalY = y;

  // 横向：如果菜单会超出右边界，则显示在鼠标左侧
  if (finalX + menuWidth > viewportWidth - 10) {
    finalX = Math.max(10, finalX - menuWidth);
  }

  // 纵向：如果菜单会超出下边界，则显示在鼠标上方
  if (finalY + menuHeight > viewportHeight - 10) {
    finalY = Math.max(10, finalY - menuHeight);
  }

  contextMenuStyle.value = {
    left: `${finalX}px`,
    top: `${finalY}px`,
  };

  contextMenuVisible.value = true;

  console.log(`[MessageArea] 右键菜单打开，消息索引: ${index}，位置: (${finalX}, ${finalY})`);
}

/**
 * 处理触摸开始（移动端长按）
 */
function handleTouchStart(event: TouchEvent, index: number) {
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;

  // 设置长按计时器
  longPressTimer = setTimeout(() => {
    // 触发长按菜单
    handleLongPress(index, touch.clientX, touch.clientY);
    longPressTimer = null;

    // 震动反馈（如果设备支持）
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, LONG_PRESS_DURATION);
}

/**
 * 处理触摸结束
 */
function handleTouchEnd() {
  // 清除长按计时器
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

/**
 * 处理触摸移动
 */
function handleTouchMove(event: TouchEvent) {
  const touch = event.touches[0];
  const deltaX = Math.abs(touch.clientX - touchStartX);
  const deltaY = Math.abs(touch.clientY - touchStartY);

  // 如果移动超过阈值，取消长按
  if (deltaX > TOUCH_MOVE_THRESHOLD || deltaY > TOUCH_MOVE_THRESHOLD) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
}

/**
 * 处理长按（移动端）
 */
function handleLongPress(index: number, x: number, y: number) {
  const message = gameStore.messages[index];
  if (!message) return;

  currentMessageIndex.value = index;
  currentMessageRole.value = message.role;

  // 计算菜单位置（移动端智能定位）
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 菜单尺寸（移动端更大）
  const menuWidth = 220;
  const menuHeight = 260; // 固定高度，包含所有按钮

  // 智能定位：优先在触摸点显示，但避免超出边界
  let menuX = x;
  let menuY = y;

  // 横向：如果超出右边界，显示在左侧
  if (menuX + menuWidth > viewportWidth - 10) {
    menuX = Math.max(10, x - menuWidth);
  }

  // 如果还是超出，居中显示
  if (menuX < 10) {
    menuX = (viewportWidth - menuWidth) / 2;
  }

  // 纵向：如果超出下边界，显示在上方
  if (menuY + menuHeight > viewportHeight - 10) {
    menuY = Math.max(10, y - menuHeight);
  }

  // 如果还是超出，居中显示
  if (menuY < 10) {
    menuY = (viewportHeight - menuHeight) / 2;
  }

  contextMenuStyle.value = {
    left: `${menuX}px`,
    top: `${menuY}px`,
  };

  contextMenuVisible.value = true;

  console.log(`[MessageArea] 长按菜单打开，消息索引: ${index}，位置: (${menuX}, ${menuY})`);
}

/**
 * 隐藏右键菜单
 */
function hideContextMenu() {
  contextMenuVisible.value = false;
  currentMessageIndex.value = -1;
}

/**
 * 编辑消息
 */
function handleEdit() {
  const message = gameStore.messages[currentMessageIndex.value];
  if (!message) return;

  editingIndex.value = currentMessageIndex.value;
  editingContent.value = message.content;
  editModalVisible.value = true;

  hideContextMenu();
}

/**
 * 确认编辑
 */
async function confirmEdit() {
  if (editingIndex.value < 0) return;

  await gameStore.editMessage(editingIndex.value, editingContent.value);

  closeEditModal();
}

/**
 * 关闭编辑弹窗
 */
function closeEditModal() {
  editModalVisible.value = false;
  editingContent.value = '';
  editingIndex.value = -1;
}

/**
 * 重新发送消息（支持所有类型的消息）
 * 🔧 学习 lucklyjkop.html：不仅能重新生成 AI 消息，还能重新发送用户消息
 */
async function handleRegenerate() {
  await gameStore.regenerateMessage(currentMessageIndex.value);
  hideContextMenu();
}

/**
 * 复制消息
 */
async function handleCopy() {
  await gameStore.copyMessage(currentMessageIndex.value);
  hideContextMenu();
}

/**
 * 删除消息
 */
async function handleDelete() {
  const confirmed = await new Promise<boolean>(resolve => {
    if (window.confirm('确定要删除这条消息吗？')) {
      resolve(true);
    } else {
      resolve(false);
    }
  });

  if (confirmed) {
    await gameStore.deleteMessage(currentMessageIndex.value);
  }

  hideContextMenu();
}

/**
 * 回溯到指定消息
 */
async function handleRevert() {
  await gameStore.revertToMessage(currentMessageIndex.value);
  hideContextMenu();
}

// ==================== 生命周期钩子 ====================

onMounted(() => {
  scrollToBottom();

  // 监听全局点击事件，关闭右键菜单
  const handleGlobalClick = (event: MouseEvent) => {
    if (contextMenu.value && !contextMenu.value.contains(event.target as Node)) {
      hideContextMenu();
    }
  };

  window.addEventListener('click', handleGlobalClick);

  // 清理全局点击监听
  onBeforeUnmount(() => {
    window.removeEventListener('click', handleGlobalClick);
  });

  // 监听正则规则更新事件，清除缓存
  clearCacheHandler = () => {
    clearFormatCache();
    console.log('[MessageArea] 收到正则规则更新事件，已清除缓存');
  };
  eventOn('adnd2e_regex_rules_updated', clearCacheHandler);
});

onBeforeUnmount(() => {
  // 清理长按计时器
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  // 清理事件监听器
  if (clearCacheHandler) {
    eventRemoveListener('adnd2e_regex_rules_updated', clearCacheHandler);
    clearCacheHandler = null;
  }
});
</script>

<style lang="scss" scoped>
.message-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-left: 2px solid #000;
  border-right: 2px solid #000;
  position: relative;
  height: 100%;
  min-height: 600px;

  @media (max-width: 992px) {
    width: 100%;
    border: none;
  }
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 15px;

  @media (max-width: 992px) {
    padding: 15px;
  }
}

.message {
  width: 100%;
  max-width: 900px;
  align-self: center;
  padding: 20px 30px;
  border: 3px solid #000;
  position: relative;
  font-family: '临海体', serif;
  font-size: 15px;
  line-height: 1.8;
  background-color: #fff;
  margin: 0 auto;

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

  &.message-system {
    background-color: #f5f5f5;
    text-align: center;

    .message-name {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #8b4513;
    }

    .message-content {
      text-align: center;
    }
  }

  &.message-user {
    background-color: #fff8f0;
    border-color: #4a90e2;

    &::before {
      border-color: #4a90e2;
    }

    .message-name {
      color: #4a90e2;
    }
  }

  &.message-assistant {
    background-color: #faf8f3;
    border-color: #8b4513;

    &::before {
      border-color: #8b4513;
    }

    .message-name {
      color: #8b4513;
    }

    &.streaming {
      position: relative;

      .typing-indicator {
        display: inline-block;
        animation: blink 1s infinite;
        font-weight: bold;
        margin-left: 2px;
      }
    }
  }
}

.message-name {
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #333;
}

.message-content {
  word-wrap: break-word;
  white-space: pre-wrap;
}

.input-area {
  border-top: 4px solid #000;
  background-color: #fff;
  padding: 15px;
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  align-items: flex-end;
  position: relative;
  z-index: 10;
}

.stop-button-icon {
  flex-shrink: 0;
  width: 45px;
  height: 45px;
  border: 3px solid #dc3545;
  background-color: #dc3545;
  color: #fff;
  font-size: 1.2em;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    background-color: #a71d2a;
    border-color: #a71d2a;
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
}

.input-textarea {
  flex: 1;
  min-height: 45px;
  max-height: 150px;
  padding: 12px;
  font-family: '临海体', serif;
  font-size: 14px;
  line-height: 1.4;
  border: 2px solid #000;
  background-color: #fff;
  resize: vertical;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #8b4513;
    box-shadow: 0 0 8px rgba(139, 69, 19, 0.3);
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.7;
  }

  &::placeholder {
    color: #999;
  }
}

.send-button-icon {
  flex-shrink: 0;
  width: 50px;
  height: 45px;
  border: 3px solid #000;
  background-color: #8b4513;
  color: #fff;
  font-size: 1.2em;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover:not(:disabled) {
    background-color: #a0522d;
    border-color: #8b4513;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    background-color: #ccc;
    border-color: #999;
    color: #666;
    cursor: not-allowed;
    opacity: 0.6;
  }
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

// ==================== 右键菜单样式 ====================

.message-context-menu {
  position: fixed;
  z-index: 9999;
  background-color: #fff;
  border: 3px solid #000;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 180px;
  padding: 8px;
  user-select: none;

  @media (max-width: 992px) {
    min-width: 200px;
    padding: 10px;
    border-radius: 12px;
  }
}

.ctx-menu-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 15px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-family: '临海体', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  text-align: left;
  transition: all 0.2s ease;
  border-radius: 4px;

  &:hover {
    background-color: #f0f0f0;
    color: #8b4513;
  }

  &:active {
    background-color: #e0e0e0;
  }

  i {
    width: 16px;
    text-align: center;
    color: #666;
  }

  @media (max-width: 992px) {
    padding: 14px 18px;
    font-size: 16px;

    i {
      width: 20px;
      font-size: 18px;
    }
  }
}

// ==================== 编辑弹窗样式 ====================

.edit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
}

.edit-modal {
  background-color: #fff;
  border: 4px solid #000;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

  @media (max-width: 992px) {
    max-width: 95vw;
    max-height: 90vh;
    border-radius: 16px;
  }
}

.edit-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 3px solid #000;
  background-color: #f5f5f5;

  h3 {
    margin: 0;
    font-family: '临海体', 'Microsoft YaHei', sans-serif;
    font-size: 20px;
    font-weight: bold;
    color: #333;
  }

  @media (max-width: 992px) {
    padding: 18px 20px;

    h3 {
      font-size: 18px;
    }
  }
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 28px;
  line-height: 1;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    color: #dc3545;
    transform: scale(1.1);
  }

  @media (max-width: 992px) {
    width: 40px;
    height: 40px;
    font-size: 32px;
  }
}

.edit-modal-body {
  flex: 1;
  padding: 25px;
  overflow-y: auto;

  @media (max-width: 992px) {
    padding: 20px;
  }
}

.edit-textarea {
  width: 100%;
  min-height: 300px;
  padding: 15px;
  font-family: '临海体', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  border: 2px solid #ccc;
  border-radius: 8px;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #8b4513;
    box-shadow: 0 0 8px rgba(139, 69, 19, 0.2);
  }

  @media (max-width: 992px) {
    min-height: 250px;
    font-size: 16px;
    padding: 18px;
  }
}

.edit-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 25px;
  border-top: 3px solid #000;
  background-color: #f5f5f5;

  @media (max-width: 992px) {
    padding: 18px 20px;
    gap: 15px;
  }
}

.modal-action-btn {
  padding: 10px 24px;
  border: 2px solid #000;
  border-radius: 6px;
  font-family: '临海体', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  &.cancel {
    background-color: #fff;
    color: #333;

    &:hover {
      background-color: #f0f0f0;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  }

  &.confirm {
    background-color: #8b4513;
    color: #fff;
    border-color: #8b4513;

    &:hover {
      background-color: #a0522d;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(139, 69, 19, 0.3);
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 992px) {
    padding: 12px 28px;
    font-size: 16px;
    border-radius: 8px;
  }
}

// ==================== 移动端优化 ====================

@media (max-width: 992px) {
  .message {
    // 增加触摸区域
    padding: 18px 25px;

    // 长按时的视觉反馈
    &:active {
      background-color: #f8f8f8;
    }
  }

  // 禁用文本选择（避免与长按冲突）
  .message-content {
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
}
</style>
