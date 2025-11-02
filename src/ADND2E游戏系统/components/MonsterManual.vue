<template>
  <!-- 怪物图鉴弹窗 - 性能优化版 -->
  <div v-if="visible" class="monster-manual-overlay">
    <div class="monster-manual">
      <!-- 顶部栏 -->
      <div class="manual-header">
        <button class="close-btn" @click="handleClose">✕</button>
        <div class="header-content">
          <div class="book-cover">
            <img src="https://p.sda1.dev/28/7456f5a04826b4817c6f2af3fea52996/demon.png" alt="怪物图鉴" />
          </div>
          <h1>怪物图鉴</h1>
          <p class="monster-count">共 {{ totalMonsters }} 种怪物</p>
        </div>
      </div>

      <!-- 搜索和筛选栏 -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索怪物名称..."
            class="search-input"
            @input="handleSearch"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">✕</button>
        </div>

        <!-- 快速筛选 -->
        <div class="quick-filters">
          <button
            v-for="letter in quickLetters"
            :key="letter"
            :class="['letter-btn', { active: selectedLetter === letter }]"
            @click="jumpToLetter(letter)"
          >
            {{ letter }}
          </button>
        </div>
      </div>

      <!-- 怪物列表 - 简化版本 (更流畅) -->
      <div ref="listContainer" class="monster-list" @scroll="handleScroll">
        <!-- 数据加载中 -->
        <div v-if="isLoadingMonsters" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>正在加载怪物数据...</p>
        </div>

        <!-- 加载错误 -->
        <div v-else-if="loadError" class="error-state">
          <div class="error-icon">⚠️</div>
          <p class="error-text">{{ loadError }}</p>
          <button class="retry-btn" @click="loadMonsterData">重试</button>
        </div>

        <!-- 数据已加载 -->
        <template v-else>
          <!-- 分组显示 -->
          <div v-for="group in visibleGroups" :key="group.letter" :data-letter="group.letter" class="monster-group">
            <!-- 字母标题 -->
            <div class="letter-header">
              <span class="letter">{{ group.letter }}</span>
              <span class="count">{{ group.monsters.length }} 种</span>
            </div>

            <!-- 怪物卡片 -->
            <div class="monster-grid">
              <div
                v-for="monster in group.monsters"
                :key="monster.id"
                :class="['monster-item', { expanded: expandedMonsterId === monster.id }]"
                :data-monster-id="monster.id"
                @click="toggleMonster(monster.id)"
              >
                <!-- 简要信息 -->
                <div class="monster-preview">
                  <div class="monster-name">
                    <strong>{{ monster.name }}</strong>
                    <span class="english-name">{{ monster.englishName }}</span>
                  </div>
                  <div class="monster-stats">
                    <span class="stat">AC {{ monster.armorClass }}</span>
                    <span class="stat">HD {{ monster.hitDice }}</span>
                    <span class="stat">XP {{ monster.xpValue }}</span>
                  </div>
                  <div class="expand-icon">{{ expandedMonsterId === monster.id ? '▲' : '▼' }}</div>
                </div>

                <!-- 详细信息 (仅在展开时渲染) -->
                <div v-if="expandedMonsterId === monster.id" class="monster-detail">
                  <MonsterCard :monster="monster" />
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredMonsters.length === 0 && !isLoadingMonsters" class="empty-state">
            <div class="empty-icon">🔍</div>
            <p class="empty-text">未找到匹配的怪物</p>
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
      <div class="manual-footer">
        <button class="footer-btn" @click="scrollToTop">
          <span>⬆</span>
          回到顶部
        </button>
        <div class="footer-info">
          {{
            selectedLetter
              ? `${selectedLetter} 系列: ${filteredMonsters.length} 种`
              : `筛选后: ${filteredMonsters.length} 种`
          }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { Monster } from '../utils/monsterData';
import MonsterCard from './MonsterCard.vue';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 状态
const searchQuery = ref('');
const selectedLetter = ref('A'); // 默认显示 A 系列怪物
const expandedMonsterId = ref<string | null>(null);
const isSearching = ref(false);
const listContainer = ref<HTMLElement | null>(null);
const scrollTop = ref(0);

// 怪物数据加载状态
const monsters = ref<Monster[]>([]);
const isLoadingMonsters = ref(false);
const loadError = ref<string | null>(null);

// 动态加载怪物数据
async function loadMonsterData() {
  if (monsters.value.length > 0) return; // 已加载

  isLoadingMonsters.value = true;
  loadError.value = null;

  try {
    const module = await import(/* webpackChunkName: "monsterData" */ '../utils/monsterData');
    monsters.value = module.monsters;
  } catch (error) {
    console.error('加载怪物数据失败:', error);
    loadError.value = '加载怪物数据失败，请刷新重试';
  } finally {
    isLoadingMonsters.value = false;
  }
}

// 当组件可见时加载数据
watch(
  () => props.visible,
  visible => {
    if (visible && monsters.value.length === 0) {
      loadMonsterData();
    }
  },
  { immediate: true },
);

// 常量
const VIEWPORT_BUFFER = 2; // 视口缓冲区（渲染额外的组数）

// 总怪物数
const totalMonsters = computed(() => monsters.value.length);

// 快速字母导航
const quickLetters = computed(() => {
  const letters = new Set<string>();
  monsters.value.forEach(m => {
    letters.add(m.englishName.charAt(0).toUpperCase());
  });
  return Array.from(letters).sort();
});

// 过滤后的怪物列表
const filteredMonsters = computed(() => {
  let result = monsters.value;

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(m => m.name.toLowerCase().includes(query) || m.englishName.toLowerCase().includes(query));
  }

  // 字母过滤
  if (selectedLetter.value) {
    result = result.filter(m => m.englishName.charAt(0).toUpperCase() === selectedLetter.value);
  }

  return result;
});

// 按字母分组
interface MonsterGroup {
  letter: string;
  monsters: Monster[];
}

const monsterGroups = computed<MonsterGroup[]>(() => {
  const groups = new Map<string, Monster[]>();

  filteredMonsters.value.forEach(monster => {
    const letter = monster.englishName.charAt(0).toUpperCase();
    if (!groups.has(letter)) {
      groups.set(letter, []);
    }
    groups.get(letter)!.push(monster);
  });

  // 按字母排序
  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([letter, monsters]) => ({
      letter,
      monsters,
    }));
});

// 可见的分组 (优化：只在搜索结果较多时限制显示)
const visibleGroups = computed(() => {
  // 如果总怪物数小于100，直接显示全部
  if (filteredMonsters.value.length <= 100) {
    return monsterGroups.value;
  }

  // 否则使用懒加载策略
  const container = listContainer.value;
  if (!container) return monsterGroups.value.slice(0, 3); // 初始显示前3组

  // 计算可见范围（基于滚动位置）
  const scrollRatio = scrollTop.value / (container.scrollHeight - container.clientHeight || 1);
  const totalGroups = monsterGroups.value.length;
  const centerIndex = Math.floor(scrollRatio * totalGroups);

  // 显示当前位置前后各 VIEWPORT_BUFFER 组
  const startIndex = Math.max(0, centerIndex - VIEWPORT_BUFFER);
  const endIndex = Math.min(totalGroups, centerIndex + VIEWPORT_BUFFER + 1);

  return monsterGroups.value.slice(startIndex, endIndex);
});

// 处理搜索
function handleSearch() {
  isSearching.value = true;
  // 防抖
  setTimeout(() => {
    isSearching.value = false;
  }, 300);
}

// 清除搜索
function clearSearch() {
  searchQuery.value = '';
  selectedLetter.value = '';
}

// 字母筛选
function jumpToLetter(letter: string) {
  selectedLetter.value = letter;
  expandedMonsterId.value = null;

  nextTick(() => {
    // 滚动到对应字母的 DOM 元素
    const element = listContainer.value?.querySelector(`[data-letter="${letter}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// 切换怪物展开/收起
function toggleMonster(monsterId: string) {
  if (expandedMonsterId.value === monsterId) {
    expandedMonsterId.value = null;
  } else {
    expandedMonsterId.value = monsterId;

    // 滚动到展开的怪物
    nextTick(() => {
      const element = document.querySelector(`[data-monster-id="${monsterId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
}

// 滚动处理
function handleScroll() {
  if (listContainer.value) {
    scrollTop.value = listContainer.value.scrollTop;
  }
}

// 回到顶部
function scrollToTop() {
  if (listContainer.value) {
    listContainer.value.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}

// 关闭弹窗
function handleClose() {
  emit('close');
}

// 监听弹窗打开，重置状态
watch(
  () => props.visible,
  visible => {
    if (visible) {
      searchQuery.value = '';
      selectedLetter.value = 'A'; // 重置为默认显示 A 系列
      expandedMonsterId.value = null;
      scrollTop.value = 0;
      if (listContainer.value) {
        listContainer.value.scrollTop = 0;
      }
    }
  },
);
</script>

<style lang="scss" scoped>
.monster-manual-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.85);
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

.monster-manual {
  background: #fff;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// 顶部栏
.manual-header {
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  color: #fff;
  padding: 24px 20px;
  position: relative;
  display: flex;
  cursor: move;
  user-select: none;
  justify-content: center;
  border-bottom: 3px solid #000;

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
      border: 2px solid #ffd700;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    h1 {
      font-family: 'Times New Roman', serif;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 2px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .monster-count {
      font-size: 14px;
      color: #ccc;
      margin: 0;
      letter-spacing: 1px;
    }
  }
}

// 搜索栏
.search-bar {
  background: #f8f8f8;
  padding: 16px;
  border-bottom: 2px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #000;
  }

  .search-icon {
    font-size: 18px;
    margin-right: 8px;
    color: #666;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px 8px;
    font-size: 15px;
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

    &:hover {
      background: #e0e0e0;
      color: #000;
    }
  }
}

.quick-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  .letter-btn {
    background: #fff;
    border: 2px solid #ddd;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    color: #555;
    min-width: 36px;

    &:hover {
      border-color: #999;
      background: #f5f5f5;
      color: #000;
    }

    &.active {
      background: #000;
      border-color: #000;
      color: #fff;
    }
  }
}

// 怪物列表
.monster-list {
  flex: 1;
  overflow-y: auto;
  background: #fafafa;
  position: relative;

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

.monster-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.letter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(135deg, #fff 0%, #f5f5f5 100%);
  border-bottom: 2px solid #000;
  position: sticky;
  top: 0;
  z-index: 10;

  .letter {
    font-size: 24px;
    font-weight: bold;
    color: #000;
    font-family: 'Times New Roman', serif;
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

.monster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  padding: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.monster-item {
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &.expanded {
    grid-column: 1 / -1;
    border-color: #000;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
}

.monster-preview {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  user-select: none;

  .monster-name {
    display: flex;
    flex-direction: column;
    gap: 4px;

    strong {
      font-size: 16px;
      font-weight: 700;
      color: #000;
      font-family: 'Times New Roman', serif;
    }

    .english-name {
      font-size: 12px;
      color: #999;
      font-style: italic;
    }
  }

  .monster-stats {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .stat {
      font-size: 11px;
      color: #666;
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      border: 1px solid #e0e0e0;
    }
  }

  .expand-icon {
    text-align: center;
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
}

.monster-detail {
  padding: 16px;
  background: #fafafa;
  border-top: 2px solid #e0e0e0;
  animation: expandDetail 0.3s ease;
}

@keyframes expandDetail {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 2000px;
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
  }
}

// 错误状态
.error-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 30px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-text {
    font-size: 16px;
    color: #d32f2f;
    margin: 0 0 16px 0;
  }

  .retry-btn {
    background: #d32f2f;
    color: #fff;
    border: none;
    padding: 10px 24px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #b71c1c;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 底部操作栏
.manual-footer {
  background: #f8f8f8;
  border-top: 2px solid #e0e0e0;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

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
  }
}

// 响应式
@media (max-width: 768px) {
  .monster-manual {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .manual-header {
    .header-content {
      .book-cover {
        width: 80px;
        height: 80px;
      }

      h1 {
        font-size: 22px;
      }
    }
  }

  .manual-footer {
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
