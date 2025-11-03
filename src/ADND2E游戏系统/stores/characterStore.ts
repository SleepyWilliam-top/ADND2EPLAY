import { defineStore } from 'pinia';
import { computed, shallowRef } from 'vue';
import { getAlignmentById } from '../utils/alignmentData';
import { canRaceSelectClass, getClassById } from '../utils/classData';
import { getClassCategory, getSavingThrows, getTHAC0 } from '../utils/combatData';
import { getEquipmentById } from '../utils/equipmentData';
import {
  getAllPriestLevel1Spells,
  getAllPriestLevel2Spells,
  getAllPriestLevel3Spells,
  getAllPriestLevel4Spells,
  getAllPriestLevel5Spells,
  getAllPriestLevel6Spells,
  getAllPriestLevel7Spells,
  getPriestSpellById,
} from '../utils/priestSpellData';
import { getProficiencyById } from '../utils/proficiencyData';
import { getRaceById, getSubraceById } from '../utils/raceData';
import { getWeaponById } from '../utils/weaponData';
import { getWizardSpellById } from '../utils/wizardSpellData';

export interface Abilities {
  str: number | null;
  dex: number | null;
  con: number | null;
  int: number | null;
  wis: number | null;
  cha: number | null;
}

export interface PurchasedEquipment {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number; // 单价（GP）
  totalPrice: number; // 总价（GP）
  weight: number; // 单个重量
  totalWeight: number; // 总重量
}

export interface SpellData {
  // 法师法术书（仅法师职业）
  spellbook?: string[]; // 已学会的法术ID列表
  spellbookRoll?: number; // 初始法术书掷骰结果（3d4）

  // 已记忆的法术（所有施法职业）
  memorizedSpells: {
    level1: string[];
    level2: string[];
    level3: string[];
    level4: string[];
    level5: string[];
    level6: string[];
    level7: string[];
    level8: string[];
    level9: string[];
  };
}

/**
 * 神祇数据接口
 */
export interface DeityData {
  // 神格等级
  divineRank: 'demigod' | 'lesser' | 'intermediate' | 'greater' | null;
  // 神职（神祇的统治领域）
  portfolios: string[]; // 如：['狼裔', '性爱（雄性间的同性交配）', '宿命论']
  // 魔法抗力（对凡人魔法的抗力百分比）
  magicResistance: number; // 半神70%，弱等90%，中等95%，高等100%
  // 神祇特殊能力（除共有能力外的特殊能力）
  divineAbilities: Array<{
    name: string; // 能力名称
    description: string; // 能力描述
    category: 'common' | 'rank_specific' | 'portfolio_specific'; // 能力类别
  }>;
  // 同时操控化身数（神祇可无限创造化身，但同时只能操控有限数量）
  maxAvatars: number; // 半神1，弱等2，中等5，高等10
  // 感知范围（英里）
  sensingRange: number; // 半神1，弱等10，中等100，高等全位面
}

export interface CharacterData {
  step: number;
  completed: boolean; // 是否完成角色创建
  abilities: Abilities;
  exceptionalStrength: number | null; // 超凡力量（18/xx，仅勇士系力量18时）
  raceCategory: string | null; // 种族分类ID
  race: string | null; // 种族ID
  subrace: string | null; // 亚种ID（可选）
  class: string | null;
  name: string | null;
  alignment: string | null; // 阵营
  // 角色基本信息
  characterName: string | null; // 角色名字
  gender: 'male' | 'female' | 'other' | null; // 性别
  appearance: string | null; // 外貌描述
  background: string | null; // 背景故事
  penisSize: string | null; // 阴茎大小（仅男性）
  // 熟练相关数据
  weaponProficiencies: string[]; // 已选武器熟练ID列表
  weaponSpecializations: string[]; // 已专精武器ID列表（仅战士）
  nonweaponProficiencies: Array<{
    id: string;
    slots: number; // 投入的槽位数（可能>1以获得奖励）
  }>;
  languageSlotsToWeapon: number; // 转换为武器熟练的语言槽数
  languageSlotsToNonweapon: number; // 转换为非武器熟练的语言槽数
  // 装备购买相关数据
  startingMoney: number; // 起始金币（GP）
  currentMoney: number; // 当前剩余金币（GP）
  purchasedEquipment: PurchasedEquipment[]; // 已购买装备列表
  // 法术相关数据
  spells?: SpellData;
  // 是否为神祇（存储在角色卡变量中，标记该角色是否具有神祇身份）
  isDeity?: boolean;
  // 神祇相关数据（如果角色是神祇或半神）
  deity?: DeityData;
  // 战斗数据
  hitPoints?: {
    rolled: number; // 掷骰结果
    constitutionBonus: number; // 体质加成
    racialBonus: number; // 种族加成
    current: number; // 当前生命值
    max: number; // 最大生命值
  };
  armorClass?: {
    total: number; // 总AC
    fromArmor: number; // 来自护甲
    fromShield: number; // 来自盾牌
    dexterityBonus: number; // 敏捷修正
  };
  thac0?: number; // THAC0值
  savingThrows?: {
    paralyzation: number; // 麻痹/毒素/死亡魔法
    rod: number; // 权杖/法杖/魔杖
    petrification: number; // 石化/变形
    breath: number; // 喷吐武器
    spell: number; // 法术
  };
  movement?: number; // 地面移动力
  combatBonuses?: {
    attackBonus: number; // 攻击加值
    damageBonus: number; // 伤害加值
  };
}

export const useCharacterStore = defineStore('character', () => {
  // 角色数据（使用 shallowRef 优化性能：不深度追踪嵌套对象）
  // 当整体替换数据时触发更新，而不是每个属性变化都触发
  const characterData = shallowRef<CharacterData>({
    step: 1,
    completed: false,
    abilities: {
      str: null,
      dex: null,
      con: null,
      int: null,
      wis: null,
      cha: null,
    },
    exceptionalStrength: null,
    raceCategory: null,
    race: null,
    subrace: null,
    class: null,
    name: null,
    alignment: null,
    characterName: null,
    gender: null,
    appearance: null,
    background: null,
    penisSize: null,
    weaponProficiencies: [],
    weaponSpecializations: [],
    nonweaponProficiencies: [],
    languageSlotsToWeapon: 0,
    languageSlotsToNonweapon: 0,
    startingMoney: 0,
    currentMoney: 0,
    purchasedEquipment: [],
  });

  // 工具函数：触发 shallowRef 更新（性能优化必需）
  function updateCharacterData(updater: (data: CharacterData) => void) {
    const newData = { ...characterData.value };
    updater(newData);
    characterData.value = newData;
  }

  // 计算属性：应用种族调整后的属性
  const adjustedAbilities = computed(() => {
    if (!characterData.value.race) return characterData.value.abilities;

    const race = getRaceById(characterData.value.race);
    if (!race) return characterData.value.abilities;

    const adjusted: Abilities = { ...characterData.value.abilities };
    const abilityMap: Record<string, keyof Abilities> = {
      str: 'str',
      dex: 'dex',
      con: 'con',
      int: 'int',
      wis: 'wis',
      cha: 'cha',
    };

    // 如果选择了亚种，使用亚种的属性调整替换基础种族调整
    // 如果没有选择亚种或选择"不使用亚种"（null），则使用基础种族调整
    let adjustments = race.abilityAdjustments;
    if (characterData.value.subrace) {
      const subrace = getSubraceById(characterData.value.race, characterData.value.subrace);
      if (subrace) {
        adjustments = subrace.abilityAdjustments;
      }
    }

    // 应用属性调整
    for (const [key, adjustment] of Object.entries(adjustments)) {
      const abilityKey = abilityMap[key];
      if (abilityKey && adjusted[abilityKey] !== null) {
        adjusted[abilityKey] = (adjusted[abilityKey] as number) + adjustment;
      }
    }

    return adjusted;
  });

  // 检查种族属性要求
  function canSelectRace(raceId: string): boolean {
    const race = getRaceById(raceId);
    if (!race) return false;

    // 人类无属性要求
    if (Object.keys(race.abilityRequirements).length === 0) return true;

    const abilities = characterData.value.abilities;
    const abilityMap: Record<string, keyof Abilities> = {
      str: 'str',
      dex: 'dex',
      con: 'con',
      int: 'int',
      wis: 'wis',
      cha: 'cha',
    };

    // 检查所有属性要求
    for (const [key, requirement] of Object.entries(race.abilityRequirements)) {
      // 如果 min 和 max 都是 0，表示无此属性，跳过检查
      if (requirement.min === 0 && requirement.max === 0) continue;

      const abilityKey = abilityMap[key];
      const abilityValue = abilities[abilityKey];

      if (abilityValue === null) return false;
      if (abilityValue < requirement.min || abilityValue > requirement.max) {
        return false;
      }
    }

    return true;
  }

  // 检查单个属性是否满足要求
  function checkAbilityRequirement(
    raceId: string,
    abilityKey: keyof Abilities,
  ): { met: boolean; min: number; max: number } | null {
    const race = getRaceById(raceId);
    if (!race) return null;

    const abilityMapReverse: Record<keyof Abilities, string> = {
      str: 'str',
      dex: 'dex',
      con: 'con',
      int: 'int',
      wis: 'wis',
      cha: 'cha',
    };

    const reqKey = abilityMapReverse[abilityKey];
    const requirement = race.abilityRequirements[reqKey];

    // 无要求则视为满足
    if (!requirement) return { met: true, min: 3, max: 18 };

    // 如果 min 和 max 都是 0，表示无此属性，始终满足要求
    if (requirement.min === 0 && requirement.max === 0) {
      return { met: true, min: 0, max: 0 };
    }

    const abilityValue = characterData.value.abilities[abilityKey];
    const met = abilityValue !== null && abilityValue >= requirement.min && abilityValue <= requirement.max;

    return {
      met,
      min: requirement.min,
      max: requirement.max,
    };
  }

  // 检查亚种属性要求
  function canSelectSubrace(raceId: string, subraceId: string): boolean {
    const subrace = getSubraceById(raceId, subraceId);
    if (!subrace) return false;

    const abilities = characterData.value.abilities;
    const abilityMap: Record<string, keyof Abilities> = {
      str: 'str',
      dex: 'dex',
      con: 'con',
      int: 'int',
      wis: 'wis',
      cha: 'cha',
    };

    // 检查所有属性要求
    for (const [key, requirement] of Object.entries(subrace.abilityRequirements)) {
      // 如果 min 和 max 都是 0，表示无此属性，跳过检查
      if (requirement.min === 0 && requirement.max === 0) continue;

      const abilityKey = abilityMap[key];
      const abilityValue = abilities[abilityKey];

      if (abilityValue === null) return false;
      if (abilityValue < requirement.min || abilityValue > requirement.max) {
        return false;
      }
    }

    return true;
  }

  // 检查亚种的单个属性是否满足要求
  function checkSubraceAbilityRequirement(
    raceId: string,
    subraceId: string,
    abilityKey: keyof Abilities,
  ): { met: boolean; min: number; max: number } | null {
    const subrace = getSubraceById(raceId, subraceId);
    if (!subrace) return null;

    const abilityMapReverse: Record<keyof Abilities, string> = {
      str: 'str',
      dex: 'dex',
      con: 'con',
      int: 'int',
      wis: 'wis',
      cha: 'cha',
    };

    const reqKey = abilityMapReverse[abilityKey];
    const requirement = subrace.abilityRequirements[reqKey];

    // 无要求则视为满足
    if (!requirement) return { met: true, min: 3, max: 18 };

    // 如果 min 和 max 都是 0，表示无此属性，始终满足要求
    if (requirement.min === 0 && requirement.max === 0) {
      return { met: true, min: 0, max: 0 };
    }

    const abilityValue = characterData.value.abilities[abilityKey];
    const met = abilityValue !== null && abilityValue >= requirement.min && abilityValue <= requirement.max;

    return {
      met,
      min: requirement.min,
      max: requirement.max,
    };
  }

  // 重置角色数据
  function resetCharacter() {
    characterData.value = {
      step: 1,
      completed: false,
      abilities: {
        str: null,
        dex: null,
        con: null,
        int: null,
        wis: null,
        cha: null,
      },
      exceptionalStrength: null,
      raceCategory: null,
      race: null,
      subrace: null,
      class: null,
      name: null,
      alignment: null,
      characterName: null,
      gender: null,
      appearance: null,
      background: null,
      penisSize: null,
      weaponProficiencies: [],
      weaponSpecializations: [],
      nonweaponProficiencies: [],
      languageSlotsToWeapon: 0,
      languageSlotsToNonweapon: 0,
      startingMoney: 0,
      currentMoney: 0,
      purchasedEquipment: [],
    };

    // 🔧 不要保存重置后的空数据到酒馆变量，因为这会触发不必要的存储
    // MainMenu 已在创建新角色前清除了所有数据
    console.log('[CharacterStore] 角色数据已重置（不保存到酒馆变量）');
  }

  // 保存角色数据到酒馆变量
  async function saveToTavern() {
    try {
      await replaceVariables(
        {
          adnd2e: {
            character: characterData.value,
            lastSaved: new Date().toISOString(),
          },
        },
        { type: 'character' },
      );
      toastr.success('角色数据已保存');
    } catch (error) {
      console.error('保存角色数据失败:', error);
      toastr.error('保存失败');
    }
  }

  // 从酒馆变量加载角色数据
  function loadFromTavern(silent = false) {
    try {
      const variables = getVariables({ type: 'character' });
      if (variables?.adnd2e?.character) {
        characterData.value = variables.adnd2e.character;
        if (!silent) {
          toastr.success('角色数据已加载');
        }
        console.log('[CharacterStore] 角色数据已从变量加载');
      }
    } catch (error) {
      console.error('加载角色数据失败:', error);
      if (!silent) {
        toastr.error('加载失败');
      }
    }
  }

  // 监听角色数据同步事件，自动重新加载
  eventOn('adnd2e_character_data_synced', () => {
    loadFromTavern(true); // 静默加载，不显示 toastr
  });

  // 检查是否可以选择某个职业
  function canSelectClass(classId: string): boolean {
    const cls = getClassById(classId);
    if (!cls) return false;

    // 1. 检查种族限制
    const currentRace = characterData.value.race;
    if (!currentRace) return false;

    const raceCheck = canRaceSelectClass(currentRace, cls.name);
    if (!raceCheck.allowed) return false;

    // 2. 检查属性要求
    const adjusted = adjustedAbilities.value;
    for (const [key, minValue] of Object.entries(cls.abilityRequirements)) {
      const abilityKey = key as keyof Abilities;
      if ((adjusted[abilityKey] ?? 0) < minValue) {
        return false;
      }
    }

    return true;
  }

  // 检查职业的单个属性要求
  function checkClassAbilityRequirement(
    classId: string,
    abilityKey: keyof Abilities,
  ): { met: boolean; required: number } | null {
    const cls = getClassById(classId);
    if (!cls) return null;

    const abilityMapReverse: Record<keyof Abilities, string> = {
      str: 'str',
      dex: 'dex',
      con: 'con',
      int: 'int',
      wis: 'wis',
      cha: 'cha',
    };

    const reqKey = abilityMapReverse[abilityKey];
    const minValue = cls.abilityRequirements[reqKey];

    // 无要求则视为满足
    if (minValue === undefined) return { met: true, required: 0 };

    const abilityValue = adjustedAbilities.value[abilityKey];
    const met = (abilityValue ?? 0) >= minValue;

    return {
      met,
      required: minValue,
    };
  }

  // 检查是否可以拥有超凡力量
  function canHaveExceptionalStrength(): boolean {
    // 1. 必须选择了职业
    if (!characterData.value.class) return false;

    // 2. 职业必须是勇士系
    const cls = getClassById(characterData.value.class);
    if (!cls || cls.category !== 'warrior') return false;

    // 3. 调整后力量必须恰好为18
    if (adjustedAbilities.value.str !== 18) return false;

    // 4. 半身人战士除外
    const race = getRaceById(characterData.value.race || '');
    if (race?.id === 'halfling' && cls.id === 'fighter') return false;

    return true;
  }

  // 掷超凡力量（1d100）
  function rollExceptionalStrength(): number {
    if (!canHaveExceptionalStrength()) return 0;
    const roll = Math.floor(Math.random() * 100) + 1; // 1-100
    characterData.value.exceptionalStrength = roll;
    return roll;
  }

  // 格式化超凡力量显示（如 18/01, 18/00）
  function formatExceptionalStrength(): string {
    if (!characterData.value.exceptionalStrength) return '18';
    const value = characterData.value.exceptionalStrength;
    if (value === 100) return '18/00';
    return `18/${value.toString().padStart(2, '0')}`;
  }

  // ==================== 熟练相关函数 ====================

  // 基于智力表4获取额外语言槽
  function getAvailableLanguageSlots(): number {
    const int = adjustedAbilities.value.int;
    if (int === null) return 0;

    if (int <= 1) return 0;
    if (int <= 8) return 1;
    if (int <= 11) return 2;
    if (int === 12) return 3;
    if (int === 13) return 3;
    if (int <= 14) return 4;
    if (int <= 15) return 4;
    if (int === 16) return 5;
    if (int === 17) return 6;
    if (int === 18) return 7;
    if (int === 19) return 8;
    if (int === 20) return 9;
    if (int === 21) return 10;
    if (int === 22) return 11;
    if (int === 23) return 12;
    if (int === 24) return 15;
    return 20; // 25+
  }

  // 基于职业类别和表34获取初始武器熟练槽
  function getInitialWeaponSlots(): number {
    if (!characterData.value.class) return 0;

    const classData = getClassById(characterData.value.class);
    if (!classData) return 0;

    switch (classData.category) {
      case 'warrior':
        return 4;
      case 'wizard':
        return 1;
      case 'priest':
        return 2;
      case 'rogue':
        return 2;
      default:
        return 0;
    }
  }

  // 基于职业类别、表34和智力调整获取初始非武器熟练槽
  function getInitialNonweaponSlots(): number {
    if (!characterData.value.class) return 0;

    const classData = getClassById(characterData.value.class);
    if (!classData) return 0;

    let baseSlots = 0;
    switch (classData.category) {
      case 'warrior':
        baseSlots = 3;
        break;
      case 'wizard':
        baseSlots = 4;
        break;
      case 'priest':
        baseSlots = 4;
        break;
      case 'rogue':
        baseSlots = 3;
        break;
      default:
        baseSlots = 0;
    }

    // 智力提供额外的非武器熟练槽（表4）
    const int = adjustedAbilities.value.int;
    if (int === null) return baseSlots;

    // 根据表4，语言数量=非武器熟练槽数量增加
    // 但是这个理解可能不准确，根据规则，智力提供的是额外语言数，可以转换为熟练槽
    // 这里的baseSlots是表34的初始值，语言槽可以额外转换
    return baseSlots;
  }

  // 计算剩余武器熟练槽
  function getRemainingWeaponSlots(): number {
    const initial = getInitialWeaponSlots();
    const languageConverted = characterData.value.languageSlotsToWeapon;
    const total = initial + languageConverted;

    // 计算已使用的槽位
    let used = characterData.value.weaponProficiencies.length;

    // 专精额外消耗槽位
    characterData.value.weaponSpecializations.forEach(weaponId => {
      // 弓类需要额外2槽，其他武器需要额外1槽
      const isBow = weaponId.includes('bow') && !weaponId.includes('crossbow');
      used += isBow ? 2 : 1;
    });

    return total - used;
  }

  // 计算剩余非武器熟练槽
  function getRemainingNonweaponSlots(): number {
    const initial = getInitialNonweaponSlots();
    const languageConverted = characterData.value.languageSlotsToNonweapon;
    const total = initial + languageConverted;

    // 计算已使用的槽位
    const used = characterData.value.nonweaponProficiencies.reduce((sum, p) => sum + p.slots, 0);

    return total - used;
  }

  // 检查是否可以专精（仅单职业战士）
  function canSpecialize(): boolean {
    if (!characterData.value.class) return false;

    const classData = getClassById(characterData.value.class);
    if (!classData) return false;

    // 仅单职业战士可以专精
    return classData.id === 'fighter';
  }

  // 获取职业的不熟练武器惩罚（表34）
  function getWeaponProficiencyPenalty(): number {
    if (!characterData.value.class) return -4;

    const classData = getClassById(characterData.value.class);
    if (!classData) return -4;

    switch (classData.category) {
      case 'warrior':
        return -2;
      case 'wizard':
        return -5;
      case 'priest':
        return -3;
      case 'rogue':
        return -3;
      default:
        return -4;
    }
  }

  // ==================== 装备购买相关函数 ====================

  // 根据职业类型计算起始资金（表43）
  function calculateStartingMoney(): number {
    if (!characterData.value.class) return 0;

    const classData = getClassById(characterData.value.class);
    if (!classData) return 0;

    let roll = 0;
    switch (classData.category) {
      case 'warrior':
        // 5d4 x 10 gp
        for (let i = 0; i < 5; i++) {
          roll += Math.floor(Math.random() * 4) + 1;
        }
        return roll * 10;
      case 'wizard':
        // (1d4+1) x 10 gp
        roll = Math.floor(Math.random() * 4) + 1 + 1;
        return roll * 10;
      case 'rogue':
        // 2d6 x 10 gp
        for (let i = 0; i < 2; i++) {
          roll += Math.floor(Math.random() * 6) + 1;
        }
        return roll * 10;
      case 'priest':
        // 3d6 x 10 gp
        for (let i = 0; i < 3; i++) {
          roll += Math.floor(Math.random() * 6) + 1;
        }
        return roll * 10;
      default:
        return 0;
    }
  }

  // 初始化起始资金（在进入装备购买步骤时调用）
  function initializeStartingMoney() {
    const money = calculateStartingMoney();
    characterData.value.startingMoney = money;
    characterData.value.currentMoney = money;
  }

  // 添加装备到购物车
  function addEquipmentToCart(equipmentId: string, quantity: number = 1): boolean {
    const equipment = getEquipmentById(equipmentId);
    if (!equipment) return false;

    const totalPrice = equipment.price * quantity;
    if (totalPrice > characterData.value.currentMoney) {
      return false; // 金币不足
    }

    // 检查是否已存在
    const existingIndex = characterData.value.purchasedEquipment.findIndex(e => e.id === equipmentId);

    if (existingIndex !== -1) {
      // 更新数量
      const existing = characterData.value.purchasedEquipment[existingIndex];
      existing.quantity += quantity;
      existing.totalPrice = existing.unitPrice * existing.quantity;
      existing.totalWeight = existing.weight * existing.quantity;
    } else {
      // 添加新装备
      characterData.value.purchasedEquipment.push({
        id: equipment.id,
        name: equipment.name,
        category: equipment.category,
        quantity: quantity,
        unitPrice: equipment.price,
        totalPrice: totalPrice,
        weight: equipment.weight,
        totalWeight: equipment.weight * quantity,
      });
    }

    characterData.value.currentMoney -= totalPrice;
    return true;
  }

  // 从购物车移除装备
  function removeEquipmentFromCart(equipmentId: string, quantityToRemove?: number) {
    const index = characterData.value.purchasedEquipment.findIndex(e => e.id === equipmentId);
    if (index === -1) return;

    const item = characterData.value.purchasedEquipment[index];

    if (quantityToRemove === undefined || quantityToRemove >= item.quantity) {
      // 完全移除
      characterData.value.currentMoney += item.totalPrice;
      characterData.value.purchasedEquipment.splice(index, 1);
    } else {
      // 部分移除
      const refundAmount = item.unitPrice * quantityToRemove;
      item.quantity -= quantityToRemove;
      item.totalPrice = item.unitPrice * item.quantity;
      item.totalWeight = item.weight * item.quantity;
      characterData.value.currentMoney += refundAmount;
    }
  }

  // 更新购物车中装备的数量
  function updateEquipmentQuantity(equipmentId: string, newQuantity: number): boolean {
    if (newQuantity < 0) return false;

    const index = characterData.value.purchasedEquipment.findIndex(e => e.id === equipmentId);
    if (index === -1) return false;

    const item = characterData.value.purchasedEquipment[index];

    if (newQuantity === 0) {
      // 移除装备
      removeEquipmentFromCart(equipmentId);
      return true;
    }

    const quantityDiff = newQuantity - item.quantity;
    const priceDiff = item.unitPrice * quantityDiff;

    // 检查是否有足够的金币
    if (quantityDiff > 0 && priceDiff > characterData.value.currentMoney) {
      return false;
    }

    // 更新数量和价格
    item.quantity = newQuantity;
    item.totalPrice = item.unitPrice * newQuantity;
    item.totalWeight = item.weight * newQuantity;
    characterData.value.currentMoney -= priceDiff;

    return true;
  }

  // 清空购物车
  function clearCart() {
    characterData.value.currentMoney = characterData.value.startingMoney;
    characterData.value.purchasedEquipment = [];
  }

  // 计算已花费金币
  function getTotalSpent(): number {
    return characterData.value.startingMoney - characterData.value.currentMoney;
  }

  // 计算总负重
  function getTotalWeight(): number {
    return characterData.value.purchasedEquipment.reduce((total, item) => total + item.totalWeight, 0);
  }

  // 获取购物车中装备的数量
  function getEquipmentQuantityInCart(equipmentId: string): number {
    const item = characterData.value.purchasedEquipment.find(e => e.id === equipmentId);
    return item ? item.quantity : 0;
  }

  // ==================== 法术相关函数 ====================

  // 检查职业是否可以施法（1级就能施法）
  function canCastSpellsAtLevel1(): boolean {
    const cls = getClassById(characterData.value.class || '');
    if (!cls?.spellcasting) return false;

    // 检查是否从1级开始施法
    const firstLevel = cls.spellcasting.spellProgression[0];
    return firstLevel.level === 1;
  }

  // 获取法师初始法术书数量（3d4）
  function rollInitialSpellbookSize(): number {
    let total = 0;
    for (let i = 0; i < 3; i++) {
      total += Math.floor(Math.random() * 4) + 1;
    }
    return total;
  }

  // 获取当前等级的法术位
  function getSpellSlotsForLevel(spellLevel: number): number {
    const cls = getClassById(characterData.value.class || '');
    if (!cls?.spellcasting) return 0;

    // 查找1级角色的法术进程（角色创建时默认是1级）
    // 需要找到level=1的进程，如果没有则说明该职业1级还不能施法
    const progression = cls.spellcasting.spellProgression.find(p => p.level === 1);
    if (!progression) return 0; // 1级还不能施展该等级的法术

    return progression.spells[spellLevel - 1] || 0;
  }

  // 基于灵知获取奖励法术位（仅祭司）
  function getBonusSpellSlots(spellLevel: number): number {
    const cls = getClassById(characterData.value.class || '');
    if (cls?.spellcasting?.type !== 'priest') return 0;

    const wis = adjustedAbilities.value.wis;
    if (!wis || wis < 13) return 0;

    // 检查当前等级是否能施展该等级的法术
    const baseSlots = getSpellSlotsForLevel(spellLevel);
    if (baseSlots === 0) {
      // 如果基础法术位为0，说明等级不够，奖励法术位也不可用
      return 0;
    }

    // 根据表格5计算奖励法术（关键：奖励是累加的！）
    // 需要累加所有小于等于当前灵知值的奖励
    // 格式：灵知值 -> [该灵知值奖励哪些法术等级]
    const bonusTable: Record<number, number[]> = {
      13: [1], // 奖励1个1级
      14: [1], // 奖励1个1级
      15: [2], // 奖励1个2级
      16: [2], // 奖励1个2级
      17: [3], // 奖励1个3级
      18: [4], // 奖励1个4级
      19: [1, 3], // 奖励1个1级 + 1个3级
      20: [2, 4], // 奖励1个2级 + 1个4级
      21: [3, 5], // 奖励1个3级 + 1个5级
      22: [4, 5], // 奖励1个4级 + 1个5级
      23: [1, 6], // 奖励1个1级 + 1个6级
      24: [5, 6], // 奖励1个5级 + 1个6级
      25: [6, 7], // 奖励1个6级 + 1个7级
    };

    // 累加所有小于等于当前灵知值的奖励
    let totalBonus = 0;
    for (let wisValue = 13; wisValue <= wis && wisValue <= 25; wisValue++) {
      const bonusLevels = bonusTable[wisValue];
      if (bonusLevels) {
        // 计算该灵知值对当前法术等级的奖励次数
        totalBonus += bonusLevels.filter(level => level === spellLevel).length;
      }
    }

    return totalBonus;
  }

  // 获取施法失败率（仅祭司，灵知<13）
  function getSpellFailureChance(): number {
    const cls = getClassById(characterData.value.class || '');
    if (cls?.spellcasting?.type !== 'priest') return 0;

    const wis = adjustedAbilities.value.wis;
    if (!wis || wis >= 13) return 0;

    const failureTable: Record<number, number> = {
      1: 80,
      2: 60,
      3: 50,
      4: 45,
      5: 40,
      6: 35,
      7: 30,
      8: 25,
      9: 20,
      10: 15,
      11: 10,
      12: 5,
    };

    return failureTable[wis] || 0;
  }

  // 获取法师最高可学法术等级（基于智力）
  function getMaxSpellLevelForWizard(): number {
    const int = adjustedAbilities.value.int;
    if (!int || int < 9) return 0;

    if (int >= 19) return 9;

    const maxLevelTable: Record<number, number> = {
      9: 4,
      10: 5,
      11: 5,
      12: 6,
      13: 6,
      14: 7,
      15: 7,
      16: 8,
      17: 8,
      18: 9,
    };

    return maxLevelTable[int] || 9;
  }

  // 获取法师每级法术学习上限（基于智力）
  function getMaxSpellsPerLevel(): number {
    const int = adjustedAbilities.value.int;
    if (!int || int < 9) return 0;

    if (int >= 19) return 999; // 任意

    const maxTable: Record<number, number> = {
      9: 6,
      10: 7,
      11: 7,
      12: 7,
      13: 9,
      14: 9,
      15: 11,
      16: 11,
      17: 14,
      18: 18,
    };

    return maxTable[int] || 999;
  }

  // 获取法师法术学习成功率（基于智力）
  function getSpellLearnChance(): number {
    const int = adjustedAbilities.value.int;
    if (!int || int < 9) return 0;

    const chanceTable: Record<number, number> = {
      9: 35,
      10: 40,
      11: 45,
      12: 50,
      13: 55,
      14: 60,
      15: 65,
      16: 70,
      17: 75,
      18: 85,
      19: 95,
      20: 96,
      21: 97,
      22: 98,
      23: 99,
      24: 100,
      25: 100,
    };

    return chanceTable[int] || 100;
  }

  // 初始化法术数据
  function initializeSpellData() {
    if (!characterData.value.spells) {
      characterData.value.spells = {
        memorizedSpells: {
          level1: [],
          level2: [],
          level3: [],
          level4: [],
          level5: [],
          level6: [],
          level7: [],
          level8: [],
          level9: [],
        },
      };
    }
  }

  // 获取角色当前职业数据
  function getCharacterClass() {
    if (!characterData.value.class) return null;
    return getClassById(characterData.value.class);
  }

  // 🔧 新增：生成神祇专属角色卡
  function generateDeityCharacterCardText(data: any, race: any, subrace: any, alignmentData: any): string {
    let text = '';

    // 基本信息
    text += '【基本信息】\n';
    const defaultName = (typeof SillyTavern !== 'undefined' && SillyTavern.name1) || 'Player';
    text += `角色名: ${data.characterName?.trim() || defaultName}\n`;
    text += `性别: ${data.gender === 'male' ? '男' : data.gender === 'female' ? '女' : '其他'}\n`;

    // 种族（如果有）
    const raceName = race?.name || subrace?.name;
    text += `种族: ${raceName || '无'}\n`;

    // 神祇标志
    text += `神祇：是\n`;

    // 尝试从背景中解析神格等级和神职
    let deityRank = '半神力'; // 默认为半神力
    let portfolios: string[] = [];
    let deityRankDetected = false; // 标记是否成功检测到神格等级

    if (data.background) {
      // 🔧 更严格的神格等级检测：必须明确表明角色"是"或"成为"该神格
      // 排除"侍奉"、"信仰"、"崇拜"等关键词
      const isNotServant = !/(侍奉|信仰|崇拜|追随|效忠|服侍|祭司|牧师|圣武士|信徒)[^，。！？]*?(神|神祇|神明)/i.test(
        data.background,
      );

      if (isNotServant) {
        // 检测"是xxx神力"或"成为xxx神力"等明确表述
        if (
          /(是|成为|晋升为|获得了?|已经是|现在是|作为)[^，。！？]{0,20}(高等神力?|强大神力?|伟大神力?|Greater\s*Power)/i.test(
            data.background,
          )
        ) {
          deityRank = '高等神力';
          deityRankDetected = true;
        } else if (
          /(是|成为|晋升为|获得了?|已经是|现在是|作为)[^，。！？]{0,20}(中等神力?|Intermediate\s*Power)/i.test(
            data.background,
          )
        ) {
          deityRank = '中等神力';
          deityRankDetected = true;
        } else if (
          /(是|成为|晋升为|获得了?|已经是|现在是|作为)[^，。！？]{0,20}(弱等神力?|次级神力?|Lesser\s*Power)/i.test(
            data.background,
          )
        ) {
          deityRank = '弱等神力';
          deityRankDetected = true;
        } else if (
          /(是|成为|晋升为|获得了?|已经是|现在是|作为)[^，。！？]{0,20}(半神力?|微弱神力?|守护神|DemiPower|Demi\s*Power)/i.test(
            data.background,
          )
        ) {
          deityRank = '半神力';
          deityRankDetected = true;
        }
      }

      // 🔧 解析神职（支持多种格式）
      // 格式1: 【神职：xxx】或【神职:xxx】
      let portfolioMatch = data.background.match(/【神职[：:](.*?)】/);

      // 格式2: 神职：xxx 或 神职:xxx（不带【】）
      if (!portfolioMatch) {
        portfolioMatch = data.background.match(/神职[：:]\s*([^\n。！？]+)/);
      }

      // 格式3: "掌管xxx"
      if (!portfolioMatch) {
        const zhangguanMatch = data.background.match(/掌管[：:\s]*([^\n。！？]+)/);
        if (zhangguanMatch) {
          portfolioMatch = zhangguanMatch;
        }
      }

      // 格式4: "作为xxx之神"或"是xxx之神"
      if (!portfolioMatch) {
        const godOfMatch = data.background.match(/(作为|是)([^，。！？]{1,30})(之神|神)/);
        if (godOfMatch && godOfMatch[2]) {
          // 提取"xxx"部分
          portfolioMatch = [godOfMatch[0], godOfMatch[2]];
        }
      }

      if (portfolioMatch && portfolioMatch[1]) {
        // 清理并分割神职
        const rawPortfolios = portfolioMatch[1]
          .replace(/^[\s【[]+|[\s】\]]+$/g, '') // 移除首尾的空格和括号
          .split(/[、，,和与及]/) // 支持多种分隔符
          .map((p: string) => p.trim())
          .filter(Boolean);

        // 进一步清理每个神职项（移除"的"、"之"等助词）
        portfolios = rawPortfolios.map((p: string) => p.replace(/^(的|之)\s*/, '').replace(/\s*(的|之)$/, ''));
      }
    }

    text += `神力等级：${deityRank}`;
    if (!deityRankDetected) {
      text += ` (默认值，建议在背景中明确描述神格等级)\n`;
    } else {
      text += '\n';
    }
    if (portfolios.length > 0) {
      text += `神职：${portfolios.join('、')}\n`;
    }

    text += `职业: 不适用\n`;
    text += `阵营: ${alignmentData?.name || data.alignment || '未知'}\n`;
    text += `等级: 不适用\n`;
    text += `经验值: 不适用\n`;
    text += `经验值调整: 不适用\n\n`;

    // 角色描述
    if (data.appearance || data.background || (data.gender === 'male' && data.penisSize)) {
      text += '【角色描述】\n';
      if (data.appearance) {
        text += `外貌: ${data.appearance}\n`;
      }
      if (data.background) {
        text += `背景: ${data.background}\n`;
      }
      if (data.gender === 'male' && data.penisSize) {
        const sizeMap: Record<string, string> = {
          xs: '特小',
          s: '偏小',
          m: '平均',
          l: '偏大',
          xl: '特大',
          xxl: '超大',
        };
        text += `身体特征: 阴茎大小${sizeMap[data.penisSize] || data.penisSize}\n`;
      }
      text += '\n';
    }

    // 属性值 - 神祇不适用
    text += '【属性值】\n';
    text += '力量: 不适用\n';
    text += '敏捷: 不适用\n';
    text += '体质: 不适用\n';
    text += '智力: 不适用\n';
    text += '灵知: 不适用\n';
    text += '魅力: 不适用\n\n';

    // 战斗数据 - 神祇不适用
    text += '【战斗数据】\n';
    text += '护甲等级 (AC): 不适用\n';
    text += '生命值 (HP): 不适用\n';
    text += '移动力: 不适用\n';
    text += 'THAC0: 不适用\n\n';

    // 武器熟练 - 神祇不适用
    text += '【武器熟练】\n';
    text += '不适用\n\n';

    // 非武器熟练 - 神祇不适用
    text += '【非武器熟练】\n';
    text += '不适用\n\n';

    // 装备 - 神祇不适用
    text += '【装备】\n';
    text += '金币: 不适用\n\n';

    // 种族描述（如果有）
    const raceForDisplay = subrace || race;
    if (raceForDisplay) {
      text += '【种族描述】\n';
      text += `${raceForDisplay.description}\n\n`;

      text += '种族能力:\n';
      text += '不适用\n\n';

      if (raceForDisplay.specialDisadvantages) {
        text += `特殊劣势: ${raceForDisplay.specialDisadvantages}\n\n`;
      }
    }

    // 职业特性 - 神祇不适用
    text += '【职业特性】\n';
    text += '不适用\n\n';
    text += '职业能力:\n';
    text += '不适用\n\n';
    text += '武器限制: 可以使用任何武器\n';
    text += '护甲限制: 可以穿戴任何类型的护甲和盾牌\n\n';

    // 神祇能力
    text += '【神祇共有能力】\n';
    text += '神职（Portfolios）\n';
    text += '  使用时机: 判定神祇影响范围、力量强弱、能否干涉特定事务时\n\n';
    text += '  定义: 神祇统治/驱动/控制的特定主题/事物/概念/情感\n';
    text += '  特性: 神祇在神职范围内通常最强\n';
    text += '  变化条件: 消逝复活/同神系神祇消逝/性格转变/神格升降/神系重大变故\n';
    text += '  规则：同一神职神力里，只有一个可以抵达比半神更高位的层次，其余均为半神\n\n';
    text += '  化身伪装: 高等或中等神力可创造被融入神祇的精确化身模仿物，必须表现出全部能力但不必表现意图和思想\n\n';

    text += '不朽（Immortality）\n';
    text += '  使用时机: 判定神祇是否会因年龄或普通伤害死亡时\n\n';
    text += '  特性: 无年龄，只能通过特殊手段死亡\n';
    text += '  死亡方式: 被更高神格神力在魔法或物理战斗中毁灭、被遗忘以至于完全没有信众\n';
    text += '  复生机制: 遭受足以毁灭的攻击后崩散并重组（掷1d100决定天数）\n\n';

    text += '传送（Teleportation）\n';
    text += '  使用时机: 神祇需要移动到同位面任意位置时\n\n';
    text += '  特性: 立即传送到同位面任意位置，随意使用，无偏差\n\n';

    text += '先攻（Initiative）\n';
    text += '  使用时机: 神祇与凡人进行战斗或互动时\n\n';
    text += '  特性: 自动获得最早先攻权，可选择等待观察凡人行动\n\n';

    text += '沟通（Communication）\n';
    text += '  使用时机: 神祇需要与任何生物交流或传递信息时\n\n';
    text += '  能力范围:\n';
    text += '  - 理解并使用任何语言（书写/阅读/特殊沟通方式如气味语言）\n';
    text += '  - 穿越虚空/物理屏障/魔法屏障直接秘密地向任何存在说话\n';
    text += '  - 超越空间和位面界限（通常不超越时间）\n\n';

    text += '魔法使用（Magic Use）\n';
    text += '  使用时机: 神祇需要施展法术或魔法效果时\n\n';
    text += '  能力范围:\n';
    text += '  - 可使用任何等级的任何法术（祭司或法师法术）\n';
    text += '  - 无需法术书/祈祷/材料成分/言语成分/姿势成分\n';
    text += '  - 可即兴发明新法术或改变法术\n';
    text += '  - 仅需心念一动\n\n';

    text += '免疫（Immunities）\n';
    text += '  使用时机: 判定神祇是否受到武器或魔法伤害时\n\n';
    text += '  武器免疫:\n';
    text += '  - 半神力或更弱: 仅被+1或更好魔法武器伤害\n';
    text += '  - 中等神力: 仅被+2或更好魔法武器伤害\n';
    text += '  - 高等神力: 仅被+3或更好魔法武器伤害\n\n';
    text += '  魔法免疫:\n';
    text += '  - 免疫即死魔法（豁免失败自动死亡或无豁免立即死亡）\n';
    text += '  - 免疫能量吸取或生命等级吸取\n';
    text += '  - 免疫所有符文或徽记的力量\n';
    text += '  - 免疫所有非神性存在施展的灵能能力\n';
    text += '  - 免疫神格等级比自己低的神祇施展的灵能能力\n\n';

    text += '授予能力（Granted Abilities）\n';
    text += '  使用时机: 判定祭司/圣武士/游侠能否获得法术和能力时\n\n';
    text += '  能力范围:\n';
    text += '  - 可授予任何能力和任何等级法术给祭司（不超过自身能力）\n';
    text += '  - 通过此能力给予祭司/圣武士/游侠魔法能力和法术\n';
    text += '  - 仅神力和准神性地位生物（如塔纳厘领主）能授予法术\n\n';

    text += '特殊规则\n';
    text += '  - 神祇无卡面，除明确提及的数据外其他数值不适用\n';
    text += '  - 神祇力量不可量化，数据对神祇毫无意义\n\n';

    // 根据神格等级添加对应能力
    text += `【${deityRank}能力】\n`;
    if (deityRank === '半神力') {
      text += '半神力能力\n';
      text += '  前置条件: 除神祇共有能力（不朽/传送/先攻/沟通/魔法使用/免疫/授予能力）外，半神力额外拥有以下能力\n\n';
      text +=
        '  定位: 任何神系中最不强大的神祇，通常是初次擢升到神性地位、刚从消逝中归来、与更高神格共享神职、或追随者不足的神祇\n\n';
      text += '  典型来源: 在小群体或小区域中特别强大而赢得神性地位的凡人\n\n';

      text += '改变现形（Shapeshifting）\n';
      text += '  使用时机: 半神力需要改变形态或伪装时\n\n';
      text += '  能力范围:\n';
      text += '  - 只能变形为与其天性和神职契合的有生命对象\n\n';
      text += '  限制: 新形态只是该生物的平均个体（或许额外伴随浅薄的神圣化特殊效果）\n\n';

      text += '魔法抗力（Magic Resistance）\n';
      text += '  使用时机: 半神力受到法术攻击时\n\n';
      text += '  抗力数值:\n';
      text += '  - 对凡人魔法: 70%抗力\n';
      text += '  - 对其他半神力魔法: 40%抗力\n';
      text += '  - 对更高地位神力魔法: 20%抗力\n\n';

      text += '豁免检定（Saving Throws）\n';
      text += '  使用时机: 半神力需要进行豁免检定时\n\n';
      text += '  特性: 所有类型豁免检定为4，仅在掷出自然骰3或更低时失败（除非化身豁免检定更好）\n\n';

      text += ' 位面旅行（Planar Travel）\n';
      text += '  使用时机: 半神力需要跨位面移动时\n\n';
      text += '  能力范围:\n';
      text += '  - 只能依赖魔法法术和设备在位面间旅行\n\n';
      text += '  限制: 无法像其他神力那样随意位面旅行\n\n';
      text += '  特殊情况: 因此缺陷，半神力更倾向于逗留在某个位面（不少半神居住在物质位面）\n\n';
      text += '  与其他神格差异:\n';
      text += '  - 高等/中等/弱等神力: 随意使用位面旅行，但不能进入主物质位面\n';
      text += '  - 半神力: 必须依赖魔法法术和设备，但可以进入主物质位面\n\n';

      text += '感知能力（Sensing Ability）\n';
      text += '  使用时机: 判定半神力是否知晓特定事件或信息时\n\n';
      text += '  感知范围:\n';
      text += '  - 知晓自身/任何追随者/圣物1英里内发生之事\n';
      text += '  - 某人念出其名讳或头衔后1小时内，可延展感知知晓1英里内发生之事\n\n';
      text += '  限制: 可被同等地位神力有意识努力、或更高地位神力无意识愿望阻止\n\n';

      text += '创造（Creation）\n';
      text += '  使用时机: 半神力需要获取物体或生物时\n\n';
      text += '  能力范围:\n';
      text += '  - 必须通过感知能力收集信息，尝试寻觅想要的存世之物\n';
      text += '  - 或花费时间和努力用合适原材料创造\n';
      text += '  - 或找到能造出它们之人\n\n';
      text += '  限制: 不能凭空创造或复制任何对象\n\n';
      text += '  策略: 通常与中等或高等神力结盟，依靠更强大的朋友协助事物创造\n\n';

      text += '生命与死亡（Life and Death）\n';
      text += '  使用时机: 半神力需要复活生物时\n\n';
      text += '  能力范围:\n';
      text += '  - 可从死亡中复活任何之前有生命的凡物\n';
      text += '  - 随意使用，不论躯体当前状况\n\n';
      text += '  限制: 复活的躯体所在位置必须有某尊化身或某件圣物在场\n\n';

      text += '一心多用（Multitasks）\n';
      text += '  使用时机: 半神力需要同时执行多个行动时\n\n';
      text += '  能力范围:\n';
      text += '  - 可一次执行任何2项行动而不受惩罚\n\n';
      text += '  限制: 极少数情况下当前物理形态会限制此能力\n\n';

      text += '化身（Avatars）\n';
      text += '  使用时机: 半神力需要显现化身时\n\n';
      text += '  能力范围:\n';
      text += '  - 同一时间只能操纵1尊化身\n';
      text += '  - 化身被毁灭后需1整年塑造新化身\n\n';
      text += '  特殊情况: 有些半神力无法操纵化身，或选择不这样做\n';
    } else if (deityRank === '弱等神力') {
      text += '弱等神力能力\n';
      text +=
        '  前置条件: 除神祇共有能力（不朽/传送/先攻/沟通/魔法使用/免疫/授予能力）外，弱等神力额外拥有以下能力\n\n';
      text += '  定位: 拥有相当追随者和影响力的神祇，在神系中占据重要但非核心地位\n\n';

      text += '改变现形（Shapeshifting）\n';
      text += '  使用时机: 弱等神力需要改变形态或伪装时\n\n';
      text += '  能力范围:\n';
      text += '  - 可变形为期望的对象\n\n';
      text += '  限制: 新形态只是该生物的平均个体（或许额外伴随浅薄的神圣化特殊效果）\n\n';

      text += '魔法抗力（Magic Resistance）\n';
      text += '  使用时机: 弱等神力受到法术攻击时\n\n';
      text += '  抗力数值:\n';
      text += '  - 对凡人魔法: 90%抗力\n';
      text += '  - 对较低神格神祇魔法: 60%抗力\n';
      text += '  - 对其他弱等神力法术: 45%抗力\n';
      text += '  - 对更高地位神力魔法: 20%抗力\n\n';

      text += '豁免检定（Saving Throws）\n';
      text += '  使用时机: 弱等神力需要进行豁免检定时\n\n';
      text += '  特性: 所有类型豁免检定为2，仅在掷出自然骰1和2时失败（除非化身豁免检定更好）\n\n';

      text += '位面旅行（Planar Travel）\n';
      text += '  使用时机: 弱等神力需要跨位面移动时\n\n';
      text += '  能力范围:\n';
      text += '  - 随意使用，能在位面间旅行\n';
      text += '  - 无物理或物质屏障可阻碍\n';
      text += '  - 绝对不会被传送去目标之外的地方\n\n';
      text += '  限制: 被禁止进入主物质位面\n\n';

      text += '感知能力（Sensing Ability）\n';
      text += '  使用时机: 判定弱等神力是否知晓特定事件或信息时\n\n';
      text += '  感知范围:\n';
      text += '  - 知晓自身10英里内发生之事\n';
      text += '  - 可延展感知容纳任何崇拜者或圣物10英里内所揭露的知识\n';
      text += '  - 某人念出其名讳或头衔后1天内，可延展感知知晓10英里内发生之事\n\n';
      text += '  限制: 可被同等地位神力有意识努力、或更高地位神力无意识愿望阻止\n\n';

      text += '创造（Creation）\n';
      text += '  使用时机: 弱等神力需要获取物体或生物时\n\n';
      text += '  能力范围:\n';
      text += '  - 知晓在哪里可以找到想要的存世之物\n';
      text += '  - 若物品不存在，能感知到能制造该物品的人\n\n';
      text += '  限制: 不能凭空创造或复制任何对象\n\n';
      text += '  策略: 通常与中等或高等神力结盟，依靠更强大的朋友协助事物创造\n\n';

      text += '一心多用（Multitasks）\n';
      text += '  使用时机: 弱等神力需要同时执行多个行动时\n\n';
      text += '  能力范围:\n';
      text += '  - 可一次执行最多5项行动而不受惩罚\n\n';
      text += '  限制: 当前物理形态的自然限制仍可能适用\n\n';

      text += '化身（Avatars）\n';
      text += '  使用时机: 弱等神力需要在多个地点同时显现时\n\n';
      text += '  能力范围:\n';
      text += '  - 可同时操纵最多2尊化身\n';
      text += '  - 随意使用，可在整个位面移动化身\n';
      text += '  - 化身被毁灭后需1个月制造新化身\n';
    } else if (deityRank === '中等神力') {
      text += '中等神力能力\n';
      text +=
        '  前置条件: 除神祇共有能力（不朽/传送/先攻/沟通/魔法使用/免疫/授予能力）外，中等神力额外拥有以下能力\n\n';
      text += '  定位: 神系中的核心成员，拥有庞大的信徒群体和广泛的影响力\n\n';

      text += '改变现形（Shapeshifting）\n';
      text += '  使用时机: 中等神力需要改变形态或伪装时\n\n';
      text += '  能力范围:\n';
      text += '  - 可变形为任何对象（有生命或无生命）\n\n';
      text += '  限制: 不能变得比该自然或魔法物品存在过的最大体型更大\n\n';

      text += '魔法抗力（Magic Resistance）\n';
      text += '  使用时机: 中等神力受到法术攻击时\n\n';
      text += '  抗力数值:\n';
      text += '  - 对凡人魔法: 95%抗力\n';
      text += '  - 对较低神格神祇魔法: 70%抗力\n';
      text += '  - 对其他中等神力法术: 50%抗力\n';
      text += '  - 对高等神力法术: 25%抗力\n\n';

      text += '豁免检定（Saving Throws）\n';
      text += '  使用时机: 中等神力需要进行豁免检定时\n\n';
      text += '  特性: 所有类型豁免检定为2，仅在掷出自然骰1时失败\n\n';

      text += '位面旅行（Planar Travel）\n';
      text += '  使用时机: 中等神力需要跨位面移动时\n\n';
      text += '  能力范围:\n';
      text += '  - 如同高等神力在位面间旅行\n';
      text += '  - 总能无误到达希望到的地方\n\n';
      text += '  限制: 不能进入主物质位面\n\n';

      text += '感知能力（Sensing Ability）\n';
      text += '  使用时机: 判定中等神力是否知晓特定事件或信息时\n\n';
      text += '  感知范围:\n';
      text += '  - 总是知晓当前位置100英里内发生之事\n';
      text += '  - 可延展感官了解自己和盟友的崇拜者或圣物100英里内发生之事\n';
      text += '  - 某人念出其名讳或头衔后一个月内，可延展感知知晓100英里内发生之事\n\n';
      text += '  限制: 可被同等或更高地位神力有意识努力阻止\n\n';

      text += '创造（Creation）\n';
      text += '  使用时机: 中等神力需要创造物体或生物时\n\n';
      text += '  能力范围:\n';
      text += '  - 可召唤或创造所持任何物品的复制品\n\n';
      text += '  限制: 不能无中生有，需在同一位面可获得合适材料\n\n';

      text += '生命与死亡（Life and Death）\n';
      text += '  使用时机: 中等神力需要杀死或复活生物时\n\n';
      text += '  能力范围:\n';
      text += '  - 可在任何地方安排足以杀死任何凡物的意外事故（随意使用）\n';
      text += '  - 可将任何之前有生命的存在从死亡中复活（自动成功，无论死亡时间和躯体状况）\n\n';
      text += '  限制: 不能直接导致活物死亡，只能安排意外\n\n';

      text += '一心多用（Multitasks）\n';
      text += '  使用时机: 中等神力需要同时执行多个行动时\n\n';
      text += '  能力范围:\n';
      text += '  - 可一次执行最多100项行动而不受惩罚\n\n';
      text += '  限制: 当前物理形态的自然限制仍可能适用\n\n';

      text += '化身（Avatars）\n';
      text += '  使用时机: 中等神力需要在多个地点同时显现时\n\n';
      text += '  能力范围:\n';
      text += '  - 可同时操纵最多5尊化身\n';
      text += '  - 随意使用，可在位面间移动化身\n';
      text += '  - 化身被毁灭后需5天制造新化身\n';
    } else if (deityRank === '高等神力') {
      text += '高等神力能力\n';
      text +=
        '  前置条件: 除神祇共有能力（不朽/传送/先攻/沟通/魔法使用/免疫/授予能力）外，高等神力额外拥有以下能力\n\n';
      text += '  定位: 神系的最高统治者，拥有近乎无限的力量和影响力\n\n';

      text += '改变现形（Shapeshifting）\n';
      text += '  使用时机: 高等神力需要改变形态或伪装时\n\n';
      text += '  能力范围:\n';
      text += '  - 可变形为任何对象（有生命或无生命）\n';
      text += '  - 无尺寸体型限制（已知案例可呈现为行星大小）\n\n';

      text += '魔法抗力（Magic Resistance）\n';
      text += '  使用时机: 高等神力受到法术攻击时\n\n';
      text += '  抗力数值:\n';
      text += '  - 对凡人魔法: 100%抗力\n';
      text += '  - 对较低神格神祇魔法: 75%抗力\n';
      text += '  - 对其他高等神力法术: 50%抗力\n\n';

      text += '豁免检定（Saving Throws）\n';
      text += '  使用时机: 高等神力需要进行豁免检定时\n\n';
      text += '  特性: 自动通过所有豁免检定，反映伟大能力/精神力量/肉体力量\n\n';

      text += '位面旅行（Planar Travel）\n';
      text += '  使用时机: 高等神力需要跨位面移动时\n\n';
      text += '  能力范围:\n';
      text += '  - 随意使用，无误地在各实存位面间旅行\n\n';
      text += '  限制: 不能旅行到主物质位面\n\n';

      text += '感知能力（Sensing Ability）\n';
      text += '  使用时机: 判定高等神力是否知晓特定事件或信息时\n\n';
      text += '  感知范围:\n';
      text += '  - 总是知晓自己栖居的整个位面发生之事\n';
      text += '  - 总是知晓自己和盟友的崇拜者或圣物所在整个位面发生之事\n';
      text += '  - 某人念出其名讳或头衔后一年内，知晓该位面发生之事\n';
      text += '  - 可基于广博知识准确预测凡人和其他神祇的精确行动\n\n';
      text += '  限制: 可被同地位神力有意效果阻碍\n\n';

      text += '创造（Creation）\n';
      text += '  使用时机: 高等神力需要凭空创造物体或生物时\n\n';
      text += '  能力范围:\n';
      text += '  - 可创造任何对象（有生命或无生命）\n';
      text += '  - 仅受想象力限制\n\n';
      text += '  限制: 耗散性过程，需将自身能量储备转化为物质对象\n\n';

      text += '生命与死亡（Life and Death）\n';
      text += '  使用时机: 高等神力需要杀死或复活生物时\n\n';
      text += '  能力范围:\n';
      text += '  - 以一个念头杀死任何活物\n';
      text += '  - 在任何地方赋予任何被杀凡物生命\n\n';
      text += '  限制: 另一位高等神力可立即扭转此效果\n\n';

      text += '一心多用（Multitasks）\n';
      text += '  使用时机: 高等神力需要同时执行多个行动时\n\n';
      text += '  能力范围:\n';
      text += '  - 可一次执行任意数量行动\n';
      text += '  - 不会因复杂性受到惩罚\n\n';
      text += '  限制: 当前物理形态的自然限制仍可能适用\n\n';

      text += '化身（Avatars）\n';
      text += '  使用时机: 高等神力需要在多个地点同时显现时\n\n';
      text += '  能力范围:\n';
      text += '  - 可同时操纵最多10尊化身\n';
      text += '  - 随意使用，可在位面间移动化身\n';
      text += '  - 化身被毁灭后需1天制造新化身\n';
    }

    text += '═══════════════════════════════════════════════';

    return text;
  }

  // 生成文本格式的角色卡
  // 参数 useAdjustedData: 是否使用调整后的属性值（默认 true）
  function generateCharacterCardText(useAdjustedData = true): string {
    // 如果 useAdjustedData 为 true，使用调整后的属性值
    const data = useAdjustedData
      ? {
          ...characterData.value,
          abilities: adjustedAbilities.value, // 使用调整后的属性值
        }
      : characterData.value;

    const race = getRaceById(data.race || '');
    const subrace = data.subrace ? getSubraceById(data.race || '', data.subrace) : null;
    const cls = getClassById(data.class || '');
    const alignmentData = getAlignmentById(data.alignment || '');

    let text = '═══════════════════════════════════════════════\n';
    text += '        ADND 2E 角色卡\n';
    text += '═══════════════════════════════════════════════\n\n';

    // 🔧 如果角色是神祇，生成神祇专属角色卡
    if (data.isDeity) {
      return generateDeityCharacterCardText(data, race, subrace, alignmentData);
    }

    // 基本信息
    text += '【基本信息】\n';
    // 使用酒馆的用户名作为默认值
    const defaultName = (typeof SillyTavern !== 'undefined' && SillyTavern.name1) || 'Player';
    text += `角色名: ${data.characterName?.trim() || defaultName}\n`;
    text += `性别: ${data.gender === 'male' ? '男' : data.gender === 'female' ? '女' : '其他'}\n`;
    text += `种族: ${race?.name}${subrace ? ` (${subrace.name})` : ''}\n`;
    text += `职业: ${cls?.name}\n`;
    text += `阵营: ${alignmentData?.name || data.alignment || '未知'}\n`;
    text += `等级: 1\n`;
    text += `经验值: 0\n`;

    // 经验值调整
    const raceXpPenalty = subrace?.xpPenalty || 0;
    let classXpBonus = 0;
    if (cls) {
      const abilities = adjustedAbilities.value;
      let allMet = true;
      cls.primeRequisites.forEach(req => {
        const keyMap: Record<string, keyof Abilities> = {
          力量: 'str',
          敏捷: 'dex',
          体质: 'con',
          智力: 'int',
          灵知: 'wis',
          魅力: 'cha',
        };
        const key = keyMap[req];
        if (key && (abilities[key] || 0) < 16) allMet = false;
      });
      if (allMet) classXpBonus = 10;
    }

    if (raceXpPenalty > 0 || classXpBonus > 0) {
      text += `经验值调整: `;
      const parts = [];
      if (raceXpPenalty > 0) parts.push(`种族惩罚-${raceXpPenalty}%`);
      if (classXpBonus > 0) parts.push(`职业奖励+${classXpBonus}%`);
      text += parts.join(', ');
      const total = classXpBonus - raceXpPenalty;
      text += ` = ${total > 0 ? '+' : ''}${total}%\n`;
    }
    text += '\n';

    // 角色信息 - 外貌和背景
    if (data.appearance || data.background || (data.gender === 'male' && data.penisSize)) {
      text += '【角色描述】\n';
      if (data.appearance) {
        text += `外貌: ${data.appearance}\n`;
      }
      if (data.background) {
        text += `背景: ${data.background}\n`;
      }
      if (data.gender === 'male' && data.penisSize) {
        const sizeMap: Record<string, string> = {
          xs: '特小',
          s: '偏小',
          m: '平均',
          l: '偏大',
          xl: '特大',
          xxl: '超大',
        };
        text += `身体特征: 阴茎大小${sizeMap[data.penisSize] || data.penisSize}\n`;
      }
      text += '\n';
    }

    // 属性值
    text += '【属性值】\n';
    const abilityNames: Record<string, string> = {
      str: '力量',
      dex: '敏捷',
      con: '体质',
      int: '智力',
      wis: '灵知',
      cha: '魅力',
    };
    Object.entries(abilityNames).forEach(([key, name]) => {
      const original = data.abilities[key as keyof Abilities] || 0;
      const adjusted = adjustedAbilities.value[key as keyof Abilities] || 0;
      const diff = adjusted - original;
      text += `${name}: ${adjusted}`;
      if (diff !== 0) {
        text += ` (原始${original} ${diff > 0 ? '+' : ''}${diff})`;
      }
      text += '\n';
    });
    if (data.exceptionalStrength) {
      text += `超凡力量: ${data.exceptionalStrength}\n`;
    }
    text += '\n';

    // 战斗数据
    text += '【战斗数据】\n';
    const ac = data.armorClass?.total || 10;
    text += `护甲等级 (AC): ${ac}\n`;
    const raceData = subrace || race;
    const movement = raceData?.movement?.ground || 12;
    const hp = data.hitPoints?.max || '[待掷骰]';
    const currentHp = data.hitPoints?.current !== undefined ? data.hitPoints.current : hp;
    text += `生命值 (HP): ${currentHp}/${hp}\n`;
    text += `移动力: ${movement}\n`;
    const classCategory = cls ? getClassCategory(cls.name) : 'warrior';
    const thac0 = getTHAC0(classCategory, 1);
    text += `THAC0: ${thac0}\n`;

    // 豁免检定
    const savingThrows = getSavingThrows(classCategory, 1);
    text += `豁免检定:\n`;
    text += `  - 麻痹/毒素/死亡魔法: ${savingThrows.paralyzation}\n`;
    text += `  - 权杖/法杖/魔杖: ${savingThrows.rod}\n`;
    text += `  - 石化/变形: ${savingThrows.petrification}\n`;
    text += `  - 喷吐武器: ${savingThrows.breath}\n`;
    text += `  - 法术: ${savingThrows.spell}\n`;
    text += '\n';

    // 武器熟练
    text += '【武器熟练】\n';
    if (data.weaponProficiencies.length > 0) {
      data.weaponProficiencies.forEach(id => {
        const weapon = getWeaponById(id);
        const weaponName = weapon?.name || id;
        const isSpec = data.weaponSpecializations.includes(id);
        text += `- ${weaponName}${isSpec ? ' (专精)' : ''}\n`;
      });
    } else {
      text += '无\n';
    }
    text += '\n';

    // 非武器熟练
    text += '【非武器熟练】\n';
    if (data.nonweaponProficiencies.length > 0) {
      data.nonweaponProficiencies.forEach(prof => {
        const profData = getProficiencyById(prof.id);
        const profName = profData?.name || prof.id;
        text += `- ${profName} (${prof.slots}槽)\n`;
      });
    } else {
      text += '无\n';
    }
    text += '\n';

    // 装备
    text += '【装备】\n';
    text += `金币: ${data.currentMoney.toFixed(2)} GP\n`;
    if (data.purchasedEquipment.length > 0) {
      // 按类别分组
      const grouped = new Map<string, typeof data.purchasedEquipment>();
      data.purchasedEquipment.forEach(item => {
        const category = item.category || '其他';
        if (!grouped.has(category)) {
          grouped.set(category, []);
        }
        grouped.get(category)!.push(item);
      });

      grouped.forEach((items, category) => {
        text += `${category}:\n`;
        items.forEach(item => {
          text += `  - ${item.name} × ${item.quantity}\n`;
        });
      });
    }
    text += '\n';

    // 法术能力（如有）
    if (cls?.spellcasting) {
      text += '【法术能力】\n';
      text += `类型: ${cls.spellcasting.type === 'wizard' ? '奥术施法者' : '神术施法者'}\n`;

      if (data.spells) {
        if (cls.spellcasting.type === 'wizard' && data.spells.spellbook && data.spells.spellbook.length > 0) {
          text += '\n法术书:\n';
          data.spells.spellbook.forEach(spellId => {
            const spell = getWizardSpellById(spellId);
            const spellName = spell?.name || spellId;
            text += `  - ${spellName}\n`;
          });
        } else if (cls.spellcasting.type === 'priest') {
          text += `\n法术领域:\n`;
          text += `  主要: ${cls.spellSpheres?.major.join(', ') || '无'}\n`;
          if (cls.spellSpheres?.minor && cls.spellSpheres.minor.length > 0) {
            text += `  次要: ${cls.spellSpheres.minor.join(', ')}\n`;
          }
        }

        // 已记忆法术
        text += '\n已记忆法术:\n';
        console.log('[角色卡生成] 检查法术记忆数据:', JSON.stringify(data.spells.memorizedSpells, null, 2));
        let hasMemorizedSpells = false;
        Object.entries(data.spells.memorizedSpells).forEach(([key, spells]) => {
          const level = key.replace('level', '');
          console.log(`[角色卡生成] ${key} (${level}环):`, spells);
          if (spells && Array.isArray(spells) && spells.length > 0) {
            hasMemorizedSpells = true;
            const spellNames = spells.map((id: string) => {
              const spell = cls.spellcasting!.type === 'wizard' ? getWizardSpellById(id) : getPriestSpellById(id);
              console.log(`[角色卡生成] 解析法术ID ${id}:`, spell?.name);
              return spell?.name || id;
            });
            text += `  ${level}环: ${spellNames.join(', ')}\n`;
          }
        });
        if (!hasMemorizedSpells) {
          text += '  无\n';
        }
        console.log('[角色卡生成] 是否有记忆法术:', hasMemorizedSpells);
      }
      text += '\n';
    }

    // 种族描述与特性
    text += '【种族特性】\n';
    const raceForDisplay = subrace || race;
    if (raceForDisplay) {
      // 种族描述
      text += `${raceForDisplay.description}\n\n`;

      // 种族能力
      const raceAbilities = raceForDisplay.abilities || [];
      if (raceAbilities.length > 0) {
        text += '种族能力:\n';
        raceAbilities.forEach(ability => {
          text += `• ${ability.name}: ${ability.description}\n`;
        });
        text += '\n';
      }

      // 种族优势
      if (raceForDisplay.specialAdvantages) {
        text += `特殊优势: ${raceForDisplay.specialAdvantages}\n`;
      }

      // 种族劣势
      if (raceForDisplay.specialDisadvantages) {
        text += `特殊劣势: ${raceForDisplay.specialDisadvantages}\n`;
      }
    }
    text += '\n';

    // 职业描述与特性
    text += '【职业特性】\n';
    if (cls) {
      // 职业描述
      text += `${cls.description}\n\n`;

      // 职业能力（1级）
      const classAbilities = cls.specialAbilities.filter(a => a.level === 1);
      if (classAbilities.length > 0) {
        text += '职业能力:\n';
        classAbilities.forEach(ability => {
          text += `• ${ability.name}: ${ability.description}\n`;
        });
        text += '\n';
      }

      // 职业说明
      if (cls.specialNotes && cls.specialNotes.length > 0) {
        text += '特殊说明:\n';
        cls.specialNotes.forEach(note => {
          text += `- ${note}\n`;
        });
        text += '\n';
      }

      // 武器与护甲限制
      text += `武器限制: ${cls.weaponRestrictions}\n`;
      text += `护甲限制: ${cls.armorRestrictions}\n`;
    }

    text += '\n═══════════════════════════════════════════════\n';

    return text;
  }

  // ==================== 法术学习与记忆相关函数 ====================

  // 检查法师是否可以学习某个法术
  function canLearnSpell(spellId: string): { canLearn: boolean; reason?: string } {
    const cls = getCharacterClass();
    if (!cls || cls.spellcasting?.type !== 'wizard') {
      return { canLearn: false, reason: '只有法师可以学习法术' };
    }

    if (!characterData.value.spells) {
      initializeSpellData();
    }

    // 获取法术信息
    const spell = getWizardSpellById(spellId);
    if (!spell) {
      return { canLearn: false, reason: '法术不存在' };
    }

    // 检查智力限制 - 最高可学法术等级
    const maxLevel = getMaxSpellLevelForWizard();
    if (spell.level > maxLevel) {
      return { canLearn: false, reason: `智力不足，最高可学${maxLevel}级法术` };
    }

    // 检查该等级已学法术数量
    const spellbook = characterData.value.spells!.spellbook || [];
    const currentLevelCount = spellbook.filter(id => {
      const s = getWizardSpellById(id);
      return s && s.level === spell.level;
    }).length;

    const maxPerLevel = getMaxSpellsPerLevel();
    if (maxPerLevel !== 999 && currentLevelCount >= maxPerLevel) {
      return { canLearn: false, reason: `该等级法术已达上限(${maxPerLevel}个)` };
    }

    // 检查是否已经学会
    if (spellbook.includes(spellId)) {
      return { canLearn: false, reason: '已经学会该法术' };
    }

    return { canLearn: true };
  }

  // 尝试学习法术（含习得率判定）
  function learnSpell(spellId: string): { success: boolean; roll?: number; chance?: number; reason?: string } {
    const check = canLearnSpell(spellId);
    if (!check.canLearn) {
      return { success: false, reason: check.reason };
    }

    // 进行习得率判定
    const learnChance = getSpellLearnChance();
    const roll = Math.floor(Math.random() * 100) + 1; // 1-100

    if (roll <= learnChance) {
      // 成功学习
      if (!characterData.value.spells!.spellbook) {
        characterData.value.spells!.spellbook = [];
      }
      characterData.value.spells!.spellbook.push(spellId);
      return { success: true, roll, chance: learnChance };
    } else {
      // 学习失败
      return { success: false, roll, chance: learnChance, reason: '习得判定失败' };
    }
  }

  // 获取祭司可用的法术列表
  function getAvailablePriestSpells(spellLevel: number): string[] {
    const cls = getCharacterClass();
    if (!cls || cls.spellcasting?.type !== 'priest' || !cls.spellSpheres) {
      return [];
    }

    const major = cls.spellSpheres.major || [];
    const minor = cls.spellSpheres.minor || [];

    // 获取该等级的所有祭司法术
    let allSpells: any[] = [];
    switch (spellLevel) {
      case 1:
        allSpells = getAllPriestLevel1Spells?.() || [];
        break;
      case 2:
        allSpells = getAllPriestLevel2Spells?.() || [];
        break;
      case 3:
        allSpells = getAllPriestLevel3Spells?.() || [];
        break;
      case 4:
        allSpells = getAllPriestLevel4Spells?.() || [];
        break;
      case 5:
        allSpells = getAllPriestLevel5Spells?.() || [];
        break;
      case 6:
        allSpells = getAllPriestLevel6Spells?.() || [];
        break;
      case 7:
        allSpells = getAllPriestLevel7Spells?.() || [];
        break;
    }

    // 过滤符合领域要求的法术
    const availableSpells = allSpells.filter(spell => {
      // 检查主要领域（可学所有等级）
      if (spell.sphere && spell.sphere.some((s: string) => major.includes(s))) {
        return true;
      }
      // 检查次要领域（仅1-3级）
      if (spellLevel <= 3 && spell.sphere && spell.sphere.some((s: string) => minor.includes(s))) {
        return true;
      }
      return false;
    });

    return availableSpells.map(s => s.id);
  }

  // 记忆法术
  function memorizeSpell(spellLevel: number, spellId: string): { success: boolean; reason?: string } {
    if (!characterData.value.spells) {
      initializeSpellData();
    }

    // 再次检查确保 spells 已初始化
    if (!characterData.value.spells) {
      return { success: false, reason: '法术数据初始化失败' };
    }

    const cls = getCharacterClass();
    if (!cls || !cls.spellcasting) {
      return { success: false, reason: '职业不能施法' };
    }

    // 检查法术等级是否有效
    if (spellLevel < 1 || spellLevel > 9) {
      return { success: false, reason: '无效的法术等级' };
    }

    // 获取该等级的可用槽位
    const baseSlots = getSpellSlotsForLevel(spellLevel);
    const bonusSlots = cls.spellcasting.type === 'priest' ? getBonusSpellSlots(spellLevel) : 0;
    const totalSlots = baseSlots + bonusSlots;

    if (totalSlots === 0) {
      return { success: false, reason: '该等级没有可用法术槽位' };
    }

    // 检查当前已记忆数量
    const levelKey = `level${spellLevel}` as keyof typeof characterData.value.spells.memorizedSpells;
    const currentMemorized = characterData.value.spells.memorizedSpells[levelKey] || [];

    if (currentMemorized.length >= totalSlots) {
      return { success: false, reason: '该等级法术槽位已满' };
    }

    // 对于法师，检查法术是否在法术书中
    if (cls.spellcasting.type === 'wizard') {
      const spellbook = characterData.value.spells.spellbook || [];
      if (!spellbook.includes(spellId)) {
        return { success: false, reason: '法术不在法术书中' };
      }
    }

    // 对于祭司，检查法术是否在可用领域中
    if (cls.spellcasting.type === 'priest') {
      const availableSpells = getAvailablePriestSpells(spellLevel);
      if (!availableSpells.includes(spellId)) {
        return { success: false, reason: '法术不在可用领域中' };
      }
    }

    // 添加到记忆列表
    characterData.value.spells.memorizedSpells[levelKey].push(spellId);
    return { success: true };
  }

  // 取消记忆某个法术
  function unmemorizeSpell(spellLevel: number, spellId: string): boolean {
    if (!characterData.value.spells) return false;

    const levelKey = `level${spellLevel}` as keyof typeof characterData.value.spells.memorizedSpells;
    const memorized = characterData.value.spells.memorizedSpells[levelKey];

    const index = memorized.indexOf(spellId);
    if (index !== -1) {
      memorized.splice(index, 1);
      return true;
    }
    return false;
  }

  // 清空某个等级的记忆法术
  function clearMemorizedSpellsAtLevel(spellLevel: number) {
    if (!characterData.value.spells) return;

    const levelKey = `level${spellLevel}` as keyof typeof characterData.value.spells.memorizedSpells;
    characterData.value.spells.memorizedSpells[levelKey] = [];
  }

  // 清空所有记忆法术
  function clearAllMemorizedSpells() {
    if (!characterData.value.spells) {
      initializeSpellData();
    }

    characterData.value.spells!.memorizedSpells = {
      level1: [],
      level2: [],
      level3: [],
      level4: [],
      level5: [],
      level6: [],
      level7: [],
      level8: [],
      level9: [],
    };
  }

  // 获取法师已学法术列表（按等级分组）
  function getWizardSpellbookByLevel(): Record<number, string[]> {
    const result: Record<number, string[]> = {};
    if (!characterData.value.spells?.spellbook) return result;

    for (const spellId of characterData.value.spells.spellbook) {
      const spell = getWizardSpellById(spellId);
      if (spell) {
        if (!result[spell.level]) {
          result[spell.level] = [];
        }
        result[spell.level].push(spellId);
      }
    }

    return result;
  }

  return {
    characterData,
    updateCharacterData, // 工具函数（性能优化）
    adjustedAbilities,
    canSelectRace,
    checkAbilityRequirement,
    canSelectSubrace,
    checkSubraceAbilityRequirement,
    canSelectClass,
    checkClassAbilityRequirement,
    canHaveExceptionalStrength,
    rollExceptionalStrength,
    formatExceptionalStrength,
    resetCharacter,
    saveToTavern,
    loadFromTavern,
    // 熟练相关函数
    getAvailableLanguageSlots,
    getInitialWeaponSlots,
    getInitialNonweaponSlots,
    getRemainingWeaponSlots,
    getRemainingNonweaponSlots,
    canSpecialize,
    getWeaponProficiencyPenalty,
    // 装备购买相关函数
    calculateStartingMoney,
    initializeStartingMoney,
    addEquipmentToCart,
    removeEquipmentFromCart,
    updateEquipmentQuantity,
    clearCart,
    getTotalSpent,
    getTotalWeight,
    getEquipmentQuantityInCart,
    // 法术相关函数
    canCastSpellsAtLevel1,
    rollInitialSpellbookSize,
    getSpellSlotsForLevel,
    getBonusSpellSlots,
    getSpellFailureChance,
    getMaxSpellLevelForWizard,
    getMaxSpellsPerLevel,
    getSpellLearnChance,
    initializeSpellData,
    getCharacterClass,
    // 法术学习与记忆函数
    canLearnSpell,
    learnSpell,
    getAvailablePriestSpells,
    memorizeSpell,
    unmemorizeSpell,
    clearMemorizedSpellsAtLevel,
    clearAllMemorizedSpells,
    getWizardSpellbookByLevel,
    // 角色卡生成
    generateCharacterCardText,
  };
});
