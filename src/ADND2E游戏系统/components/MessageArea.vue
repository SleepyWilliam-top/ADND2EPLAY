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
  </div>
</template>

<script setup lang="ts">
import { useThrottleFn } from '@vueuse/core';
import { nextTick, onMounted, ref, watch } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { formatMessageWithRegex } from '../utils/regexProcessor';

const gameStore = useGameStore();
const userInput = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

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

onMounted(() => {
  scrollToBottom();
});

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
</style>
