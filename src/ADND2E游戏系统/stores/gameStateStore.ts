import { klona } from 'klona';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { GameCommand } from '../utils/commandParser';
import { validateCommand } from '../utils/commandParser';

/**
 * 游戏状态接口（结构化存储）
 */
export interface GameState {
  // 角色状态
  character: {
    hp: { current: number; max: number };
    tempHp: number;
    attributes: {
      str: number;
      dex: number;
      con: number;
      int: number;
      wis: number;
      cha: number;
    };
    gold: number;
    xp: number;
    level: number;
  };

  // 位置信息
  location: {
    current: string;
    history: string[];
  };

  // 时间系统
  time: {
    current: string; // 当前时间描述，如 "清晨"、"午后"、"黄昏"、"深夜"等
    date: string; // 游戏内日期，如 "第3天"、"春月15日" 等
    season: string; // 季节，如 "春季"、"夏季" 等
  };

  // 天气系统
  weather: {
    current: string; // 当前天气，如 "晴朗"、"多云"、"雨天" 等
    temperature: string; // 温度描述，如 "温暖"、"寒冷" 等
  };

  // 物品清单
  inventory: Array<{
    name: string;
    quantity: number;
    description?: string;
    weight?: number;
  }>;

  // NPC 状态（简化版，与 useNpcAutoDetection 配合）
  npcs: Array<{
    name: string;
    hp: number;
    maxHp: number;
    ac: number;
    status: string;
    attitude: string;
  }>;

  // 任务
  quests: Array<{
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'failed';
    progress?: string;
  }>;

  // 效果/状态
  effects: Array<{
    name: string;
    duration: string;
    description?: string;
  }>;

  // 战斗状态
  combat: {
    inCombat: boolean;
    round: number;
    initiative: number;
  };

  // 休息状态
  rest: {
    lastShortRest: number | null;
    lastLongRest: number | null;
  };

  // 元信息
  meta: {
    lastUpdated: number;
    version: string;
  };
}

/**
 * 创建默认游戏状态
 */
function createDefaultGameState(): GameState {
  return {
    character: {
      hp: { current: 0, max: 0 },
      tempHp: 0,
      attributes: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      },
      gold: 0,
      xp: 0,
      level: 1,
    },
    location: {
      current: '未知',
      history: [],
    },
    time: {
      current: '未知',
      date: '第1天',
      season: '未知',
    },
    weather: {
      current: '未知',
      temperature: '未知',
    },
    inventory: [],
    npcs: [],
    quests: [],
    effects: [],
    combat: {
      inCombat: false,
      round: 0,
      initiative: 0,
    },
    rest: {
      lastShortRest: null,
      lastLongRest: null,
    },
    meta: {
      lastUpdated: Date.now(),
      version: '1.0.0',
    },
  };
}

/**
 * 游戏状态 Store（与 gameStore 配合使用）
 */
export const useGameStateStore = defineStore('adnd2e-game-state', () => {
  const gameState = ref<GameState>(createDefaultGameState());

  // 计算属性
  const isAlive = computed(() => gameState.value.character.hp.current > 0);
  const isDead = computed(() => gameState.value.character.hp.current <= 0);
  const isInjured = computed(() => {
    const { current, max } = gameState.value.character.hp;
    return current < max && current > 0;
  });

  /**
   * 初始化游戏状态（从第0层加载）
   */
  function initializeGameState(characterData?: any) {
    if (characterData) {
      // 从角色卡数据初始化
      gameState.value.character.hp = {
        current: characterData.hitPoints?.current || 0,
        max: characterData.hitPoints?.max || 0,
      };
      gameState.value.character.attributes = {
        str: characterData.abilities?.str || 10,
        dex: characterData.abilities?.dex || 10,
        con: characterData.abilities?.con || 10,
        int: characterData.abilities?.int || 10,
        wis: characterData.abilities?.wis || 10,
        cha: characterData.abilities?.cha || 10,
      };
      gameState.value.character.gold = characterData.currentMoney || 0;
      gameState.value.character.level = 1;
      gameState.value.character.xp = 0;
    }

    console.log('[GameState] 游戏状态已初始化', gameState.value);
  }

  /**
   * 从第0层加载游戏状态
   */
  function loadGameState(savedState: Partial<GameState>) {
    if (savedState) {
      // 深度合并保存的状态
      gameState.value = {
        ...gameState.value,
        ...savedState,
        meta: {
          ...gameState.value.meta,
          lastUpdated: Date.now(),
        },
      };
      console.log('[GameState] 游戏状态已加载', gameState.value);
    }
  }

  /**
   * 应用单个命令到游戏状态
   */
  function applyCommand(command: GameCommand): boolean {
    if (!validateCommand(command)) {
      console.warn('[GameState] 无效命令:', command);
      return false;
    }

    try {
      switch (command.type) {
        case 'update_hp':
          gameState.value.character.hp.current = Math.max(
            0,
            Math.min(command.data.current, gameState.value.character.hp.max),
          );
          toastr.info(`生命值更新: ${gameState.value.character.hp.current}/${gameState.value.character.hp.max}`);
          break;

        case 'update_attribute': {
          const attr = command.data.attribute as keyof typeof gameState.value.character.attributes;
          if (attr in gameState.value.character.attributes) {
            gameState.value.character.attributes[attr] = command.data.value;
            toastr.info(`${attr.toUpperCase()} 更新为 ${command.data.value}`);
          }
          break;
        }

        case 'add_item': {
          const existingItem = gameState.value.inventory.find(item => item.name === command.data.name);
          if (existingItem) {
            existingItem.quantity += command.data.quantity || 1;
          } else {
            gameState.value.inventory.push({
              name: command.data.name,
              quantity: command.data.quantity || 1,
              description: command.data.description,
              weight: command.data.weight,
            });
          }
          toastr.success(`获得物品: ${command.data.name} ×${command.data.quantity || 1}`);
          break;
        }

        case 'remove_item': {
          const itemIndex = gameState.value.inventory.findIndex(item => item.name === command.data.name);
          if (itemIndex !== -1) {
            const item = gameState.value.inventory[itemIndex];
            item.quantity -= command.data.quantity || 1;
            if (item.quantity <= 0) {
              gameState.value.inventory.splice(itemIndex, 1);
            }
            toastr.warning(`失去物品: ${command.data.name} ×${command.data.quantity || 1}`);
          }
          break;
        }

        case 'update_gold':
          gameState.value.character.gold += command.data.amount;
          if (command.data.amount > 0) {
            toastr.success(`获得金币: ${command.data.amount} GP`);
          } else {
            toastr.warning(`失去金币: ${Math.abs(command.data.amount)} GP`);
          }
          break;

        case 'add_npc':
          gameState.value.npcs.push({
            name: command.data.name,
            hp: command.data.hp || 10,
            maxHp: command.data.maxHp || command.data.hp || 10,
            ac: command.data.ac || 10,
            status: command.data.status || 'normal',
            attitude: command.data.attitude || 'neutral',
          });
          toastr.info(`新 NPC 出现: ${command.data.name}`);
          break;

        case 'update_npc': {
          const npc = gameState.value.npcs.find(n => n.name === command.data.name);
          if (npc) {
            Object.assign(npc, command.data);
            toastr.info(`NPC ${command.data.name} 状态更新`);
          }
          break;
        }

        case 'remove_npc': {
          const npcIndex = gameState.value.npcs.findIndex(n => n.name === command.data.name);
          if (npcIndex !== -1) {
            gameState.value.npcs.splice(npcIndex, 1);
            toastr.info(`NPC ${command.data.name} 已离开`);
          }
          break;
        }

        case 'update_location':
          if (gameState.value.location.current !== command.data.location) {
            gameState.value.location.history.push(gameState.value.location.current);
            gameState.value.location.current = command.data.location;
            console.log('[GameState] 位置已更新:', command.data.location);
            toastr.info(`位置更新: ${command.data.location}`);
          }
          break;

        case 'update_time':
          if (command.data.current) gameState.value.time.current = command.data.current;
          if (command.data.date) gameState.value.time.date = command.data.date;
          if (command.data.season) gameState.value.time.season = command.data.season;
          console.log('[GameState] 时间已更新:', gameState.value.time);
          toastr.info(
            `时间更新: ${gameState.value.time.current}${gameState.value.time.date ? ` (${gameState.value.time.date})` : ''}`,
          );
          break;

        case 'update_weather':
          if (command.data.current) gameState.value.weather.current = command.data.current;
          if (command.data.temperature) gameState.value.weather.temperature = command.data.temperature;
          console.log('[GameState] 天气已更新:', gameState.value.weather);
          toastr.info(
            `天气更新: ${gameState.value.weather.current}${gameState.value.weather.temperature ? ` (${gameState.value.weather.temperature})` : ''}`,
          );
          break;

        case 'add_quest':
          gameState.value.quests.push({
            id: crypto.randomUUID(),
            title: command.data.title,
            description: command.data.description || '',
            status: 'active',
            progress: command.data.progress,
          });
          toastr.success(`新任务: ${command.data.title}`);
          break;

        case 'update_quest': {
          const quest = gameState.value.quests.find(q => q.title === command.data.title);
          if (quest) {
            Object.assign(quest, command.data);
            if (command.data.status === 'completed') {
              toastr.success(`任务完成: ${command.data.title}`);
            }
          }
          break;
        }

        case 'add_effect':
          gameState.value.effects.push({
            name: command.data.effect,
            duration: command.data.duration || '未知',
            description: command.data.description,
          });
          toastr.warning(`获得效果: ${command.data.effect}`);
          break;

        case 'remove_effect': {
          const effectIndex = gameState.value.effects.findIndex(e => e.name === command.data.effect);
          if (effectIndex !== -1) {
            gameState.value.effects.splice(effectIndex, 1);
            toastr.info(`效果消失: ${command.data.effect}`);
          }
          break;
        }

        case 'take_damage':
          gameState.value.character.hp.current = Math.max(
            0,
            gameState.value.character.hp.current - command.data.amount,
          );
          toastr.error(`受到 ${command.data.amount} 点伤害${command.data.source ? `（${command.data.source}）` : ''}`);
          break;

        case 'heal':
          gameState.value.character.hp.current = Math.min(
            gameState.value.character.hp.max,
            gameState.value.character.hp.current + command.data.amount,
          );
          toastr.success(
            `恢复 ${command.data.amount} 点生命值${command.data.source ? `（${command.data.source}）` : ''}`,
          );
          break;

        case 'gain_xp':
          gameState.value.character.xp += command.data.amount;
          toastr.success(
            `获得 ${command.data.amount} 点经验值${command.data.source ? `（${command.data.source}）` : ''}`,
          );
          break;

        case 'level_up':
          gameState.value.character.level = command.data.newLevel;
          toastr.success(`🎉 升级到 ${command.data.newLevel} 级！`);
          break;

        case 'rest': {
          const now = Date.now();
          if (command.data.type === 'short') {
            gameState.value.rest.lastShortRest = now;
            toastr.info('你进行了短休');
          } else if (command.data.type === 'long') {
            gameState.value.rest.lastLongRest = now;
            gameState.value.character.hp.current = gameState.value.character.hp.max;
            toastr.success('你进行了长休，生命值已完全恢复');
          }
          break;
        }

        default:
          console.warn('[GameState] 未知命令类型:', command.type);
          return false;
      }

      gameState.value.meta.lastUpdated = Date.now();
      return true;
    } catch (error) {
      console.error('[GameState] 应用命令失败:', command, error);
      return false;
    }
  }

  /**
   * 批量应用命令
   */
  function applyCommands(commands: GameCommand[]): number {
    let successCount = 0;
    commands.forEach(command => {
      if (applyCommand(command)) {
        successCount++;
      }
    });

    console.log(`[GameState] 成功应用 ${successCount}/${commands.length} 个命令`);
    return successCount;
  }

  /**
   * 导出游戏状态（用于保存）
   */
  function exportGameState(): GameState {
    return klona(gameState.value);
  }

  /**
   * 重置游戏状态
   */
  function resetGameState() {
    gameState.value = createDefaultGameState();
    console.log('[GameState] 游戏状态已重置');
  }

  return {
    // 状态
    gameState,

    // 计算属性
    isAlive,
    isDead,
    isInjured,

    // 方法
    initializeGameState,
    loadGameState,
    applyCommand,
    applyCommands,
    exportGameState,
    resetGameState,
  };
});
