import { klona } from 'klona';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { GameCommand } from '../utils/commandParser';
import { parseDeityFromCharacterBackground, validateCommand } from '../utils/commandParser';
import {
  emitCharacterDataSynced,
  emitGameDataUpdated,
  emitNpcAdded,
  emitNpcRemoved,
  emitNpcUpdated,
} from '../utils/eventBus';

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
    // 魔法抗力（来自种族、职业、装备、法术等，不包括神祇）
    magicResistance?: {
      race?: number; // 种族魔法抗力
      class?: number; // 职业魔法抗力
      equipment?: number; // 装备魔法抗力
      spell?: number; // 法术效果魔法抗力
      other?: number; // 其他来源
    };
    // 神祇数据（游戏中获得）
    deity?: {
      divineRank: 'demigod' | 'lesser' | 'intermediate' | 'greater';
      portfolios: string[]; // 神职领域
      magicResistance: number; // 神祇魔法抗力
      divineAbilities: Array<{
        name: string;
        description: string;
        category: 'common' | 'rank_specific' | 'portfolio_specific';
      }>;
      maxAvatars: number; // 同时操控化身数（神祇可无限创造化身，但同时只能操控有限数量）
      sensingRange: number; // 感知范围（英里）
    };
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

  // NPC 状态（完整 ADND2E 格式）
  npcs: Array<{
    id: string; // 唯一标识符
    name: string;

    // 战斗属性
    ac: number | string; // 护甲等级
    mv: number | string; // 移动速度
    hd: string; // 生命骰
    hp: number | string; // 当前生命值
    maxHp?: number | string; // 最大生命值
    thac0: number | string; // 命中值
    at: string; // 攻击次数
    dmg: string; // 伤害骰
    sz: string; // 体型
    int: string; // 智力
    al: string; // 阵营
    ml: number | string; // 士气
    xp: number | string; // 经验值

    // 可选属性
    sa?: string; // 特殊攻击
    sd?: string; // 特殊防御
    sw?: string; // 特殊弱点
    sp?: string; // 法术能力
    mr?: string; // 魔法抗力
    magicItems?: string; // 魔法物品

    // 基本信息
    race?: string; // 种族
    class?: string; // 职业
    location?: string; // 当前位置
    status?: string; // 当前状态
    attitude?: string; // 态度

    // 描述信息
    appearance?: string; // 外貌描述
    personality?: string; // 性格描述
    background?: string; // 背景故事
    motivation?: string; // 动机/目标

    // 关系系统
    relationship?: number; // 与玩家的关系值（-100 到 100）
    relationshipDescription?: string; // 关系描述
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

  // 休息状态（ADND2E 自然治疗）
  rest: {
    lastRestDay: number | null; // 最后一次休息日期（少量活动）
    bedRestDays: number; // 连续卧床休息天数
    lastBedRestWeek: number | null; // 最后一次卧床休息满一周的时间
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
      lastRestDay: null,
      bedRestDays: 0,
      lastBedRestWeek: null,
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

      // 从角色背景中解析神祇信息
      if (characterData.background) {
        try {
          const deityCommand = parseDeityFromCharacterBackground(characterData.background);
          if (deityCommand && deityCommand.type === 'update_deity') {
            console.log('[GameState] 从角色背景解析到神祇信息:', deityCommand.data);

            const { divineRank, portfolios } = deityCommand.data;

            // 初始化魔法抗力映射
            const mrMap = {
              demigod: 70,
              lesser: 90,
              intermediate: 95,
              greater: 100,
            };

            // 初始化化身数量映射
            const avatarsMap = {
              demigod: 1,
              lesser: 2,
              intermediate: 5,
              greater: 10,
            };

            // 初始化感知范围映射
            const sensingMap = {
              demigod: 1,
              lesser: 10,
              intermediate: 100,
              greater: 999999, // 全位面
            };

            // 初始化神祇数据
            gameState.value.character.deity = {
              divineRank,
              portfolios: portfolios || [],
              magicResistance: mrMap[divineRank as keyof typeof mrMap],
              divineAbilities: [],
              maxAvatars: avatarsMap[divineRank as keyof typeof avatarsMap],
              sensingRange: sensingMap[divineRank as keyof typeof sensingMap],
            };

            // 同步更新角色卡变量中的 isDeity 标志
            try {
              const charVars = getVariables({ type: 'character' });
              if (charVars?.adnd2e?.character) {
                charVars.adnd2e.character.isDeity = true;
                replaceVariables(charVars, { type: 'character' });
                console.log('[GameState] 已设置角色卡变量 isDeity = true');
              }
            } catch (error) {
              console.error('[GameState] 同步 isDeity 标志失败:', error);
            }

            console.log('[GameState] 神祇数据已初始化:', gameState.value.character.deity);
            console.log('[GameState] 完整角色状态:', gameState.value.character);
            toastr.success(`检测到神祇: ${divineRank === 'demigod' ? '半神力' : divineRank}`, '神祇初始化');
          } else {
            console.log('[GameState] 未检测到神祇信息（命令为null）');
          }
        } catch (error) {
          console.error('[GameState] 解析神祇信息失败:', error);
        }
      } else {
        console.log('[GameState] 跳过神祇检测：', characterData.background ? '背景存在但未触发' : '无背景描述');
      }
    } else {
      console.log('[GameState] 跳过神祇检测：无角色数据');
    }

    console.log('[GameState] 游戏状态已初始化', gameState.value);
    console.log('[GameState] 神祇数据状态:', gameState.value.character.deity);
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
   * 同步关键数据到角色卡变量
   * 确保左侧角色面板能显示最新数据
   *
   * 🔧 修复：同步 NPC、任务等游戏状态数据到角色卡变量
   */
  function syncToCharacterVariables() {
    try {
      const charVars = getVariables({ type: 'character' });
      if (!charVars?.adnd2e?.character) {
        console.warn('[GameState] 无法同步：角色卡变量不存在');
        return;
      }

      const character = charVars.adnd2e.character;
      const state = gameState.value.character;

      // 同步 HP（如果有变化）
      if (character.hitPoints) {
        character.hitPoints.current = state.hp.current;
        character.hitPoints.max = state.hp.max;
      }

      // 同步金币（使用 currentMoney 字段）
      if (state.gold !== character.currentMoney) {
        character.currentMoney = state.gold;
      }

      // 同步经验值和等级
      if (state.xp !== undefined && state.xp !== (character.experiencePoints || 0)) {
        character.experiencePoints = state.xp;
      }
      if (state.level !== undefined && state.level !== (character.level || 1)) {
        character.level = state.level;
      }

      // 同步属性值（如果有永久性变化）
      const abilityMap: Record<string, keyof typeof character.abilities> = {
        str: 'str',
        dex: 'dex',
        con: 'con',
        int: 'int',
        wis: 'wis',
        cha: 'cha',
      };

      for (const [key, value] of Object.entries(state.attributes)) {
        const abilityKey = abilityMap[key];
        if (abilityKey && character.abilities[abilityKey] !== null) {
          character.abilities[abilityKey] = value;
        }
      }

      // 同步神祇数据（如果存在）
      if (state.deity) {
        character.deity = state.deity;
        character.isDeity = true; // 确保 isDeity 标志也同步
        console.log('[GameState] 已同步神祇数据到角色卡变量:', state.deity);
      }

      // 🔧 新增：同步魔法抗力数据到角色卡变量
      if (state.magicResistance) {
        character.magicResistance = state.magicResistance;
        console.log('[GameState] 已同步魔法抗力数据到角色卡变量');
      }

      // 🔧 新增：同步游戏状态关键数据到角色卡变量（NPC、任务等）
      // 这些数据需要在变量管理器中显示，且需要随着聊天记录编辑/删除实时更新
      // 重要：必须同步完整的 gameState.character 对象，因为状态栏会读取 gameState.character
      charVars.adnd2e.gameState = {
        character: klona(gameState.value.character), // 完整的角色游戏状态（HP、金币、属性、等级等）
        npcs: klona(gameState.value.npcs) || [],
        quests: klona(gameState.value.quests) || [],
        location: klona(gameState.value.location),
        time: klona(gameState.value.time),
        weather: klona(gameState.value.weather),
        effects: klona(gameState.value.effects) || [],
        inventory: klona(gameState.value.inventory) || [],
        combat: klona(gameState.value.combat),
        rest: klona(gameState.value.rest),
      };

      // 🔧 兼容性修复：useNpcAutoDetection 从 charVars.adnd2e.npcs 读取 NPC 列表
      // 为了确保 SettingsPanel 的 NPC 管理能正确显示，也同步到这个位置
      charVars.adnd2e.npcs = klona(gameState.value.npcs) || [];

      console.log(
        '[GameState] 已同步完整游戏状态到角色卡变量（NPC数量:',
        gameState.value.npcs?.length || 0,
        ', HP:',
        gameState.value.character.hp.current,
        '/',
        gameState.value.character.hp.max,
        '）',
      );

      // 保存回角色卡变量
      replaceVariables(charVars, { type: 'character' });
      console.log('[GameState] 已同步数据到角色卡变量');

      // 🔧 使用双事件系统（DOM + 酒馆助手）
      emitCharacterDataSynced('update');

      // 兼容旧系统（保留）
      eventEmit('adnd2e_character_data_synced');
    } catch (error) {
      console.error('[GameState] 同步到角色卡变量失败:', error);
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

    let needsSync = false; // 标记是否需要同步到角色卡变量

    try {
      switch (command.type) {
        case 'update_hp':
          gameState.value.character.hp.current = Math.max(
            0,
            Math.min(command.data.current, gameState.value.character.hp.max),
          );
          toastr.info(`生命值更新: ${gameState.value.character.hp.current}/${gameState.value.character.hp.max}`);
          needsSync = true; // HP 更新需要同步
          break;

        case 'update_attribute': {
          const attr = command.data.attribute as keyof typeof gameState.value.character.attributes;
          if (attr in gameState.value.character.attributes) {
            gameState.value.character.attributes[attr] = command.data.value;
            toastr.info(`${attr.toUpperCase()} 更新为 ${command.data.value}`);
            needsSync = true; // 属性更新需要同步
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
          needsSync = true; // 金币更新需要同步
          break;

        case 'add_npc': {
          // 生成唯一 ID
          const npcId = command.data.id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const newNpc = {
            id: npcId,
            name: command.data.name,

            // 战斗属性（必需）
            ac: command.data.ac || 10,
            mv: command.data.mv || 12,
            hd: command.data.hd || '1',
            hp: command.data.hp || 4,
            maxHp: command.data.maxHp || command.data.hp || 4,
            thac0: command.data.thac0 || 20,
            at: command.data.at || '1',
            dmg: command.data.dmg || '1d6',
            sz: command.data.sz || 'M',
            int: command.data.int || '8-10',
            al: command.data.al || 'N',
            ml: command.data.ml || 10,
            xp: command.data.xp || 15,

            // 可选属性
            sa: command.data.sa,
            sd: command.data.sd,
            sw: command.data.sw,
            sp: command.data.sp,
            mr: command.data.mr,
            magicItems: command.data.magicItems,

            // 基本信息
            race: command.data.race,
            class: command.data.class,
            location: command.data.location,
            status: command.data.status || 'normal',
            attitude: command.data.attitude || 'neutral',
          };

          gameState.value.npcs.push(newNpc);
          toastr.info(`新 NPC 出现: ${command.data.name}`);

          // 🔧 触发 NPC 添加事件（双事件系统）
          emitNpcAdded(npcId, command.data.name);
          break;
        }

        case 'update_npc': {
          const npc = gameState.value.npcs.find(n => n.name === command.data.name);
          if (npc) {
            // 记录变更字段
            const changes = Object.keys(command.data).filter(key => key !== 'name');
            Object.assign(npc, command.data);
            toastr.info(`NPC ${command.data.name} 状态更新`);

            // 🔧 触发 NPC 更新事件（双事件系统）
            emitNpcUpdated(npc.id, npc.name, changes);
          }
          break;
        }

        case 'remove_npc': {
          const npcIndex = gameState.value.npcs.findIndex(n => n.name === command.data.name);
          if (npcIndex !== -1) {
            const removedNpc = gameState.value.npcs[npcIndex];
            gameState.value.npcs.splice(npcIndex, 1);
            toastr.info(`NPC ${command.data.name} 已离开`);

            // 🔧 触发 NPC 移除事件（双事件系统）
            emitNpcRemoved(removedNpc.id, removedNpc.name);
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

        case 'add_quest': {
          // 任务存储在角色卡变量中
          const charVars = getVariables({ type: 'character' });
          if (charVars?.adnd2e) {
            if (!charVars.adnd2e.quests) {
              charVars.adnd2e.quests = [];
            }
            charVars.adnd2e.quests.push({
              id: crypto.randomUUID(),
              title: command.data.title,
              description: command.data.description || '',
              status: 'active',
              progress: command.data.progress,
            });
            replaceVariables(charVars, { type: 'character' });
            toastr.success(`新任务: ${command.data.title}`);
            eventEmit('adnd2e_character_data_synced'); // 触发更新事件
          }
          break;
        }

        case 'update_quest': {
          // 从角色卡变量更新任务
          const charVars = getVariables({ type: 'character' });
          if (charVars?.adnd2e?.quests) {
            const quest = charVars.adnd2e.quests.find((q: any) => q.title === command.data.title);
            if (quest) {
              Object.assign(quest, command.data);
              replaceVariables(charVars, { type: 'character' });
              if (command.data.status === 'completed') {
                toastr.success(`任务完成: ${command.data.title}`);
              } else if (command.data.status === 'failed') {
                toastr.error(`任务失败: ${command.data.title}`);
              } else {
                toastr.info(`任务更新: ${command.data.title}`);
              }
              eventEmit('adnd2e_character_data_synced'); // 触发更新事件
            }
          }
          break;
        }

        case 'update_deity': {
          // 计算魔法抗力
          const divineRank = command.data.divineRank || 'demigod';
          const mrMap = { demigod: 70, lesser: 90, intermediate: 95, greater: 100 };
          const avatarsMap = { demigod: 1, lesser: 2, intermediate: 5, greater: 10 };
          const sensingMap = { demigod: 1, lesser: 10, intermediate: 100, greater: 999999 };

          if (!gameState.value.character.deity) {
            gameState.value.character.deity = {
              divineRank,
              portfolios: command.data.portfolios || [],
              magicResistance: mrMap[divineRank as keyof typeof mrMap],
              divineAbilities: [],
              maxAvatars: avatarsMap[divineRank as keyof typeof avatarsMap],
              sensingRange: sensingMap[divineRank as keyof typeof sensingMap],
            };
            toastr.success(`🌟 神格等级: ${divineRank === 'demigod' ? '半神' : divineRank}`, '神祇觉醒', {
              timeOut: 5000,
            });

            // 同步更新角色卡变量中的 isDeity 标志
            try {
              const charVars = getVariables({ type: 'character' });
              if (charVars?.adnd2e?.character) {
                charVars.adnd2e.character.isDeity = true;
                replaceVariables(charVars, { type: 'character' });
                console.log('[GameState] update_deity: 已设置角色卡变量 isDeity = true');
              }
            } catch (error) {
              console.error('[GameState] update_deity: 同步 isDeity 标志失败:', error);
            }
          } else {
            // 更新现有神祇数据
            gameState.value.character.deity.divineRank = divineRank;
            if (command.data.portfolios) {
              gameState.value.character.deity.portfolios.push(...command.data.portfolios);
            }
            gameState.value.character.deity.magicResistance = mrMap[divineRank as keyof typeof mrMap];
            gameState.value.character.deity.maxAvatars = avatarsMap[divineRank as keyof typeof avatarsMap];
            gameState.value.character.deity.sensingRange = sensingMap[divineRank as keyof typeof sensingMap];
          }

          if (command.data.portfolios && command.data.portfolios.length > 0) {
            toastr.info(`神职领域: ${command.data.portfolios.join('、')}`);
          }
          needsSync = true;
          break;
        }

        case 'add_divine_ability': {
          if (!gameState.value.character.deity) {
            // 如果还没有神祇数据，先初始化为半神
            gameState.value.character.deity = {
              divineRank: 'demigod',
              portfolios: [],
              magicResistance: 70,
              divineAbilities: [],
              maxAvatars: 1,
              sensingRange: 1,
            };

            // 同步更新角色卡变量中的 isDeity 标志
            try {
              const charVars = getVariables({ type: 'character' });
              if (charVars?.adnd2e?.character) {
                charVars.adnd2e.character.isDeity = true;
                replaceVariables(charVars, { type: 'character' });
                console.log('[GameState] add_divine_ability: 已设置角色卡变量 isDeity = true');
              }
            } catch (error) {
              console.error('[GameState] add_divine_ability: 同步 isDeity 标志失败:', error);
            }
          }

          const ability = {
            name: command.data.name,
            description: command.data.description,
            category: command.data.category || 'portfolio_specific',
          };

          // 检查是否已存在相同能力
          const exists = gameState.value.character.deity.divineAbilities.some(
            a => a.name === ability.name && a.description === ability.description,
          );

          if (!exists) {
            gameState.value.character.deity.divineAbilities.push(ability);
            toastr.info(`✨ 获得神力: ${ability.name}`);
          }
          needsSync = true;
          break;
        }

        case 'update_magic_resistance': {
          // 初始化魔法抗力结构（如果不存在）
          if (!gameState.value.character.magicResistance) {
            gameState.value.character.magicResistance = {};
          }

          const mr = gameState.value.character.magicResistance;
          const sourceType = command.data.source || 'other'; // race, class, equipment, spell, other
          const value = command.data.value || 0;

          // 更新对应来源的魔法抗力
          if (sourceType === 'race') mr.race = value;
          else if (sourceType === 'class') mr.class = value;
          else if (sourceType === 'equipment') mr.equipment = value;
          else if (sourceType === 'spell') mr.spell = value;
          else mr.other = value;

          // 计算总魔法抗力
          const total = (mr.race || 0) + (mr.class || 0) + (mr.equipment || 0) + (mr.spell || 0) + (mr.other || 0);
          const displayTotal = Math.min(total, 100);

          toastr.info(`魔法抗力更新: ${sourceType} ${value > 0 ? '+' : ''}${value}% (总计 ${displayTotal}%)`);
          needsSync = true;
          break;
        }

        case 'add_extra_ability': {
          // 额外能力存储在角色卡变量中
          const charVars = getVariables({ type: 'character' });
          if (charVars?.adnd2e?.character) {
            if (!charVars.adnd2e.character.extraAbilities) {
              charVars.adnd2e.character.extraAbilities = [];
            }
            charVars.adnd2e.character.extraAbilities.push({
              name: command.data.name,
              description: command.data.description,
              effect: command.data.effect,
              conditions: command.data.conditions,
              uses: command.data.uses,
              source: command.data.source,
            });
            replaceVariables(charVars, { type: 'character' });
            toastr.success(`✨ 获得额外能力: ${command.data.name}`);
            eventEmit('adnd2e_character_data_synced'); // 触发更新事件
          }
          break;
        }

        case 'remove_extra_ability': {
          // 从角色卡变量移除额外能力
          const charVars = getVariables({ type: 'character' });
          if (charVars?.adnd2e?.character?.extraAbilities) {
            const index = charVars.adnd2e.character.extraAbilities.findIndex((a: any) => a.name === command.data.name);
            if (index !== -1) {
              charVars.adnd2e.character.extraAbilities.splice(index, 1);
              replaceVariables(charVars, { type: 'character' });
              toastr.info(`移除额外能力: ${command.data.name}`);
              eventEmit('adnd2e_character_data_synced'); // 触发更新事件
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
          needsSync = true; // HP 变化需要同步
          break;

        case 'heal':
          gameState.value.character.hp.current = Math.min(
            gameState.value.character.hp.max,
            gameState.value.character.hp.current + command.data.amount,
          );
          toastr.success(
            `恢复 ${command.data.amount} 点生命值${command.data.source ? `（${command.data.source}）` : ''}`,
          );
          needsSync = true; // HP 变化需要同步
          break;

        case 'gain_xp':
          gameState.value.character.xp += command.data.amount;
          toastr.success(
            `获得 ${command.data.amount} 点经验值${command.data.source ? `（${command.data.source}）` : ''}`,
          );
          needsSync = true; // 经验值更新需要同步
          break;

        case 'level_up':
          gameState.value.character.level = command.data.newLevel;
          toastr.success(`🎉 升级到 ${command.data.newLevel} 级！`);
          needsSync = true; // 等级更新需要同步
          break;

        case 'rest': {
          const now = Date.now();
          const restType = command.data.type || 'normal'; // 'normal' 或 'bed'

          if (restType === 'bed') {
            // 卧床休息：每天恢复 3 点生命值
            gameState.value.rest.bedRestDays += 1;
            const healAmount = 3;
            gameState.value.character.hp.current = Math.min(
              gameState.value.character.hp.max,
              gameState.value.character.hp.current + healAmount,
            );

            // 检查是否满一周（7天）
            if (gameState.value.rest.bedRestDays >= 7) {
              // 获取体质HP奖励（根据ADND2E规则）
              const charVars = getVariables({ type: 'character' });
              const constitution = charVars?.adnd2e?.character?.abilities?.con || 10;

              // ADND2E 体质HP奖励表
              let conBonus = 0;
              if (constitution <= 6) conBonus = -1;
              else if (constitution <= 14) conBonus = 0;
              else if (constitution === 15) conBonus = 1;
              else if (constitution === 16) conBonus = 2;
              else if (constitution === 17)
                conBonus = 2; // 战士为+3，但这里简化
              else if (constitution === 18)
                conBonus = 2; // 战士为+4
              else if (constitution >= 19) conBonus = 2; // 战士更高

              if (conBonus > 0) {
                gameState.value.character.hp.current = Math.min(
                  gameState.value.character.hp.max,
                  gameState.value.character.hp.current + conBonus,
                );
                toastr.success(
                  `卧床休息满一周（第 7 天），基础恢复 21 点 + 体质奖励 ${conBonus} 点 = 共 ${21 + conBonus} 点生命值`,
                );
              } else {
                toastr.success(`卧床休息满一周（第 7 天），恢复 21 点生命值`);
              }

              // 记录满周时间并重置计数
              gameState.value.rest.lastBedRestWeek = now;
              gameState.value.rest.bedRestDays = 0;
            } else {
              toastr.success(`卧床休息第 ${gameState.value.rest.bedRestDays} 天，恢复 ${healAmount} 点生命值`);
            }

            gameState.value.rest.lastRestDay = now;
            needsSync = true;
          } else {
            // 普通休息（少量活动）：每天恢复 1 点生命值
            const healAmount = 1;
            gameState.value.character.hp.current = Math.min(
              gameState.value.character.hp.max,
              gameState.value.character.hp.current + healAmount,
            );
            gameState.value.rest.lastRestDay = now;
            gameState.value.rest.bedRestDays = 0; // 中断卧床休息
            toastr.info(`休息一天（少量活动），恢复 ${healAmount} 点生命值`);
            needsSync = true;
          }
          break;
        }

        case 'cast_spell': {
          // 🔧 新增：处理施法命令
          const spellName = command.data.spellName;
          if (!spellName) {
            console.warn('[施法] 未提供法术名称');
            return false;
          }

          // 从角色变量中获取已记忆的法术
          const charVars = getVariables({ type: 'character' });
          const memorizedSpells = charVars?.adnd2e?.character?.spells?.memorizedSpells;

          if (!memorizedSpells) {
            console.warn('[施法] 角色没有记忆法术数据');
            return false;
          }

          // 在所有等级的已记忆法术中查找匹配的法术
          let removed = false;
          for (let level = 1; level <= 9; level++) {
            const levelKey = `level${level}` as keyof typeof memorizedSpells;
            const spells = memorizedSpells[levelKey] || [];

            // 查找法术（支持模糊匹配：通过 ID 或名称的一部分）
            const spellIndex = spells.findIndex((spellId: string) => {
              // 直接 ID 匹配
              if (spellId === spellName) return true;
              // 模糊名称匹配（从法术库中获取法术名称进行比较）
              // 注意：这里需要访问法术库，暂时使用 ID 包含检查
              return (
                spellId.toLowerCase().includes(spellName.toLowerCase()) ||
                spellName.toLowerCase().includes(spellId.toLowerCase())
              );
            });

            if (spellIndex !== -1) {
              // 从已记忆列表中移除该法术
              spells.splice(spellIndex, 1);

              // 更新回角色变量
              replaceVariables({ adnd2e: { character: { spells: { memorizedSpells } } } }, { type: 'character' });

              toastr.info(`✨ 施展了 ${level} 级法术: ${spellName}`);
              removed = true;
              needsSync = true;
              break;
            }
          }

          if (!removed) {
            console.warn(`[施法] 未在已记忆法术中找到: ${spellName}`);
            toastr.warning(`未找到已记忆的法术: ${spellName}`);
            return false;
          }
          break;
        }

        default:
          console.warn('[GameState] 未知命令类型:', command.type);
          return false;
      }

      gameState.value.meta.lastUpdated = Date.now();

      // 🔧 修复：所有命令执行后都同步到角色卡变量，确保状态栏始终显示最新数据
      // 之前只有部分命令会同步（needsSync=true），导致状态栏经常不更新
      // 现在统一在命令执行成功后同步，保证数据一致性
      syncToCharacterVariables();

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

    // 🔧 优化：批量执行时，临时禁用单个命令的同步，最后统一同步一次
    const originalSync = syncToCharacterVariables;
    let syncNeeded = false;

    // 临时替换为标记函数
    const tempSync = () => {
      syncNeeded = true;
    };
    (syncToCharacterVariables as any) = tempSync;

    try {
      commands.forEach(command => {
        if (applyCommand(command)) {
          successCount++;
        }
      });
    } finally {
      // 恢复原始函数
      (syncToCharacterVariables as any) = originalSync;
    }

    console.log(`[GameState] 成功应用 ${successCount}/${commands.length} 个命令`);

    // 🔧 批量执行后，统一同步一次到角色卡变量（避免频繁同步）
    if (successCount > 0 && syncNeeded) {
      syncToCharacterVariables();
      console.log('[GameState] 批量命令执行完毕，已同步到角色卡变量');
    }

    // 🔧 触发游戏数据更新事件（双事件系统）
    if (successCount > 0) {
      emitGameDataUpdated('command');
      eventEmit('adnd2e_game_data_updated'); // 兼容旧系统
      console.log('[GameState] 已触发 adnd2e_game_data_updated 事件（双系统）');
    }

    return successCount;
  }

  /**
   * 导出游戏状态（用于保存）
   */
  function exportGameState(): GameState {
    return klona(gameState.value);
  }

  /**
   * 从快照恢复游戏状态
   */
  function restoreGameState(snapshot: GameState) {
    try {
      gameState.value = klona(snapshot);
      console.log('[GameState] 游戏状态已从快照恢复');

      // 触发游戏数据更新事件，通知其他组件（如状态栏）更新显示
      eventEmit('adnd2e_game_data_updated');
      console.log('[GameState] 恢复状态后已触发 adnd2e_game_data_updated 事件');
    } catch (error) {
      console.error('[GameState] 恢复游戏状态失败:', error);
      throw error;
    }
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
    syncToCharacterVariables, // 导出同步函数
    applyCommand,
    applyCommands,
    exportGameState,
    restoreGameState, // 从快照恢复状态
    resetGameState,
  };
});
