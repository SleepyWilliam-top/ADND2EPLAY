<template>
  <!-- 法术图鉴弹窗 -->
  <div v-if="visible" class="spell-compendium-overlay">
    <div class="spell-compendium">
      <!-- 顶部栏 -->
      <div class="compendium-header">
        <button class="close-btn" @click="handleClose">✕</button>
        <div class="header-content">
          <div class="book-cover">
            <img src="https://p.sda1.dev/28/0ce3f1432047dc9772bd0ed8871ac336/Spell.jpg" alt="法术图鉴" />
          </div>
          <h1>法术图鉴</h1>
          <p class="spell-count">{{ activeTab === 'wizard' ? '法师法术' : '祭司法术' }}: {{ totalCount }} 个</p>
        </div>
      </div>

      <!-- 标签页 -->
      <div class="tabs-bar">
        <button :class="['tab-btn', { active: activeTab === 'wizard' }]" @click="switchTab('wizard')">
          🔮 法师法术 ({{ allWizardSpells.length }})
        </button>
        <button :class="['tab-btn', { active: activeTab === 'priest' }]" @click="switchTab('priest')">
          ✨ 祭司法术 ({{ allPriestSpells.length }})
        </button>
      </div>

      <!-- 搜索和筛选栏 -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="search-input"
            @input="handleSearch"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">✕</button>
        </div>

        <!-- 等级筛选 -->
        <div class="level-filters">
          <button
            v-for="level in availableLevels"
            :key="level"
            :class="['level-btn', { active: selectedLevel === level }]"
            @click="toggleLevel(level)"
          >
            {{ level }}级
          </button>
          <button v-if="selectedLevel !== null" class="level-btn clear-filter" @click="clearLevelFilter">全部</button>
        </div>

        <!-- 学派/领域筛选 (仅在未选择等级时显示) -->
        <div v-if="selectedLevel === null" class="category-filters">
          <button
            v-for="category in availableCategories"
            :key="category"
            :class="['category-btn', { active: selectedCategory === category }]"
            @click="toggleCategory(category)"
          >
            {{ category }}
          </button>
          <button v-if="selectedCategory" class="category-btn clear-filter" @click="clearCategoryFilter">全部</button>
        </div>
      </div>

      <!-- 法术列表 -->
      <div ref="listContainer" class="spell-list" @scroll="handleScroll">
        <!-- 数据加载中 -->
        <div
          v-if="(activeTab === 'wizard' && isLoadingWizardSpells) || (activeTab === 'priest' && isLoadingPriestSpells)"
          class="loading-overlay"
        >
          <div class="loading-spinner"></div>
          <p>正在加载{{ activeTab === 'wizard' ? '法师' : '祭司' }}法术数据...</p>
        </div>

        <!-- 加载错误 -->
        <div v-else-if="loadError" class="error-state">
          <div class="error-icon">⚠️</div>
          <p class="error-text">{{ loadError }}</p>
          <button class="retry-btn" @click="activeTab === 'wizard' ? loadWizardSpellData() : loadPriestSpellData()">
            重试
          </button>
        </div>

        <!-- 数据已加载 -->
        <template v-else>
          <!-- 分组显示 -->
          <div v-for="group in visibleGroups" :key="group.level" :data-level="group.level" class="spell-group">
            <!-- 等级标题 -->
            <div class="level-header">
              <span class="level">{{ group.level }}级法术</span>
              <span class="count">{{ group.spells.length }} 个</span>
            </div>

            <!-- 法术卡片 -->
            <div class="spell-grid">
              <SpellCard
                v-for="spell in group.spells"
                :key="spell.id"
                :spell="spell"
                @click="handleSpellClick(spell)"
              />
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredSpells.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <p class="empty-text">未找到匹配的法术</p>
            <button class="reset-btn" @click="clearSearch">清除搜索</button>
          </div>

          <!-- 加载提示 -->
          <div v-if="isSearching" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p>搜索中...</p>
          </div>
        </template>
      </div>

      <!-- 底部操作栏 -->
      <div class="compendium-footer">
        <button class="footer-btn" @click="scrollToTop">
          <span>⬆</span>
          回到顶部
        </button>
        <div class="footer-info">
          {{ filteredSpells.length === totalCount ? '显示全部' : `筛选后: ${filteredSpells.length}` }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { PriestSpell } from '../utils/priestSpellData';
import type { WizardSpell } from '../utils/wizardSpellData';
import SpellCard from './SpellCard.vue';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 状态
const activeTab = ref<'wizard' | 'priest'>('wizard');
const searchQuery = ref('');
const selectedLevel = ref<number | null>(null);
const selectedCategory = ref<string>('');
const isSearching = ref(false);
const listContainer = ref<HTMLElement | null>(null);
const scrollTop = ref(0);

// 法术数据加载状态
const wizardSpells = ref<WizardSpell[]>([]);
const priestSpells = ref<PriestSpell[]>([]);
const isLoadingWizardSpells = ref(false);
const isLoadingPriestSpells = ref(false);
const loadError = ref<string | null>(null);

// 动态加载法师法术数据
async function loadWizardSpellData() {
  if (wizardSpells.value.length > 0) return; // 已加载

  isLoadingWizardSpells.value = true;
  loadError.value = null;

  try {
    const module = await import(/* webpackChunkName: "wizardSpellData" */ '../utils/wizardSpellData');
    wizardSpells.value = [
      ...module.getAllWizardLevel1Spells(),
      ...module.getAllWizardLevel2Spells(),
      ...module.getAllWizardLevel3Spells(),
      ...module.getAllWizardLevel4Spells(),
      ...module.getAllWizardLevel5Spells(),
      ...module.getAllWizardLevel6Spells(),
      ...module.getAllWizardLevel7Spells(),
      ...module.getAllWizardLevel8Spells(),
      ...module.getAllWizardLevel9Spells(),
    ];
  } catch (error) {
    console.error('加载法师法术数据失败:', error);
    loadError.value = '加载法师法术数据失败，请刷新重试';
  } finally {
    isLoadingWizardSpells.value = false;
  }
}

// 动态加载祭司法术数据
async function loadPriestSpellData() {
  if (priestSpells.value.length > 0) return; // 已加载

  isLoadingPriestSpells.value = true;
  loadError.value = null;

  try {
    const module = await import(/* webpackChunkName: "priestSpellData" */ '../utils/priestSpellData');
    priestSpells.value = [
      ...module.getAllPriestLevel1Spells(),
      ...module.getAllPriestLevel2Spells(),
      ...module.getAllPriestLevel3Spells(),
      ...module.getAllPriestLevel4Spells(),
      ...module.getAllPriestLevel5Spells(),
      ...module.getAllPriestLevel6Spells(),
      ...module.getAllPriestLevel7Spells(),
    ];
  } catch (error) {
    console.error('加载祭司法术数据失败:', error);
    loadError.value = '加载祭司法术数据失败，请刷新重试';
  } finally {
    isLoadingPriestSpells.value = false;
  }
}

// 当组件可见时加载数据
watch(
  () => props.visible,
  visible => {
    if (visible) {
      if (activeTab.value === 'wizard' && wizardSpells.value.length === 0) {
        loadWizardSpellData();
      } else if (activeTab.value === 'priest' && priestSpells.value.length === 0) {
        loadPriestSpellData();
      }
    }
  },
  { immediate: true },
);

// 切换标签时加载对应数据
watch(activeTab, tab => {
  if (props.visible) {
    if (tab === 'wizard' && wizardSpells.value.length === 0) {
      loadWizardSpellData();
    } else if (tab === 'priest' && priestSpells.value.length === 0) {
      loadPriestSpellData();
    }
  }
});

// 常量
const VIEWPORT_BUFFER = 2;

// 获取所有法师法术
const allWizardSpells = computed<WizardSpell[]>(() => wizardSpells.value);

// 获取所有祭司法术
const allPriestSpells = computed<PriestSpell[]>(() => priestSpells.value);

// 当前数据源
type Spell = WizardSpell | PriestSpell;

const currentSpells = computed<Spell[]>(() => {
  return activeTab.value === 'wizard' ? allWizardSpells.value : allPriestSpells.value;
});

// 总数
const totalCount = computed(() => currentSpells.value.length);

// 搜索占位符
const searchPlaceholder = computed(() => {
  return activeTab.value === 'wizard' ? '搜索法师法术名称或描述...' : '搜索祭司法术名称或描述...';
});

// 可用等级
const availableLevels = computed(() => {
  const levels = new Set<number>();
  currentSpells.value.forEach(spell => levels.add(spell.level));
  return Array.from(levels).sort((a, b) => a - b);
});

// 可用分类（学派或领域）
const availableCategories = computed(() => {
  const categories = new Set<string>();
  if (activeTab.value === 'wizard') {
    (currentSpells.value as WizardSpell[]).forEach(spell => {
      categories.add(spell.school);
    });
  } else {
    (currentSpells.value as PriestSpell[]).forEach(spell => {
      spell.sphere.forEach(s => categories.add(s));
    });
  }
  return Array.from(categories).sort();
});

// 过滤后的法术列表
const filteredSpells = computed(() => {
  let result = currentSpells.value;

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      spell =>
        spell.name.toLowerCase().includes(query) ||
        spell.englishName.toLowerCase().includes(query) ||
        spell.description.toLowerCase().includes(query),
    );
  }

  // 等级过滤
  if (selectedLevel.value !== null) {
    result = result.filter(spell => spell.level === selectedLevel.value);
  }

  // 学派/领域过滤
  if (selectedCategory.value) {
    if (activeTab.value === 'wizard') {
      result = result.filter(spell => (spell as WizardSpell).school === selectedCategory.value);
    } else {
      result = result.filter(spell => (spell as PriestSpell).sphere.includes(selectedCategory.value));
    }
  }

  return result;
});

// 按等级分组
interface SpellGroup {
  level: number;
  spells: Spell[];
}

const spellGroups = computed<SpellGroup[]>(() => {
  const groups = new Map<number, Spell[]>();

  filteredSpells.value.forEach(spell => {
    const level = spell.level;
    if (!groups.has(level)) {
      groups.set(level, []);
    }
    groups.get(level)!.push(spell);
  });

  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([level, spells]) => ({
      level,
      spells,
    }));
});

// 可见的分组
const visibleGroups = computed(() => {
  if (filteredSpells.value.length <= 100) {
    return spellGroups.value;
  }

  const container = listContainer.value;
  if (!container) return spellGroups.value.slice(0, 3);

  const scrollRatio = scrollTop.value / (container.scrollHeight - container.clientHeight || 1);
  const totalGroups = spellGroups.value.length;
  const centerIndex = Math.floor(scrollRatio * totalGroups);

  const startIndex = Math.max(0, centerIndex - VIEWPORT_BUFFER);
  const endIndex = Math.min(totalGroups, centerIndex + VIEWPORT_BUFFER + 1);

  return spellGroups.value.slice(startIndex, endIndex);
});

// 切换标签页
function switchTab(tab: 'wizard' | 'priest') {
  activeTab.value = tab;
  searchQuery.value = '';
  selectedLevel.value = null;
  selectedCategory.value = '';
  scrollTop.value = 0;
  if (listContainer.value) {
    listContainer.value.scrollTop = 0;
  }
}

// 处理搜索
function handleSearch() {
  isSearching.value = true;
  setTimeout(() => {
    isSearching.value = false;
  }, 300);
}

// 清除搜索
function clearSearch() {
  searchQuery.value = '';
  selectedLevel.value = null;
  selectedCategory.value = '';
}

// 等级筛选
function toggleLevel(level: number) {
  if (selectedLevel.value === level) {
    selectedLevel.value = null;
  } else {
    selectedLevel.value = level;
    selectedCategory.value = ''; // 清除分类筛选
  }

  nextTick(() => {
    if (selectedLevel.value !== null) {
      const element = listContainer.value?.querySelector(`[data-level="${level}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
}

// 清除等级筛选
function clearLevelFilter() {
  selectedLevel.value = null;
}

// 分类筛选
function toggleCategory(category: string) {
  if (selectedCategory.value === category) {
    selectedCategory.value = '';
  } else {
    selectedCategory.value = category;
  }
}

// 清除分类筛选
function clearCategoryFilter() {
  selectedCategory.value = '';
}

// 处理法术点击
function handleSpellClick(spell: Spell) {
  // 这里可以添加法术详情展示逻辑
  console.log('Clicked spell:', spell);
}

// 滚动处理
function handleScroll(event: Event) {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
}

// 回到顶部
function scrollToTop() {
  listContainer.value?.scrollTo({ top: 0, behavior: 'smooth' });
}

// 关闭弹窗
function handleClose() {
  emit('close');
}

// 监听可见性变化
watch(
  () => props.visible,
  visible => {
    if (visible) {
      // 重置状态
      activeTab.value = 'wizard';
      searchQuery.value = '';
      selectedLevel.value = null;
      selectedCategory.value = '';
      scrollTop.value = 0;
      if (listContainer.value) {
        listContainer.value.scrollTop = 0;
      }
    }
  },
);
</script>

<style lang="scss" scoped>
// 黑白风格的弹窗样式
.spell-compendium-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.spell-compendium {
  background-color: #fff;
  border: 3px solid #000;
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border: 1px solid #666;
    pointer-events: none;
    z-index: 1;
  }
}

// 顶部栏
.compendium-header {
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  color: #fff;
  padding: 24px 20px;
  position: relative;
  display: flex;
  cursor: move;
  user-select: none;
  justify-content: center;
  border-bottom: 3px solid #000;
  z-index: 2;

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
      transform: rotate(90deg);
    }
  }

  .header-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .book-cover {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      overflow: hidden;
      background: #000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      border: 2px solid #9370db;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 60px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    h1 {
      font-family: '临海体', serif;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 2px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .spell-count {
      font-size: 14px;
      color: #ccc;
      margin: 0;
      letter-spacing: 1px;
    }
  }
}

// 标签页
.tabs-bar {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 2px solid #000;
  z-index: 2;
  position: relative;

  .tab-btn {
    flex: 1;
    padding: 14px 16px;
    border: none;
    border-right: 2px solid #ccc;
    background-color: #e0e0e0;
    font-family: '临海体', serif;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    color: #666;

    &:last-child {
      border-right: none;
    }

    &:hover {
      background-color: #d0d0d0;
    }

    &.active {
      background-color: #fff;
      color: #000;
      border-bottom: 3px solid #fff;
      margin-bottom: -3px;
    }
  }
}

// 搜索栏
.search-bar {
  padding: 14px 16px;
  background-color: #f9f9f9;
  border-bottom: 2px solid #ccc;
  z-index: 2;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #000;
  border-radius: 4px;
  padding: 0 10px;

  &:focus-within {
    border-color: #333;
    box-shadow: 0 0 0 1px #333;
  }

  .search-icon {
    font-size: 16px;
    color: #666;
    margin-right: 8px;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 10px 8px;
    font-family: '临海体', serif;
    font-size: 14px;
    outline: none;

    &::placeholder {
      color: #aaa;
    }
  }

  .clear-btn {
    background: #f0f0f0;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 14px;
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #e0e0e0;
      color: #000;
    }
  }
}

// 等级筛选
.level-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .level-btn {
    padding: 6px 14px;
    border: 2px solid #000;
    background-color: #fff;
    font-family: '临海体', serif;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.15s;
    color: #000;
    border-radius: 4px;

    &:hover {
      background-color: #e0e0e0;
    }

    &.active {
      background-color: #000;
      color: #fff;
    }

    &.clear-filter {
      background-color: #f5f5f5;
      border-color: #999;
      color: #666;

      &:hover {
        background-color: #e0e0e0;
        border-color: #666;
        color: #000;
      }
    }
  }
}

// 分类筛选
.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f0f0;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;

    &:hover {
      background: #999;
    }
  }

  .category-btn {
    padding: 5px 12px;
    border: 1px solid #000;
    background-color: #fff;
    font-family: '临海体', serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    color: #000;
    border-radius: 3px;
    white-space: nowrap;

    &:hover {
      background-color: #f0f0f0;
    }

    &.active {
      background-color: #000;
      color: #fff;
    }

    &.clear-filter {
      background-color: #f5f5f5;
      border-color: #999;
      color: #666;

      &:hover {
        background-color: #e0e0e0;
        border-color: #666;
        color: #000;
      }
    }
  }
}

// 法术列表
.spell-list {
  flex: 1;
  overflow-y: auto;
  background-color: #fafafa;
  position: relative;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f0f0;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 5px;

    &:hover {
      background: #999;
    }
  }
}

.spell-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.level-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fff 0%, #f5f5f5 100%);
  border: 2px solid #000;
  margin-bottom: 12px;
  position: sticky;
  top: -16px;
  z-index: 10;

  .level {
    font-size: 20px;
    font-weight: bold;
    color: #000;
    font-family: '临海体', serif;
  }

  .count {
    font-size: 13px;
    color: #666;
    background: #fff;
    padding: 4px 12px;
    border-radius: 12px;
    border: 1px solid #ddd;
  }
}

.spell-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

// 空状态
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 40px;

  .empty-icon {
    font-size: 80px;
    opacity: 0.2;
    margin-bottom: 16px;
  }

  .empty-text {
    font-size: 16px;
    color: #999;
    margin-bottom: 20px;
    font-family: '临海体', serif;
  }

  .reset-btn {
    background: #000;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: '临海体', serif;

    &:hover {
      background: #333;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
  }
}

// 加载状态
.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #000;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f0f0f0;
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 12px;
  }

  p {
    font-size: 14px;
    color: #666;
    margin: 0;
    font-family: '临海体', serif;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 底部操作栏
.compendium-footer {
  background-color: #f8f8f8;
  border-top: 2px solid #e0e0e0;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;

  .footer-btn {
    background: #000;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: '临海体', serif;

    &:hover {
      background: #333;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    span {
      font-size: 16px;
    }
  }

  .footer-info {
    font-size: 13px;
    color: #666;
    font-weight: 500;
    font-family: '临海体', serif;
  }
}

// 响应式
@media (max-width: 768px) {
  .spell-compendium {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .compendium-header {
    .header-content {
      .book-cover {
        width: 80px;
        height: 80px;
        font-size: 40px;
      }

      h1 {
        font-size: 22px;
      }
    }
  }

  .compendium-footer {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;

    .footer-btn {
      justify-content: center;
    }

    .footer-info {
      text-align: center;
    }
  }
}
</style>
