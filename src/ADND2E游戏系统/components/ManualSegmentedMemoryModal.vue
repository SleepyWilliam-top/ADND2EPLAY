<template>
  <div v-if="visible" class="segmented-memory-overlay">
    <div class="segmented-memory-modal modal">
      <button class="modal-close-btn" @click="closeModal">&times;</button>
      <h4>手动补充分段记忆</h4>
      <p class="hint-text">为最新的AI回复补充缺失的总结信息。</p>

      <div class="modal-content">
        <!-- 小总结输入 -->
        <div class="settings-section">
          <label for="manual-small-summary">小总结 (Small Summary)</label>
          <p class="help-text">用约50~100字概括本次内容，包含时间、地点、关键事件。</p>
          <textarea
            id="manual-small-summary"
            v-model="smallSummary"
            rows="4"
            placeholder="例如：在格兰特里公国的跃马酒馆中，冒险者艾登与矮人铁匠格罗姆讨价还价购买武器..."
          ></textarea>
        </div>

        <!-- 大总结输入 -->
        <div class="settings-section">
          <label for="manual-large-summary">大总结 (Large Summary)</label>
          <p class="help-text">用一句话（50字以内）概述，保留时间、地点。</p>
          <textarea
            id="manual-large-summary"
            v-model="largeSummary"
            rows="2"
            placeholder="例如：初春清晨于格兰特里公国，艾登购得武器，与矮人铁匠建立友谊。"
          ></textarea>
        </div>

        <!-- 按钮组 -->
        <div class="button-group">
          <button class="major-action-button" @click="closeModal"><i class="fas fa-times"></i> 取消</button>
          <button class="major-action-button save-btn" :disabled="!canSave" @click="saveAndClose">
            <i class="fas fa-save"></i> 保存并补充记忆
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [{ smallSummary: string; largeSummary: string }];
}>();

const smallSummary = ref('');
const largeSummary = ref('');

const canSave = computed(() => {
  return smallSummary.value.trim().length > 0 && largeSummary.value.trim().length > 0;
});

// 当弹窗打开时重置输入

watch(
  () => props.visible,
  newVisible => {
    if (newVisible) {
      smallSummary.value = '';
      largeSummary.value = '';
    }
  },
);

function closeModal() {
  emit('close');
}

function saveAndClose() {
  if (!canSave.value) {
    toastr.warning('请填写小总结和大总结');
    return;
  }

  emit('save', {
    smallSummary: smallSummary.value.trim(),
    largeSummary: largeSummary.value.trim(),
  });

  closeModal();
}
</script>

<style lang="scss" scoped>
.segmented-memory-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.segmented-memory-modal {
  background-color: #fff;
  border: 2px solid #000;
  padding: 20px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);

  h4 {
    font-family:
      'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', '宋体', 'SimHei', '黑体', sans-serif;
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 10px;
    text-align: center;
  }

  .hint-text {
    text-align: center;
    color: #666;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .modal-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #000;
    transition: color 0.2s;

    &:hover {
      color: #d32f2f;
    }
  }

  .modal-content {
    padding: 10px 0;
  }
}

.settings-section {
  margin-bottom: 20px;

  label {
    display: block;
    font-family:
      'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', '宋体', 'SimHei', '黑体', sans-serif;
    font-size: 15px;
    font-weight: bold;
    margin-bottom: 5px;
    color: #333;
  }

  .help-text {
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  textarea {
    width: 100%;
    font-family:
      'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', '宋体', 'SimHei', '黑体', sans-serif;
    font-size: 14px;
    padding: 10px;
    border: 2px solid #ccc;
    background-color: #f9f9f9;
    resize: vertical;
    transition:
      border-color 0.2s,
      background-color 0.2s;

    &:focus {
      outline: none;
      border-color: #4682b4;
      background-color: #fff;
    }

    &::placeholder {
      color: #999;
    }
  }
}

.button-group {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
}

.major-action-button {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: bold;
  border: 2px solid #000;
  background-color: #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family:
    'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', '宋体', 'SimHei', '黑体', sans-serif;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: #e0e0e0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.save-btn {
    background-color: #4682b4;
    border-color: #4682b4;
    color: #fff;

    &:hover:not(:disabled) {
      background-color: #5a9bd4;
      border-color: #5a9bd4;
    }
  }

  i {
    font-size: 16px;
  }
}

// 移动端适配
@media (max-width: 992px) {
  .segmented-memory-overlay {
    padding: 15px;
  }

  .segmented-memory-modal {
    width: 100%;
    max-width: 100%;
    max-height: 90vh;
    padding: 20px 15px;
    border-radius: 8px;

    h4 {
      font-size: 20px;
      margin-bottom: 8px;
      padding-right: 30px; // 为关闭按钮留出空间
    }

    .hint-text {
      font-size: 13px;
      margin-bottom: 15px;
    }

    .modal-close-btn {
      top: 12px;
      right: 12px;
      font-size: 28px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-content {
      padding: 8px 0;
    }
  }

  .settings-section {
    margin-bottom: 18px;

    label {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .help-text {
      font-size: 11px;
      margin-bottom: 6px;
    }

    textarea {
      font-size: 16px !important; // 防止iOS自动缩放
      padding: 12px;
      border-width: 2px;
    }
  }

  .button-group {
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }

  .major-action-button {
    width: 100%;
    padding: 12px 15px;
    font-size: 14px;
    justify-content: center;
    min-height: 44px; // 触摸友好
    border-width: 2px;

    i {
      font-size: 15px;
    }
  }
}

@media (max-width: 480px) {
  .segmented-memory-modal {
    padding: 15px 12px;
    border-radius: 6px;

    h4 {
      font-size: 18px;
    }

    .hint-text {
      font-size: 12px;
    }

    .modal-close-btn {
      width: 32px;
      height: 32px;
      font-size: 24px;
    }
  }

  .settings-section {
    label {
      font-size: 13px;
    }

    .help-text {
      font-size: 10px;
    }

    textarea {
      font-size: 15px !important;
      padding: 10px;
    }
  }

  .major-action-button {
    font-size: 13px;
    padding: 10px 12px;

    i {
      font-size: 14px;
    }
  }
}
</style>
