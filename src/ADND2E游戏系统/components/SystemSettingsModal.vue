<template>
  <div v-if="visible" class="system-settings-overlay">
    <div class="settings-modal modal">
      <button class="modal-close-btn" @click="closeModal">&times;</button>
      <h4>系统设置</h4>

      <div class="settings-section">
        <button class="major-action-button" @click="openTextRegexSettings">
          <i class="fas fa-magic"></i> 正文与正则设置
        </button>

        <button class="major-action-button" @click="openSummarySettings">
          <i class="fas fa-book-reader"></i> 总结 &amp; 分段记忆设置
        </button>

        <button class="major-action-button" @click="openGameplaySettings">
          <i class="fas fa-gamepad"></i> 游戏玩法设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  openTextRegex: [];
  openSummary: [];
  openGameplay: [];
}>();

function closeModal() {
  emit('close');
}

function openTextRegexSettings() {
  emit('openTextRegex');
}

function openSummarySettings() {
  emit('openSummary');
}

function openGameplaySettings() {
  emit('openGameplay');
}
</script>

<style lang="scss" scoped>
.system-settings-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
  padding: 20px;
}

.settings-modal {
  background-color: #f5f5dc;
  border: 4px solid #000;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  padding: 30px;
  overflow-y: auto;

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

  h4 {
    font-family: 'Times New Roman', serif;
    font-size: 24px;
    font-weight: bold;
    letter-spacing: 2px;
    margin: 0 0 25px 0;
    text-transform: uppercase;
    text-align: center;
    color: #000;
    cursor: move;
    user-select: none;
  }
}

.modal-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: 2px solid #000;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 2;

  &:hover {
    background-color: #000;
    color: #fff;
  }
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 15px;
}

.major-action-button {
  width: 100%;
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 15px 20px;
  border: 3px solid #000;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-transform: uppercase;

  &:hover {
    background-color: #000;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  i {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .settings-modal {
    width: 95%;
    max-width: 95%;
    padding: 20px;
  }
}
</style>
