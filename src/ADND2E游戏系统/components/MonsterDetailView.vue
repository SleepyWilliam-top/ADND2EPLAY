<template>
  <div class="monster-detail-view">
    <!-- 头部栏 -->
    <div class="detail-header">
      <button class="back-btn" @click="emit('back')">
        <i class="fas fa-arrow-left"></i>
        返回
      </button>
      <button class="close-btn" @click="emit('close')">
        <i class="fas fa-xmark"></i>
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="detail-content">
      <!-- 怪物基本信息 -->
      <div class="monster-header">
        <div class="monster-avatar-large">
          <img :src="monsterImage" :alt="monster.name" class="avatar-img" @error="handleImageError" />
          <div v-if="isDefaultImage" class="image-source">
            <small>来自 X.com @SimarglArtist</small>
          </div>
        </div>

        <div class="monster-basic-info">
          <h2 class="monster-name">
            {{ monster.name }}
            <span class="monster-english">({{ monster.englishName }})</span>
          </h2>

          <div class="monster-quick-stats">
            <span class="quick-stat">
              <i class="fas fa-heart"></i>
              HD {{ monster.hitDice }}
            </span>
            <span class="quick-stat">
              <i class="fas fa-shield"></i>
              AC {{ monster.armorClass }}
            </span>
            <span class="quick-stat">
              <i class="fas fa-crosshairs"></i>
              THAC0 {{ monster.thac0 }}
            </span>
            <span class="quick-stat">
              <i class="fas fa-star"></i>
              XP {{ monster.xpValue }}
            </span>
            <span class="quick-stat">
              <i class="fas fa-balance-scale"></i>
              {{ monster.alignment }}
            </span>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button class="action-btn image-btn" @click="handleChangeImage">
              <i class="fas fa-image"></i>
              更换图片
            </button>
            <button class="action-btn copy-btn" @click="handleCopyAIFormat">
              <i class="fas fa-copy"></i>
              复制AI格式
            </button>
          </div>
        </div>
      </div>

      <!-- 标签页 -->
      <div class="tabs-container">
        <div class="tabs-header">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <i :class="['fas', tab.icon]"></i>
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <!-- 基础属性 -->
          <div v-if="activeTab === 'basic'" class="tab-pane">
            <div class="attributes-grid">
              <div class="attr-item">
                <span class="attr-label">气候/地形:</span>
                <span class="attr-value">{{ monster.climate }}</span>
              </div>
              <div class="attr-item">
                <span class="attr-label">出现频率:</span>
                <span class="attr-value">{{ monster.frequency }}</span>
              </div>
              <div class="attr-item">
                <span class="attr-label">组织:</span>
                <span class="attr-value">{{ monster.organization }}</span>
              </div>
              <div class="attr-item">
                <span class="attr-label">活动周期:</span>
                <span class="attr-value">{{ monster.activityCycle }}</span>
              </div>
              <div class="attr-item">
                <span class="attr-label">食性:</span>
                <span class="attr-value">{{ monster.diet }}</span>
              </div>
              <div class="attr-item">
                <span class="attr-label">智力:</span>
                <span class="attr-value">{{ monster.intelligence }}</span>
              </div>
              <div class="attr-item">
                <span class="attr-label">宝藏:</span>
                <span class="attr-value">{{ monster.treasure }}</span>
              </div>
              <div class="attr-item">
                <span class="attr-label">出现数量:</span>
                <span class="attr-value">{{ monster.numberAppearing }}</span>
              </div>
              <div class="attr-item">
                <span class="attr-label">移动力:</span>
                <span class="attr-value">{{ monster.movement }}</span>
              </div>
              <div class="attr-item">
                <span class="attr-label">体型:</span>
                <span class="attr-value">{{ monster.size }}</span>
              </div>
              <div class="attr-item">
                <span class="attr-label">士气:</span>
                <span class="attr-value">{{ monster.morale }}</span>
              </div>
            </div>

            <div class="description-section">
              <h4 class="section-title">
                <i class="fas fa-book-open"></i>
                描述
              </h4>
              <p class="description-text">{{ monster.description }}</p>
            </div>
          </div>

          <!-- 战斗信息 -->
          <div v-if="activeTab === 'combat'" class="tab-pane">
            <div class="combat-stats">
              <div class="combat-item">
                <span class="combat-label">
                  <i class="fas fa-sword"></i>
                  攻击次数:
                </span>
                <span class="combat-value">{{ monster.numberOfAttacks }}</span>
              </div>
              <div class="combat-item">
                <span class="combat-label">
                  <i class="fas fa-burst"></i>
                  伤害/攻击:
                </span>
                <span class="combat-value">{{ monster.damage }}</span>
              </div>
              <div class="combat-item">
                <span class="combat-label">
                  <i class="fas fa-fire"></i>
                  特殊攻击:
                </span>
                <span class="combat-value">{{ monster.specialAttacks }}</span>
              </div>
              <div class="combat-item">
                <span class="combat-label">
                  <i class="fas fa-shield-halved"></i>
                  特殊防御:
                </span>
                <span class="combat-value">{{ monster.specialDefenses }}</span>
              </div>
              <div class="combat-item">
                <span class="combat-label">
                  <i class="fas fa-wand-sparkles"></i>
                  魔法抗力:
                </span>
                <span class="combat-value">{{ monster.magicResistance }}</span>
              </div>
            </div>

            <div class="description-section">
              <h4 class="section-title">
                <i class="fas fa-swords"></i>
                战斗详情
              </h4>
              <p class="description-text">{{ monster.combat }}</p>
            </div>
          </div>

          <!-- 栖息地 -->
          <div v-if="activeTab === 'habitat'" class="tab-pane">
            <div class="description-section">
              <h4 class="section-title">
                <i class="fas fa-house"></i>
                栖息地/社会
              </h4>
              <p class="description-text">{{ monster.habitat }}</p>
            </div>
          </div>

          <!-- 生态 -->
          <div v-if="activeTab === 'ecology'" class="tab-pane">
            <div class="description-section">
              <h4 class="section-title">
                <i class="fas fa-leaf"></i>
                生态
              </h4>
              <p class="description-text">{{ monster.ecology }}</p>
            </div>

            <!-- 特殊规则 -->
            <div v-if="monster.specialRules && monster.specialRules.length > 0" class="special-rules">
              <h4 class="section-title">
                <i class="fas fa-scroll"></i>
                特殊规则
              </h4>
              <div v-for="rule in monster.specialRules" :key="rule.id" class="rule-item">
                <h5 class="rule-name">{{ rule.name }}</h5>
                <p class="rule-content">{{ rule.content }}</p>
              </div>
            </div>
          </div>

          <!-- 笔记 -->
          <div v-if="activeTab === 'notes'" class="tab-pane">
            <div class="notes-editor">
              <div class="note-field">
                <label class="note-label">
                  <i class="fas fa-pen"></i>
                  通用笔记
                </label>
                <textarea
                  v-model="editingNotes.general"
                  class="note-textarea"
                  placeholder="记录关于这个怪物的任何信息..."
                  rows="4"
                ></textarea>
              </div>

              <div class="note-field">
                <label class="note-label">
                  <i class="fas fa-circle-info"></i>
                  当前状态
                </label>
                <input
                  v-model="editingNotes.status"
                  type="text"
                  class="note-input"
                  placeholder="例如：敌对、友好、中立..."
                />
              </div>

              <div class="note-field">
                <label class="note-label">
                  <i class="fas fa-user"></i>
                  外貌
                </label>
                <textarea
                  v-model="editingNotes.appearance"
                  class="note-textarea"
                  placeholder="描述这个怪物的外貌特征..."
                  rows="3"
                ></textarea>
              </div>

              <div class="note-field">
                <label class="note-label">
                  <i class="fas fa-face-smile"></i>
                  性格
                </label>
                <input
                  v-model="editingNotes.personality"
                  type="text"
                  class="note-input"
                  placeholder="例如：狡猾、暴躁、谨慎..."
                />
              </div>

              <div class="note-field">
                <label class="note-label">
                  <i class="fas fa-handshake"></i>
                  与角色关系
                </label>
                <input
                  v-model="editingNotes.relationship"
                  type="text"
                  class="note-input"
                  placeholder="例如：盟友、敌人、陌生人..."
                />
              </div>

              <button class="save-notes-btn" @click="handleSaveNotes">
                <i class="fas fa-floppy-disk"></i>
                保存笔记
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 遭遇记录 -->
      <div class="encounter-section">
        <h4 class="section-title">
          <i class="fas fa-star"></i>
          遭遇记录
        </h4>

        <div v-if="encounterRecord" class="encounter-info">
          <div class="encounter-stat">
            <i class="fas fa-hashtag"></i>
            已遭遇 <strong>{{ encounterRecord.encounterCount }}</strong> 次
          </div>
          <div class="encounter-stat">
            <i class="fas fa-clock"></i>
            最近遭遇: <strong>{{ formatDate(encounterRecord.lastEncounteredAt) }}</strong>
          </div>
          <div class="encounter-stat">
            <i class="fas fa-calendar"></i>
            首次遭遇: <strong>{{ formatDate(encounterRecord.firstEncounteredAt) }}</strong>
          </div>

          <!-- 遭遇历史 -->
          <div v-if="encounterRecord.encounterHistory.length > 0" class="encounter-history">
            <h5 class="history-title">遭遇历史:</h5>
            <div
              v-for="(entry, index) in encounterRecord.encounterHistory.slice().reverse().slice(0, 5)"
              :key="index"
              class="history-entry"
            >
              <span class="entry-badge" :class="entry.source">
                {{ entry.source === 'auto' ? '自动' : '手动' }}
              </span>
              <span class="entry-time">{{ formatDate(entry.timestamp) }}</span>
              <span v-if="entry.context" class="entry-context">{{ entry.context.substring(0, 50) }}...</span>
              <!-- 手动标记的遭遇显示删除按钮 -->
              <button
                v-if="entry.source === 'manual'"
                title="删除此遭遇记录"
                class="delete-entry-btn"
                @click.stop="handleDeleteEncounter(getOriginalIndex(index))"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="no-encounter">
          <i class="fas fa-circle-exclamation"></i>
          尚未遭遇此怪物
        </div>

        <button class="encounter-btn" @click="handleRecordEncounter">
          <i class="fas fa-plus"></i>
          标记新遭遇
        </button>
      </div>

      <!-- 底部占位空间，确保内容完全可见 -->
      <div class="bottom-spacer"></div>
    </div>

    <!-- 图片图库模态框 -->
    <ImageLibraryModal v-model="showImageLibrary" category="other" @select="handleImageSelect" />
  </div>
</template>

<script setup lang="ts">
import toastr from 'toastr';
import { computed, onMounted, ref } from 'vue';
import {
  copyAIFormatToClipboard,
  deleteEncounterEntry,
  getEncounterRecord,
  recordEncounterManual,
  updateMonsterImage,
  updateMonsterNotes,
  type Monster,
  type MonsterEncounterRecord,
  type MonsterNotes,
} from '../composables/useMonsterEncyclopedia';
import ImageLibraryModal from './ImageLibraryModal.vue';

// ==================== Props & Emits ====================

const props = defineProps<{
  monster: Monster | null;
}>();

const emit = defineEmits<{
  back: [];
  close: [];
}>();

// ==================== 状态管理 ====================

const activeTab = ref('basic');
const encounterRecord = ref<MonsterEncounterRecord | null>(null);
const editingNotes = ref<MonsterNotes>({
  general: '',
  status: '',
  appearance: '',
  personality: '',
  relationship: '',
});
const showImageLibrary = ref(false);

const DEFAULT_MONSTER_IMAGE = 'https://p.sda1.dev/28/5892e1c9ce14258ff21ba5f95f42c5eb/Monster.jpg';

// 标签页配置
const tabs = [
  { id: 'basic', label: '基础', icon: 'fa-book' },
  { id: 'combat', label: '战斗', icon: 'fa-swords' },
  { id: 'habitat', label: '栖息地', icon: 'fa-house' },
  { id: 'ecology', label: '生态', icon: 'fa-leaf' },
  { id: 'notes', label: '笔记', icon: 'fa-pen' },
];

// ==================== 计算属性 ====================

const monsterImage = computed(() => {
  if (!props.monster) return DEFAULT_MONSTER_IMAGE;

  // 优先使用自定义图片
  if (encounterRecord.value?.customImageId) {
    // TODO: 从图库获取
    return DEFAULT_MONSTER_IMAGE;
  }

  // 使用怪物数据中的图片
  if (props.monster.imageUrl) {
    return props.monster.imageUrl;
  }

  // 使用默认图片
  return DEFAULT_MONSTER_IMAGE;
});

const isDefaultImage = computed(() => {
  if (!props.monster) return true;
  if (encounterRecord.value?.customImageId) return false;
  if (props.monster.imageUrl) return false;
  return true;
});

// ==================== 生命周期 ====================

onMounted(async () => {
  if (props.monster) {
    await loadEncounterRecord();
  }
});

// ==================== 方法 ====================

/**
 * 加载遭遇记录
 */
async function loadEncounterRecord() {
  if (!props.monster) return;

  try {
    const record = await getEncounterRecord(props.monster.id);
    encounterRecord.value = record;

    if (record && record.notes) {
      editingNotes.value = { ...record.notes };
    }
  } catch (error) {
    console.error('[MonsterDetailView] 加载遭遇记录失败:', error);
  }
}

/**
 * 格式化日期
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '未知时间';
  }
}

/**
 * 处理记录遭遇
 */
async function handleRecordEncounter() {
  if (!props.monster) return;

  try {
    await recordEncounterManual(props.monster.id);
    await loadEncounterRecord();
  } catch (error) {
    console.error('[MonsterDetailView] 记录遭遇失败:', error);
    toastr.error('记录遭遇失败');
  }
}

/**
 * 获取原始索引（因为显示时是反转的）
 */
function getOriginalIndex(reversedIndex: number): number {
  if (!encounterRecord.value) return 0;
  const totalCount = encounterRecord.value.encounterHistory.length;
  return totalCount - 1 - reversedIndex;
}

/**
 * 处理删除遭遇记录
 */
async function handleDeleteEncounter(originalIndex: number) {
  if (!props.monster) return;

  // 确认删除
  if (!confirm('确定要删除这条遭遇记录吗？')) {
    return;
  }

  try {
    await deleteEncounterEntry(props.monster.id, originalIndex);
    await loadEncounterRecord();
  } catch (error) {
    console.error('[MonsterDetailView] 删除遭遇记录失败:', error);
    toastr.error('删除遭遇记录失败');
  }
}

/**
 * 处理保存笔记
 */
async function handleSaveNotes() {
  if (!props.monster) return;

  try {
    await updateMonsterNotes(props.monster.id, editingNotes.value);
    toastr.success('笔记已保存');
    await loadEncounterRecord();
  } catch (error) {
    console.error('[MonsterDetailView] 保存笔记失败:', error);
    toastr.error('保存笔记失败');
  }
}

/**
 * 处理更换图片
 */
function handleChangeImage() {
  showImageLibrary.value = true;
}

/**
 * 处理图片选择
 */
async function handleImageSelect(_imageData: string, imageId: string) {
  if (!props.monster) return;

  try {
    await updateMonsterImage(props.monster.id, imageId);
    toastr.success('图片已更换');
    await loadEncounterRecord();
  } catch (error) {
    console.error('[MonsterDetailView] 更换图片失败:', error);
    toastr.error('更换图片失败');
  }
}

/**
 * 处理复制AI格式
 */
async function handleCopyAIFormat() {
  if (!props.monster) return;

  try {
    await copyAIFormatToClipboard(props.monster, editingNotes.value);
  } catch (error) {
    console.error('[MonsterDetailView] 复制AI格式失败:', error);
  }
}

/**
 * 处理图片加载错误
 */
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = DEFAULT_MONSTER_IMAGE;
}
</script>

<style scoped lang="scss">
.monster-detail-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
}

// ==================== 头部栏 ====================
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: #fff;
  border-bottom: 2px solid rgba(0, 0, 0, 0.08);

  .back-btn,
  .close-btn {
    padding: 10px 18px;
    background: #fff;
    border: 2px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: '临海体', serif;
    font-size: 14px;
    font-weight: 600;
    color: #555;

    &:hover {
      background: #f5f5f5;
      border-color: #8b4513;
      color: #8b4513;
    }

    i {
      font-size: 14px;
    }
  }

  .back-btn:hover {
    transform: translateX(-3px);
  }

  .close-btn:hover {
    transform: rotate(90deg);
  }
}

// ==================== 内容区域 ====================
.detail-content {
  flex: 1;
  overflow-y: scroll; // 强制显示滚动条
  overflow-x: hidden;
  padding: 25px 30px 20px 30px; // 减少底部 padding，因为有占位元素
  min-height: 0; // 确保 flex 子元素可以滚动

  // 性能优化
  will-change: scroll-position;
  -webkit-overflow-scrolling: touch;

  // 自定义滚动条 - 更宽更明显
  &::-webkit-scrollbar {
    width: 12px; // 增加滚动条宽度
  }

  &::-webkit-scrollbar-track {
    background: #e8e8e8; // 更明显的轨道颜色
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888; // 更深的滑块颜色
    border-radius: 6px;
    border: 2px solid #e8e8e8; // 添加边框

    &:hover {
      background: #555; // hover 时更深
    }
  }

  // 为 Firefox 提供滚动条样式
  scrollbar-width: auto; // 使用标准宽度
  scrollbar-color: #888 #e8e8e8;
}

// ==================== 怪物头部 ====================
.monster-header {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding: 25px;
  background: #fff;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.08);

  .monster-avatar-large {
    width: 200px;
    height: 200px;
    border-radius: 12px;
    overflow: hidden;
    background: #f0f0f0;
    border: 3px solid rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
    position: relative;

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-source {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 5px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 10px;
      text-align: center;

      small {
        display: block;
      }
    }
  }

  .monster-basic-info {
    flex: 1;

    .monster-name {
      margin: 0 0 15px 0;
      font-size: 28px;
      font-weight: 700;
      color: #2c2c2c;
      font-family: '临海体', serif;
      line-height: 1.3;

      .monster-english {
        display: block;
        font-size: 18px;
        font-weight: 400;
        color: #888;
        margin-top: 5px;
      }
    }

    .monster-quick-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;

      .quick-stat {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 15px;
        background: #f8f5f0;
        border-radius: 6px;
        font-family: '临海体', serif;
        font-size: 14px;
        font-weight: 600;
        color: #2c2c2c;
        border: 1px solid rgba(139, 69, 19, 0.2);

        i {
          color: #8b4513;
          font-size: 12px;
        }
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;

      .action-btn {
        padding: 12px 20px;
        border: 2px solid #8b4513;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: '临海体', serif;
        font-size: 14px;
        font-weight: 600;

        i {
          font-size: 14px;
        }

        &.image-btn {
          background: #fff;
          color: #8b4513;

          &:hover {
            background: #8b4513;
            color: #fff;
          }
        }

        &.copy-btn {
          background: #8b4513;
          color: #fff;

          &:hover {
            background: #6d3610;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
          }
        }
      }
    }
  }
}

// ==================== 标签页 ====================
.tabs-container {
  background: #fff;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
  overflow: hidden;

  .tabs-header {
    display: flex;
    background: #f8f5f0;
    border-bottom: 2px solid rgba(0, 0, 0, 0.08);
    overflow-x: auto;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 2px;
    }

    .tab-btn {
      flex: 1;
      min-width: 120px;
      padding: 15px 20px;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: '临海体', serif;
      font-size: 15px;
      font-weight: 600;
      color: #666;

      i {
        font-size: 14px;
      }

      &:hover {
        background: rgba(139, 69, 19, 0.05);
        color: #8b4513;
      }

      &.active {
        background: #fff;
        color: #8b4513;
        border-bottom-color: #8b4513;
      }
    }
  }

  .tab-content {
    .tab-pane {
      padding: 25px;
    }
  }
}

// 属性网格
.attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 25px;

  .attr-item {
    display: flex;
    align-items: flex-start; // 改为顶部对齐
    padding: 12px 15px;
    background: #f8f5f0;
    border-radius: 6px;
    font-family: '临海体', serif;
    font-size: 14px;
    border: 1px solid rgba(0, 0, 0, 0.05);

    .attr-label {
      font-weight: 600;
      color: #555;
      margin-right: 8px;
      min-width: 90px;
      flex-shrink: 0; // 不压缩标签
    }

    .attr-value {
      flex: 1;
      color: #2c2c2c;
      word-break: break-word; // 允许长文本换行
      line-height: 1.5; // 增加行高
    }
  }
}

// 战斗统计
.combat-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;

  .combat-item {
    display: flex;
    align-items: center;
    padding: 15px;
    background: #f8f5f0;
    border-radius: 6px;
    font-family: '临海体', serif;
    font-size: 14px;
    border: 1px solid rgba(139, 69, 19, 0.1);

    .combat-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #555;
      min-width: 140px;

      i {
        color: #8b4513;
        font-size: 14px;
      }
    }

    .combat-value {
      flex: 1;
      color: #2c2c2c;
      font-weight: 500;
    }
  }
}

// 描述部分
.description-section {
  margin-bottom: 25px;

  .section-title {
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
    color: #2c2c2c;
    font-family: '临海体', serif;
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 10px;
    border-bottom: 2px solid rgba(0, 0, 0, 0.08);

    i {
      color: #8b4513;
    }
  }

  .description-text {
    font-family: '临海体', serif;
    font-size: 15px;
    line-height: 1.8;
    color: #444;
    margin: 0;
    text-align: justify;
    white-space: pre-wrap;
  }
}

// 特殊规则
.special-rules {
  margin-top: 25px;

  .rule-item {
    padding: 15px;
    background: #fffbf5;
    border-left: 4px solid #8b4513;
    border-radius: 6px;
    margin-bottom: 15px;

    .rule-name {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 600;
      color: #8b4513;
      font-family: '临海体', serif;
    }

    .rule-content {
      margin: 0;
      font-family: '临海体', serif;
      font-size: 14px;
      line-height: 1.7;
      color: #444;
      white-space: pre-wrap;
    }
  }
}

// 笔记编辑器
.notes-editor {
  .note-field {
    margin-bottom: 20px;

    .note-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-family: '临海体', serif;
      font-size: 14px;
      font-weight: 600;
      color: #555;

      i {
        color: #8b4513;
      }
    }

    .note-input,
    .note-textarea {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 6px;
      font-family: '临海体', serif;
      font-size: 14px;
      background: #fff;
      transition: all 0.2s;

      &::placeholder {
        color: #bbb;
      }

      &:focus {
        outline: none;
        border-color: #8b4513;
        box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.08);
      }
    }

    .note-textarea {
      resize: vertical;
      line-height: 1.6;
    }
  }

  .save-notes-btn {
    width: 100%;
    padding: 15px;
    margin-bottom: 30px; // 确保按钮底部有足够空间
    background: #8b4513;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: '临海体', serif;
    font-size: 16px;
    font-weight: 600;

    &:hover {
      background: #6d3610;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
    }

    i {
      font-size: 16px;
    }
  }
}

// ==================== 遭遇记录 ====================
.encounter-section {
  padding: 25px;
  margin-bottom: 30px; // 确保底部有足够空间
  background: #fff;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.08);

  .section-title {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    color: #2c2c2c;
    font-family: '临海体', serif;
    display: flex;
    align-items: center;
    gap: 10px;

    i {
      color: #f39c12;
    }
  }

  .encounter-info {
    margin-bottom: 20px;

    .encounter-stat {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 15px;
      background: #f8f5f0;
      border-radius: 6px;
      margin-bottom: 10px;
      font-family: '临海体', serif;
      font-size: 14px;
      color: #555;
      word-break: break-word; // 允许长文本换行
      flex-wrap: wrap; // 允许内容换行

      i {
        color: #8b4513;
        font-size: 14px;
        flex-shrink: 0; // 图标不压缩
      }

      strong {
        color: #2c2c2c;
        font-weight: 700;
      }
    }

    .encounter-history {
      margin-top: 15px;

      .history-title {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
        color: #555;
        font-family: '临海体', serif;
      }

      .history-entry {
        display: flex;
        align-items: flex-start; // 改为顶部对齐
        gap: 10px;
        padding: 10px;
        background: #fafafa;
        border-radius: 4px;
        margin-bottom: 6px;
        font-size: 13px;
        font-family: '临海体', serif;
        flex-wrap: wrap; // 允许换行
        position: relative; // 为删除按钮定位

        .entry-badge {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          flex-shrink: 0; // 徽章不压缩
          white-space: nowrap; // 徽章文字不换行

          &.auto {
            background: #3498db;
          }

          &.manual {
            background: #2ecc71;
          }
        }

        .entry-time {
          color: #888;
          flex-shrink: 0; // 时间不压缩
          white-space: nowrap; // 时间不换行
        }

        .entry-context {
          flex: 1;
          min-width: 0; // 允许缩小
          color: #666;
          font-size: 12px;
          font-style: italic;
          word-break: break-word; // 长文本换行
          line-height: 1.5; // 增加行高
        }

        .delete-entry-btn {
          padding: 4px 8px;
          background: transparent;
          border: 1px solid #e74c3c;
          color: #e74c3c;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 11px;
          flex-shrink: 0;
          margin-left: auto; // 推到右边

          &:hover {
            background: #e74c3c;
            color: #fff;
            transform: scale(1.05);
          }

          i {
            font-size: 10px;
          }
        }
      }
    }
  }

  .no-encounter {
    padding: 30px;
    text-align: center;
    color: #999;
    font-family: '临海体', serif;
    font-size: 15px;

    i {
      font-size: 40px;
      margin-bottom: 10px;
      display: block;
    }
  }

  .encounter-btn {
    width: 100%;
    padding: 12px;
    background: #fff;
    color: #f39c12;
    border: 2px solid #f39c12;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: '临海体', serif;
    font-size: 14px;
    font-weight: 600;

    &:hover {
      background: #f39c12;
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
    }

    i {
      font-size: 14px;
    }
  }
}

// ==================== 底部占位空间 ====================
.bottom-spacer {
  height: 200px; // 超大占位高度，确保最后的内容完全可见
  flex-shrink: 0; // 防止被压缩
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .detail-content {
    padding: 20px;
  }

  .monster-header {
    flex-direction: column;
    padding: 20px;

    .monster-avatar-large {
      width: 100%;
      height: 250px;
    }

    .monster-basic-info {
      .action-buttons {
        flex-direction: column;

        .action-btn {
          width: 100%;
          justify-content: center;
        }
      }
    }
  }

  .attributes-grid {
    grid-template-columns: 1fr;
  }

  .tabs-header {
    .tab-btn {
      min-width: 100px;
      padding: 12px 15px;
      font-size: 13px;
    }
  }

  .tab-content .tab-pane {
    padding: 20px;
  }
}
</style>
