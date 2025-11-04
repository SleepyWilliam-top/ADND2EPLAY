<template>
  <div v-if="modelValue" class="monster-encyclopedia-overlay">
    <div class="monster-encyclopedia-modal">
      <!-- 装饰图片（只在索引和列表视图显示） -->
      <div v-if="currentView !== 'detail'" class="decoration-header">
        <img
          src="https://p.sda1.dev/28/53ad65463dfd09d3f2cb029c6d6aa26e/demon.png"
          alt="Demon"
          class="demon-decoration"
        />
      </div>

      <!-- 模态框头部（只在索引和列表视图显示） -->
      <div v-if="currentView !== 'detail'" class="modal-header">
        <h2 class="modal-title">
          <i class="fas fa-dragon"></i>
          怪物图鉴
        </h2>
        <button class="close-btn" @click="emit('update:modelValue', false)">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <!-- 索引视图 -->
      <div v-if="currentView === 'index'" class="index-view">
        <!-- 搜索栏 -->
        <div class="search-bar">
          <i class="fas fa-magnifying-glass search-icon"></i>
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="搜索怪物..."
            @input="handleSearch"
          />
        </div>

        <!-- 浏览方式选择器 -->
        <div class="browse-mode-selector">
          <label class="selector-label">浏览方式:</label>
          <select v-model="browseMode" class="mode-select">
            <option value="letter">按首字母</option>
            <option value="series">按系列</option>
          </select>
        </div>

        <!-- 分类索引 -->
        <div class="category-index">
          <!-- 按首字母 -->
          <div v-if="browseMode === 'letter'" class="letter-grid">
            <button
              v-for="category in letterIndex"
              :key="category.id"
              class="category-button"
              :class="{ empty: category.count === 0 }"
              :disabled="category.count === 0"
              @click="handleCategoryClick(category.id)"
            >
              <span class="category-label">{{ category.label }}</span>
              <span class="category-count">({{ category.count }})</span>
            </button>
          </div>

          <!-- 按系列 -->
          <div v-else class="series-list">
            <button
              v-for="category in seriesIndex"
              :key="category.id"
              class="series-item"
              @click="handleCategoryClick(category.id)"
            >
              <i :class="['fas', category.icon]" class="series-icon"></i>
              <div class="series-info">
                <span class="series-label">{{ category.label }}</span>
                <span class="series-count">({{ category.count }})</span>
              </div>
              <i class="fas fa-chevron-right arrow-icon"></i>
            </button>
          </div>
        </div>

        <!-- 快捷筛选 -->
        <div class="quick-filters">
          <h3 class="filter-title">
            <i class="fas fa-bolt"></i>
            快捷筛选
          </h3>
          <button class="filter-button" @click="handleQuickFilter('encountered')">
            <i class="fas fa-star filter-icon"></i>
            <span class="filter-label">已遭遇</span>
            <span class="filter-count">({{ encounteredCount }})</span>
            <i class="fas fa-chevron-right arrow-icon"></i>
          </button>
          <button class="filter-button" @click="handleQuickFilter('notes')">
            <i class="fas fa-note-sticky filter-icon"></i>
            <span class="filter-label">有笔记</span>
            <span class="filter-count">({{ notesCount }})</span>
            <i class="fas fa-chevron-right arrow-icon"></i>
          </button>
          <button class="filter-button" @click="handleQuickFilter('customImage')">
            <i class="fas fa-image filter-icon"></i>
            <span class="filter-label">自定义图片</span>
            <span class="filter-count">({{ customImageCount }})</span>
            <i class="fas fa-chevron-right arrow-icon"></i>
          </button>
        </div>

        <!-- 底部占位空间，确保内容完全可见 -->
        <div class="bottom-spacer"></div>
      </div>

      <!-- 列表视图 -->
      <MonsterListView
        v-else-if="currentView === 'list'"
        :monsters="currentMonsters"
        :category-label="currentCategoryLabel"
        @back="handleBack"
        @select="handleMonsterSelect"
      />

      <!-- 详情视图 -->
      <MonsterDetailView
        v-else-if="currentView === 'detail'"
        :monster="selectedMonster"
        @back="handleBackToList"
        @close="emit('update:modelValue', false)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  cleanupAutoDetection,
  generateLetterIndex,
  generateSeriesIndex,
  getEncounteredMonsters,
  getMonstersByCategory,
  getMonstersWithCustomImage,
  getMonstersWithNotes,
  searchMonsters,
  type BrowseMode,
  type CategoryIndex,
  type Monster,
} from '../composables/useMonsterEncyclopedia';
import MonsterDetailView from './MonsterDetailView.vue';
import MonsterListView from './MonsterListView.vue';

// ==================== Props & Emits ====================

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// ==================== 状态管理 ====================

type ViewMode = 'index' | 'list' | 'detail';

const currentView = ref<ViewMode>('index');
const browseMode = ref<BrowseMode>('letter');
const searchKeyword = ref('');
const selectedCategoryId = ref('');
const currentMonsters = ref<Monster[]>([]);
const currentCategoryLabel = ref('');
const selectedMonster = ref<Monster | null>(null);

// 快捷筛选统计
const encounteredCount = ref(0);
const notesCount = ref(0);
const customImageCount = ref(0);

// ==================== 索引数据 ====================

const letterIndex = ref<CategoryIndex[]>([]);
const seriesIndex = ref<CategoryIndex[]>([]);

// ==================== 生命周期 ====================

onMounted(async () => {
  // 生成索引（这些是同步操作，不需要 await）
  letterIndex.value = generateLetterIndex();
  seriesIndex.value = generateSeriesIndex();

  // 异步加载快捷筛选统计（不阻塞）
  loadQuickFilterStats().catch(error => {
    console.error('[MonsterEncyclopedia] 加载快捷筛选统计失败:', error);
  });

  // 不在这里初始化自动遭遇检测，避免卡顿
  // 自动检测功能只在需要时才启动
});

onBeforeUnmount(() => {
  // 清理自动遭遇检测
  cleanupAutoDetection();
});

// 监听模态框打开/关闭
watch(
  () => props.modelValue,
  async newValue => {
    if (newValue) {
      // 重置视图
      currentView.value = 'index';
      searchKeyword.value = '';
      selectedCategoryId.value = '';
      currentMonsters.value = [];
      selectedMonster.value = null;

      // 重新加载数据
      letterIndex.value = generateLetterIndex();
      seriesIndex.value = generateSeriesIndex();
      await loadQuickFilterStats();
    }
  },
);

// ==================== 方法 ====================

/**
 * 加载快捷筛选统计
 */
async function loadQuickFilterStats() {
  try {
    const [encountered, withNotes, withImage] = await Promise.all([
      getEncounteredMonsters(),
      getMonstersWithNotes(),
      getMonstersWithCustomImage(),
    ]);

    encounteredCount.value = encountered.length;
    notesCount.value = withNotes.length;
    customImageCount.value = withImage.length;
  } catch (error) {
    console.error('[MonsterEncyclopedia] 加载快捷筛选统计失败:', error);
  }
}

/**
 * 处理搜索（防抖）
 */
const handleSearch = useDebounceFn(() => {
  if (!searchKeyword.value.trim()) {
    return;
  }

  const results = searchMonsters(searchKeyword.value);
  currentMonsters.value = results;
  currentCategoryLabel.value = `搜索结果 (共 ${results.length} 个)`;
  currentView.value = 'list';
}, 300);

/**
 * 处理分类点击
 */
function handleCategoryClick(categoryId: string) {
  selectedCategoryId.value = categoryId;
  const monsters = getMonstersByCategory(categoryId, browseMode.value);
  currentMonsters.value = monsters;

  if (browseMode.value === 'letter') {
    currentCategoryLabel.value = `字母 ${categoryId} 的怪物 (共 ${monsters.length} 个)`;
  } else {
    currentCategoryLabel.value = `${categoryId} 系列 (共 ${monsters.length} 个)`;
  }

  currentView.value = 'list';
}

/**
 * 处理快捷筛选
 */
async function handleQuickFilter(type: 'encountered' | 'notes' | 'customImage') {
  let monsters: Monster[] = [];
  let label = '';

  try {
    switch (type) {
      case 'encountered':
        monsters = await getEncounteredMonsters();
        label = `已遭遇的怪物 (共 ${monsters.length} 个)`;
        break;
      case 'notes':
        monsters = await getMonstersWithNotes();
        label = `有笔记的怪物 (共 ${monsters.length} 个)`;
        break;
      case 'customImage':
        monsters = await getMonstersWithCustomImage();
        label = `自定义图片的怪物 (共 ${monsters.length} 个)`;
        break;
    }

    currentMonsters.value = monsters;
    currentCategoryLabel.value = label;
    currentView.value = 'list';
  } catch (error) {
    console.error('[MonsterEncyclopedia] 快捷筛选失败:', error);
  }
}

/**
 * 处理返回索引
 */
function handleBack() {
  currentView.value = 'index';
  searchKeyword.value = '';
}

/**
 * 处理返回列表
 */
function handleBackToList() {
  currentView.value = 'list';
  selectedMonster.value = null;
}

/**
 * 处理怪物选择
 */
function handleMonsterSelect(monster: Monster) {
  selectedMonster.value = monster;
  currentView.value = 'detail';
}

// 已移除点击遮罩关闭功能，防止误触
</script>

<style scoped lang="scss">
// ==================== 遮罩层 ====================
.monster-encyclopedia-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
  padding: 20px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// ==================== 模态框主体 ====================
.monster-encyclopedia-modal {
  background-color: #fff;
  border: 3px solid #2c2c2c;
  border-radius: 12px;
  width: 96vw; // 超大宽度，几乎占满屏幕
  max-width: 1800px; // 超大最大宽度
  height: 94vh; // 超大高度，几乎占满屏幕
  max-height: 94vh; // 最大高度与固定高度一致
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  position: relative;
  overflow: hidden; // 重要：防止内容溢出

  // 柔和的内边框
  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    pointer-events: none;
    z-index: 1;
    border-radius: 8px;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// ==================== 装饰图片 ====================
.decoration-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 20px 8px; // 进一步减少顶部 padding
  background: linear-gradient(to bottom, #f8f8f8, #fff);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 2;
  position: relative;
  flex-shrink: 0; // 防止被压缩

  .demon-decoration {
    height: 90px; // 从 100px 减少到 90px，节省更多空间
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
    animation: float 3s ease-in-out infinite;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

// ==================== 头部 ====================
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 30px; // 从 15px 进一步减少到 12px
  border-bottom: 2px solid rgba(0, 0, 0, 0.08);
  background-color: #fff;
  z-index: 2;
  position: relative;
  flex-shrink: 0; // 防止被压缩

  .modal-title {
    margin: 0;
    font-size: 22px; // 从 24px 减少到 22px
    color: #2c2c2c;
    font-family: '临海体', serif;
    font-weight: 700;
    letter-spacing: 2px;
    display: flex;
    align-items: center;
    gap: 10px;

    i {
      color: #8b4513;
      font-size: 26px; // 从 28px 减少到 26px
    }
  }

  .close-btn {
    background: none;
    border: 2px solid rgba(0, 0, 0, 0.15);
    color: #666;
    font-size: 20px;
    width: 40px;
    height: 40px;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #f5f5f5;
      border-color: #2c2c2c;
      color: #2c2c2c;
      transform: rotate(90deg);
    }
  }
}

// ==================== 索引视图 ====================
.index-view {
  flex: 1;
  overflow-y: scroll; // 强制显示滚动条
  overflow-x: hidden;
  padding: 25px 30px 20px 30px; // 减少底部 padding，因为有占位元素
  background: #fafafa;
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

// 搜索栏
.search-bar {
  position: relative;
  margin-bottom: 25px;

  .search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    font-size: 16px;
  }

  .search-input {
    width: 100%;
    padding: 12px 15px 12px 45px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font-family: '临海体', serif;
    font-size: 15px;
    background: #fff;
    transition: all 0.2s;

    &::placeholder {
      color: #bbb;
    }

    &:focus {
      outline: none;
      border-color: #8b4513;
      box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
    }
  }
}

// 浏览方式选择器
.browse-mode-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 25px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);

  .selector-label {
    font-family: '临海体', serif;
    font-size: 15px;
    font-weight: 600;
    color: #555;
  }

  .mode-select {
    flex: 1;
    padding: 10px 15px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    font-family: '临海体', serif;
    font-size: 14px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #8b4513;
    }

    &:focus {
      outline: none;
      border-color: #8b4513;
      box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
    }
  }
}

// 分类索引
.category-index {
  margin-bottom: 30px;
}

// 首字母网格
.letter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 12px;

  .category-button {
    padding: 15px 10px;
    background: #fff;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    font-family: '临海体', serif;

    &:hover:not(.empty) {
      border-color: #8b4513;
      background: #f8f5f0;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
    }

    &:active:not(.empty) {
      transform: translateY(0);
    }

    &.empty {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .category-label {
      font-size: 22px;
      font-weight: 700;
      color: #2c2c2c;
    }

    .category-count {
      font-size: 13px;
      color: #888;
    }
  }
}

// 系列列表
.series-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .series-item {
    padding: 18px 20px;
    background: #fff;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 15px;
    font-family: '临海体', serif;

    &:hover {
      border-color: #8b4513;
      background: #f8f5f0;
      transform: translateX(5px);
      box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
    }

    .series-icon {
      font-size: 24px;
      color: #8b4513;
      min-width: 30px;
      text-align: center;
    }

    .series-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;

      .series-label {
        font-size: 16px;
        font-weight: 600;
        color: #2c2c2c;
      }

      .series-count {
        font-size: 14px;
        color: #888;
      }
    }

    .arrow-icon {
      color: #bbb;
      font-size: 14px;
    }
  }
}

// 快捷筛选
.quick-filters {
  padding: 20px;
  margin-bottom: 30px; // 确保底部有足够空间
  background: #fff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);

  .filter-title {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 600;
    color: #555;
    font-family: '临海体', serif;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: #f39c12;
    }
  }

  .filter-button {
    width: 100%;
    padding: 15px 18px;
    background: #fafafa;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
    font-family: '临海体', serif;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: #f8f5f0;
      border-color: #8b4513;
      transform: translateX(3px);
    }

    .filter-icon {
      font-size: 18px;
      color: #8b4513;
      min-width: 24px;
      text-align: center;
    }

    .filter-label {
      flex: 1;
      font-size: 15px;
      font-weight: 500;
      color: #2c2c2c;
      text-align: left;
    }

    .filter-count {
      font-size: 14px;
      color: #888;
    }

    .arrow-icon {
      color: #bbb;
      font-size: 12px;
    }
  }
}

// ==================== 底部占位空间 ====================
.bottom-spacer {
  height: 200px; // 超大占位高度，确保最后的内容完全可见
  flex-shrink: 0; // 防止被压缩
}

// ==================== 响应式 ====================
@media (max-width: 992px) {
  .monster-encyclopedia-modal {
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    border-radius: 0;
    border: none;
  }

  .decoration-header .demon-decoration {
    height: 100px;
  }

  .modal-header {
    padding: 15px 20px;

    .modal-title {
      font-size: 22px;

      i {
        font-size: 26px;
      }
    }
  }

  .index-view {
    padding: 20px;
  }

  .letter-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 10px;
  }
}
</style>
