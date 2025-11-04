<template>
  <div class="main-menu">
    <!-- 主菜单 -->
    <div class="border-frame">
      <div class="title-section">
        <h1 class="main-title">
          ADVANCED DUNGEONS & DRAGONS
          <span class="edition">2nd Edition</span>
        </h1>
      </div>
      <div class="menu-buttons">
        <!-- 创建角色卡片 -->
        <div class="menu-card" @click="showCreateModal">
          <div class="card-border">
            <div class="card-header">
              <span class="card-icon"><i class="fa-solid fa-dice-d20"></i></span>
              <h3>创建角色</h3>
            </div>
            <div class="card-description">
              <p>开始一段全新的冒险旅程</p>
            </div>
            <div class="card-action">
              <span class="action-hint">点击进入</span>
            </div>
          </div>
        </div>

        <!-- 继续游戏卡片 -->
        <div class="menu-card" :class="{ disabled: !hasSavedGame }" @click="hasSavedGame && showContinueModal()">
          <div class="card-border">
            <div class="card-header">
              <span class="card-icon"><i class="fa-solid fa-scroll"></i></span>
              <h3>继续游戏</h3>
            </div>
            <div class="card-description">
              <p v-if="hasSavedGame">继续上次的冒险进度</p>
              <p v-else class="no-save-text">暂无存档</p>
            </div>
            <div class="card-action">
              <span class="action-hint">{{ hasSavedGame ? '点击继续' : '无存档' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-text">
        <p>A Fantasy Role-Playing Game</p>
        <button class="about-button" title="关于" @click="showAboutModal">
          <span class="about-icon">ℹ</span>
        </button>
      </div>
    </div>

    <!-- 创建角色模态框 -->
    <transition name="modal-fade">
      <div v-if="isCreateModalOpen" class="modal-overlay" @click="closeCreateModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3>创建新角色</h3>
            <button class="modal-close" @click="closeCreateModal">×</button>
          </div>
          <div class="modal-content">
            <div class="modal-icon"><i class="fa-solid fa-dice-d20"></i></div>
            <p class="modal-description">
              你即将踏上一段全新的冒险旅程。<br />
              在这个世界中，你将扮演一位勇敢的冒险者，<br />
              面对未知的挑战与机遇。
            </p>
            <div v-if="hasSavedGame" class="modal-warning">
              <p>⚠ 注意：创建新角色将覆盖当前存档</p>
            </div>
          </div>
          <div class="modal-actions">
            <div class="action-card cancel-card" @click="closeCreateModal">
              <div class="action-card-content">
                <span class="action-icon">✕</span>
                <span class="action-label">取消</span>
              </div>
            </div>
            <div class="action-card confirm-card" @click="confirmCreateCharacter">
              <div class="action-card-content">
                <span class="action-label">开始创建</span>
                <span class="action-icon"><i class="fa-solid fa-dice-d20"></i></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 继续游戏模态框 -->
    <transition name="modal-fade">
      <div v-if="isContinueModalOpen" class="modal-overlay" @click="closeContinueModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3>继续游戏</h3>
            <button class="modal-close" @click="closeContinueModal">×</button>
          </div>
          <div class="modal-content">
            <div class="modal-icon"><i class="fa-solid fa-scroll"></i></div>
            <p class="modal-description">欢迎回来，冒险者！</p>
            <div class="save-info">
              <div class="info-row">
                <span class="info-label">角色名称：</span>
                <span class="info-value">{{ saveInfo.characterName || '未知冒险者' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">游戏进度：</span>
                <span class="info-value">{{ saveInfo.progress || '刚开始' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">存档时间：</span>
                <span class="info-value">{{ saveInfo.lastSaved || '未知' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <div class="action-card cancel-card" @click="closeContinueModal">
              <div class="action-card-content">
                <span class="action-icon">✕</span>
                <span class="action-label">取消</span>
              </div>
            </div>
            <div class="action-card confirm-card" @click="confirmContinueGame">
              <div class="action-card-content">
                <span class="action-label">继续冒险</span>
                <span class="action-icon"><i class="fa-solid fa-scroll"></i></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 关于模态框 -->
    <transition name="modal-fade">
      <div v-if="isAboutModalOpen" class="modal-overlay" @click="closeAboutModal">
        <div class="modal-container modal-small" @click.stop>
          <div class="modal-header">
            <h3>关于</h3>
            <button class="modal-close" @click="closeAboutModal">×</button>
          </div>
          <div class="modal-content">
            <div class="modal-icon"><i class="fa-solid fa-dice-d20"></i></div>
            <h4 class="about-title">ADND 2E 游戏系统</h4>
            <p class="modal-description">
              欢迎来到 Advanced Dungeons & Dragons 2nd Edition！<br />
              这是一个经典的桌面角色扮演游戏系统。
            </p>
            <div class="qq-group-info">
              <p class="group-label">欢迎加入 QQ 群交流</p>
              <div class="group-number">
                <span class="number">1023386714</span>
                <button class="copy-button" @click="copyQQGroup">复制</button>
              </div>
              <p class="group-hint">与其他冒险者一起探索奇幻世界</p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="adnd-button" @click="closeAboutModal">关闭</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onActivated, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { clearAllData } from './composables/usePersistence';

const router = useRouter();
const hasSavedGame = ref(false);
const isCreateModalOpen = ref(false);
const isContinueModalOpen = ref(false);
const isAboutModalOpen = ref(false);
const saveInfo = ref({
  characterName: '',
  progress: '',
  lastSaved: '',
});

onMounted(async () => {
  await checkSavedGame();

  // 监听存档清除事件
  window.addEventListener('adnd2e-save-cleared', handleSaveCleared);

  // 禁用自动恢复功能，避免刷新后自动跳转到游戏界面
  // 之前会莫名掉前端，现在几乎没有这个问题，所以禁用自动恢复
  // const shouldAutoResume = await checkAutoResume();
  // if (!shouldAutoResume) {
  //   clearCurrentRoute();
  // }

  // 总是清除路由记录，确保刷新后停留在主菜单
  clearCurrentRoute();
});

onBeforeUnmount(() => {
  // 清理事件监听器
  window.removeEventListener('adnd2e-save-cleared', handleSaveCleared);
});

// 当从游戏返回主菜单时，重新检查存档状态
onActivated(async () => {
  await checkSavedGame();
});

async function checkSavedGame() {
  try {
    const variables = getVariables({ type: 'character' });
    const adnd2eData = variables?.adnd2e;

    if (adnd2eData?.character) {
      // 只有完成角色创建才算有有效存档
      hasSavedGame.value = adnd2eData.character.completed === true;

      // 加载存档信息
      if (hasSavedGame.value) {
        // 使用酒馆的用户名作为默认值
        const defaultName = (typeof SillyTavern !== 'undefined' && SillyTavern.name1) || 'Player';
        saveInfo.value = {
          characterName: adnd2eData.character?.characterName || defaultName,
          progress: adnd2eData.gameProgress?.stage || '游戏初期',
          lastSaved: adnd2eData.lastSaved ? new Date(adnd2eData.lastSaved).toLocaleString('zh-CN') : '未知时间',
        };
      }
    } else {
      hasSavedGame.value = false;
    }
  } catch (error) {
    console.error('检查存档失败:', error);
    hasSavedGame.value = false;
  }
}

// 检查是否应该自动恢复游戏（用户上次在游戏界面中）
async function checkAutoResume(): Promise<boolean> {
  try {
    // 只有在有存档的情况下才检查
    if (!hasSavedGame.value) {
      return false;
    }

    // 从 IndexedDB 或角色卡变量读取上次的界面状态
    const variables = getVariables({ type: 'character' });
    const lastRoute = variables?.adnd2e?.lastRoute;

    // 如果上次用户在游戏界面，自动恢复
    if (lastRoute === '/game') {
      console.log('[MainMenu] 检测到上次在游戏界面，自动恢复游戏');
      toastr.info('正在恢复游戏...');
      // 延迟一下让用户看到提示
      setTimeout(() => {
        router.push('/game');
      }, 500);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[MainMenu] 检查自动恢复失败:', error);
    // 失败不影响正常使用，静默处理
    return false;
  }
}

// 清除当前路由记录
function clearCurrentRoute() {
  try {
    const variables = getVariables({ type: 'character' });
    if (variables?.adnd2e) {
      variables.adnd2e.lastRoute = undefined;
      replaceVariables(variables, { type: 'character' });
      console.log('[MainMenu] 已清除路由记录');
    }
  } catch (error) {
    console.error('[MainMenu] 清除路由记录失败:', error);
  }
}

// 处理存档清除事件
function handleSaveCleared() {
  // 重新检查存档状态
  checkSavedGame();

  // 如果继续游戏模态框正在打开，关闭它
  if (isContinueModalOpen.value) {
    isContinueModalOpen.value = false;
  }
}

// 显示创建角色模态框
function showCreateModal() {
  isCreateModalOpen.value = true;
}

// 关闭创建角色模态框
function closeCreateModal() {
  isCreateModalOpen.value = false;
}

// 确认创建角色
async function confirmCreateCharacter() {
  closeCreateModal();
  toastr.info('正在清理旧数据...');

  try {
    // 🔧 修复：创建新角色前清除所有 IndexedDB 缓存
    await clearAllData();
    console.log('[MainMenu] 已清除所有 IndexedDB 缓存');

    // 清除角色卡变量中的旧数据
    replaceVariables(
      {
        adnd2e: undefined, // 完全清空
      },
      { type: 'character' },
    );
    console.log('[MainMenu] 已清除角色卡变量');

    toastr.success('正在进入角色创建...');
    router.push('/character-creation');
  } catch (error) {
    console.error('[MainMenu] 清理数据失败:', error);
    toastr.warning('数据清理失败，但仍可继续创建');
    router.push('/character-creation');
  }
}

// 显示继续游戏模态框
function showContinueModal() {
  if (hasSavedGame.value) {
    isContinueModalOpen.value = true;
  }
}

// 关闭继续游戏模态框
function closeContinueModal() {
  isContinueModalOpen.value = false;
}

// 确认继续游戏
function confirmContinueGame() {
  closeContinueModal();
  toastr.success('正在加载游戏...');
  router.push('/game');
}

// 显示关于模态框
function showAboutModal() {
  isAboutModalOpen.value = true;
}

// 关闭关于模态框
function closeAboutModal() {
  isAboutModalOpen.value = false;
}

// 复制QQ群号
function copyQQGroup() {
  const qqGroup = '1023386714';
  navigator.clipboard
    .writeText(qqGroup)
    .then(() => {
      toastr.success('QQ群号已复制到剪贴板');
    })
    .catch(() => {
      toastr.error('复制失败，请手动复制');
    });
}
</script>

<style lang="scss" scoped>
.main-menu {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 60px 20px;
  background-color: #f5f5f5;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 992px) {
    padding: 20px 15px;
    min-height: 100vh;
    align-items: center;
  }
}

.border-frame {
  width: 100%;
  max-width: 900px;
  padding: 80px 60px;
  border: 5px solid #000;
  position: relative;
  background-color: #fff;
  flex-shrink: 0;
  margin: auto 0;

  &::before {
    content: '';
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    bottom: 10px;
    border: 2px solid #000;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    bottom: 20px;
    border: 1px solid #666;
    pointer-events: none;
  }

  @media (max-width: 992px) {
    padding: 40px 25px;
    border-width: 4px;
    max-width: 100%;

    &::before {
      top: 8px;
      left: 8px;
      right: 8px;
      bottom: 8px;
    }

    &::after {
      top: 14px;
      left: 14px;
      right: 14px;
      bottom: 14px;
    }
  }

  @media (max-width: 480px) {
    padding: 30px 20px;
    border-width: 3px;
  }
}

.title-section {
  text-align: center;
  margin-bottom: 60px;

  @media (max-width: 992px) {
    margin-bottom: 40px;
  }
}

.main-title {
  font-family: '临海体', serif;
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 4px;
  line-height: 1.4;
  color: #000;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  @media (max-width: 1024px) {
    font-size: 28px;
    letter-spacing: 3px;
  }

  @media (max-width: 992px) {
    font-size: 22px;
    letter-spacing: 2px;
    gap: 8px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
    letter-spacing: 1.5px;
  }

  .edition {
    font-size: 0.6em;
    font-weight: 400;
    letter-spacing: 3px;
    color: #333;
    font-style: italic;
    margin-top: 5px;

    @media (max-width: 992px) {
      font-size: 0.65em;
      letter-spacing: 2px;
    }
  }
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: center;
  margin-bottom: 50px;
}

.menu-card {
  width: 100%;
  max-width: 450px;
  background-color: #fff;
  border: 4px solid #000;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover:not(.disabled) {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);

    .card-action .action-hint {
      background-color: #000;
      color: #fff;
    }
  }

  &:active:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  // 禁用状态
  &.disabled {
    opacity: 0.5;
    background-color: #e8e8e8;
    border-color: #999;
    cursor: not-allowed;

    .card-border {
      border-color: #999;

      &::before,
      &::after {
        border-color: #bbb;
      }
    }

    .card-header h3,
    .card-icon {
      color: #999;
    }

    .card-description p {
      color: #999;
    }

    .card-action .action-hint {
      background-color: #999;
      color: #ccc;
      border-color: #999;
    }
  }

  @media (max-width: 992px) {
    max-width: 100%;
  }
}

.card-border {
  padding: 30px;
  border: 2px solid #000;
  margin: 8px;
  position: relative;

  // 角落装饰
  &::before {
    content: '';
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    bottom: 12px;
    border: 1px solid #666;
    pointer-events: none;
  }

  // 四角小方块装饰
  &::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: #000;
    top: -2px;
    left: -2px;
  }

  @media (max-width: 992px) {
    padding: 25px 20px;
    margin: 6px;
  }

  @media (max-width: 480px) {
    padding: 20px 15px;
    margin: 5px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #000;

  h3 {
    font-family: '临海体', serif;
    font-size: 24px;
    font-weight: bold;
    letter-spacing: 2px;
    margin: 0;
    text-transform: uppercase;

    @media (max-width: 992px) {
      font-size: 20px;
    }
  }
}

.card-icon {
  font-size: 36px;
  display: inline-block;
}

.card-description {
  margin-bottom: 20px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;

  p {
    font-family: '临海体', serif;
    font-size: 16px;
    line-height: 1.6;
    color: #666;
    margin: 0;
    text-align: center;

    @media (max-width: 992px) {
      font-size: 14px;
    }
  }

  .no-save-text {
    color: #999;
    font-style: italic;
  }
}

.card-action {
  display: flex;
  justify-content: center;
  padding-top: 15px;
  border-top: 2px solid #000;

  .action-hint {
    font-family: '临海体', serif;
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #000;
    padding: 10px 20px;
    border: 2px solid #000;
    background-color: #fff;
    transition: all 0.2s ease;

    @media (max-width: 992px) {
      font-size: 12px;
      padding: 8px 16px;
      min-height: 44px; // 触摸友好的最小高度
    }
  }
}

.menu-card.disabled .card-action {
  border-top-color: #999;
}

.footer-text {
  text-align: center;
  margin-top: 50px;
  position: relative;

  p {
    font-family: '临海体', serif;
    font-size: 14px;
    font-style: italic;
    color: #999;
    letter-spacing: 2px;
    margin-bottom: 15px;

    @media (max-width: 992px) {
      font-size: 12px;
    }
  }
}

.about-button {
  background-color: #fff;
  border: 2px solid #000;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  margin: 0 auto;

  &:hover {
    background-color: #000;
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    .about-icon {
      color: #fff;
    }
  }

  &:active {
    transform: scale(1.05);
  }
}

.about-icon {
  font-size: 18px;
  font-weight: bold;
  color: #000;
  transition: color 0.2s ease;
}

// 模态框样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;

  @media (max-width: 992px) {
    padding: 15px;
  }

  @media (max-width: 480px) {
    padding: 10px;
  }
}

.modal-container {
  background-color: #fff;
  border: 4px solid #000;
  max-width: 500px;
  width: 100%;
  position: relative;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;

  // 内边框
  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border: 1px solid #000;
    pointer-events: none;
  }

  @media (max-width: 992px) {
    border-width: 3px;
    box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.3);
    max-width: 100%;

    &::before {
      top: 5px;
      left: 5px;
      right: 5px;
      bottom: 5px;
    }
  }

  @media (max-width: 480px) {
    border-width: 2px;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
    max-height: 85vh;

    &::before {
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
    }
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 3px solid #000;
  background-color: #f5f5f5;

  h3 {
    font-family: '临海体', serif;
    font-size: 24px;
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0;
  }

  @media (max-width: 992px) {
    padding: 15px 20px;
    border-bottom-width: 2px;

    h3 {
      font-size: 20px;
      letter-spacing: 1.5px;
    }
  }

  @media (max-width: 480px) {
    padding: 12px 15px;

    h3 {
      font-size: 18px;
      letter-spacing: 1px;
    }
  }
}

.modal-close {
  background: none;
  border: none;
  font-size: 32px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.2);
  }
}

.modal-content {
  padding: 40px 30px;
  text-align: center;

  @media (max-width: 992px) {
    padding: 30px 20px;
  }

  @media (max-width: 480px) {
    padding: 25px 15px;
  }
}

.modal-icon {
  font-size: 64px;
  margin-bottom: 20px;

  @media (max-width: 992px) {
    font-size: 56px;
    margin-bottom: 15px;
  }

  @media (max-width: 480px) {
    font-size: 48px;
    margin-bottom: 12px;
  }
}

.modal-description {
  font-family: '临海体', serif;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;

  @media (max-width: 992px) {
    font-size: 15px;
    line-height: 1.6;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 1.5;
  }
}

.modal-warning {
  background-color: #fff3cd;
  border: 2px solid #856404;
  padding: 12px;
  margin-top: 20px;

  p {
    font-size: 14px;
    color: #856404;
    margin: 0;
    font-weight: bold;
  }
}

.save-info {
  background-color: #f5f5f5;
  border: 2px solid #000;
  padding: 20px;
  margin-top: 20px;
  text-align: left;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ccc;
  font-family: '临海体', serif;

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-weight: bold;
  color: #333;
}

.info-value {
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 20px;
  padding: 30px;
  border-top: 3px solid #000;
  background-color: #f5f5f5;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 15px;
  }
}

.action-card {
  flex: 1;
  background-color: #fff;
  border: 3px solid #000;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    border: 1px solid #666;
    pointer-events: none;
    transition: all 0.2s ease;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }
}

.action-card-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: '临海体', serif;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;

  @media (max-width: 480px) {
    font-size: 14px;
  }
}

.action-icon {
  font-size: 20px;
}

.cancel-card {
  border-color: #666;

  &::before {
    border-color: #999;
  }

  .action-card-content {
    color: #666;
  }

  &:hover {
    background-color: #666;
    border-color: #666;

    .action-card-content {
      color: #fff;
    }

    &::before {
      border-color: #888;
    }
  }
}

.confirm-card {
  border-color: #000;

  &::before {
    border-color: #666;
  }

  .action-card-content {
    color: #000;
  }

  &:hover {
    background-color: #000;
    border-color: #000;

    .action-card-content {
      color: #fff;
    }

    &::before {
      border-color: #333;
    }
  }
}

.adnd-button-secondary {
  background-color: #fff;
  border: 3px solid #666;
  color: #666;
  padding: 15px 40px;
  font-size: 16px;
  font-weight: bold;
  font-family: '临海体', serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #666;
    color: #fff;
    border-color: #666;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

// 模态框过渡动画
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-container {
  transform: scale(0.9);
}

// 小尺寸模态框
.modal-small {
  max-width: 420px;
}

// 关于页面专属样式
.about-title {
  font-family: '临海体', serif;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 15px 0 10px;
  color: #000;
}

.qq-group-info {
  background-color: #f5f5f5;
  border: 2px solid #000;
  padding: 20px;
  margin-top: 25px;
  text-align: center;

  @media (max-width: 992px) {
    padding: 15px;
    margin-top: 20px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    margin-top: 15px;
  }
}

.group-label {
  font-family: '临海体', serif;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;

  @media (max-width: 480px) {
    font-size: 15px;
    margin-bottom: 12px;
  }
}

.group-number {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 10px;
  }

  .number {
    font-family: '临海体', serif;
    font-size: 28px;
    font-weight: bold;
    color: #000;
    letter-spacing: 2px;
    padding: 10px 20px;
    background-color: #fff;
    border: 2px solid #000;

    @media (max-width: 992px) {
      font-size: 24px;
      padding: 8px 16px;
      letter-spacing: 1.5px;
    }

    @media (max-width: 480px) {
      font-size: 20px;
      padding: 8px 12px;
      letter-spacing: 1px;
    }
  }

  .copy-button {
    background-color: #fff;
    border: 2px solid #000;
    color: #000;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: bold;
    font-family: '临海体', serif;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 44px; // 触摸友好的最小高度

    &:hover {
      background-color: #000;
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
    }

    @media (max-width: 992px) {
      padding: 6px 14px;
      font-size: 13px;
    }

    @media (max-width: 480px) {
      width: 100%;
      padding: 8px 16px;
    }
  }
}

.group-hint {
  font-size: 14px;
  color: #666;
  font-style: italic;
  margin: 0;
}
</style>
