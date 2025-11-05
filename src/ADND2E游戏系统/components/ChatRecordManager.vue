<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <h2>聊天记录</h2>
        <div class="header-controls">
          <input
            v-model.number="chapterSize"
            type="number"
            min="1"
            max="50"
            class="chapter-size-input"
            title="每章消息数"
          />
          <span class="input-label">条/章</span>
        </div>
        <button class="close-button" @click="close">✕</button>
      </div>

      <!-- 章节导航栏 -->
      <div v-if="chapters.length > 0" class="chapter-nav">
        <div class="display-mode-toggle">
          <label class="radio-label">
            <input v-model="displayMode" type="radio" value="single" />
            <span>单章节</span>
          </label>
          <label class="radio-label">
            <input v-model="displayMode" type="radio" value="continuous" />
            <span>连贯模式</span>
          </label>
        </div>

        <div v-if="displayMode === 'single'" class="chapter-selector">
          <button class="nav-btn" :disabled="currentChapter === 0" @click="prevChapter">
            <i class="fas fa-chevron-left"></i>
          </button>
          <select v-model.number="currentChapter" class="chapter-select">
            <option v-for="(chapter, index) in chapters" :key="index" :value="index">
              第{{ index + 1 }}章 ({{ chapter.start + 1 }}-{{ chapter.end + 1 }}条)
            </option>
          </select>
          <button class="nav-btn" :disabled="currentChapter === chapters.length - 1" @click="nextChapter">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <button class="bookmark-btn" @click="toggleBookmark">
          <i :class="isCurrentBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
          <span>{{ isCurrentBookmarked ? '已收藏' : '收藏' }}</span>
        </button>
      </div>

      <!-- 主内容区 -->
      <div class="modal-body" :class="{ 'continuous-mode': displayMode === 'continuous' }">
        <!-- 单章节模式 -->
        <div v-if="displayMode === 'single' && chapters.length > 0" class="single-chapter-view">
          <div class="chapter-header">
            <h3>第{{ currentChapter + 1 }}章</h3>
            <p class="chapter-range">
              消息 {{ chapters[currentChapter].start + 1 }} - {{ chapters[currentChapter].end + 1 }}
            </p>
          </div>

          <div class="chapter-content">
            <div
              v-for="(message, idx) in getCurrentChapterMessages()"
              :key="chapters[currentChapter].start + idx"
              class="message-item"
              :class="`message-${message.role}`"
            >
              <div class="message-header">
                <span class="message-role">{{ getRoleLabel(message.role) }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <span class="message-index">#{{ chapters[currentChapter].start + idx + 1 }}</span>
                <span v-if="message.stateSnapshot" class="snapshot-badge" title="此消息包含状态快照（删除时可回溯）">
                  <i class="fas fa-bookmark"></i>
                </span>
                <div class="message-actions">
                  <button
                    class="message-action-btn edit-btn"
                    title="编辑"
                    @click="editMessage(chapters[currentChapter].start + idx)"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="message-action-btn delete-btn"
                    title="删除（会自动回溯游戏状态）"
                    @click="deleteMessage(chapters[currentChapter].start + idx)"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
              <div class="message-content" v-html="formatMessage(message.content)"></div>
            </div>
          </div>
        </div>

        <!-- 连贯模式 -->
        <div v-else-if="displayMode === 'continuous' && chapters.length > 0" class="continuous-view">
          <div v-for="(chapter, chapterIdx) in chapters" :key="chapterIdx" class="chapter-block">
            <div :id="`chapter-anchor-${chapterIdx}`" class="chapter-anchor"></div>
            <div class="chapter-divider">
              <div class="divider-content">
                <div class="divider-icon">✦</div>
                <div class="chapter-title">第{{ chapterIdx + 1 }}章</div>
                <div class="chapter-info">{{ chapter.start + 1 }} - {{ chapter.end + 1 }}条</div>
                <div class="divider-icon">✦</div>
              </div>
            </div>

            <div class="chapter-messages">
              <div
                v-for="(message, idx) in getChapterMessages(chapterIdx)"
                :key="chapter.start + idx"
                class="message-item"
                :class="`message-${message.role}`"
              >
                <div class="message-header">
                  <span class="message-role">{{ getRoleLabel(message.role) }}</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                  <span class="message-index">#{{ chapter.start + idx + 1 }}</span>
                  <span v-if="message.stateSnapshot" class="snapshot-badge" title="此消息包含状态快照（删除时可回溯）">
                    <i class="fas fa-bookmark"></i>
                  </span>
                  <div class="message-actions">
                    <button class="message-action-btn edit-btn" title="编辑" @click="editMessage(chapter.start + idx)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="message-action-btn delete-btn"
                      title="删除（会自动回溯游戏状态）"
                      @click="deleteMessage(chapter.start + idx)"
                    >
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
                <div class="message-content" v-html="formatMessage(message.content)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无聊天记录</p>
          <p class="hint">开始游戏后，聊天记录将显示在这里</p>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div v-if="chapters.length > 0" class="modal-footer">
        <div class="footer-stats">
          <span>共 {{ totalMessages }} 条消息</span>
          <span>分 {{ chapters.length }} 章</span>
          <span v-if="bookmarks.length > 0">{{ bookmarks.length }} 个书签</span>
        </div>
        <div class="footer-actions">
          <button class="footer-btn" @click="showBookmarks">
            <i class="far fa-bookmark"></i>
            <span>书签列表</span>
          </button>
          <button class="footer-btn danger" @click="clearAllMessages">
            <i class="fas fa-trash-alt"></i>
            <span>清空记录</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 书签列表弹窗 -->
  <div v-if="showBookmarkModal" class="modal-overlay" @click.self="showBookmarkModal = false">
    <div class="bookmark-modal">
      <div class="modal-header">
        <h3>书签列表</h3>
        <button class="close-button" @click="showBookmarkModal = false">✕</button>
      </div>
      <div class="bookmark-list">
        <div v-if="bookmarks.length === 0" class="empty-state">
          <p>暂无书签</p>
        </div>
        <div v-for="(bookmark, index) in bookmarks" v-else :key="index" class="bookmark-item">
          <div class="bookmark-info" @click="jumpToChapter(bookmark.chapter)">
            <i class="fas fa-bookmark"></i>
            <span class="bookmark-chapter">第{{ bookmark.chapter + 1 }}章</span>
            <span class="bookmark-time">{{ formatTime(bookmark.timestamp) }}</span>
          </div>
          <button class="remove-bookmark-btn" @click="removeBookmark(bookmark.chapter)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 编辑消息弹窗 -->
  <div v-if="editingMessageIndex !== null" class="modal-overlay" @click.self="cancelEdit">
    <div class="edit-modal">
      <div class="modal-header">
        <h3>编辑消息 #{{ editingMessageIndex + 1 }}</h3>
        <button class="close-button" @click="cancelEdit">✕</button>
      </div>
      <div class="modal-body">
        <div class="edit-form">
          <label class="form-label">消息内容：</label>
          <textarea v-model="editingContent" class="edit-textarea" rows="15"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="footer-btn" @click="cancelEdit">取消</button>
        <button class="footer-btn primary" @click="saveEdit">保存修改</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { klona } from 'klona';
import { computed, nextTick, ref, watch } from 'vue';
import { saveGameData } from '../composables/usePersistence';
import { useGameStateStore } from '../stores/gameStateStore';
import { useGameStore } from '../stores/gameStore';
import { emitChatMessageDeleted, emitChatMessageEdited, emitGameDataUpdated } from '../utils/eventBus';

interface Props {
  visible: boolean;
}

interface Chapter {
  start: number;
  end: number;
}

interface Bookmark {
  chapter: number;
  timestamp: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const gameStore = useGameStore();

// 状态
const chapterSize = ref(10); // 每章消息数
const displayMode = ref<'single' | 'continuous'>('single');
const currentChapter = ref(0);
const bookmarks = ref<Bookmark[]>([]);
const showBookmarkModal = ref(false);
const editingMessageIndex = ref<number | null>(null);
const editingContent = ref('');

// 计算章节
const chapters = computed<Chapter[]>(() => {
  const messages = gameStore.messages;
  if (messages.length === 0) return [];

  const result: Chapter[] = [];
  for (let i = 0; i < messages.length; i += chapterSize.value) {
    result.push({
      start: i,
      end: Math.min(i + chapterSize.value - 1, messages.length - 1),
    });
  }
  return result;
});

const totalMessages = computed(() => gameStore.messages.length);

const isCurrentBookmarked = computed(() => {
  return bookmarks.value.some(b => b.chapter === currentChapter.value);
});

// 监听章节大小变化，重置当前章节
watch(chapterSize, () => {
  currentChapter.value = 0;
  loadBookmarks();
});

// 监听可见性，加载书签
watch(
  () => props.visible,
  visible => {
    if (visible) {
      loadBookmarks();
      loadSettings();
    }
  },
);

// 方法
async function close() {
  // 确保关闭前所有 DOM 更新已完成
  await nextTick();
  emit('close');
}

function prevChapter() {
  if (currentChapter.value > 0) {
    currentChapter.value--;
  }
}

function nextChapter() {
  if (currentChapter.value < chapters.value.length - 1) {
    currentChapter.value++;
  }
}

function getCurrentChapterMessages() {
  const chapter = chapters.value[currentChapter.value];
  if (!chapter) return [];
  return gameStore.messages.slice(chapter.start, chapter.end + 1);
}

function getChapterMessages(chapterIdx: number) {
  const chapter = chapters.value[chapterIdx];
  if (!chapter) return [];
  return gameStore.messages.slice(chapter.start, chapter.end + 1);
}

function toggleBookmark() {
  const existingIndex = bookmarks.value.findIndex(b => b.chapter === currentChapter.value);

  if (existingIndex >= 0) {
    bookmarks.value.splice(existingIndex, 1);
    toastr.info('已取消收藏');
  } else {
    bookmarks.value.push({
      chapter: currentChapter.value,
      timestamp: Date.now(),
    });
    toastr.success('已收藏此章节');
  }

  saveBookmarks();
}

function removeBookmark(chapter: number) {
  const index = bookmarks.value.findIndex(b => b.chapter === chapter);
  if (index >= 0) {
    bookmarks.value.splice(index, 1);
    saveBookmarks();
    toastr.info('已移除书签');
  }
}

function jumpToChapter(chapter: number) {
  if (displayMode.value === 'single') {
    currentChapter.value = chapter;
    showBookmarkModal.value = false;
  } else {
    const anchor = document.getElementById(`chapter-anchor-${chapter}`);
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showBookmarkModal.value = false;
    }
  }
}

function showBookmarks() {
  showBookmarkModal.value = true;
}

async function clearAllMessages() {
  if (!confirm('确定要清空所有聊天记录吗？\n\n此操作将删除游戏内的所有消息，无法恢复！')) {
    return;
  }

  if (!confirm('请再次确认：真的要删除所有消息吗？')) {
    return;
  }

  try {
    // 清空前端消息（同层游玩，不影响酒馆）
    gameStore.messages = [];

    // 立即触发 Vue 响应式更新
    await nextTick();

    // 立即保存到 IndexedDB 和角色卡变量
    const gameStateStore = useGameStateStore();

    // 🔧 修复：先调用 syncToCharacterVariables，将最新的游戏状态（包括 character 和 gameState）同步到角色卡变量
    // 然后 saveGameData 只需要保存 messages 即可，不需要再传递 character（避免重复保存和数据冲突）
    gameStateStore.syncToCharacterVariables(); // 同步 character 和 gameState 到角色卡变量
    await nextTick(); // 等待同步完成

    await saveGameData({
      messages: [],
      gameState: gameStateStore.exportGameState(),
      // 不需要传递 character，因为 syncToCharacterVariables 已经同步了
    });

    console.log('[ChatRecordManager] 清空后的数据已立即保存到 IndexedDB 和角色卡变量');

    // 清空书签
    bookmarks.value = [];
    saveBookmarks();

    // 触发自定义事件，通知其他组件数据已更新（如变量管理器、NPC管理器、状态栏等）
    console.log('[ChatRecordManager] 🔔 触发更新事件: adnd2e_game_data_updated, adnd2e_character_data_synced');
    eventEmit('adnd2e_game_data_updated');
    eventEmit('adnd2e_character_data_synced');

    toastr.success('已清空所有消息（游戏独立层，不影响酒馆聊天）');
  } catch (error) {
    console.error('[ChatRecordManager] 清空失败:', error);
    toastr.error('清空失败: ' + (error as Error).message);
  }
}

// 编辑消息
function editMessage(index: number) {
  if (index < 0 || index >= gameStore.messages.length) return;

  const message = gameStore.messages[index];

  // 🔧 如果编辑的是AI消息且后面还有很多消息，给出警告
  if (message.role === 'assistant' && index < gameStore.messages.length - 5) {
    const confirmed = confirm(
      `⚠️ 编辑提示\n\n您正在编辑第 ${index + 1} 条消息，此消息后还有 ${gameStore.messages.length - index - 1} 条消息。\n\n` +
        `📝 编辑模式：增量更新\n` +
        `• 只会重新解析当前消息的命令\n` +
        `• 不会影响后续消息添加的NPC和其他数据\n` +
        `• 适合修正文本、微调数值\n\n` +
        `⚠️ 如果您要修改关键游戏命令（如NPC的创建、删除），建议使用"删除消息"功能，\n` +
        `这样系统会回溯游戏状态并重新应用所有后续命令。\n\n` +
        `是否继续编辑？`,
    );

    if (!confirmed) return;
  }

  editingMessageIndex.value = index;
  editingContent.value = gameStore.messages[index].content;
}

function cancelEdit() {
  editingMessageIndex.value = null;
  editingContent.value = '';
}

async function saveEdit() {
  if (editingMessageIndex.value === null) return;

  const index = editingMessageIndex.value;
  const newContent = editingContent.value.trim();

  if (!newContent) {
    toastr.error('消息内容不能为空');
    return;
  }

  try {
    const message = gameStore.messages[index];
    const gameStateStore = useGameStateStore(); // 在函数开始就定义，避免作用域问题

    // 1. 更新消息内容
    message.content = newContent;

    // 2. 如果是 AI 消息，重新解析命令并更新游戏状态
    if (message.role === 'assistant') {
      console.log('[ChatRecordManager] 检测到 AI 消息编辑，重新解析当前消息的命令（增量更新模式）...');

      // 动态导入 commandParser
      const { parseAiResponse } = await import('../utils/commandParser');

      // 🔧 修复：使用增量更新策略，只重新解析当前消息，不回溯整个游戏状态
      // 这样可以避免丢失后续消息添加的NPC等数据

      // 解析新的消息内容
      const parseResult = parseAiResponse(newContent);

      if (parseResult.commands.length > 0) {
        console.log(`[ChatRecordManager] 当前消息包含 ${parseResult.commands.length} 个命令，准备增量应用...`);

        // 3. 增量应用新命令（不清空现有状态）
        const successCount = gameStateStore.applyCommands(parseResult.commands);

        // 4. 更新该消息的快照为最新状态
        message.stateSnapshot = JSON.stringify(gameStateStore.exportGameState());

        console.log(
          `[ChatRecordManager] 消息 #${index + 1}: 增量应用了 ${successCount}/${parseResult.commands.length} 个命令`,
        );

        // 收集错误
        if (parseResult.errors.length > 0) {
          console.warn('[ChatRecordManager] 命令解析错误:', parseResult.errors);
          toastr.warning(`部分命令解析失败，详见控制台`);
        }

        toastr.success(`消息已更新，增量应用了 ${successCount}/${parseResult.commands.length} 个命令`);
      } else {
        // 5. 如果新内容没有命令，只更新消息内容，不改变游戏状态
        console.log('[ChatRecordManager] 新内容未检测到命令，仅更新消息文本');
        toastr.info('消息已更新（未检测到命令）');
      }
    } else {
      toastr.success('消息已更新');
    }

    // 3. 立即保存到 IndexedDB 和角色卡变量（编辑是关键操作，不使用防抖）
    await nextTick();

    // 🔧 修复：先调用 syncToCharacterVariables，将最新的游戏状态（包括 character 和 gameState）同步到角色卡变量
    // 然后 saveGameData 只需要保存 messages 即可，不需要再传递 character（避免重复保存和数据冲突）
    gameStateStore.syncToCharacterVariables(); // 同步 character 和 gameState 到角色卡变量
    await nextTick(); // 等待同步完成

    await saveGameData({
      messages: klona(gameStore.messages),
      gameState: gameStateStore.exportGameState(),
      // 不需要传递 character，因为 syncToCharacterVariables 已经同步了
    });

    console.log('[ChatRecordManager] 编辑后的消息已立即保存到 IndexedDB 和角色卡变量');

    // 4. 🔧 触发双事件系统，通知其他组件数据已更新
    console.log('[ChatRecordManager] 🔔 触发更新事件（双系统）');
    emitChatMessageEdited(index);
    emitGameDataUpdated('chat-edit');
    eventEmit('adnd2e_game_data_updated'); // 兼容旧系统
    eventEmit('adnd2e_character_data_synced'); // 兼容旧系统

    cancelEdit();
  } catch (error) {
    console.error('[ChatRecordManager] 更新消息失败:', error);
    toastr.error('更新失败: ' + (error as Error).message);
  }
}

// 删除单条消息（同层游玩，不影响酒馆）并回溯游戏状态
async function deleteMessage(index: number) {
  if (index < 0 || index >= gameStore.messages.length) return;

  const message = gameStore.messages[index];
  const roleLabel = getRoleLabel(message.role);

  if (
    !confirm(
      `确定要删除第 ${index + 1} 条消息吗？\n\n类型：${roleLabel}\n内容预览：${message.content.slice(0, 50)}...\n\n⚠️ 删除此消息后，游戏状态将回溯到该消息之前的状态，且之后的所有消息也将被删除。`,
    )
  ) {
    return;
  }

  try {
    // 1. 找到要回溯到的快照（该消息之前最近的带快照的消息）
    let snapshotToRestore: any = null;
    for (let i = index - 1; i >= 0; i--) {
      const snapshot = gameStore.messages[i].stateSnapshot;
      if (snapshot) {
        snapshotToRestore = JSON.parse(snapshot);
        console.log(`[ChatRecordManager] 找到快照: 消息 #${i + 1}`);
        break;
      }
    }

    // 2. 恢复游戏状态
    const gameStateStore = useGameStateStore();
    if (snapshotToRestore) {
      gameStateStore.restoreGameState(snapshotToRestore);
      console.log('[ChatRecordManager] 游戏状态已回溯到快照');
    } else {
      // 如果没有快照，回溯到初始状态（从角色数据初始化）
      const charVars = getVariables({ type: 'character' });
      const characterData = charVars?.adnd2e?.character;
      gameStateStore.resetGameState();
      if (characterData) {
        gameStateStore.initializeGameState(characterData);
        console.log('[ChatRecordManager] 未找到快照，已回溯到初始状态');
        toastr.info('未找到快照，已回溯到角色创建时的初始状态');
      } else {
        console.warn('[ChatRecordManager] 未找到快照和角色数据，游戏状态未回溯');
        toastr.warning('未找到状态快照，游戏状态未回溯');
      }
    }

    // 3. 删除该消息及之后的所有消息
    const deletedCount = gameStore.messages.length - index;
    gameStore.messages.splice(index);

    // 4. 立即保存到 IndexedDB 和角色卡变量（删除是关键操作，不使用防抖）
    await nextTick();

    // 🔧 修复：先调用 syncToCharacterVariables，将最新的游戏状态（包括 character 和 gameState）同步到角色卡变量
    // 然后 saveGameData 只需要保存 messages 即可，不需要再传递 character（避免重复保存和数据冲突）
    gameStateStore.syncToCharacterVariables(); // 同步 character 和 gameState 到角色卡变量
    await nextTick(); // 等待同步完成

    await saveGameData({
      messages: klona(gameStore.messages),
      gameState: gameStateStore.exportGameState(),
      // 不需要传递 character，因为 syncToCharacterVariables 已经同步了
    });

    console.log('[ChatRecordManager] 删除后的消息已立即保存到 IndexedDB 和角色卡变量');

    // 🔧 触发双事件系统，通知其他组件数据已更新
    console.log('[ChatRecordManager] 🔔 触发删除事件（双系统）');
    emitChatMessageDeleted(index);
    emitGameDataUpdated('chat-delete');
    eventEmit('adnd2e_game_data_updated'); // 兼容旧系统
    eventEmit('adnd2e_character_data_synced'); // 兼容旧系统

    // 5. 更新书签（删除消息后，后面的消息索引会变化）
    bookmarks.value = bookmarks.value
      .filter(b => {
        const chapterStart = b.chapter * chapterSize.value;
        return chapterStart < index;
      })
      .map(b => {
        const chapterStart = b.chapter * chapterSize.value;
        if (index < chapterStart) {
          const newChapter = Math.floor((chapterStart - 1) / chapterSize.value);
          return { ...b, chapter: newChapter };
        }
        return b;
      });
    saveBookmarks();

    toastr.success(`已删除 ${deletedCount} 条消息并回溯游戏状态`);
  } catch (error) {
    console.error('[ChatRecordManager] 删除消息失败:', error);
    toastr.error('删除失败: ' + (error as Error).message);
  }
}

// 辅助函数
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    system: '系统',
    assistant: 'AI',
    user: '玩家',
  };
  return labels[role] || role;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMessage(content: string): string {
  return content.replace(/\n/g, '<br>').replace(/ {2}/g, '&nbsp;&nbsp;');
}

// 持久化
function saveBookmarks() {
  try {
    const charVars = getVariables({ type: 'character' });
    const currentAdnd2e = charVars?.adnd2e || {};

    replaceVariables(
      {
        adnd2e: {
          ...currentAdnd2e,
          chatRecordBookmarks: bookmarks.value,
        },
      },
      { type: 'character' },
    );
  } catch (error) {
    console.error('[ChatRecordManager] 保存书签失败:', error);
  }
}

function loadBookmarks() {
  try {
    const charVars = getVariables({ type: 'character' });
    const saved = charVars?.adnd2e?.chatRecordBookmarks;
    if (saved && Array.isArray(saved)) {
      bookmarks.value = saved;
    }
  } catch (error) {
    console.error('[ChatRecordManager] 加载书签失败:', error);
  }
}

function saveSettings() {
  try {
    const charVars = getVariables({ type: 'character' });
    const currentAdnd2e = charVars?.adnd2e || {};

    replaceVariables(
      {
        adnd2e: {
          ...currentAdnd2e,
          chatRecordSettings: {
            chapterSize: chapterSize.value,
            displayMode: displayMode.value,
          },
        },
      },
      { type: 'character' },
    );
  } catch (error) {
    console.error('[ChatRecordManager] 保存设置失败:', error);
  }
}

function loadSettings() {
  try {
    const charVars = getVariables({ type: 'character' });
    const saved = charVars?.adnd2e?.chatRecordSettings;
    if (saved) {
      chapterSize.value = saved.chapterSize || 10;
      displayMode.value = saved.displayMode || 'single';
    }
  } catch (error) {
    console.error('[ChatRecordManager] 加载设置失败:', error);
  }
}

// 监听设置变化，自动保存
watch([chapterSize, displayMode], () => {
  saveSettings();
});
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  overflow: auto;
}

.modal-card {
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  max-width: 1200px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.modal-header {
  background-color: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px 8px 0 0;
  padding: 18px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  gap: 15px;
  cursor: move;
  user-select: none;

  h2 {
    font-family: '临海体', serif;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 1px;
    margin: 0;
    color: #333;
  }
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;

  .chapter-size-input {
    width: 60px;
    padding: 6px 8px;
    border: 2px solid #000;
    background-color: #fff;
    font-family: '临海体', serif;
    font-size: 13px;
    text-align: center;

    &:focus {
      outline: none;
      border-color: #4a90e2;
    }
  }

  .input-label {
    font-family: '临海体', serif;
    font-size: 12px;
    color: #666;
  }
}

.close-button {
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 20px;
  font-weight: normal;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #666;
  border-radius: 4px;

  &:hover {
    background-color: #f5f5f5;
    color: #333;
  }
}

.chapter-nav {
  background-color: #fafafa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 2;
  flex-wrap: wrap;
}

.display-mode-toggle {
  display: flex;
  gap: 15px;

  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: '临海体', serif;
    font-size: 13px;
    cursor: pointer;

    input[type='radio'] {
      cursor: pointer;
    }
  }
}

.chapter-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #666;

  &:hover:not(:disabled) {
    background-color: #f5f5f5;
    border-color: rgba(0, 0, 0, 0.25);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.chapter-select {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background-color: #fff;
  font-family: '临海体', serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }
}

.bookmark-btn {
  padding: 6px 14px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  font-family: '临海体', serif;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  color: #666;

  &:hover {
    background-color: #f5f5f5;
    border-color: rgba(0, 0, 0, 0.25);
    color: #333;
  }

  i {
    font-size: 14px;
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: #fff;

  &.continuous-mode {
    padding: 0;
  }
}

.single-chapter-view {
  .chapter-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    h3 {
      font-family: '临海体', serif;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
      letter-spacing: 1px;
      color: #333;
    }

    .chapter-range {
      font-family: '临海体', serif;
      font-size: 13px;
      color: #999;
      margin: 0;
      font-weight: normal;
    }
  }
}

.continuous-view {
  .chapter-block {
    position: relative;
  }

  .chapter-anchor {
    position: absolute;
    top: -80px;
  }
}

.chapter-divider {
  background-color: #fafafa;
  padding: 24px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin: 20px 0;

  .divider-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    font-family: '临海体', serif;
  }

  .divider-icon {
    font-size: 18px;
    color: #8b4513;
  }

  .chapter-title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 1px;
    color: #333;
  }

  .chapter-info {
    font-size: 12px;
    color: #666;
    font-family: '临海体', serif;
  }
}

.chapter-content,
.chapter-messages {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 0 20px 20px;
}

.message-item {
  background-color: #fafafa;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  padding: 16px;
  position: relative;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    border-color: rgba(0, 0, 0, 0.12);
  }

  &.message-system {
    background-color: #fafafa;
    border-left: 3px solid #ff9800;
  }

  &.message-user {
    background-color: #fafafa;
    border-left: 3px solid #4a90e2;
  }

  &.message-assistant {
    background-color: #fafafa;
    border-left: 3px solid #28a745;
  }
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.message-role {
  font-family: '临海体', serif;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-time {
  font-family: '临海体', serif;
  font-size: 11px;
  color: #999;
  font-weight: normal;
}

.message-index {
  font-family: '临海体', serif;
  font-size: 11px;
  color: #999;
  font-weight: normal;
}

.message-user .message-role {
  background-color: rgba(74, 144, 226, 0.15);
  color: #4a90e2;
}

.message-assistant .message-role {
  background-color: rgba(40, 167, 69, 0.15);
  color: #28a745;
}

.message-system .message-role {
  background-color: rgba(255, 152, 0, 0.15);
  color: #ff9800;
}

.snapshot-badge {
  margin-left: 8px;
  padding: 3px 8px;
  background-color: rgba(255, 215, 0, 0.2);
  color: #d4a017;
  font-size: 11px;
  border-radius: 10px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;

  i {
    font-size: 12px;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.message-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.message-action-btn {
  background: transparent;
  border: none;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 14px;
  color: #999;
  border-radius: 4px;

  &:hover {
    background-color: #f0f0f0;
    color: #333;
  }

  &.edit-btn:hover {
    background-color: rgba(74, 144, 226, 0.1);
    color: #4a90e2;
  }

  &.delete-btn:hover {
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }
}

.message-content {
  font-family: '临海体', serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;

  i {
    font-size: 48px;
    margin-bottom: 20px;
    opacity: 0.5;
  }

  p {
    font-family: '临海体', serif;
    font-size: 16px;
    margin: 10px 0;

    &.hint {
      font-size: 13px;
      color: #bbb;
    }
  }
}

.modal-footer {
  border-top: 3px solid #000;
  background-color: #fff;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  gap: 15px;
  flex-wrap: wrap;
}

.footer-stats {
  display: flex;
  gap: 20px;
  font-family: '临海体', serif;
  font-size: 12px;
  color: #666;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.footer-btn {
  padding: 8px 16px;
  border: 2px solid #000;
  background-color: #fff;
  cursor: pointer;
  font-family: '临海体', serif;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background-color: #000;
    color: #fff;
  }

  &.danger {
    border-color: #dc3545;
    color: #dc3545;

    &:hover {
      background-color: #dc3545;
      border-color: #dc3545;
      color: #fff;
    }
  }
}

// 书签列表弹窗
.bookmark-modal {
  background-color: #fff;
  border: 4px solid #000;
  max-width: 500px;
  width: 90%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);

  .modal-header {
    border-bottom: 2px solid #000;

    h3 {
      font-family: '临海体', serif;
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 0;
    }
  }
}

.bookmark-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bookmark-item {
  background-color: #fff;
  border: 2px solid #000;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  transition: all 0.2s;

  &:hover {
    background-color: #fffbf0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.bookmark-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-family: '临海体', serif;

  i {
    color: #ffd700;
    font-size: 16px;
  }

  .bookmark-chapter {
    font-weight: bold;
    font-size: 14px;
  }

  .bookmark-time {
    font-family: '临海体', serif;
    font-size: 11px;
    color: #999;
    margin-left: auto;
  }
}

.remove-bookmark-btn {
  background: none;
  border: 2px solid #000;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background-color: #dc3545;
    border-color: #dc3545;
    color: #fff;
  }
}

// 编辑消息弹窗
.edit-modal {
  background-color: #fff;
  border: 4px solid #000;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);

  .modal-header {
    border-bottom: 2px solid #000;

    h3 {
      font-family: '临海体', serif;
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 0;
    }
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .modal-footer {
    border-top: 2px solid #000;
    background-color: #fff;
    padding: 15px 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    .primary {
      background-color: #4a90e2;
      border-color: #4a90e2;
      color: #fff;

      &:hover {
        background-color: #357abd;
        border-color: #357abd;
      }
    }
  }
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .form-label {
    font-family: '临海体', serif;
    font-size: 14px;
    font-weight: bold;
    color: #333;
  }
}

.edit-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #000;
  background-color: #fff;
  font-family: '临海体', serif;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #4a90e2;
  }
}

// 响应式
@media (max-width: 992px) {
  .modal-card {
    max-width: 100%;
    width: 100%;
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
    border: none;
  }

  .chapter-nav {
    flex-direction: column;
    align-items: stretch;
  }

  .chapter-selector {
    width: 100%;
  }

  .footer-stats,
  .footer-actions {
    width: 100%;
    justify-content: center;
  }

  .edit-modal {
    max-width: 95%;
    width: 95%;
  }
}
</style>
