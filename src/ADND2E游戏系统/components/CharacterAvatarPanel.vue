<template>
  <div class="avatar-panel-wrapper" :class="$attrs.class">
    <div class="avatar-panel">
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
            <span class="info-value">{{ currentHP }}/{{ maxHP }}</span>
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

    <!-- 隐藏的文件输入 -->
    <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleAvatarUpload" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useGameStateStore } from '../stores/gameStateStore';
import { getAlignmentById } from '../utils/alignmentData';
import { getClassById } from '../utils/classData';
import { getRaceById, getSubraceById } from '../utils/raceData';
import StatusPanel from './StatusPanelNew.vue';

// 禁用属性自动继承，因为我们手动处理了 class
defineOptions({
  inheritAttrs: false,
});

const gameStateStore = useGameStateStore();
const showCharacterSheet = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
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
const characterData = computed(() => {
  const charVars = getVariables({ type: 'character' });
  return charVars?.adnd2e?.character || null;
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

// 显示职业/等级
const displayClassLevel = computed(() => {
  const char = characterData.value;
  if (!char?.class) return '战士/1';

  const classData = getClassById(char.class);
  const className = classData?.name || char.class;
  const level = char.level ?? 1;

  return `${className}/${level}`;
});

// 护甲等级
const armorClass = computed(() => {
  const char = characterData.value;
  return char?.armorClass ?? 10;
});

// THAC0
const thac0 = computed(() => {
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

// 经验值
const experiencePoints = computed(() => {
  const char = characterData.value;
  return char?.experiencePoints ?? 0;
});

// 经验值调整
const xpModifier = computed(() => {
  const char = characterData.value;
  // 根据首要属性计算经验值奖励/惩罚
  // 这里简化处理，实际可以根据职业和属性详细计算
  return char?.xpModifier ?? 0;
});

const currentHP = computed(() => {
  const char = characterData.value;
  return char?.hitPoints?.current ?? 10;
});

const maxHP = computed(() => {
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
  fileInput.value?.click();
}

function handleAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // 检查文件大小（限制为2MB）
  if (file.size > 2 * 1024 * 1024) {
    toastr.error('图片文件不能超过2MB');
    target.value = '';
    return;
  }

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    toastr.error('请选择图片文件');
    target.value = '';
    return;
  }

  // 读取文件并转换为 base64
  const reader = new FileReader();
  reader.onload = e => {
    const base64 = e.target?.result as string;
    console.log('[Avatar] 读取文件成功，大小:', (base64.length / 1024).toFixed(2), 'KB');

    // 保存到角色卡变量
    const charVars = getVariables({ type: 'character' });
    const newData = {
      adnd2e: {
        ...charVars?.adnd2e,
        avatarUrl: base64,
      },
    };

    console.log('[Avatar] 保存头像到角色卡变量');
    replaceVariables(newData, { type: 'character' });

    // 验证是否保存成功并立即更新显示
    setTimeout(() => {
      const savedVars = getVariables({ type: 'character' });
      console.log('[Avatar] 验证保存结果:', savedVars?.adnd2e?.avatarUrl ? '成功' : '失败');
      if (savedVars?.adnd2e?.avatarUrl === base64) {
        toastr.success('头像已更换');
        // 立即刷新头像显示
        loadAvatar();
      } else {
        toastr.error('头像保存失败，请重试');
      }
    }, 100);
  };

  reader.onerror = () => {
    toastr.error('读取图片失败');
  };

  reader.readAsDataURL(file);

  // 清空input，允许重复上传同一文件
  target.value = '';
}
</script>

<style lang="scss" scoped>
.avatar-panel-wrapper {
  // 包裹容器，不设置样式，只用于解决Vue多根元素问题
  display: contents;
}

.avatar-panel {
  width: 280px;
  background-color: #f5f5dc;
  border-right: 4px solid #000;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;

  .avatar-panel-wrapper.visible & {
    // 移动端visible类应用到wrapper上
    @media (max-width: 992px) {
      left: 0 !important;
    }
  }

  &.collapsed {
    width: 50px;
  }

  @media (max-width: 992px) {
    position: fixed;
    left: -300px;
    top: 0;
    bottom: 0;
    width: 280px !important; // 覆盖collapsed的width
    z-index: 1200;
    box-shadow: 4px 0 15px rgba(0, 0, 0, 0.3);
    transition: left 0.3s ease;

    // 移动端不应用collapsed样式
    &.collapsed {
      width: 280px;

      .panel-content {
        display: flex; // 覆盖collapsed隐藏内容的设置
      }
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
  font-family: 'Times New Roman', serif;
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
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  padding: 10px;
}

.character-name {
  margin-top: 12px;
  font-family: 'Times New Roman', serif;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
}

.default-avatar-credit {
  margin-top: 6px;
  font-size: 10px;
  color: #999;
  text-align: center;
  font-family: Arial, sans-serif;
}

.quick-info {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 12px;
  background-color: #fff;
  border: 3px solid #000;
  position: relative;
  font-family: 'Courier New', monospace;

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
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #333;
  min-width: 80px;
}

.info-value {
  font-family: 'Courier New', monospace;
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
  font-family: 'Times New Roman', serif;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
  color: #666;
}

.time-value {
  font-family: 'Times New Roman', serif;
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
  background-color: #f5f5dc;
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
    font-family: 'Times New Roman', serif;
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
  font-family: 'Times New Roman', serif;
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.sheet-character-desc {
  font-family: 'Times New Roman', serif;
  font-size: 16px;
  color: #666;
  margin: 0;
}

.default-avatar-credit {
  font-family: 'Times New Roman', serif;
  font-size: 12px;
  color: #999;
  margin: 8px 0 0 0;
  font-style: italic;
}
</style>
