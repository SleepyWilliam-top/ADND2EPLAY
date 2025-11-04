<template>
  <div class="monster-list-view">
    <!-- 头部栏 -->
    <div class="list-header">
      <button class="back-btn" @click="emit('back')">
        <i class="fas fa-arrow-left"></i>
        返回
      </button>
      <h3 class="list-title">{{ categoryLabel }}</h3>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <i class="fas fa-magnifying-glass search-icon"></i>
      <input
        v-model="localSearchKeyword"
        type="text"
        class="search-input"
        placeholder="在此分类中搜索..."
        @input="handleLocalSearch"
      />
    </div>

    <!-- 怪物列表 -->
    <div ref="listContainer" class="monster-list">
      <div v-if="filteredMonsters.length === 0" class="empty-state">
        <i class="fas fa-dragon empty-icon"></i>
        <p class="empty-text">未找到符合条件的怪物</p>
      </div>

      <div v-for="monster in filteredMonsters" :key="monster.id" class="monster-card" @click="emit('select', monster)">
        <!-- 怪物头像 -->
        <div class="monster-avatar">
          <img
            :src="getMonsterImage(monster)"
            :alt="monster.name"
            class="avatar-img"
            loading="lazy"
            @error="handleImageError"
          />
        </div>

        <!-- 怪物信息 -->
        <div class="monster-info">
          <h4 class="monster-name">
            {{ monster.name }}
            <span class="monster-english">({{ monster.englishName }})</span>
          </h4>
          <div class="monster-stats">
            <span class="stat-item">
              <i class="fas fa-heart"></i>
              HD {{ monster.hitDice }}
            </span>
            <span class="stat-divider">|</span>
            <span class="stat-item">
              <i class="fas fa-shield"></i>
              AC {{ monster.armorClass }}
            </span>
            <span class="stat-divider">|</span>
            <span class="stat-item">
              <i class="fas fa-star"></i>
              XP {{ monster.xpValue }}
            </span>
          </div>

          <!-- 遭遇标记 -->
          <div v-if="encounterRecords[monster.id]" class="encounter-badge">
            <i class="fas fa-star"></i>
            已遭遇 ×{{ encounterRecords[monster.id].encounterCount }}
          </div>
        </div>

        <!-- 查看详情按钮 -->
        <div class="card-action">
          <button class="detail-btn">
            <span>查看详情</span>
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- 底部占位空间，确保内容完全可见 -->
      <div class="bottom-spacer"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getAllEncounterRecords, type MonsterEncounterRecord } from '../composables/useMonsterEncyclopedia';
import { type Monster } from '../utils/monsterData';

// ==================== Props & Emits ====================

const props = defineProps<{
  monsters: Monster[];
  categoryLabel: string;
}>();

const emit = defineEmits<{
  back: [];
  select: [monster: Monster];
}>();

// ==================== 状态管理 ====================

const localSearchKeyword = ref('');
const listContainer = ref<HTMLElement | null>(null);
const encounterRecords = ref<Record<string, MonsterEncounterRecord>>({});

// 默认怪物头像
const DEFAULT_MONSTER_IMAGE = 'https://p.sda1.dev/28/5892e1c9ce14258ff21ba5f95f42c5eb/Monster.jpg';

// ==================== 计算属性 ====================

const filteredMonsters = computed(() => {
  if (!localSearchKeyword.value.trim()) {
    return props.monsters;
  }

  const keyword = localSearchKeyword.value.toLowerCase();
  return props.monsters.filter(
    monster => monster.name.toLowerCase().includes(keyword) || monster.englishName.toLowerCase().includes(keyword),
  );
});

// ==================== 生命周期 ====================

onMounted(async () => {
  await loadEncounterRecords();
});

// ==================== 方法 ====================

/**
 * 加载遭遇记录
 */
async function loadEncounterRecords() {
  try {
    const records = await getAllEncounterRecords();
    const recordMap: Record<string, MonsterEncounterRecord> = {};
    records.forEach(record => {
      recordMap[record.monsterId] = record;
    });
    encounterRecords.value = recordMap;
  } catch (error) {
    console.error('[MonsterListView] 加载遭遇记录失败:', error);
  }
}

/**
 * 获取怪物图片
 */
function getMonsterImage(monster: Monster): string {
  // 优先使用自定义图片
  const record = encounterRecords.value[monster.id];
  if (record && record.customImageId) {
    // TODO: 从图库获取图片
    // const customImage = await getImageById(record.customImageId);
    // if (customImage) return customImage.data;
  }

  // 使用怪物数据中的图片
  if (monster.imageUrl) {
    return monster.imageUrl;
  }

  // 使用默认图片
  return DEFAULT_MONSTER_IMAGE;
}

/**
 * 处理图片加载错误
 */
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = DEFAULT_MONSTER_IMAGE;
}

/**
 * 处理本地搜索
 */
function handleLocalSearch() {
  // 搜索已经通过 computed 实现
}
</script>

<style scoped lang="scss">
.monster-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
}

// ==================== 头部栏 ====================
.list-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px 30px;
  background: #fff;
  border-bottom: 2px solid rgba(0, 0, 0, 0.08);

  .back-btn {
    padding: 10px 18px;
    background: #fff;
    border: 2px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: '临海体', serif;
    font-size: 14px;
    font-weight: 600;
    color: #555;

    &:hover {
      background: #f5f5f5;
      border-color: #8b4513;
      color: #8b4513;
      transform: translateX(-3px);
    }

    i {
      font-size: 14px;
    }
  }

  .list-title {
    flex: 1;
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #2c2c2c;
    font-family: '临海体', serif;
  }
}

// ==================== 搜索栏 ====================
.search-bar {
  position: relative;
  padding: 20px 30px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .search-icon {
    position: absolute;
    left: 45px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    font-size: 14px;
  }

  .search-input {
    width: 100%;
    padding: 10px 15px 10px 40px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    font-family: '临海体', serif;
    font-size: 14px;
    background: #fafafa;
    transition: all 0.2s;

    &::placeholder {
      color: #bbb;
    }

    &:focus {
      outline: none;
      border-color: #8b4513;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.08);
    }
  }
}

// ==================== 怪物列表 ====================
.monster-list {
  flex: 1;
  overflow-y: scroll; // 强制显示滚动条，即使内容不够也显示
  overflow-x: hidden;
  padding: 20px 30px 20px 30px; // 减少底部 padding，因为有占位元素
  min-height: 0; // 确保 flex 子元素可以滚动

  // 性能优化
  will-change: scroll-position;
  -webkit-overflow-scrolling: touch;

  // 自定义滚动条 - 更宽更明显
  &::-webkit-scrollbar {
    width: 12px; // 增加滚动条宽度
  }

  &::-webkit-scrollbar-track {
    background: #e8e8e8; // 更明显的轨道颜色
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888; // 更深的滑块颜色
    border-radius: 6px;
    border: 2px solid #e8e8e8; // 添加边框，更明显

    &:hover {
      background: #555; // hover 时更深
    }
  }

  // 为 Firefox 提供滚动条样式
  scrollbar-width: auto; // 使用标准宽度而不是 thin
  scrollbar-color: #888 #e8e8e8;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;

  .empty-icon {
    font-size: 80px;
    opacity: 0.3;
    margin-bottom: 20px;
  }

  .empty-text {
    font-family: '临海体', serif;
    font-size: 16px;
    margin: 0;
  }
}

// 怪物卡片
.monster-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.2s;

  // 确保卡片宽度正确
  width: 100%;
  box-sizing: border-box;

  // 性能优化
  will-change: transform;
  transform: translateZ(0); // 启用硬件加速

  &:hover {
    border-color: #8b4513;
    background: #f8f5f0;
    transform: translateY(-3px) translateZ(0);
    box-shadow: 0 6px 20px rgba(139, 69, 19, 0.15);

    .detail-btn {
      background: #8b4513;
      color: #fff;
    }
  }

  &:active {
    transform: translateY(-1px) translateZ(0);
  }

  .monster-avatar {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    background: #f0f0f0;
    border: 2px solid rgba(0, 0, 0, 0.08);
    flex-shrink: 0;

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .monster-info {
    flex: 1;
    min-width: 0;
    overflow: hidden; // 防止溢出

    .monster-name {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #2c2c2c;
      font-family: '临海体', serif;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      word-break: break-word; // 允许长文本换行

      .monster-english {
        font-size: 14px;
        font-weight: 400;
        color: #888;
        word-break: break-word;
      }
    }

    .monster-stats {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 14px;
      color: #666;
      font-family: '临海体', serif;
      margin-bottom: 8px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap; // 统计项不换行

        i {
          color: #8b4513;
          font-size: 12px;
        }
      }

      .stat-divider {
        color: #ddd;
      }
    }

    .encounter-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      background: linear-gradient(135deg, #f39c12, #e67e22);
      color: #fff;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      font-family: '临海体', serif;
      box-shadow: 0 2px 6px rgba(243, 156, 18, 0.3);
      white-space: nowrap; // 徽章不换行

      i {
        font-size: 10px;
      }
    }
  }

  .card-action {
    flex-shrink: 0;
    display: flex;
    align-items: center;

    .detail-btn {
      padding: 10px 16px; // 减少左右 padding
      background: #fff;
      border: 2px solid #8b4513;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px; // 减少间距
      font-family: '临海体', serif;
      font-size: 13px; // 稍微减小字体
      font-weight: 600;
      color: #8b4513;
      white-space: nowrap; // 按钮文字不换行

      i {
        font-size: 12px;
        flex-shrink: 0; // 图标不压缩
      }

      span {
        flex-shrink: 0; // 文字不压缩
      }
    }
  }
}

// ==================== 底部占位空间 ====================
.bottom-spacer {
  height: 200px; // 超大占位高度，确保最后的内容完全可见
  flex-shrink: 0; // 防止被压缩
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .list-header {
    padding: 15px 20px;

    .list-title {
      font-size: 18px;
    }
  }

  .search-bar,
  .monster-list {
    padding: 15px 20px;
  }

  .monster-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    padding: 15px;

    .monster-avatar {
      width: 100%;
      height: 150px;
    }

    .card-action {
      width: 100%;

      .detail-btn {
        width: 100%;
        justify-content: center;
      }
    }
  }
}
</style>
