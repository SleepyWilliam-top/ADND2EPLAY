<template>
  <div class="message-area">
    <div class="messages-container" ref="messagesContainer">
      <div
        v-for="(message, index) in gameStore.messages"
        :key="index"
        class="message"
        :class="`message-${message.role}`"
      >
        <div v-if="message.name" class="message-name">{{ message.name }}</div>
        <div class="message-content" v-html="formatMessage(message.content)"></div>
      </div>

      <!-- 流式传输中的消息 -->
      <div v-if="gameStore.isGenerating && gameStore.streamingText" class="message message-assistant streaming">
        <div class="message-content" v-html="formatMessage(gameStore.streamingText)"></div>
        <div class="typing-indicator">▌</div>
      </div>
    </div>

    <div class="input-area">
      <textarea
        v-model="userInput"
        class="input-textarea"
        placeholder="输入你的行动..."
        :disabled="gameStore.isGenerating"
        @keydown.enter.exact="handleSend"
        @keydown.enter.shift.prevent="userInput += '\n'"
      ></textarea>
      <div class="input-buttons">
        <button v-if="!gameStore.isGenerating" class="send-button" @click="handleSend" :disabled="!userInput.trim()">
          发送
        </button>
        <button v-else class="stop-button" @click="handleStop">停止</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { formatMessageWithRegex } from '../utils/regexProcessor';

const gameStore = useGameStore();
const userInput = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

// 自动滚动到底部
async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
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
  { deep: true },
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

// 格式化消息内容（应用正则规则 + 基础格式化）
function formatMessage(content: string): string {
  return formatMessageWithRegex(content);
}
</script>

<style lang="scss" scoped>
.message-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f5dc;
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
  font-family: 'Times New Roman', serif;
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
  min-height: 130px;
  position: relative;
  z-index: 10;
}

.input-textarea {
  flex: 1;
  min-height: 80px;
  max-height: 200px;
  padding: 10px;
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  border: 2px solid #000;
  background-color: #fff;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #333;
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
}

.input-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.send-button,
.stop-button {
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 10px 20px;
  border: 3px solid #000;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: #000;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.stop-button {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;

  &:hover {
    background-color: #a71d2a;
    border-color: #a71d2a;
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
