<template>
  <div v-if="visible" class="settings-overlay">
    <div class="settings-modal modal">
      <button class="modal-close-btn" @click="closeModal">&times;</button>
      <h4>总结 & 分段记忆设置</h4>

      <div class="modal-content">
        <!-- API 源 -->
        <div class="settings-section">
          <h5>API 源</h5>
          <div class="api-source-controls">
            <label>
              <input v-model="settings.apiSource" type="radio" value="custom" />
              自定义 API
            </label>
            <label>
              <input v-model="settings.apiSource" type="radio" value="parent" />
              父窗口 API (使用酒馆配置)
            </label>
            <button class="major-action-button segmented-btn" @click="openSegmentedMemory">
              <i class="fas fa-brain"></i> 分段记忆
            </button>
          </div>

          <div v-if="settings.apiSource === 'custom'" class="custom-api-settings">
            <h5>自定义 API 配置</h5>
            <label for="summary-api-url">API URL:</label>
            <input
              id="summary-api-url"
              v-model="settings.customApi.url"
              type="text"
              placeholder="例如: https://api.openai.com/v1"
            />

            <label for="summary-api-key">API Key:</label>
            <input id="summary-api-key" v-model="settings.customApi.key" type="password" placeholder="sk-..." />

            <label for="summary-api-model">模型 (Model):</label>
            <input
              id="summary-api-model"
              v-model="settings.customApi.model"
              type="text"
              placeholder="例如: gpt-3.5-turbo"
            />
          </div>
        </div>

        <!-- 总结提示词 -->
        <div class="settings-section">
          <h5>总结提示词 (Prompt)</h5>
          <textarea
            v-model="settings.summaryPrompt"
            rows="6"
            placeholder="请总结以下冒险记录的要点，包括关键事件、重要NPC、获得的物品和完成的任务..."
          ></textarea>
        </div>

        <!-- 自动总结 -->
        <div class="settings-section">
          <h5>自动总结</h5>

          <div class="auto-summary-controls">
            <label class="checkbox-label">
              <input v-model="settings.autoSummary.enabled" type="checkbox" />
              <span>启用自动总结</span>
            </label>

            <div class="threshold-control">
              <label for="summary-threshold">当未总结消息达到此层数时触发 (推荐 20-50):</label>
              <input
                id="summary-threshold"
                v-model.number="settings.autoSummary.threshold"
                type="number"
                min="2"
                :disabled="!settings.autoSummary.enabled"
              />
            </div>
          </div>
        </div>

        <!-- 手动总结 -->
        <div class="settings-section">
          <h5>手动总结</h5>
          <p class="hint-text">选择历史记录范围进行手动总结，需要开启预设的总结功能并暂停剧情</p>
          <button class="major-action-button" @click="openManualSummary">
            <i class="fas fa-hand-paper"></i> 进行手动总结
          </button>
        </div>

        <!-- 按钮组 -->
        <div class="button-group">
          <button class="major-action-button save-btn" @click="saveAndClose">
            <i class="fas fa-save"></i> 保存设置
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 分段记忆弹窗 -->
  <div v-if="showSegmentedMemory" class="settings-overlay">
    <div class="settings-modal modal">
      <button class="modal-close-btn" @click="closeSegmentedMemory">&times;</button>
      <h4>分段记忆设置</h4>

      <div class="modal-content">
        <!-- 记忆管理 -->
        <div class="settings-section">
          <h5>记忆管理</h5>
          <div class="button-group">
            <button class="major-action-button" @click="viewSmallSummaries">
              <i class="fas fa-list"></i> 查看小总结
            </button>
            <button class="major-action-button" @click="viewLargeSummaries">
              <i class="fas fa-list-alt"></i> 查看大总结
            </button>
          </div>
        </div>

        <!-- 上下文发送策略 -->
        <div class="settings-section">
          <h5>上下文发送策略</h5>

          <label class="checkbox-label">
            <input v-model="settings.segmentedMemory.enabled" type="checkbox" />
            <span>启用分段记忆</span>
          </label>

          <p class="hint-text">
            启用后，将按以下规则分层发送上下文，并覆盖"AI上下文控制"中的层数限制。层数从最新的AI回复倒数计算。
          </p>

          <div class="segmented-controls">
            <label for="segmented-chat-layers">最新的 X 层发送完整聊天记录:</label>
            <input
              id="segmented-chat-layers"
              v-model.number="settings.segmentedMemory.chatLayers"
              type="number"
              min="0"
              :disabled="!settings.segmentedMemory.enabled"
            />

            <label for="segmented-large-summary-start">从倒数第 Y 层开始，只发送大总结 (Y &gt; X):</label>
            <input
              id="segmented-large-summary-start"
              v-model.number="settings.segmentedMemory.largeSummaryStart"
              type="number"
              min="0"
              :disabled="!settings.segmentedMemory.enabled"
            />
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group">
          <button class="major-action-button save-btn" @click="saveSegmentedMemory">
            <i class="fas fa-save"></i> 保存设置
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 手动总结弹窗 -->
  <div v-if="showManualSummary" class="settings-overlay">
    <div class="settings-modal modal">
      <button class="modal-close-btn" @click="closeManualSummary">&times;</button>
      <h4>手动总结</h4>

      <div class="modal-content">
        <div class="settings-section">
          <h5>选择要总结的记录范围</h5>

          <div class="range-controls">
            <label for="summary-start-layer">起始楼层:</label>
            <input id="summary-start-layer" v-model.number="manualSummaryRange.start" type="number" min="0" />

            <label for="summary-end-layer">结束楼层:</label>
            <input id="summary-end-layer" v-model.number="manualSummaryRange.end" type="number" min="0" />
          </div>

          <p class="hint-text">将为楼层 {{ manualSummaryRange.start }} 到 {{ manualSummaryRange.end }} 生成总结</p>
        </div>

        <div class="settings-section">
          <h5>总结预览</h5>
          <textarea
            v-model="manualSummaryContent"
            rows="8"
            placeholder="生成的总结将在此显示..."
            class="summary-preview"
          ></textarea>
        </div>

        <div class="button-group">
          <button class="major-action-button" :disabled="isGeneratingSummary" @click="generateSummary">
            <i class="fas fa-magic"></i> {{ isGeneratingSummary ? '生成中...' : '生成总结' }}
          </button>
          <button class="major-action-button save-btn" :disabled="!manualSummaryContent" @click="saveManualSummary">
            <i class="fas fa-save"></i> 保存总结
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { klona } from 'klona';
import { ref } from 'vue';
import { z } from 'zod';
import { useGameStore } from '../stores/gameStore';

const SummarySettingsSchema = z.object({
  apiSource: z.enum(['custom', 'parent']).default('parent'),
  customApi: z
    .object({
      url: z.string().default(''),
      key: z.string().default(''),
      model: z.string().default(''),
    })
    .default(() => ({ url: '', key: '', model: '' })),
  summaryPrompt: z
    .string()
    .default(
      '请总结以下 ADND 2E 冒险记录的要点，包括：\n1. 关键剧情事件\n2. 重要NPC和他们的关系\n3. 获得或失去的物品\n4. 完成的任务或目标\n5. 角色的成长和变化',
    ),
  autoSummary: z
    .object({
      enabled: z.boolean().default(false),
      threshold: z.number().min(2).default(30),
    })
    .default(() => ({ enabled: false, threshold: 30 })),
  segmentedMemory: z
    .object({
      enabled: z.boolean().default(false),
      chatLayers: z.number().min(0).default(10),
      largeSummaryStart: z.number().min(0).default(20),
    })
    .default(() => ({ enabled: false, chatLayers: 10, largeSummaryStart: 20 })),
});

type SummarySettings = z.infer<typeof SummarySettingsSchema>;

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const gameStore = useGameStore();
const settings = ref<SummarySettings>(loadSettings());
const showSegmentedMemory = ref(false);
const showManualSummary = ref(false);
const manualSummaryRange = ref({ start: 0, end: 10 });
const manualSummaryContent = ref('');
const isGeneratingSummary = ref(false);

// 从酒馆变量加载设置
function loadSettings(): SummarySettings {
  try {
    const vars = getVariables({ type: 'character' });
    const saved = vars?.adnd2e?.summarySettings;
    return SummarySettingsSchema.parse(saved || {});
  } catch (error) {
    console.warn('[SummarySettings] 加载设置失败，使用默认值:', error);
    return SummarySettingsSchema.parse({});
  }
}

// 保存设置到酒馆变量
function saveSettings() {
  try {
    const vars = getVariables({ type: 'character' });
    if (!vars?.adnd2e) {
      toastr.error('无法保存设置: 角色数据不存在');
      return false;
    }

    vars.adnd2e.summarySettings = klona(settings.value);
    replaceVariables(vars, { type: 'character' });

    console.log('[SummarySettings] 设置已保存');
    return true;
  } catch (error) {
    console.error('[SummarySettings] 保存设置失败:', error);
    toastr.error('保存设置失败');
    return false;
  }
}

function closeModal() {
  emit('close');
}

function saveAndClose() {
  if (saveSettings()) {
    toastr.success('总结设置已保存');
    emit('close');
  }
}

// 分段记忆
function openSegmentedMemory() {
  showSegmentedMemory.value = true;
}

function closeSegmentedMemory() {
  showSegmentedMemory.value = false;
}

function saveSegmentedMemory() {
  if (saveSettings()) {
    toastr.success('分段记忆设置已保存');
    showSegmentedMemory.value = false;
  }
}

function viewSmallSummaries() {
  // TODO: 实现查看小总结
  toastr.info('查看小总结功能开发中...');
}

function viewLargeSummaries() {
  // TODO: 实现查看大总结
  toastr.info('查看大总结功能开发中...');
}

// 手动总结
function openManualSummary() {
  showManualSummary.value = true;
  manualSummaryContent.value = '';

  // 使用游戏系统自己的消息存储
  try {
    const totalMessages = gameStore.messages.length;
    console.log('[SummarySettings] 当前消息总数:', totalMessages);

    if (totalMessages > 0) {
      // 消息索引从 0 开始，所以最后一条是 totalMessages - 1
      manualSummaryRange.value = {
        start: Math.max(0, totalMessages - 50),
        end: totalMessages - 1,
      };
    } else {
      manualSummaryRange.value = { start: 0, end: 0 };
      toastr.warning('当前没有消息可以总结');
    }
  } catch (error) {
    console.warn('[SummarySettings] 获取消息数量失败:', error);
  }
}

function closeManualSummary() {
  showManualSummary.value = false;
}

async function generateSummary() {
  isGeneratingSummary.value = true;
  try {
    console.log('[SummarySettings] 开始生成总结');

    const { start, end } = manualSummaryRange.value;
    console.log('[SummarySettings] 消息范围:', `${start}-${end}`);

    // 从游戏存储中获取指定范围的消息
    const allMessages = gameStore.messages;
    console.log('[SummarySettings] 总消息数:', allMessages.length);

    if (start < 0 || end >= allMessages.length || start > end) {
      toastr.warning(`消息范围无效: ${start}-${end} (总共 ${allMessages.length} 条)`);
      return;
    }

    // 切片获取范围内的消息（包含 start 和 end）
    const messages = allMessages.slice(start, end + 1);
    console.log('[SummarySettings] 获取到的消息数量:', messages.length);

    if (messages.length === 0) {
      toastr.warning('指定范围内没有消息');
      return;
    }

    // 构建上下文
    const context = messages
      .map(msg => {
        const roleName = msg.role === 'user' ? '玩家' : msg.role === 'assistant' ? 'DM' : '系统';
        const content = msg.content || '';
        return `[${roleName}${msg.name ? ` - ${msg.name}` : ''}]\n${content}`;
      })
      .join('\n\n---\n\n');

    console.log('[SummarySettings] 构建的上下文长度:', context.length);

    // 构建完整的请求文本
    const finalInstruction = `\n\n当前请暂停剧情扮演，进入总结模式，以上是需要总结的内容，（${settings.value.summaryPrompt}）`;
    const fullContent = context + finalInstruction;

    // 根据 API 源调用不同的方法
    let summaryResult;

    if (settings.value.apiSource === 'parent') {
      // 使用父窗口的 TavernHelper.generate
      console.log('[SummarySettings] 使用父窗口 API');

      if (
        window.parent &&
        (window.parent as any).TavernHelper &&
        typeof (window.parent as any).TavernHelper.generate === 'function'
      ) {
        const params = {
          user_input: fullContent,
          should_stream: false,
          disable_extras: true,
        };
        summaryResult = await (window.parent as any).TavernHelper.generate(params);
      } else {
        throw new Error('父窗口 TavernHelper 未找到');
      }
    } else {
      // 使用自定义 API
      console.log('[SummarySettings] 使用自定义 API');

      const { url, key, model } = settings.value.customApi;
      if (!url || !model) {
        throw new Error('自定义 API 配置不完整：请填写 API URL 和模型名称');
      }

      const apiUrl = url.endsWith('/chat/completions') ? url : `${url}/chat/completions`;
      console.log('[SummarySettings] API URL:', apiUrl);
      console.log('[SummarySettings] 模型:', model);
      console.log('[SummarySettings] 请求内容长度:', fullContent.length);

      const requestBody = {
        model: model,
        messages: [{ role: 'user', content: fullContent }],
      };

      console.log('[SummarySettings] 发送请求...');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[SummarySettings] 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        // 尝试读取错误响应并解析
        let errorMessage = `API 请求失败 (${response.status} ${response.statusText})`;
        try {
          const errorData = await response.json();
          errorMessage += `\n错误详情: ${errorData.error?.message || JSON.stringify(errorData)}`;
        } catch (parseError) {
          // 如果无法解析 JSON，尝试读取为文本
          try {
            const errorText = await response.text();
            errorMessage += `\n响应内容: ${errorText.substring(0, 200)}`;
          } catch (textError) {
            console.error('[SummarySettings] 无法读取错误响应:', textError);
          }
        }
        throw new Error(errorMessage);
      }

      // 直接尝试解析 JSON，不检查 Content-Type（某些 API 返回 text/plain 但内容是 JSON）
      const data = await response.json();
      console.log('[SummarySettings] API 响应成功');

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API 响应格式不正确，缺少 choices 或 message 字段');
      }

      summaryResult = data.choices[0].message.content;
    }

    manualSummaryContent.value = summaryResult?.trim() || '';
    console.log('[SummarySettings] 总结生成完成，长度:', manualSummaryContent.value.length);
    toastr.success('总结生成完成');
  } catch (error) {
    toastr.error('生成总结失败: ' + (error as Error).message);
    console.error('[SummarySettings] 生成总结失败:', error);
  } finally {
    isGeneratingSummary.value = false;
  }
}

function saveManualSummary() {
  if (!manualSummaryContent.value) {
    toastr.warning('总结内容为空');
    return;
  }

  try {
    // 保存总结到角色卡变量
    const vars = getVariables({ type: 'character' });
    if (!vars?.adnd2e) {
      toastr.error('无法保存总结: 角色数据不存在');
      return;
    }

    if (!vars.adnd2e.summaries) {
      vars.adnd2e.summaries = [];
    }

    vars.adnd2e.summaries.push({
      range: `${manualSummaryRange.value.start}-${manualSummaryRange.value.end}`,
      content: manualSummaryContent.value,
      timestamp: Date.now(),
    });

    replaceVariables(vars, { type: 'character' });

    toastr.success('总结已保存');
    showManualSummary.value = false;
  } catch (error) {
    toastr.error('保存总结失败');
    console.error('[SummarySettings] 保存总结失败:', error);
  }
}
</script>

<style lang="scss" scoped>
.settings-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
  padding: 20px;
  overflow: auto;
}

.settings-modal {
  background-color: #f5f5dc;
  border: 4px solid #000;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
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
    z-index: 1;
  }

  h4 {
    font-family: 'Times New Roman', serif;
    font-size: 22px;
    font-weight: bold;
    letter-spacing: 2px;
    margin: 0;
    padding: 15px 20px;
    text-transform: uppercase;
    text-align: center;
    background-color: #fff;
    border-bottom: 3px solid #000;
    position: relative;
    z-index: 2;
  }
}

.modal-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: 2px solid #000;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 3;

  &:hover {
    background-color: #000;
    color: #fff;
  }
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
}

.settings-section {
  background-color: #fff;
  border: 2px solid #000;
  padding: 15px;
  margin-bottom: 15px;

  h5 {
    font-family: 'Times New Roman', serif;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 1px;
    margin: 0 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #000;
    text-transform: uppercase;
  }

  textarea {
    width: 100%;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    padding: 10px;
    border: 2px solid #000;
    background-color: #f9f9f9;
    resize: vertical;

    &.summary-preview {
      background-color: #fffef5;
    }
  }

  label {
    font-family: 'Times New Roman', serif;
    font-size: 13px;
    font-weight: bold;
    display: block;
    margin-bottom: 6px;
  }

  input[type='text'],
  input[type='password'],
  input[type='number'] {
    width: 100%;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    padding: 8px 10px;
    border: 2px solid #000;
    background-color: #fff;
    margin-bottom: 10px;
  }
}

.hint-text {
  font-size: 12px;
  color: #666;
  margin: 10px 0;
  font-style: italic;
  line-height: 1.5;
}

.api-source-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    input[type='radio'] {
      width: 18px;
      height: 18px;
    }
  }

  .segmented-btn {
    margin-left: auto;
  }
}

.custom-api-settings {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px dashed #ccc;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 15px;

  input[type='checkbox'] {
    width: 20px;
    height: 20px;
  }

  span {
    font-family: 'Times New Roman', serif;
    font-size: 14px;
    font-weight: bold;
  }
}

.auto-summary-controls,
.segmented-controls,
.range-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.threshold-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.major-action-button {
  flex: 1;
  min-width: 150px;
  font-family: 'Times New Roman', serif;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 12px 18px;
  border: 3px solid #000;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    background-color: #000;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.save-btn:hover:not(:disabled) {
    background-color: #28a745;
    border-color: #28a745;
    color: #fff;
  }

  &.segmented-btn {
    flex: 0 0 auto;
    background-color: #e3f2fd;
    border-color: #2196f3;

    &:hover {
      background-color: #2196f3;
      border-color: #2196f3;
    }
  }

  i {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .settings-modal {
    width: 95%;
    max-width: 95%;
  }

  .api-source-controls {
    flex-direction: column;

    .segmented-btn {
      margin-left: 0;
    }
  }

  .button-group {
    flex-direction: column;

    .major-action-button {
      width: 100%;
    }
  }
}
</style>
