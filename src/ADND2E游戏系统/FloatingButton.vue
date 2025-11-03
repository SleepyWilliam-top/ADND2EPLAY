<template>
  <div class="floating-container">
    <!-- 悬浮按钮 -->
    <button class="floating-button" :title="isOpen ? '关闭设置' : '打开设置'" @click="togglePanel">
      <span class="icon" :class="{ rotating: isOpen }"><i class="fa-solid fa-gear"></i></span>
    </button>

    <!-- 设置面板 -->
    <transition name="slide-fade">
      <div v-if="isOpen" class="settings-panel">
        <div class="panel-header">
          <h3>缓存管理</h3>
          <button class="close-button" @click="togglePanel">×</button>
        </div>

        <div class="panel-content">
          <!-- 角色存档数据 -->
          <div class="cache-section">
            <h4 class="section-title">角色存档数据</h4>
            <div class="cache-item">
              <div class="cache-info">
                <span class="cache-label">存档大小</span>
                <span class="cache-size">{{ cacheSize }}</span>
              </div>
              <button class="delete-button adnd-button-small danger" @click="confirmClearCache">清除存档</button>
            </div>
            <div class="section-note">
              <p>⚠ 清除存档将删除所有游戏进度，此操作不可逆！</p>
            </div>
          </div>

          <!-- 自定义种族数据 -->
          <div class="cache-section">
            <div class="section-header">
              <h4 class="section-title">自定义种族 ({{ customRaces.length }})</h4>
              <button
                v-if="customRaces.length > 0"
                class="clear-all-button"
                title="清除所有自定义种族"
                @click="confirmClearAllRaces"
              >
                清空
              </button>
            </div>

            <div v-if="customRaces.length === 0" class="empty-state">
              <p>暂无自定义种族</p>
            </div>

            <div v-else class="custom-races-list">
              <div v-for="race in customRaces" :key="race.id" class="race-item">
                <div class="race-info">
                  <span class="race-icon">{{ race.icon }}</span>
                  <div class="race-details">
                    <span class="race-name">{{ race.name }}</span>
                    <span class="race-english">{{ race.englishName }}</span>
                  </div>
                </div>
                <button class="delete-race-button" title="删除此种族" @click="confirmDeleteRace(race)">×</button>
              </div>
            </div>

            <div v-if="customRaces.length > 0" class="section-note">
              <p>💡 删除的自定义种族可以重新创建</p>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 遮罩层 -->
    <transition name="fade">
      <div v-if="isOpen" class="overlay" @click="togglePanel"></div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { clearAllData } from './composables/usePersistence';
import type { Race } from './utils/raceData';

const isOpen = ref(false);
const cacheSize = ref('0 KB');
const customRaces = ref<Race[]>([]);

onMounted(() => {
  updateCacheSize();
  loadCustomRaces();
});

function togglePanel() {
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    updateCacheSize();
    loadCustomRaces();
  }
}

function updateCacheSize() {
  try {
    const variables = getVariables({ type: 'character' });
    const jsonString = JSON.stringify(variables || {});
    const size = new Blob([jsonString]).size;

    if (size < 1024) {
      cacheSize.value = `${size} B`;
    } else if (size < 1024 * 1024) {
      cacheSize.value = `${(size / 1024).toFixed(2)} KB`;
    } else {
      cacheSize.value = `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  } catch (error) {
    console.error('计算缓存大小失败:', error);
    cacheSize.value = '未知';
  }
}

// 加载自定义种族列表
function loadCustomRaces() {
  try {
    const savedRaces = getVariables({ type: 'global' });
    if (savedRaces && savedRaces['adnd2e_custom_races']) {
      customRaces.value = savedRaces['adnd2e_custom_races'] as Race[];
    } else {
      customRaces.value = [];
    }
  } catch (error) {
    console.error('加载自定义种族失败:', error);
    customRaces.value = [];
  }
}

// 保存自定义种族列表
async function saveCustomRaces() {
  try {
    await replaceVariables(
      {
        adnd2e_custom_races: customRaces.value,
      },
      { type: 'global' },
    );
  } catch (error) {
    console.error('保存自定义种族失败:', error);
    throw error;
  }
}

// 确认清除存档
async function confirmClearCache() {
  const confirmed = confirm('确定要清除所有游戏存档吗？\n此操作不可逆！');

  if (confirmed) {
    await clearCache();
  }
}

// 清除存档
async function clearCache() {
  try {
    // 🔧 学习 lucklyjkop.html 的完整清除机制
    // 1. 清除 IndexedDB 中的所有数据（存档 + 设置缓存）
    //    类似 lucklyjkop 的 db.archives.clear() + db.npcAvatars.clear()
    await clearAllData();
    console.log('[FloatingButton] IndexedDB 所有数据已清除（存档 + 设置）');

    // 2. 清除角色卡变量中的游戏数据
    await replaceVariables({}, { type: 'character' });
    console.log('[FloatingButton] 角色卡变量已清除');

    toastr.success('游戏存档已完全清除（IndexedDB + 角色卡变量）');

    // 3. 刷新缓存管理器（学习 lucklyjkop 的 openCacheManager）
    refreshCacheManager();

    // 触发自定义事件通知其他组件更新状态
    window.dispatchEvent(new CustomEvent('adnd2e-save-cleared'));

    // 延迟关闭面板
    setTimeout(() => {
      isOpen.value = false;
    }, 1000);
  } catch (error) {
    console.error('清除缓存失败:', error);
    toastr.error('清除存档失败');
  }
}

// 刷新缓存管理器（学习 lucklyjkop 的 openCacheManager）
function refreshCacheManager() {
  console.log('[FloatingButton] 刷新缓存管理器');
  updateCacheSize();
  loadCustomRaces();
}

// 确认删除单个种族
async function confirmDeleteRace(race: Race) {
  const confirmed = confirm(`确定要删除自定义种族「${race.name}」吗？\n此操作不可逆！`);

  if (confirmed) {
    await deleteRace(race.id);
  }
}

// 删除单个种族
async function deleteRace(raceId: string) {
  try {
    customRaces.value = customRaces.value.filter(r => r.id !== raceId);
    await saveCustomRaces();
    toastr.success('种族已删除');
  } catch (error) {
    console.error('删除种族失败:', error);
    toastr.error('删除种族失败');
    // 重新加载以恢复状态
    loadCustomRaces();
  }
}

// 确认清空所有自定义种族
async function confirmClearAllRaces() {
  const confirmed = confirm(
    `确定要清空所有自定义种族吗？\n当前有 ${customRaces.value.length} 个自定义种族\n此操作不可逆！`,
  );

  if (confirmed) {
    await clearAllRaces();
  }
}

// 清空所有自定义种族
async function clearAllRaces() {
  try {
    customRaces.value = [];
    await saveCustomRaces();
    toastr.success('所有自定义种族已清空');
  } catch (error) {
    console.error('清空自定义种族失败:', error);
    toastr.error('清空自定义种族失败');
    // 重新加载以恢复状态
    loadCustomRaces();
  }
}
</script>

<style lang="scss" scoped>
.floating-container {
  position: fixed;
  z-index: 1000;
}

.floating-button {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 50px;
  height: 50px;
  background-color: #fff;
  border: 3px solid #000;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1002;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #000;
    transform: scale(1.1);
    box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.3);

    .icon {
      color: #fff;
    }
  }

  &:active {
    transform: scale(1.05);
  }
}

.icon {
  font-size: 24px;
  color: #000;
  transition: all 0.3s ease;

  &.rotating {
    animation: rotate 2s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.settings-panel {
  position: fixed;
  bottom: 80px;
  left: 20px;
  width: 380px;
  max-height: calc(100vh - 120px);
  background-color: #fff;
  border: 3px solid #000;
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    width: calc(100vw - 40px);
    left: 20px;
    right: 20px;
    max-height: calc(100vh - 100px);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid #000;
  background-color: #f5f5f5;

  h3 {
    font-family: '临海体', serif;
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0;
  }
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.2);
  }
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;

    &:hover {
      background: #999;
    }
  }
}

// 缓存区块
.cache-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px dashed #ddd;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
}

.section-title {
  font-family: '临海体', serif;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin: 0 0 15px 0;
  color: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.clear-all-button {
  padding: 4px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #c82333;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.cache-item {
  margin-bottom: 10px;
}

.cache-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-family: '临海体', serif;
}

.cache-label {
  font-weight: bold;
  font-size: 14px;
}

.cache-size {
  font-size: 14px;
  color: #666;
  font-weight: bold;
}

.delete-button {
  width: 100%;

  &.danger {
    background: #dc3545;
    border-color: #dc3545;

    &:hover {
      background: #c82333;
    }
  }
}

.section-note {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;

  p {
    font-size: 12px;
    line-height: 1.4;
    color: #856404;
    margin: 0;
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;

  p {
    margin: 0;
  }
}

// 自定义种族列表
.custom-races-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.race-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    border-color: #999;
  }
}

.race-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.race-icon {
  font-size: 24px;
  line-height: 1;
}

.race-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.race-name {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.race-english {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.delete-race-button {
  width: 28px;
  height: 28px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: #c82333;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(1.05);
  }
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

// 过渡动画
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
