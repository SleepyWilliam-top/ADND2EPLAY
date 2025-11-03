<template>
  <div v-if="modelValue" class="image-library-modal-overlay" @click="handleOverlayClick">
    <div class="image-library-modal" @click.stop>
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h2>📚 图片图库</h2>
        <button class="close-btn" @click="emit('update:modelValue', false)">✕</button>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <!-- 上传按钮 -->
          <label class="upload-btn">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              style="display: none"
              @change="handleFileSelect"
            />
            📤 上传图片
          </label>

          <!-- 批量上传按钮 -->
          <label class="upload-btn batch">
            <input
              type="file"
              accept="image/*"
              multiple
              webkitdirectory
              style="display: none"
              @change="handleFileSelect"
            />
            📁 批量上传
          </label>

          <!-- 分类筛选 -->
          <select v-model="selectedCategory" class="category-filter">
            <option value="all">全部分类</option>
            <option value="character">角色卡</option>
            <option value="npc">NPC</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div class="toolbar-right">
          <!-- 搜索框 -->
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="🔍 搜索图片..."
          />

          <!-- 统计信息 -->
          <div class="stats">
            <span>{{ filteredImages.length }} 张</span>
            <span class="divider">|</span>
            <span>{{ formatSize(totalSize) }}</span>
          </div>
        </div>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploading" class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <p>正在上传: {{ uploadCurrent }} / {{ uploadTotal }}</p>
      </div>

      <!-- 图片网格 -->
      <div class="image-grid" :class="{ empty: filteredImages.length === 0 }">
        <!-- 空状态 -->
        <div v-if="filteredImages.length === 0" class="empty-state">
          <div class="empty-icon">🖼️</div>
          <p>暂无图片</p>
          <p class="empty-hint">点击上方按钮上传图片</p>
        </div>

        <!-- 图片卡片 -->
        <div
          v-for="image in filteredImages"
          :key="image.id"
          class="image-card"
          :class="{ selected: selectedImageId === image.id }"
          @click="handleImageSelect(image)"
        >
          <!-- 选中标记 -->
          <div v-if="selectedImageId === image.id" class="selected-mark">✓</div>

          <!-- 缩略图 -->
          <div class="image-thumbnail">
            <img :src="image.thumbnail" :alt="image.name" loading="lazy" />
          </div>

          <!-- 图片信息 -->
          <div class="image-info">
            <p class="image-name" :title="image.name">{{ image.name }}</p>
            <p class="image-meta">
              {{ image.width }}×{{ image.height }} · {{ formatSize(image.size) }}
            </p>
          </div>

          <!-- 操作按钮 -->
          <div class="image-actions">
            <button
              class="action-btn delete"
              title="删除"
              @click.stop="handleDeleteImage(image.id)"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="modal-footer">
        <button class="footer-btn danger" @click="handleClearLibrary">
          清空图库
        </button>
        <div class="footer-right">
          <button class="footer-btn secondary" @click="emit('update:modelValue', false)">
            取消
          </button>
          <button
            class="footer-btn primary"
            :disabled="!selectedImageId"
            @click="handleConfirmSelect"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import {
  type ImageItem,
  getAllImages,
  addMultipleImages,
  deleteImage,
  clearImageLibrary,
  updateImageUsage,
  searchImages,
  getImagesByCategory,
} from '../composables/useImageLibrary';
import toastr from 'toastr';

// ==================== Props & Emits ====================

const props = defineProps<{
  modelValue: boolean; // 是否显示模态框
  category?: 'character' | 'npc' | 'other'; // 默认分类
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  select: [imageData: string, imageId: string]; // 返回图片 Base64 和 ID
}>();

// ==================== 响应式数据 ====================

const fileInput = ref<HTMLInputElement | null>(null);
const images = ref<ImageItem[]>([]);
const selectedImageId = ref<string | null>(null);
const selectedCategory = ref<'all' | 'character' | 'npc' | 'other'>('all');
const searchKeyword = ref('');

// 上传状态
const uploading = ref(false);
const uploadCurrent = ref(0);
const uploadTotal = ref(0);

// ==================== 计算属性 ====================

const uploadProgress = computed(() => {
  if (uploadTotal.value === 0) return 0;
  return Math.round((uploadCurrent.value / uploadTotal.value) * 100);
});

const filteredImages = computed(() => {
  let result = images.value;

  // 分类筛选
  if (selectedCategory.value !== 'all') {
    result = result.filter(img => img.category === selectedCategory.value);
  }

  // 搜索筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(
      img =>
        img.name.toLowerCase().includes(keyword) ||
        img.tags?.some(tag => tag.toLowerCase().includes(keyword)),
    );
  }

  // 按使用次数和时间排序
  return result.sort((a, b) => {
    // 优先按使用次数
    if ((b.usageCount || 0) !== (a.usageCount || 0)) {
      return (b.usageCount || 0) - (a.usageCount || 0);
    }
    // 其次按上传时间
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });
});

const totalSize = computed(() => {
  return filteredImages.value.reduce((sum, img) => sum + img.size, 0);
});

// ==================== 方法 ====================

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * 加载图片列表
 */
async function loadImages() {
  try {
    images.value = await getAllImages();
    console.log('[ImageLibrary] 已加载', images.value.length, '张图片');
  } catch (error) {
    console.error('[ImageLibrary] 加载图片失败:', error);
    toastr.error('加载图片失败');
  }
}

/**
 * 处理文件选择
 */
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  uploading.value = true;
  uploadCurrent.value = 0;
  uploadTotal.value = files.length;

  try {
    const fileArray = Array.from(files);
    await addMultipleImages(
      fileArray,
      props.category,
      (current, total) => {
        uploadCurrent.value = current;
        uploadTotal.value = total;
      },
    );

    toastr.success(`成功上传 ${files.length} 张图片`);
    await loadImages();
  } catch (error) {
    console.error('[ImageLibrary] 上传失败:', error);
    toastr.error('上传失败');
  } finally {
    uploading.value = false;
    // 清空 input，允许重复选择相同文件
    target.value = '';
  }
}

/**
 * 选择图片
 */
function handleImageSelect(image: ImageItem) {
  selectedImageId.value = image.id;
}

/**
 * 确认选择
 */
async function handleConfirmSelect() {
  if (!selectedImageId.value) return;

  const image = images.value.find(img => img.id === selectedImageId.value);
  if (!image) {
    toastr.error('图片不存在');
    return;
  }

  // 更新使用统计
  await updateImageUsage(image.id);

  // 返回图片数据
  emit('select', image.data, image.id);
  emit('update:modelValue', false);

  toastr.success('已选择图片');
}

/**
 * 删除图片
 */
async function handleDeleteImage(id: string) {
  if (!confirm('确定要删除这张图片吗？')) return;

  try {
    await deleteImage(id);
    await loadImages();
    toastr.success('已删除图片');

    // 如果删除的是当前选中的图片，清空选择
    if (selectedImageId.value === id) {
      selectedImageId.value = null;
    }
  } catch (error) {
    console.error('[ImageLibrary] 删除失败:', error);
    toastr.error('删除失败');
  }
}

/**
 * 清空图库
 */
async function handleClearLibrary() {
  if (!confirm('确定要清空整个图库吗？此操作不可恢复！')) return;

  try {
    await clearImageLibrary();
    await loadImages();
    selectedImageId.value = null;
    toastr.success('图库已清空');
  } catch (error) {
    console.error('[ImageLibrary] 清空失败:', error);
    toastr.error('清空失败');
  }
}

/**
 * 点击遮罩关闭
 */
function handleOverlayClick() {
  emit('update:modelValue', false);
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadImages();
});

// 监听模态框打开，重新加载图片
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      loadImages();
      selectedImageId.value = null;
    }
  },
);
</script>

<style scoped lang="scss">
// ==================== 遮罩层 ====================
.image-library-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
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
.image-library-modal {
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
  border: 2px solid #fff;
  border-radius: 4px;
  width: 90vw;
  max-width: 1200px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(255, 255, 255, 0.1);
  animation: slideUp 0.3s ease-out;
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

// ==================== 头部 ====================
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 2px solid #fff;
  background: rgba(255, 255, 255, 0.05);

  h2 {
    margin: 0;
    font-size: 24px;
    color: #fff;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .close-btn {
    background: none;
    border: 2px solid #fff;
    color: #fff;
    font-size: 24px;
    width: 40px;
    height: 40px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #fff;
      color: #000;
      transform: rotate(90deg);
    }
  }
}

// ==================== 工具栏 ====================
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  gap: 15px;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.02);

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .upload-btn {
    padding: 8px 16px;
    background: #fff;
    color: #000;
    border: 2px solid #fff;
    border-radius: 2px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
      background: #000;
      color: #fff;
      transform: translateY(-2px);
    }

    &.batch {
      background: transparent;
      color: #fff;

      &:hover {
        background: #fff;
        color: #000;
      }
    }
  }

  .category-filter {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    border-radius: 2px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: #fff;
    }

    option {
      background: #1a1a1a;
      color: #fff;
    }
  }

  .search-input {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    border-radius: 2px;
    font-size: 14px;
    min-width: 200px;
    transition: all 0.2s;

    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.15);
      border-color: #fff;
    }
  }

  .stats {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    font-weight: 600;

    .divider {
      color: rgba(255, 255, 255, 0.3);
    }

    span {
      white-space: nowrap;
    }
  }
}

// ==================== 上传进度 ====================
.upload-progress {
  padding: 15px 30px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  .progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
      transition: width 0.3s ease;
      animation: shimmer 1.5s infinite;
    }
  }

  p {
    margin: 0;
    color: #fff;
    font-size: 14px;
    text-align: center;
    font-weight: 600;
  }
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

// ==================== 图片网格 ====================
.image-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px 30px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  align-content: start;

  // 自定义滚动条（黑白风格）
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 5px;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }

  &.empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// 空状态
.empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);

  .empty-icon {
    font-size: 80px;
    margin-bottom: 20px;
    opacity: 0.3;
  }

  p {
    margin: 8px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .empty-hint {
    font-size: 14px;
    opacity: 0.7;
  }
}

// 图片卡片
.image-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1);

    .image-actions {
      opacity: 1;
    }
  }

  &.selected {
    border-color: #fff;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);

    .selected-mark {
      opacity: 1;
    }
  }

  .selected-mark {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    background: #fff;
    color: #000;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 2;
  }

  .image-thumbnail {
    width: 100%;
    height: 180px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.02);
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
  }

  &:hover .image-thumbnail img {
    transform: scale(1.1);
  }

  .image-info {
    padding: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .image-name {
      margin: 0 0 6px 0;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .image-meta {
      margin: 0;
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
    }
  }

  .image-actions {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.2s;

    .action-btn {
      width: 32px;
      height: 32px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #fff;
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;

      &:hover {
        background: #fff;
        transform: scale(1.1);
      }

      &.delete:hover {
        background: #ff4444;
        border-color: #ff4444;
      }
    }
  }
}

// ==================== 底部操作 ====================
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-top: 2px solid #fff;
  background: rgba(255, 255, 255, 0.05);

  .footer-right {
    display: flex;
    gap: 12px;
  }

  .footer-btn {
    padding: 10px 24px;
    border: 2px solid #fff;
    border-radius: 2px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 1px;

    &.primary {
      background: #fff;
      color: #000;

      &:hover:not(:disabled) {
        background: #000;
        color: #fff;
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(255, 255, 255, 0.2);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    &.secondary {
      background: transparent;
      color: #fff;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    &.danger {
      background: transparent;
      color: #ff4444;
      border-color: #ff4444;

      &:hover {
        background: #ff4444;
        color: #fff;
      }
    }
  }
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .image-library-modal {
    width: 95vw;
    height: 90vh;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;

    .toolbar-left,
    .toolbar-right {
      width: 100%;
      justify-content: space-between;
    }

    .search-input {
      min-width: auto;
      flex: 1;
    }
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    padding: 15px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 12px;

    .footer-right {
      width: 100%;

      .footer-btn {
        flex: 1;
      }
    }

    .footer-btn.danger {
      width: 100%;
    }
  }
}
</style>

