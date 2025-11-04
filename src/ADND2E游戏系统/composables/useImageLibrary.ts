/**
 * 图库管理 Composable
 *
 * 使用 IndexedDB 统一管理角色卡和NPC的图片资源
 * 支持批量上传、图片压缩、图库管理等功能
 */

import Dexie, { type Table } from 'dexie';

// ==================== 类型定义 ====================

export interface ImageItem {
  id: string; // 唯一标识符
  name: string; // 图片名称
  data: string; // Base64 图片数据
  thumbnail: string; // 缩略图（用于列表显示）
  size: number; // 文件大小（字节）
  width: number; // 图片宽度
  height: number; // 图片高度
  uploadedAt: string; // 上传时间
  tags?: string[]; // 标签（可选，用于分类）
  category?: 'character' | 'npc' | 'other'; // 分类
  usageCount?: number; // 使用次数
  lastUsedAt?: string; // 最后使用时间
}

export interface ImageLibraryStats {
  totalImages: number;
  totalSize: number; // 总大小（字节）
  categories: Record<string, number>; // 各分类数量
}

// ==================== IndexedDB 数据库 ====================

class ImageLibraryDatabase extends Dexie {
  images!: Table<ImageItem, string>;

  constructor() {
    super('ADND2E_ImageLibrary');

    // 版本 1: 初始架构
    this.version(1).stores({
      images: '&id, name, uploadedAt, category, usageCount',
    });
  }
}

// 创建数据库实例
const db = new ImageLibraryDatabase();

// ==================== 图片处理工具 ====================

/**
 * 智能压缩图片
 *
 * 优化策略：
 * 1. 自动检测图片格式，PNG 保留透明度
 * 2. 根据原图大小智能调整目标尺寸和质量
 * 3. 迭代压缩直到满足目标大小（最大 500KB）
 */
async function compressImage(
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  targetSizeKB: number = 500,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();
      img.onload = async () => {
        try {
          // 检测图片格式
          const isPNG = file.type === 'image/png';
          const mimeType = isPNG ? 'image/png' : 'image/jpeg';

          // 计算缩放比例
          let { width, height } = img;
          const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);

          // 创建 canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d', { alpha: isPNG });
          if (!ctx) {
            reject(new Error('无法获取 canvas context'));
            return;
          }

          // 🔧 使用高质量绘制
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);

          // 🔧 智能质量调整：根据目标大小迭代压缩
          let quality = 0.92;
          let base64 = '';
          let attempts = 0;
          const maxAttempts = 5;

          while (attempts < maxAttempts) {
            base64 = canvas.toDataURL(mimeType, quality);
            const sizeKB = getBase64Size(base64) / 1024;

            console.log(
              `[ImageCompression] 尝试 ${attempts + 1}: 质量=${quality.toFixed(2)}, 大小=${sizeKB.toFixed(2)}KB`,
            );

            // 如果大小合适或已是最低质量，停止
            if (sizeKB <= targetSizeKB || quality <= 0.5) {
              break;
            }

            // 根据当前大小调整质量
            const sizeFactor = targetSizeKB / sizeKB;
            quality = Math.max(0.5, quality * sizeFactor * 0.9); // 保守降低质量
            attempts++;
          }

          console.log(`[ImageCompression] 最终: 大小=${(getBase64Size(base64) / 1024).toFixed(2)}KB`);
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 生成缩略图
 */
async function generateThumbnail(base64: string, size: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(size / img.width, size / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取 canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    img.onerror = () => reject(new Error('缩略图生成失败'));
    img.src = base64;
  });
}

/**
 * 获取图片尺寸
 */
async function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('无法读取图片尺寸'));
    img.src = base64;
  });
}

/**
 * 计算 Base64 图片大小（字节）
 */
function getBase64Size(base64: string): number {
  const base64Data = base64.split(',')[1] || base64;
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  return (base64Data.length * 3) / 4 - padding;
}

// ==================== 图库 API ====================

/**
 * 添加图片到图库
 */
export async function addImageToLibrary(file: File, category?: 'character' | 'npc' | 'other'): Promise<ImageItem> {
  try {
    // 压缩图片
    const compressedBase64 = await compressImage(file);
    const thumbnail = await generateThumbnail(compressedBase64);
    const dimensions = await getImageDimensions(compressedBase64);
    const size = getBase64Size(compressedBase64);

    const imageItem: ImageItem = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      data: compressedBase64,
      thumbnail,
      size,
      width: dimensions.width,
      height: dimensions.height,
      uploadedAt: new Date().toISOString(),
      category,
      usageCount: 0,
    };

    await db.images.add(imageItem);
    console.log('[ImageLibrary] 图片已添加:', imageItem.name);
    return imageItem;
  } catch (error) {
    console.error('[ImageLibrary] 添加图片失败:', error);
    throw error;
  }
}

/**
 * 批量添加图片
 */
export async function addMultipleImages(
  files: File[],
  category?: 'character' | 'npc' | 'other',
  onProgress?: (current: number, total: number) => void,
): Promise<ImageItem[]> {
  const results: ImageItem[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const imageItem = await addImageToLibrary(files[i], category);
      results.push(imageItem);
      onProgress?.(i + 1, files.length);
    } catch (error) {
      console.error(`[ImageLibrary] 上传第 ${i + 1} 张图片失败:`, error);
    }
  }

  return results;
}

/**
 * 获取所有图片
 */
export async function getAllImages(): Promise<ImageItem[]> {
  try {
    return await db.images.toArray();
  } catch (error) {
    console.error('[ImageLibrary] 获取图片列表失败:', error);
    return [];
  }
}

/**
 * 根据分类获取图片
 */
export async function getImagesByCategory(category: 'character' | 'npc' | 'other'): Promise<ImageItem[]> {
  try {
    return await db.images.where('category').equals(category).toArray();
  } catch (error) {
    console.error('[ImageLibrary] 获取分类图片失败:', error);
    return [];
  }
}

/**
 * 根据ID获取图片
 */
export async function getImageById(id: string): Promise<ImageItem | null> {
  try {
    return (await db.images.get(id)) || null;
  } catch (error) {
    console.error('[ImageLibrary] 获取图片失败:', error);
    return null;
  }
}

/**
 * 更新图片使用统计
 */
export async function updateImageUsage(id: string): Promise<void> {
  try {
    const image = await db.images.get(id);
    if (image) {
      await db.images.update(id, {
        usageCount: (image.usageCount || 0) + 1,
        lastUsedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[ImageLibrary] 更新使用统计失败:', error);
  }
}

/**
 * 删除图片
 */
export async function deleteImage(id: string): Promise<void> {
  try {
    await db.images.delete(id);
    console.log('[ImageLibrary] 图片已删除:', id);
  } catch (error) {
    console.error('[ImageLibrary] 删除图片失败:', error);
    throw error;
  }
}

/**
 * 批量删除图片
 */
export async function deleteMultipleImages(ids: string[]): Promise<void> {
  try {
    await db.images.bulkDelete(ids);
    console.log('[ImageLibrary] 已删除', ids.length, '张图片');
  } catch (error) {
    console.error('[ImageLibrary] 批量删除失败:', error);
    throw error;
  }
}

/**
 * 清空图库
 */
export async function clearImageLibrary(): Promise<void> {
  try {
    await db.images.clear();
    console.log('[ImageLibrary] 图库已清空');
  } catch (error) {
    console.error('[ImageLibrary] 清空图库失败:', error);
    throw error;
  }
}

/**
 * 获取图库统计信息
 */
export async function getLibraryStats(): Promise<ImageLibraryStats> {
  try {
    const images = await db.images.toArray();
    const stats: ImageLibraryStats = {
      totalImages: images.length,
      totalSize: images.reduce((sum, img) => sum + img.size, 0),
      categories: {
        character: 0,
        npc: 0,
        other: 0,
      },
    };

    images.forEach(img => {
      if (img.category) {
        stats.categories[img.category]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('[ImageLibrary] 获取统计信息失败:', error);
    return {
      totalImages: 0,
      totalSize: 0,
      categories: { character: 0, npc: 0, other: 0 },
    };
  }
}

/**
 * 搜索图片
 */
export async function searchImages(keyword: string): Promise<ImageItem[]> {
  try {
    const allImages = await db.images.toArray();
    const lowerKeyword = keyword.toLowerCase();

    return allImages.filter(
      img =>
        img.name.toLowerCase().includes(lowerKeyword) ||
        img.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword)),
    );
  } catch (error) {
    console.error('[ImageLibrary] 搜索图片失败:', error);
    return [];
  }
}

/**
 * 导出图库数据（用于备份）
 */
export async function exportLibrary(): Promise<string> {
  try {
    const images = await db.images.toArray();
    const json = JSON.stringify(images, null, 2);
    return json;
  } catch (error) {
    console.error('[ImageLibrary] 导出图库失败:', error);
    throw error;
  }
}

/**
 * 导入图库数据（用于恢复）
 */
export async function importLibrary(jsonString: string): Promise<number> {
  try {
    const images: ImageItem[] = JSON.parse(jsonString);

    // 验证数据结构
    if (!Array.isArray(images)) {
      throw new Error('无效的图库数据格式');
    }

    // 批量导入
    await db.images.bulkAdd(images);
    console.log('[ImageLibrary] 已导入', images.length, '张图片');
    return images.length;
  } catch (error) {
    console.error('[ImageLibrary] 导入图库失败:', error);
    throw error;
  }
}

// 导出数据库实例（供高级使用）
export { db as imageLibraryDB };
