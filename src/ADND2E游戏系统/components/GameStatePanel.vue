<template>
  <div class="game-state-panel">
    <div class="panel-header">
      <h3>游戏状态</h3>
      <button class="toggle-btn" @click="collapsed = !collapsed">
        <i :class="collapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"></i>
      </button>
    </div>

    <div v-show="!collapsed" class="panel-content">
      <!-- 角色状态 -->
      <div class="state-section">
        <h4><i class="fas fa-heart"></i> 角色状态</h4>
        <div class="state-grid">
          <div class="state-item">
            <span class="label">生命值:</span>
            <span class="value" :class="hpClass">
              {{ gameState.character.hp.current }}/{{ gameState.character.hp.max }}
            </span>
          </div>
          <div v-if="gameState.character.tempHp > 0" class="state-item">
            <span class="label">临时HP:</span>
            <span class="value temp-hp">{{ gameState.character.tempHp }}</span>
          </div>
          <div class="state-item">
            <span class="label">等级:</span>
            <span class="value">{{ gameState.character.level }}</span>
          </div>
          <div class="state-item">
            <span class="label">经验:</span>
            <span class="value">{{ gameState.character.xp }}</span>
          </div>
          <div class="state-item">
            <span class="label">金币:</span>
            <span class="value gold">{{ gameState.character.gold }} GP</span>
          </div>
        </div>
      </div>

      <!-- 位置 -->
      <div v-if="gameState.location.current && gameState.location.current !== '未知'" class="state-section">
        <h4><i class="fas fa-map-marker-alt"></i> 位置</h4>
        <div class="location-display">{{ gameState.location.current }}</div>
      </div>

      <!-- 时间 -->
      <div
        v-if="gameState.time && (gameState.time.current !== '未知' || gameState.time.date !== '第1天')"
        class="state-section"
      >
        <h4><i class="fas fa-clock"></i> 时间</h4>
        <div class="time-display">
          <div v-if="gameState.time.current !== '未知'" class="time-item">
            <span class="time-label">时刻:</span>
            <span class="time-value">{{ gameState.time.current }}</span>
          </div>
          <div v-if="gameState.time.date !== '第1天'" class="time-item">
            <span class="time-label">日期:</span>
            <span class="time-value">{{ gameState.time.date }}</span>
          </div>
          <div v-if="gameState.time.season !== '未知'" class="time-item">
            <span class="time-label">季节:</span>
            <span class="time-value">{{ gameState.time.season }}</span>
          </div>
        </div>
      </div>

      <!-- 天气 -->
      <div v-if="gameState.weather && gameState.weather.current !== '未知'" class="state-section">
        <h4><i class="fas fa-cloud-sun"></i> 天气</h4>
        <div class="weather-display">
          <div class="weather-item">
            <span class="weather-label">天气:</span>
            <span class="weather-value">{{ gameState.weather.current }}</span>
          </div>
          <div v-if="gameState.weather.temperature !== '未知'" class="weather-item">
            <span class="weather-label">温度:</span>
            <span class="weather-value">{{ gameState.weather.temperature }}</span>
          </div>
        </div>
      </div>

      <!-- 效果/状态 -->
      <div v-if="gameState.effects.length > 0" class="state-section">
        <h4><i class="fas fa-magic"></i> 效果</h4>
        <div class="effects-list">
          <div v-for="(effect, index) in gameState.effects" :key="index" class="effect-item">
            <span class="effect-name">{{ effect.name }}</span>
            <span class="effect-duration">{{ effect.duration }}</span>
          </div>
        </div>
      </div>

      <!-- 物品 -->
      <div v-if="gameState.inventory.length > 0" class="state-section">
        <h4><i class="fas fa-backpack"></i> 物品 ({{ gameState.inventory.length }})</h4>
        <div class="inventory-list">
          <div v-for="(item, index) in gameState.inventory" :key="index" class="inventory-item">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-quantity">×{{ item.quantity }}</span>
          </div>
        </div>
      </div>

      <!-- 任务 -->
      <div v-if="activeQuests.length > 0" class="state-section">
        <h4><i class="fas fa-scroll"></i> 进行中的任务</h4>
        <div class="quests-list">
          <div v-for="quest in activeQuests" :key="quest.id" class="quest-item">
            <div class="quest-title">{{ quest.title }}</div>
            <div v-if="quest.progress" class="quest-progress">{{ quest.progress }}</div>
          </div>
        </div>
      </div>

      <!-- 战斗状态 -->
      <div v-if="gameState.combat.inCombat" class="state-section combat-section">
        <h4><i class="fas fa-crossed-swords"></i> 战斗中</h4>
        <div class="combat-info">
          <span>轮数: {{ gameState.combat.round }}</span>
          <span>先攻: {{ gameState.combat.initiative }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStateStore } from '../stores/gameStateStore';

const gameStateStore = useGameStateStore();
const gameState = computed(() => gameStateStore.gameState);

const collapsed = ref(false);

const hpClass = computed(() => {
  const { current, max } = gameState.value.character.hp;
  const percentage = (current / max) * 100;
  if (percentage <= 0) return 'hp-dead';
  if (percentage <= 25) return 'hp-critical';
  if (percentage <= 50) return 'hp-wounded';
  return 'hp-healthy';
});

const activeQuests = computed(() => {
  return gameState.value.quests.filter(q => q.status === 'active');
});
</script>

<style lang="scss" scoped>
.game-state-panel {
  background-color: #fff;
  border: 3px solid #000;
  margin-bottom: 20px;
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

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-bottom: 2px solid #000;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 5px;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.2);
    }
  }
}

.panel-content {
  padding: 15px;
}

.state-section {
  margin-bottom: 15px;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: 14px;
    font-weight: bold;
    margin: 0 0 10px 0;
    padding-bottom: 5px;
    border-bottom: 2px solid #ddd;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: #666;
    }
  }
}

.state-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.state-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  font-size: 13px;

  .label {
    font-weight: bold;
    color: #666;
  }

  .value {
    font-weight: bold;
    font-family: "临海体", serif;

    &.hp-healthy {
      color: #2e7d32;
    }

    &.hp-wounded {
      color: #f57c00;
    }

    &.hp-critical {
      color: #c62828;
    }

    &.hp-dead {
      color: #000;
      text-decoration: line-through;
    }

    &.temp-hp {
      color: #1976d2;
    }

    &.gold {
      color: #ffa000;
    }
  }
}

.location-display {
  padding: 10px;
  background-color: #f0f0f0;
  border: 2px solid #000;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
}

.time-display,
.weather-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-item,
.weather-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  font-size: 12px;

  .time-label,
  .weather-label {
    font-weight: bold;
    color: #666;
  }

  .time-value,
  .weather-value {
    font-weight: bold;
    color: #2e7d32;
  }
}

.effects-list,
.inventory-list,
.quests-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.effect-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background-color: #fff3e0;
  border: 2px solid #ff9800;
  font-size: 12px;

  .effect-name {
    font-weight: bold;
  }

  .effect-duration {
    color: #666;
    font-style: italic;
  }
}

.inventory-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  font-size: 12px;

  .item-name {
    font-weight: bold;
  }

  .item-quantity {
    color: #666;
  }
}

.quest-item {
  padding: 10px;
  background-color: #e3f2fd;
  border: 2px solid #2196f3;
  font-size: 12px;

  .quest-title {
    font-weight: bold;
    margin-bottom: 5px;
  }

  .quest-progress {
    color: #666;
    font-style: italic;
  }
}

.combat-section {
  background-color: #ffebee;
  border: 2px solid #c62828;
  padding: 10px;
  margin: -15px -15px 0 -15px;

  h4 {
    color: #c62828;
    border-bottom-color: #c62828;
  }

  .combat-info {
    display: flex;
    justify-content: space-around;
    font-size: 13px;
    font-weight: bold;
    padding: 5px 0;

    span {
      color: #c62828;
    }
  }
}
</style>
