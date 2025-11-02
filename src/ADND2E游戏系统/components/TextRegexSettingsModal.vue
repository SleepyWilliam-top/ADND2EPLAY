<template>
  <div v-if="visible" class="settings-overlay">
    <div class="settings-modal modal">
      <button class="modal-close-btn" @click="closeModal">&times;</button>
      <h4>正文与正则设置</h4>

      <div class="modal-content">
        <!-- 显示设置 -->
        <div class="settings-section">
          <h5>显示设置</h5>
          <div class="font-settings-controls">
            <label for="content-font-size">字体大小:</label>
            <div class="range-control">
              <input
                id="content-font-size"
                v-model.number="settings.contentFontSize"
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
              />
              <span class="range-value">{{ settings.contentFontSize.toFixed(2) }}</span>
            </div>

            <label for="content-font-color">字体颜色:</label>
            <input id="content-font-color" v-model="settings.contentFontColor" type="color" />

            <label for="chat-font-family">聊天字体:</label>
            <select id="chat-font-family" v-model="settings.chatFontFamily">
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
            </select>

            <label for="content-render-limit">显示楼层数量:</label>
            <input
              id="content-render-limit"
              v-model.number="settings.contentRenderLimit"
              type="number"
              min="10"
              placeholder="100"
            />
          </div>
        </div>

        <!-- AI 上下文控制 -->
        <div class="settings-section">
          <h5>AI 上下文控制</h5>

          <div class="context-control-item">
            <label for="context-limit">发送最近消息层数:</label>
            <input id="context-limit" v-model.number="settings.contextLimit" type="number" min="1" placeholder="全部" />
          </div>

          <div class="context-control-item">
            <input id="auto-hide-summarized" v-model="settings.autoHideSummarized" type="checkbox" />
            <label for="auto-hide-summarized">自动隐藏已总结内容 (优先)</label>
          </div>

          <div class="context-control-item">
            <label for="fixed-hide-range">固定隐藏范围:</label>
            <input id="fixed-hide-range" v-model="settings.fixedHideRange" type="text" placeholder="例如: 5-10" />
          </div>

          <div class="context-control-item">
            <input id="enable-streaming" v-model="settings.enableStreaming" type="checkbox" />
            <label for="enable-streaming">启用流式传输</label>
          </div>
        </div>

        <!-- 正则规则 -->
        <div class="settings-section">
          <h5>正则替换规则</h5>
          <p class="hint-text">使用正则表达式处理AI输出，实现命令解析、格式优化等功能</p>

          <div class="regex-rules-list">
            <div v-for="(rule, index) in settings.regexRules" :key="index" class="regex-rule-item">
              <div class="rule-header">
                <input v-model="rule.name" type="text" placeholder="规则名称" class="rule-name-input" />
                <button class="delete-rule-btn" @click="deleteRegexRule(index)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              <div class="rule-content">
                <input v-model="rule.pattern" type="text" placeholder="正则表达式 (如: /pattern/gi)" />
                <input v-model="rule.replacement" type="text" placeholder="替换为 (可使用 $1, $2...)" />
              </div>
              <div class="rule-options">
                <label>
                  <input v-model="rule.enabled" type="checkbox" />
                  启用
                </label>
              </div>
            </div>

            <div v-if="settings.regexRules.length === 0" class="empty-hint">暂无正则规则</div>
          </div>

          <div class="rule-buttons-group">
            <button class="major-action-button add-rule-btn" @click="addRegexRule">
              <i class="fas fa-plus"></i> 新增规则
            </button>
            <button class="major-action-button import-rules-btn" @click="importRegexRules">
              <i class="fas fa-file-import"></i> 导入正则规则
            </button>
            <button class="major-action-button export-rules-btn" @click="exportRegexRules">
              <i class="fas fa-file-export"></i> 导出正则规则
            </button>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group">
          <button class="major-action-button" @click="importSettings">
            <i class="fas fa-download"></i> 导入所有设置
          </button>
          <button class="major-action-button" @click="exportSettings">
            <i class="fas fa-upload"></i> 导出所有设置
          </button>
          <button class="major-action-button save-btn" @click="saveAndClose">
            <i class="fas fa-save"></i> 保存并关闭
          </button>
        </div>
      </div>

      <input ref="importInput" type="file" accept=".json" style="display: none" @change="handleImport" />
      <input ref="importRulesInput" type="file" accept=".json" style="display: none" @change="handleImportRules" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { klona } from 'klona';
import { ref, watch } from 'vue';
import { z } from 'zod';

const RegexRuleSchema = z.object({
  name: z.string().default(''),
  pattern: z.string().default(''),
  replacement: z.string().default(''),
  enabled: z.boolean().default(true),
});

const TextRegexSettingsSchema = z.object({
  contentFontSize: z.number().min(0.8).max(1.5).default(1),
  contentFontColor: z.string().default('#000000'),
  chatFontFamily: z.string().default("'Times New Roman', serif"),
  contentRenderLimit: z.number().min(10).default(100),
  contextLimit: z.number().min(1).nullable().default(null),
  autoHideSummarized: z.boolean().default(false),
  fixedHideRange: z.string().default(''),
  enableStreaming: z.boolean().default(true),
  regexRules: z.array(RegexRuleSchema).default([]),
});

type TextRegexSettings = z.infer<typeof TextRegexSettingsSchema>;

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const settings = ref<TextRegexSettings>(loadSettings());
const importInput = ref<HTMLInputElement | null>(null);
const importRulesInput = ref<HTMLInputElement | null>(null);

// 从酒馆变量加载设置
function loadSettings(): TextRegexSettings {
  try {
    const vars = getVariables({ type: 'character' });
    const saved = vars?.adnd2e?.textRegexSettings;
    return TextRegexSettingsSchema.parse(saved || {});
  } catch (error) {
    console.warn('[TextRegexSettings] 加载设置失败，使用默认值:', error);
    return TextRegexSettingsSchema.parse({});
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

    vars.adnd2e.textRegexSettings = klona(settings.value);
    replaceVariables(vars, { type: 'character' });

    console.log('[TextRegexSettings] 设置已保存');
    return true;
  } catch (error) {
    console.error('[TextRegexSettings] 保存设置失败:', error);
    toastr.error('保存设置失败');
    return false;
  }
}

// 应用字体设置到页面
watch(
  () => settings.value.contentFontSize,
  size => {
    document.documentElement.style.setProperty('--message-font-size', `${size}em`);
  },
);

watch(
  () => settings.value.contentFontColor,
  color => {
    document.documentElement.style.setProperty('--message-font-color', color);
  },
);

watch(
  () => settings.value.chatFontFamily,
  family => {
    document.documentElement.style.setProperty('--message-font-family', family);
  },
);

function closeModal() {
  emit('close');
}

function saveAndClose() {
  if (saveSettings()) {
    toastr.success('正文与正则设置已保存');
    emit('close');
  }
}

// 正则规则管理
function addRegexRule() {
  settings.value.regexRules.push({
    name: '新规则',
    pattern: '',
    replacement: '',
    enabled: true,
  });
}

function deleteRegexRule(index: number) {
  if (confirm('确定要删除这条规则吗？')) {
    settings.value.regexRules.splice(index, 1);
  }
}

// 导入导出
function importSettings() {
  importInput.value?.click();
}

function handleImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const json = JSON.parse(e.target?.result as string);

      // 使用 zod 的 parse 方法，它会自动填充缺失的默认值
      const parsed = TextRegexSettingsSchema.parse(json);

      // 如果有正则规则，确保它们都是有效的
      if (parsed.regexRules && Array.isArray(parsed.regexRules)) {
        parsed.regexRules = parsed.regexRules.map(rule => {
          return {
            name: rule.name || '未命名规则',
            pattern: rule.pattern || '',
            replacement: rule.replacement || '',
            enabled: rule.enabled !== undefined ? rule.enabled : true,
          };
        });
      }

      settings.value = parsed;
      toastr.success(`设置导入成功，包含 ${parsed.regexRules?.length || 0} 条正则规则`);
    } catch (error) {
      toastr.error('导入失败: 文件格式错误');
      console.error('[TextRegexSettings] 导入失败:', error);

      // 显示详细错误信息（如果是 zod 错误）
      if (error instanceof Error) {
        console.error('[TextRegexSettings] 错误详情:', error.message);
      }
    }
  };
  reader.readAsText(file);
  target.value = '';
}

function exportSettings() {
  try {
    const json = JSON.stringify(klona(settings.value), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adnd2e-text-regex-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastr.success('设置导出成功');
  } catch (error) {
    toastr.error('导出失败');
    console.error('[TextRegexSettings] 导出失败:', error);
  }
}

// ========== 单独的正则规则导入导出 ==========

// 导入正则规则（仅正则规则）
function importRegexRules() {
  importRulesInput.value?.click();
}

function handleImportRules(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const json = JSON.parse(e.target?.result as string);

      // 处理不同的导入格式
      let rulesArray = [];

      // 情况1：完整的 regexConfig 对象（lucklyjkop 格式，包含 rules 或 chainRules）
      if (typeof json === 'object' && !Array.isArray(json)) {
        if (json.rules && Array.isArray(json.rules)) {
          rulesArray = json.rules;
          console.log('[TextRegexSettings] 检测到 lucklyjkop 完整配置对象，导入 rules');
        } else if (json.chainRules && Array.isArray(json.chainRules)) {
          rulesArray = json.chainRules;
          console.log('[TextRegexSettings] 检测到 lucklyjkop 完整配置对象，导入 chainRules');
        } else if (
          json.scriptName !== undefined ||
          json.findRegex !== undefined ||
          json.script_name !== undefined ||
          json.find_regex !== undefined ||
          json.name !== undefined ||
          json.pattern !== undefined
        ) {
          // 情况2：单个规则对象（直接包装成数组）
          rulesArray = [json];
          console.log('[TextRegexSettings] 检测到单个规则对象');
        } else {
          toastr.error('文件格式错误：无法识别的格式');
          return;
        }
      }
      // 情况3：直接的规则数组
      else if (Array.isArray(json)) {
        rulesArray = json;
      }
      // 情况4：其他格式
      else {
        toastr.error('文件格式错误：无法解析');
        return;
      }

      // 验证数组不为空
      if (rulesArray.length === 0) {
        toastr.warning('文件中没有正则规则');
        return;
      }

      // 检测格式类型
      let formatType = 'unknown';
      if (rulesArray.length > 0) {
        const first = rulesArray[0];
        if (first.scriptName !== undefined && first.findRegex !== undefined) {
          formatType = 'lucklyjkop'; // lucklyjkop 格式
        } else if (first.script_name !== undefined && first.find_regex !== undefined) {
          formatType = 'tavern'; // 酒馆原生格式
        } else if (first.name !== undefined && first.pattern !== undefined) {
          formatType = 'local'; // 本系统格式
        }
      }

      // 解析并标准化每条规则
      const importedRules = rulesArray
        .map((rule: any, index: number) => {
          try {
            let result;

            // 根据格式类型解析
            if (formatType === 'lucklyjkop') {
              // lucklyjkop 格式
              result = {
                name: rule.scriptName || `导入规则 ${index + 1}`,
                pattern: rule.findRegex || '',
                replacement: rule.replaceString || '',
                enabled: !rule.disabled, // 注意：lucklyjkop 用 disabled 而不是 enabled
              };
            } else if (formatType === 'tavern') {
              // 酒馆原生格式
              result = {
                name: rule.script_name || `导入规则 ${index + 1}`,
                pattern: rule.find_regex || '',
                replacement: rule.replace_string || '',
                enabled: rule.enabled !== undefined ? rule.enabled : true,
              };
            } else {
              // 本系统格式或尝试 zod 解析
              const parsed = RegexRuleSchema.parse(rule);
              result = {
                name: parsed.name || `导入规则 ${index + 1}`,
                pattern: parsed.pattern || '',
                replacement: parsed.replacement || '',
                enabled: parsed.enabled !== undefined ? parsed.enabled : true,
              };
            }

            return result;
          } catch (error) {
            console.warn(`[TextRegexSettings] 规则 ${index + 1} 解析失败:`, error);
            // 容错处理：尝试手动构建
            if (formatType === 'lucklyjkop') {
              return {
                name: rule.scriptName || `导入规则 ${index + 1}`,
                pattern: rule.findRegex || '',
                replacement: rule.replaceString || '',
                enabled: !rule.disabled,
              };
            } else if (formatType === 'tavern') {
              return {
                name: rule.script_name || `导入规则 ${index + 1}`,
                pattern: rule.find_regex || '',
                replacement: rule.replace_string || '',
                enabled: rule.enabled !== undefined ? rule.enabled : true,
              };
            } else {
              return {
                name: rule.name || `导入规则 ${index + 1}`,
                pattern: rule.pattern || '',
                replacement: rule.replacement || '',
                enabled: rule.enabled !== undefined ? rule.enabled : true,
              };
            }
          }
        })
        .filter((rule: any) => rule.pattern); // 过滤掉没有 pattern 的规则

      if (importedRules.length === 0) {
        toastr.warning('文件中没有有效的正则规则');
        return;
      }

      // 询问是替换还是追加
      const shouldReplace = confirm(
        `检测到 ${importedRules.length} 条正则规则。\n\n` +
          `点击"确定"：替换现有规则\n` +
          `点击"取消"：追加到现有规则后`,
      );

      if (shouldReplace) {
        settings.value.regexRules = importedRules;
        toastr.success(`已替换为 ${importedRules.length} 条正则规则`);
      } else {
        settings.value.regexRules.push(...importedRules);
        toastr.success(`已追加 ${importedRules.length} 条正则规则`);
      }

      console.log('[TextRegexSettings] 正则规则导入成功:', importedRules);
      
      // 自动保存导入的规则
      if (saveSettings()) {
        console.log('[TextRegexSettings] 正则规则已自动保存到角色变量');
      } else {
        toastr.warning('规则导入成功但保存失败，请手动点击"保存并关闭"');
      }
    } catch (error) {
      toastr.error('导入失败：文件格式错误');
      console.error('[TextRegexSettings] 正则规则导入失败:', error);

      if (error instanceof Error) {
        console.error('[TextRegexSettings] 错误详情:', error.message);
      }
    }
  };
  reader.readAsText(file);
  target.value = '';
}

// 导出正则规则（仅正则规则）
function exportRegexRules() {
  try {
    if (settings.value.regexRules.length === 0) {
      toastr.warning('当前没有正则规则可导出');
      return;
    }

    const json = JSON.stringify(klona(settings.value.regexRules), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adnd2e-regex-rules-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastr.success(`已导出 ${settings.value.regexRules.length} 条正则规则`);
  } catch (error) {
    toastr.error('导出失败');
    console.error('[TextRegexSettings] 导出正则规则失败:', error);
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
    cursor: move;
    user-select: none;
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
}

.hint-text {
  font-size: 12px;
  color: #666;
  margin: 0 0 10px 0;
  font-style: italic;
}

.font-settings-controls {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px 15px;
  align-items: center;

  label {
    font-family: 'Times New Roman', serif;
    font-size: 13px;
    font-weight: bold;
  }

  input[type='color'] {
    width: 60px;
    height: 35px;
    border: 2px solid #000;
    cursor: pointer;
  }

  select,
  input[type='number'] {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    padding: 6px 10px;
    border: 2px solid #000;
    background-color: #fff;
  }
}

.range-control {
  display: flex;
  align-items: center;
  gap: 10px;

  input[type='range'] {
    flex: 1;
  }

  .range-value {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    font-weight: bold;
    min-width: 50px;
    text-align: right;
  }
}

.context-control-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;

  label {
    font-family: 'Times New Roman', serif;
    font-size: 13px;
    font-weight: bold;
  }

  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  input[type='text'],
  input[type='number'] {
    flex: 1;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    padding: 6px 10px;
    border: 2px solid #000;
    background-color: #fff;
  }
}

.regex-rules-list {
  margin-bottom: 15px;
}

.regex-rule-item {
  background-color: #f9f9f9;
  border: 2px solid #000;
  padding: 12px;
  margin-bottom: 10px;

  .rule-header {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;

    .rule-name-input {
      flex: 1;
      font-family: 'Times New Roman', serif;
      font-size: 14px;
      font-weight: bold;
      padding: 6px 10px;
      border: 2px solid #000;
      background-color: #fff;
    }

    .delete-rule-btn {
      width: 35px;
      height: 35px;
      border: 2px solid #dc3545;
      background-color: #fff;
      color: #dc3545;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background-color: #dc3545;
        color: #fff;
      }
    }
  }

  .rule-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;

    input {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 6px 10px;
      border: 2px solid #000;
      background-color: #fff;
    }
  }

  .rule-options {
    display: flex;
    gap: 15px;

    label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      cursor: pointer;

      input[type='checkbox'] {
        width: 16px;
        height: 16px;
      }
    }
  }
}

.empty-hint {
  text-align: center;
  padding: 30px;
  color: #999;
  font-style: italic;
  border: 2px dashed #ccc;
  background-color: #fafafa;
}

.rule-buttons-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  .major-action-button {
    flex: 1;
    min-width: 150px;
  }
}

.add-rule-btn {
  &:hover {
    background-color: #28a745 !important;
    border-color: #28a745 !important;
    color: #fff !important;
  }
}

.import-rules-btn {
  &:hover {
    background-color: #17a2b8 !important;
    border-color: #17a2b8 !important;
    color: #fff !important;
  }
}

.export-rules-btn {
  &:hover {
    background-color: #ffc107 !important;
    border-color: #ffc107 !important;
    color: #000 !important;
  }
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

  &:hover {
    background-color: #000;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &.save-btn:hover {
    background-color: #28a745;
    border-color: #28a745;
    color: #fff;
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

  .font-settings-controls {
    grid-template-columns: 1fr;

    label {
      margin-top: 5px;
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
