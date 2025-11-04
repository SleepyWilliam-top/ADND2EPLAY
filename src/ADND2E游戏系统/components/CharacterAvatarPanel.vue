<template>
  <div class="avatar-panel-wrapper">
    <div class="avatar-panel" :class="$attrs.class">
      <div class="panel-header">
        <h3 class="panel-title">角色</h3>
      </div>

      <div class="panel-content">
        <!-- 头像区域 -->
        <div class="avatar-container" @click="openCharacterSheet">
          <div class="avatar-frame">
            <img :src="avatarUrl" alt="角色头像" class="avatar-image" />
            <div class="avatar-overlay">
              <span class="avatar-hint">点击查看角色卡</span>
            </div>
          </div>
          <div v-if="isDefaultAvatar" class="default-avatar-credit">默认头像来自 X.com DoPq @yy62401</div>
        </div>

        <!-- 快速信息 -->
        <div class="quick-info">
          <!-- 🔧 神祇提示 -->
          <div v-if="isDeityCharacter" class="deity-notice">
            <span class="deity-icon">🌟</span>
            <span class="deity-text">神祇本体（凡人数据不适用）</span>
          </div>

          <div class="info-row">
            <span class="info-label">名字:</span>
            <span class="info-value">{{ characterName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">种族:</span>
            <span class="info-value">{{ displayRace }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">职业/等级:</span>
            <span class="info-value">{{ displayClassLevel }}</span>
          </div>
          <div class="info-row highlight">
            <span class="info-label">HP:</span>
            <span v-if="isDeityCharacter" class="info-value">不适用</span>
            <span v-else class="info-value">{{ currentHP }}/{{ maxHP }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">AC:</span>
            <span class="info-value">{{ armorClass }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">THAC0:</span>
            <span class="info-value">{{ thac0 }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">阵营:</span>
            <span class="info-value">{{ displayAlignment }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">XP:</span>
            <span class="info-value">{{ experiencePoints }}</span>
          </div>
          <div v-if="xpModifier !== 0" class="info-row" :class="{ positive: xpModifier > 0, negative: xpModifier < 0 }">
            <span class="info-label">XP调整:</span>
            <span class="info-value">{{ xpModifier > 0 ? '+' : '' }}{{ xpModifier }}%</span>
          </div>
          <div class="info-row">
            <span class="info-label">位置:</span>
            <span class="info-value">{{ currentLocation }}</span>
          </div>
          <div class="info-row time">
            <span class="info-label">时间:</span>
            <span class="info-value">{{ gameTime }}</span>
          </div>
          <div v-if="weatherInfo" class="info-row weather">
            <span class="info-label">天气:</span>
            <span class="info-value">{{ weatherInfo }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色卡弹窗 -->
    <div v-if="showCharacterSheet" class="character-sheet-modal" @click.self="closeCharacterSheet">
      <div class="character-sheet-content">
        <div class="modal-header">
          <h2>角色卡</h2>
          <button class="close-button" @click="closeCharacterSheet">✕</button>
        </div>
        <div class="modal-body">
          <!-- 头像和基本信息 -->
          <div class="sheet-avatar-section">
            <div class="avatar-with-button">
              <img :src="avatarUrl" alt="角色头像" class="sheet-avatar-image" />
              <button class="change-avatar-button-modal" title="更换头像" @click.stop="openAvatarUpload">
                <i class="fas fa-camera"></i>
              </button>
            </div>
            <div class="sheet-basic-info">
              <h3 class="sheet-character-name">{{ characterName }}</h3>
              <p class="sheet-character-desc">{{ displayRace }} {{ displayClassLevel }}</p>
              <p v-if="isDefaultAvatar" class="default-avatar-credit">默认头像来自 X.com DoPq @yy62401</p>
            </div>
          </div>

          <!-- 完整角色信息 -->
          <StatusPanel :is-in-modal="true" />
        </div>
      </div>
    </div>

    <!-- 图片图库弹窗 -->
    <ImageLibraryModal
      v-model="showImageLibraryModal"
      category="character"
      @select="handleImageSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useGameStateStore } from '../stores/gameStateStore';
import { getAlignmentById } from '../utils/alignmentData';
import { getClassById } from '../utils/classData';
import { getRaceById, getSubraceById } from '../utils/raceData';
import ImageLibraryModal from './ImageLibraryModal.vue';
import StatusPanel from './StatusPanelNew.vue';

// 禁用属性自动继承，因为我们手动处理了 class
defineOptions({
  inheritAttrs: false,
});

const gameStateStore = useGameStateStore();
const showCharacterSheet = ref(false);
const showImageLibraryModal = ref(false);
const isMobile = ref(false);

// 检测是否为移动端
function checkMobile() {
  isMobile.value = window.innerWidth <= 992;
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// 从角色卡变量读取角色数据
// 使用 ref 以便在数据更新时能手动触发响应式更新
const characterData = ref<any>(null);

// 🔧 强制刷新键，用于触发所有计算属性重新计算
const forceUpdateKey = ref(0);

// 加载角色数据
function loadCharacterData() {
  const charVars = getVariables({ type: 'character' });
  characterData.value = charVars?.adnd2e?.character || null;

  // 🔧 强制触发所有计算属性更新
  forceUpdateKey.value++;

  console.log('[CharacterAvatar] 角色数据已更新，forceUpdateKey:', forceUpdateKey.value);
}

// 初始加载
loadCharacterData();

// 🔧 监听游戏数据更新事件（AI 输出命令后的实时更新）
eventOn('adnd2e_game_data_updated', () => {
  console.log('[CharacterAvatar] 游戏数据更新，刷新显示');
  forceUpdateKey.value++;
});

// 监听角色数据更新事件
eventOn('adnd2e_character_data_synced', () => {
  console.log('[CharacterAvatar] 角色数据同步，重新加载');
  loadCharacterData();
});

// 🔧 监听 AI 生成结束事件
eventOn(iframe_events.GENERATION_ENDED, () => {
  console.log('[CharacterAvatar] AI 生成结束，刷新显示');
  setTimeout(() => {
    forceUpdateKey.value++;
  }, 50);
});

// 监听消息接收事件，AI 可能在消息中更新了角色数据
eventOn(tavern_events.MESSAGE_RECEIVED, () => {
  // 延迟一点加载，确保命令已经处理完成
  setTimeout(() => {
    loadCharacterData();
  }, 100);
});

// 🔧 监听消息编辑和删除事件
eventOn(tavern_events.MESSAGE_UPDATED, () => {
  console.log('[CharacterAvatar] 消息编辑，刷新显示');
  setTimeout(() => forceUpdateKey.value++, 50);
});

eventOn(tavern_events.MESSAGE_DELETED, () => {
  console.log('[CharacterAvatar] 消息删除，刷新显示');
  setTimeout(() => forceUpdateKey.value++, 50);
});

// 头像URL（使用 ref 而不是 computed，这样可以手动触发更新）
const avatarUrl = ref('');
const isDefaultAvatar = ref(true);

// 加载头像
function loadAvatar() {
  const charVars = getVariables({ type: 'character' });
  const url = charVars?.adnd2e?.avatarUrl;
  avatarUrl.value = url || 'https://p.sda1.dev/28/03b9d6612dc7a469be13f53baab89ad8/normal.jpg';
  isDefaultAvatar.value = !url;
  console.log('[Avatar] 加载头像:', isDefaultAvatar.value ? '默认头像' : '自定义头像');
}

// 初始加载
loadAvatar();

// 使用酒馆的用户名作为默认值
const characterName = computed(() => {
  const char = characterData.value;
  if (!char) return 'Player';
  const defaultName = (typeof SillyTavern !== 'undefined' && SillyTavern.name1) || 'Player';
  return char.characterName || defaultName;
});

// 检测角色是否为神祇
const isDeityCharacter = computed(() => {
  // 🔧 依赖 forceUpdateKey 确保响应式更新
  const _updateKey = forceUpdateKey.value;

  // 方式1: 检查角色卡数据的 isDeity 标志
  if (characterData.value?.isDeity) {
    return true;
  }

  // 方式2: 检查游戏状态中是否有神祇数据
  const deity = gameStateStore.gameState?.character?.deity;
  if (deity && deity.divineRank) {
    console.log('[CharacterAvatar] 检测到神祇数据，updateKey:', _updateKey);
    return true;
  }

  return false;
});

// 显示种族（含亚种）
const displayRace = computed(() => {
  const char = characterData.value;
  if (!char?.race) return '人类';

  const race = getRaceById(char.race);
  if (!race) return char.race;

  if (char.subrace) {
    const subrace = getSubraceById(char.race, char.subrace);
    return subrace ? subrace.name : race.name;
  }

  return race.name;
});

// 显示职业/等级（🔧 实时读取游戏状态）
const displayClassLevel = computed(() => {
  // 🔧 依赖 forceUpdateKey 确保响应式更新
  void forceUpdateKey.value; // 触发响应式依赖

  // 🔧 神祇本体不适用职业/等级
  if (isDeityCharacter.value) {
    return '不适用';
  }

  const char = characterData.value;
  if (!char?.class) return '战士/1';

  const classData = getClassById(char.class);
  const className = classData?.name || char.class;

  // 🔧 优先从游戏状态读取等级（实时更新）
  const level = gameStateStore.gameState?.character?.level ?? char.level ?? 1;

  return `${className}/${level}`;
});

// 护甲等级（🔧 从角色卡数据读取，AC 不在 gameState 中）
const armorClass = computed(() => {
  // 🔧 神祇本体不适用 AC
  if (isDeityCharacter.value) {
    return '不适用';
  }

  const char = characterData.value;
  return char?.armorClass?.total ?? char?.armorClass ?? 10;
});

// THAC0（🔧 从角色卡数据读取，THAC0 不在 gameState 中）
const thac0 = computed(() => {
  // 🔧 神祇本体不适用 THAC0
  if (isDeityCharacter.value) {
    return '不适用';
  }

  const char = characterData.value;
  return char?.thac0 ?? 20;
});

// 显示阵营
const displayAlignment = computed(() => {
  const char = characterData.value;
  if (!char?.alignment) return '中立';

  const alignment = getAlignmentById(char.alignment);
  return alignment?.shortName || char.alignment;
});

// 经验值（🔧 实时读取游戏状态）
const experiencePoints = computed(() => {
  // 🔧 神祇本体不适用 XP
  if (isDeityCharacter.value) {
    return '不适用';
  }

  // 🔧 优先从游戏状态读取（实时更新）
  const gameXP = gameStateStore.gameState?.character?.xp;
  if (gameXP !== undefined) {
    return gameXP;
  }

  const char = characterData.value;
  return char?.experience ?? char?.experiencePoints ?? 0;
});

// 经验值调整
const xpModifier = computed(() => {
  const char = characterData.value;
  // 根据首要属性计算经验值奖励/惩罚
  // 这里简化处理，实际可以根据职业和属性详细计算
  return char?.xpModifier ?? 0;
});

// 当前HP（🔧 实时读取游戏状态）
const currentHP = computed(() => {
  // 🔧 依赖 forceUpdateKey 确保响应式更新
  void forceUpdateKey.value; // 触发响应式依赖

  // 🔧 神祇本体不适用 HP
  if (isDeityCharacter.value) {
    return '不适用';
  }

  // 🔧 优先从游戏状态读取（实时更新）
  const gameHP = gameStateStore.gameState?.character?.hp?.current;
  if (gameHP !== undefined) {
    return gameHP;
  }

  const char = characterData.value;
  return char?.hitPoints?.current ?? 10;
});

// 最大HP（🔧 实时读取游戏状态）
const maxHP = computed(() => {
  // 🔧 依赖 forceUpdateKey 确保响应式更新
  void forceUpdateKey.value; // 触发响应式依赖

  // 🔧 神祇本体不适用 HP
  if (isDeityCharacter.value) {
    return '不适用';
  }

  // 🔧 优先从游戏状态读取（实时更新）
  const gameMaxHP = gameStateStore.gameState?.character?.hp?.max;
  if (gameMaxHP !== undefined) {
    return gameMaxHP;
  }

  const char = characterData.value;
  return char?.hitPoints?.max ?? 10;
});

const currentLocation = computed(() => {
  const location = gameStateStore.gameState.location.current;
  return location && location !== '未知' ? location : '未知';
});

const gameTime = computed(() => {
  const time = gameStateStore.gameState.time;
  if (!time) return '未知';

  const parts = [];
  if (time.date && time.date !== '第1天') {
    parts.push(time.date);
  }
  if (time.current && time.current !== '未知') {
    parts.push(time.current);
  }

  return parts.length > 0 ? parts.join(' ') : '未知';
});

const weatherInfo = computed(() => {
  const weather = gameStateStore.gameState.weather;
  if (!weather || weather.current === '未知') return null;

  const parts = [weather.current];
  if (weather.temperature && weather.temperature !== '未知') {
    parts.push(`(${weather.temperature})`);
  }

  return parts.join(' ');
});

function openCharacterSheet() {
  showCharacterSheet.value = true;
}

function closeCharacterSheet() {
  showCharacterSheet.value = false;
}

function openAvatarUpload() {
  showImageLibraryModal.value = true;
}

// 处理图库选择
function handleImageSelect(imageData: string, imageId: string) {
  console.log('[Avatar] 从图库选择头像:', imageId);

  // 保存到角色卡变量
  const charVars = getVariables({ type: 'character' });
  const newData = {
    adnd2e: {
      ...charVars?.adnd2e,
      avatarUrl: imageData,
    },
  };

  console.log('[Avatar] 保存头像到角色卡变量');
  replaceVariables(newData, { type: 'character' });

  // 验证是否保存成功并立即更新显示
  setTimeout(() => {
    const savedVars = getVariables({ type: 'character' });
    console.log('[Avatar] 验证保存结果:', savedVars?.adnd2e?.avatarUrl ? '成功' : '失败');
    if (savedVars?.adnd2e?.avatarUrl === imageData) {
      toastr.success('头像已更换');
      // 立即刷新头像显示
      loadAvatar();
    } else {
      toastr.error('头像保存失败，请重试');
    }
  }, 100);
}
</script>

<style lang="scss" scoped>
.avatar-panel-wrapper {
  // 包裹容器，不设置样式，只用于解决Vue多根元素问题
  display: contents;
}

.avatar-panel {
  width: 280px;
  background-color: #fff;
  border-right: 4px solid #000;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;

  &.collapsed {
    width: 50px;
  }

  @media (max-width: 992px) {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    height: 100%;
    width: 280px !important; // 覆盖collapsed的width
    z-index: 1200;
    box-shadow: 4px 0 15px rgba(0, 0, 0, 0.5);
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    overflow-y: auto;

    // 移动端不应用collapsed样式
    &.collapsed {
      width: 280px;

      .panel-content {
        display: flex; // 覆盖collapsed隐藏内容的设置
      }
    }

    // 当父级添加visible类时显示
    &.visible {
      transform: translateX(0);
    }
  }
}

.panel-header {
  background-color: #fff;
  border-bottom: 3px solid #000;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 6px;
    left: 8px;
    right: 8px;
    border-bottom: 1px solid #666;
  }
}

.panel-title {
  font-family: "临海体", serif;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 0;
  text-transform: uppercase;
}

.collapse-button {
  background: none;
  border: 2px solid #000;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background-color: #000;
    color: #fff;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.avatar-frame {
  width: 160px;
  height: 160px;
  border: 4px solid #000;
  position: relative;
  background-color: #fff;
  overflow: hidden;

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

  &:hover .avatar-overlay {
    opacity: 1;
  }
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 2;
}

.avatar-hint {
  color: #fff;
  font-family: "临海体", serif;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  padding: 10px;
}

.character-name {
  margin-top: 12px;
  font-family: "临海体", serif;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
}

.default-avatar-credit {
  margin-top: 6px;
  font-size: 10px;
  color: #999;
  text-align: center;
  font-family: "临海体", serif;
}

.quick-info {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 12px;
  background-color: #fff;
  border: 3px solid #000;
  position: relative;
  font-family: "临海体", serif;

  &::before {
    content: '';
    position: absolute;
    top: 5px;
    left: 5px;
    right: 5px;
    bottom: 5px;
    border: 1px solid #666;
    pointer-events: none;
  }
}

// 🔧 神祇提示样式
.deity-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border: 2px solid #daa520;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(218, 165, 32, 0.3);
  position: relative;
  z-index: 1;

  .deity-icon {
    font-size: 20px;
    animation: deity-pulse 2s ease-in-out infinite;
  }

  .deity-text {
    font-size: 13px;
    font-weight: bold;
    color: #8b4513;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
}

@keyframes deity-pulse {
  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.1);
    filter: brightness(1.2);
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8f8f8;
  }

  &.highlight {
    background-color: #ffe6e6;
    border: 2px solid #ff0000;
    margin: 2px 0;
    padding: 8px;
    font-weight: bold;

    &:hover {
      background-color: #ffd9d9;
    }
  }

  &.positive {
    background-color: #e6ffe6;

    .info-value {
      color: #008000;
    }
  }

  &.negative {
    background-color: #ffe6e6;

    .info-value {
      color: #ff0000;
    }
  }

  &.time {
    background-color: #f0f0f0;
    font-style: italic;
    margin-top: 4px;
  }

  &.weather {
    background-color: #e6f3ff;
    font-style: italic;

    .info-value {
      color: #0066cc;
    }
  }
}

.info-label {
  font-family: "临海体", serif;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #333;
  min-width: 80px;
}

.info-value {
  font-family: "临海体", serif;
  font-size: 13px;
  font-weight: bold;
  color: #000;
  text-align: right;
}

.time-info {
  padding: 15px;
  background-color: #faf8f3;
  border: 2px solid #000;
  text-align: center;
}

.time-label {
  font-family: "临海体", serif;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
  color: #666;
}

.time-value {
  font-family: "临海体", serif;
  font-size: 16px;
  font-weight: bold;
}

// 弹窗样式
.character-sheet-modal {
  position: fixed !important; // 确保弹窗固定在viewport
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.character-sheet-content {
  background-color: #fff;
  border: 4px solid #000;
  max-width: 900px;
  max-height: 90vh !important; // 确保有最大高度
  min-height: 600px !important; // 强制最小高度
  width: 100%;
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
  }
}

.modal-header {
  background-color: #fff;
  border-bottom: 3px solid #000;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-family: "临海体", serif;
    font-size: 24px;
    font-weight: bold;
    letter-spacing: 2px;
    margin: 0;
    text-transform: uppercase;
  }
}

.close-button {
  background: none;
  border: 2px solid #000;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background-color: #000;
    color: #fff;
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 400px !important; // 强制最小高度
  height: auto !important; // 自动高度
  max-height: none !important; // 移除最大高度限制
  background-color: rgba(255, 255, 0, 0.1) !important; // 浅黄色背景用于调试
}

.sheet-avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fff;
  border: 3px solid #000;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 5px;
    left: 5px;
    right: 5px;
    bottom: 5px;
    border: 1px solid #666;
    pointer-events: none;
  }
}

// 弹窗中的头像容器（带更换按钮）
.avatar-with-button {
  position: relative;
  flex-shrink: 0;

  .sheet-avatar-image {
    width: 180px;
    height: 180px;
    border-radius: 8px;
    border: 4px solid #000;
    object-fit: cover;
    transition: all 0.3s ease;
  }

  .change-avatar-button-modal {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid #000;
    background-color: rgba(255, 255, 255, 0.95);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;

    i {
      font-size: 18px;
      color: #000;
    }

    &:hover {
      background-color: #000;
      transform: scale(1.1);

      i {
        color: #fff;
      }
    }
  }

  &:hover {
    .change-avatar-button-modal {
      opacity: 1;
    }

    .sheet-avatar-image {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
}

.sheet-basic-info {
  flex: 1;
}

.sheet-character-name {
  font-family: "临海体", serif;
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.sheet-character-desc {
  font-family: "临海体", serif;
  font-size: 16px;
  color: #666;
  margin: 0;
}

.default-avatar-credit {
  font-family: "临海体", serif;
  font-size: 12px;
  color: #999;
  margin: 8px 0 0 0;
  font-style: italic;
}
</style>
