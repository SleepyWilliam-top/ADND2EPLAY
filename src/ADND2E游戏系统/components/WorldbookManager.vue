<template>
  <div v-if="visible" class="worldbook-manager-overlay">
    <div class="worldbook-manager-modal">
      <div class="modal-header">
        <h2><i class="fa-solid fa-book-atlas"></i> 世界书管理</h2>
        <button class="close-button" @click="closeModal">✕</button>
      </div>

      <div class="modal-content">
        <!-- 世界书选择 -->
        <div class="settings-section">
          <h4>世界书设置</h4>
          <div class="worldbook-selection">
            <label for="worldbook-select">当前角色卡绑定的世界书:</label>
            <div class="worldbook-select-group">
              <select id="worldbook-select" v-model="selectedWorldbookName">
                <option value="">-- 请先绑定世界书到角色卡 --</option>
                <option v-for="name in worldbookNames" :key="name" :value="name">
                  {{ name }}
                </option>
              </select>
              <button class="action-btn refresh-btn" title="刷新列表" @click="refreshWorldbookList">
                <i class="fa-solid fa-arrows-rotate"></i>
              </button>
            </div>
          </div>

          <!-- 绑定信息 -->
          <div v-if="selectedWorldbookName" class="binding-info">
            <p class="info-text">
              <i class="fa-solid fa-circle-info"></i>
              当前使用世界书: <strong>{{ selectedWorldbookName }}</strong>
            </p>
            <p class="hint-text">
              <i class="fa-solid fa-lightbulb"></i>
              此世界书已绑定到当前角色卡。如需更换或创建新世界书，请在酒馆的世界书管理器中操作。
            </p>
          </div>
          <div v-else class="binding-info warning">
            <p class="info-text">
              <i class="fa-solid fa-triangle-exclamation"></i>
              当前角色卡未绑定世界书
            </p>
            <p class="hint-text">请在酒馆中为当前角色卡绑定或创建世界书，然后刷新列表。</p>
          </div>
        </div>

        <!-- 同步设置 -->
        <div class="settings-section">
          <h4>同步设置</h4>

          <div class="sync-info-box">
            <i class="fa-solid fa-circle-info"></i>
            <p>
              <strong>数据来源：</strong><br />
              • <strong>分段正文</strong>：手动/自动总结生成的完整内容<br />
              <br />
              这些数据将从"总结 & 分段记忆设置"中保存的内容同步到世界书。<br />
              <br />
            </p>
          </div>

          <label class="checkbox-label">
            <input v-model="syncSettings.autoSync" type="checkbox" />
            <span>自动同步总结到世界书</span>
          </label>

          <label class="checkbox-label">
            <input v-model="syncSettings.syncSegmentedContent" type="checkbox" />
            <span>同步分段正文（手动/自动总结）</span>
          </label>

          <div class="sync-strategy">
            <label for="sync-strategy">同步策略:</label>
            <select id="sync-strategy" v-model="syncSettings.strategy">
              <option value="replace">替换同名条目</option>
              <option value="append">追加新条目</option>
              <option value="merge">合并内容</option>
            </select>
          </div>

          <div class="entry-settings">
            <h5>世界书条目设置</h5>

            <label for="entry-position">插入位置:</label>
            <select id="entry-position" v-model="entrySettings.position">
              <option value="before_character_definition">角色定义之前</option>
              <option value="after_character_definition">角色定义之后</option>
              <option value="before_example_messages">示例消息之前</option>
              <option value="after_example_messages">示例消息之后</option>
              <option value="before_author_note">作者注释之前</option>
              <option value="after_author_note">作者注释之后</option>
            </select>

            <label for="entry-scan-depth">扫描深度:</label>
            <input
              id="entry-scan-depth"
              v-model.number="entrySettings.scanDepth"
              type="number"
              min="1"
              placeholder="扫描最近几层消息"
            />
          </div>
        </div>

        <!-- 当前世界书条目 -->
        <div v-if="selectedWorldbookName" class="settings-section">
          <h4>
            当前世界书条目
            <span class="entry-count">({{ worldbookEntries.length }} 条)</span>
          </h4>

          <div class="entries-list">
            <div v-if="worldbookEntries.length === 0" class="empty-state">
              <i class="fa-solid fa-book-open"></i>
              <p>世界书为空，点击下方按钮同步总结</p>
            </div>

            <div v-for="entry in worldbookEntries" :key="entry.uid" class="entry-item">
              <div class="entry-header">
                <span class="entry-name">{{ entry.name || '(无标题)' }}</span>
                <span class="entry-status" :class="{ enabled: entry.enabled, disabled: !entry.enabled }">
                  {{ entry.enabled ? '启用' : '禁用' }}
                </span>
              </div>
              <div class="entry-content">{{ truncateContent(entry.content) }}</div>
              <div class="entry-actions">
                <button class="action-btn small" @click="toggleEntryEnabled(entry)">
                  <i :class="entry.enabled ? 'fa-solid fa-toggle-on' : 'fa-solid fa-toggle-off'"></i>
                </button>
                <button class="action-btn small delete-btn" @click="deleteEntry(entry)">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-section">
          <h4>操作</h4>
          <div class="button-group">
            <button class="major-action-btn" :disabled="!selectedWorldbookName || isSyncing" @click="syncNow">
              <i class="fa-solid fa-sync"></i>
              {{ isSyncing ? '同步中...' : '立即同步总结' }}
            </button>
          </div>
        </div>

        <!-- 保存设置 -->
        <div class="button-group">
          <button class="save-btn" @click="saveSettings">
            <i class="fa-solid fa-floppy-disk"></i>
            保存设置
          </button>
          <button class="cancel-btn" @click="closeModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { klona } from 'klona';
import { onMounted, ref, watch } from 'vue';
import { z } from 'zod';

// 定义 Props 和 Emits
const emit = defineEmits<{
  close: [];
}>();

defineProps<{
  visible: boolean;
}>();

// 世界书同步设置的 Schema
const WorldbookSyncSettingsSchema = z.object({
  worldbookName: z.string().default(''),
  autoSync: z.boolean().default(false),
  syncSegmentedContent: z.boolean().default(false), // 默认不同步分段正文，因为可能很长
  strategy: z.enum(['replace', 'append', 'merge']).default('replace'),
});

const WorldbookEntrySettingsSchema = z.object({
  position: z
    .enum([
      'before_character_definition',
      'after_character_definition',
      'before_example_messages',
      'after_example_messages',
      'before_author_note',
      'after_author_note',
    ])
    .default('after_character_definition'),
  scanDepth: z.number().min(1).default(4),
});

type WorldbookSyncSettings = z.infer<typeof WorldbookSyncSettingsSchema>;
type WorldbookEntrySettings = z.infer<typeof WorldbookEntrySettingsSchema>;

// 状态
const worldbookNames = ref<string[]>([]);
const selectedWorldbookName = ref<string>('');
const worldbookEntries = ref<WorldbookEntry[]>([]);
const isSyncing = ref(false);

// 设置
const syncSettings = ref<WorldbookSyncSettings>(WorldbookSyncSettingsSchema.parse({}));
const entrySettings = ref<WorldbookEntrySettings>(WorldbookEntrySettingsSchema.parse({}));

// 加载设置（从角色卡变量加载，避免使用 getScriptId）
function loadSettings() {
  try {
    const charVars = getVariables({ type: 'character' }) || {};
    const savedSettings = charVars.worldbookManager || {};

    if (savedSettings && typeof savedSettings === 'object') {
      if ('worldbookSync' in savedSettings) {
        syncSettings.value = WorldbookSyncSettingsSchema.parse(savedSettings.worldbookSync);
        selectedWorldbookName.value = syncSettings.value.worldbookName;
      }
      if ('worldbookEntrySettings' in savedSettings) {
        entrySettings.value = WorldbookEntrySettingsSchema.parse(savedSettings.worldbookEntrySettings);
      }
    }
  } catch (error) {
    console.error('[WorldbookManager] 加载设置失败:', error);
    // 静默失败，使用默认设置
  }
}

// 保存设置（保存到角色卡变量）
function saveSettings() {
  try {
    syncSettings.value.worldbookName = selectedWorldbookName.value;

    const charVars = getVariables({ type: 'character' }) || {};
    replaceVariables(
      {
        ...charVars,
        worldbookManager: {
          worldbookSync: klona(syncSettings.value),
          worldbookEntrySettings: klona(entrySettings.value),
        },
      },
      { type: 'character' },
    );

    toastr.success('世界书管理器设置已保存');
  } catch (error) {
    console.error('[WorldbookManager] 保存设置失败:', error);
    toastr.error('保存设置失败');
  }
}

// 刷新世界书列表并自动选择角色卡绑定的世界书
async function refreshWorldbookList() {
  try {
    worldbookNames.value = getWorldbookNames();

    // 自动获取当前角色卡绑定的世界书
    try {
      const charWorldbooks = getCharWorldbookNames('current');
      if (charWorldbooks.primary) {
        selectedWorldbookName.value = charWorldbooks.primary;
        toastr.success('已加载角色卡绑定的世界书');
      } else {
        toastr.info('当前角色卡未绑定主世界书');
      }
    } catch (error) {
      console.log('[WorldbookManager] 无法获取角色卡世界书绑定:', error);
    }
  } catch (error) {
    console.error('[WorldbookManager] 刷新世界书列表失败:', error);
    toastr.error('刷新失败');
  }
}

// 加载世界书条目
async function loadWorldbookEntries() {
  if (!selectedWorldbookName.value) {
    worldbookEntries.value = [];
    return;
  }

  try {
    const entries = await getWorldbook(selectedWorldbookName.value);
    worldbookEntries.value = entries;
  } catch (error) {
    console.error('[WorldbookManager] 加载世界书条目失败:', error);
    toastr.error('加载世界书失败');
    worldbookEntries.value = [];
  }
}

// 监听世界书选择变化
watch(selectedWorldbookName, async newName => {
  if (newName) {
    await loadWorldbookEntries();
  }
});

// 立即同步总结到世界书
async function syncNow() {
  if (!selectedWorldbookName.value) {
    toastr.warning('请先选择世界书');
    return;
  }

  isSyncing.value = true;
  try {
    // 从角色卡变量获取总结数据
    const characterVars = getVariables({ type: 'character' }) || {};
    const adnd2eData = characterVars.adnd2e || {};

    // 获取所有总结
    const allSummaries = (adnd2eData.summaries || []) as Array<{
      range: string;
      content: string;
      timestamp?: number;
      type?: 'manual' | 'auto' | 'small' | 'large';
    }>;

    // 使用固定的条目名称
    const FIXED_ENTRY_NAME = '分段正文';

    const entriesToUpdate: { name: string; content: string; extra: any }[] = [];

    // 同步分段正文（手动/自动总结）
    if (syncSettings.value.syncSegmentedContent) {
      const segmentedContent = allSummaries.filter(s => s.type === 'manual' || s.type === 'auto');
      if (segmentedContent.length > 0) {
        const content = segmentedContent
          .map((s, idx) => {
            const timestamp = s.timestamp ? new Date(s.timestamp).toLocaleString('zh-CN') : '';
            const typeLabel = s.type === 'manual' ? '【手动】' : '【自动】';
            return `${typeLabel}【${idx + 1}】楼层 ${s.range}${timestamp ? ` (${timestamp})` : ''}\n${s.content}`;
          })
          .join('\n\n---\n\n');

        entriesToUpdate.push({
          name: FIXED_ENTRY_NAME,
          content,
          extra: {
            source: 'summary',
            summary_type: 'content',
            count: segmentedContent.length,
            synced_at: new Date().toISOString(),
          },
        });
      }
    }

    if (entriesToUpdate.length === 0) {
      toastr.info('没有找到可同步的总结数据');
      return;
    }

    // 使用 updateWorldbookWith 更新或创建固定的三个条目
    await updateWorldbookWith(selectedWorldbookName.value, worldbook => {
      const updatedWorldbook = [...worldbook];

      for (const entryData of entriesToUpdate) {
        // 查找同名条目
        const existingIndex = updatedWorldbook.findIndex(e => e.name === entryData.name);

        if (existingIndex >= 0) {
          // 更新现有条目
          updatedWorldbook[existingIndex] = {
            ...updatedWorldbook[existingIndex],
            content: entryData.content,
            extra: {
              ...updatedWorldbook[existingIndex].extra,
              ...entryData.extra,
            },
          };
        } else {
          // 创建新条目
          updatedWorldbook.push({
            name: entryData.name,
            content: entryData.content,
            enabled: true,
            strategy: {
              type: 'constant' as const,
              keys: [],
              keys_secondary: { logic: 'and_any' as const, keys: [] },
              scan_depth: entrySettings.value.scanDepth,
            },
            position: {
              type: entrySettings.value.position as any,
              role: 'system' as const,
              depth: 0,
              order: 0,
            },
            probability: 100,
            recursion: {
              prevent_incoming: false,
              prevent_outgoing: false,
              delay_until: null,
            },
            effect: {
              sticky: null,
              cooldown: null,
              delay: null,
            },
            extra: entryData.extra,
          } as any);
        }
      }

      return updatedWorldbook;
    });

    await loadWorldbookEntries();
    toastr.success(`成功同步分段正文到世界书`);
  } catch (error) {
    console.error('[WorldbookManager] 同步失败:', error);
    toastr.error('同步失败');
  } finally {
    isSyncing.value = false;
  }
}

// 切换条目启用状态
async function toggleEntryEnabled(entry: WorldbookEntry) {
  try {
    await updateWorldbookWith(selectedWorldbookName.value, worldbook => {
      return worldbook.map(e => (e.uid === entry.uid ? { ...e, enabled: !e.enabled } : e));
    });
    await loadWorldbookEntries();
    toastr.success('条目状态已更新');
  } catch (error) {
    console.error('[WorldbookManager] 更新条目失败:', error);
    toastr.error('更新失败');
  }
}

// 删除条目
async function deleteEntry(entry: WorldbookEntry) {
  if (!confirm(`确定要删除条目 "${entry.name || '(无标题)'}" 吗？`)) {
    return;
  }

  try {
    await deleteWorldbookEntries(selectedWorldbookName.value, e => e.uid === entry.uid);
    await loadWorldbookEntries();
    toastr.success('条目已删除');
  } catch (error) {
    console.error('[WorldbookManager] 删除条目失败:', error);
    toastr.error('删除失败');
  }
}

// 截断内容用于显示
function truncateContent(content: string, maxLength: number = 100): string {
  if (!content) return '(无内容)';
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

// 关闭模态框
function closeModal() {
  emit('close');
}

// 暴露同步函数供外部调用
defineExpose({
  syncNow,
});

// 组件挂载时加载数据
onMounted(async () => {
  loadSettings();
  await refreshWorldbookList();
});
</script>

<style lang="scss" scoped>
.worldbook-manager-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
}

.worldbook-manager-modal {
  background: #fff;
  border: 3px solid #000;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  font-family: '临海体', serif;
}

.modal-header {
  background: #000;
  color: #fff;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #000;

  h2 {
    font-family: '临海体', serif;
    font-size: 24px;
    font-weight: bold;
    margin: 0;

    i {
      margin-right: 10px;
    }
  }

  .close-button {
    background: none;
    border: none;
    color: #fff;
    font-size: 32px;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.modal-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.settings-section {
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 2px solid #ddd;

  &:last-child {
    border-bottom: none;
  }

  h4 {
    font-family: '临海体', serif;
    font-size: 20px;
    font-weight: bold;
    margin: 0 0 15px 0;
  }

  h5 {
    font-family: '临海体', serif;
    font-size: 16px;
    font-weight: bold;
    margin: 15px 0 10px 0;
  }
}

.worldbook-selection {
  label {
    display: block;
    font-family: '临海体', serif;
    font-weight: bold;
    margin-bottom: 8px;
  }
}

.worldbook-select-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;

  select {
    flex: 1;
    padding: 10px;
    border: 2px solid #000;
    background: #fff;
    font-family: '临海体', serif;
    font-size: 16px;

    &:focus {
      outline: none;
      background: #f9f9f9;
    }
  }
}

.action-btn {
  padding: 10px 15px;
  border: 2px solid #000;
  background: #fff;
  font-family: '临海体', serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #fff;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.small {
    padding: 5px 10px;
    font-size: 12px;
  }

  &.delete-btn {
    background: #d9534f;
    color: #fff;
    border-color: #d9534f;

    &:hover:not(:disabled) {
      background: #c9302c;
    }
  }

  &.refresh-btn {
    background: #5bc0de;
    color: #fff;
    border-color: #5bc0de;

    &:hover:not(:disabled) {
      background: #46b8da;
    }
  }

  &.cancel-btn {
    background: #777;
    color: #fff;
    border-color: #777;

    &:hover:not(:disabled) {
      background: #666;
    }
  }
}

.binding-info {
  margin-top: 15px;
  padding: 15px;
  background: #e7f3ff;
  border: 2px solid #4682b4;

  &.warning {
    background: #fff3cd;
    border-color: #ffc107;
  }

  .info-text {
    font-family: '临海体', serif;
    margin: 0 0 10px 0;

    i {
      margin-right: 5px;
    }

    strong {
      color: #4682b4;
    }
  }

  .hint-text {
    font-family: '临海体', serif;
    font-size: 14px;
    color: #666;
    margin: 0;

    i {
      margin-right: 5px;
    }
  }
}

.sync-info-box {
  background: #e7f3ff;
  border: 2px solid #4682b4;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: flex-start;

  i {
    color: #4682b4;
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #333;

    strong {
      color: #4682b4;
    }
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-family: '临海体', serif;
  cursor: pointer;

  input[type='checkbox'] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
}

.sync-strategy,
.entry-settings {
  margin-top: 15px;

  label {
    display: block;
    font-family: '临海体', serif;
    font-weight: bold;
    margin: 10px 0 5px 0;
  }

  select,
  input {
    width: 100%;
    padding: 10px;
    border: 2px solid #000;
    background: #fff;
    font-family: '临海体', serif;
    font-size: 16px;

    &:focus {
      outline: none;
      background: #f9f9f9;
    }
  }
}

.entries-list {
  max-height: 400px;
  overflow-y: auto;
  border: 2px solid #000;
  padding: 10px;
  background: #fafafa;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;

  i {
    font-size: 48px;
    margin-bottom: 15px;
    display: block;
  }

  p {
    font-family: '临海体', serif;
    font-size: 16px;
  }
}

.entry-item {
  background: #fff;
  border: 2px solid #000;
  padding: 15px;
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  .entry-name {
    font-family: '临海体', serif;
    font-weight: bold;
    font-size: 16px;
  }

  .entry-status {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;

    &.enabled {
      background: #5cb85c;
      color: #fff;
    }

    &.disabled {
      background: #d9534f;
      color: #fff;
    }
  }
}

.entry-content {
  font-family: '临海体', serif;
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.6;
}

.entry-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.entry-count {
  font-size: 16px;
  color: #666;
  font-weight: normal;
}

.action-section {
  margin: 25px 0;
}

.major-action-btn {
  padding: 12px 24px;
  border: 3px solid #000;
  background: #fff;
  font-family: '临海体', serif;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  i {
    margin-right: 8px;
  }

  &:hover:not(:disabled) {
    background: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.danger-btn {
    background: #d9534f;
    color: #fff;
    border-color: #d9534f;

    &:hover:not(:disabled) {
      background: #c9302c;
    }
  }
}

.button-group {
  display: flex;
  gap: 15px;
  margin-top: 20px;

  button {
    flex: 1;
  }
}

.save-btn {
  padding: 12px 24px;
  border: 3px solid #000;
  background: #5cb85c;
  color: #fff;
  font-family: '临海体', serif;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  i {
    margin-right: 8px;
  }

  &:hover {
    background: #4cae4c;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

.cancel-btn {
  padding: 12px 24px;
  border: 3px solid #000;
  background: #fff;
  font-family: '临海体', serif;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fff;
    transform: translateY(-2px);
  }
}
</style>
