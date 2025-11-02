import { defineStore } from 'pinia';
import { computed, shallowRef } from 'vue';
import { canRaceSelectClass, getClassById } from '../utils/classData';
import { getClassCategory, getTHAC0 } from '../utils/combatData';
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
  function loadFromTavern() {
    try {
      const variables = getVariables({ type: 'character' });
      if (variables?.adnd2e?.character) {
        characterData.value = variables.adnd2e.character;
        toastr.success('角色数据已加载');
      }
    } catch (error) {
      console.error('加载角色数据失败:', error);
      toastr.error('加载失败');
    }
  }

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

  // 生成文本格式的角色卡
  function generateCharacterCardText(): string {
    const data = characterData.value;
    const race = getRaceById(data.race || '');
    const subrace = data.subrace ? getSubraceById(data.race || '', data.subrace) : null;
    const cls = getClassById(data.class || '');
    const alignment = data.alignment;

    let text = '═══════════════════════════════════\n';
    text += '        ADND 2E 角色卡\n';
    text += '═══════════════════════════════════\n\n';

    // 基本信息
    text += '【基本信息】\n';
    // 使用酒馆的用户名作为默认值
    const defaultName = (typeof SillyTavern !== 'undefined' && SillyTavern.name1) || 'Player';
    text += `角色名: ${data.characterName?.trim() || defaultName}\n`;
    text += `性别: ${data.gender === 'male' ? '男性' : data.gender === 'female' ? '女性' : '其他'}\n`;
    text += `种族: ${race?.name}${subrace ? ` (${subrace.name})` : ''}\n`;
    text += `职业: ${cls?.name}\n`;
    text += `阵营: ${alignment}\n`;
    text += `等级: 1级\n`;
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
    text += `生命值 (HP): ${hp}\n`;
    text += `移动力: ${movement}\n`;
    const classCategory = cls ? getClassCategory(cls.name) : 'warrior';
    const thac0 = getTHAC0(classCategory, 1);
    text += `THAC0: ${thac0}\n`;
    text += '\n';

    // 熟练
    text += '【熟练】\n';
    text += '武器熟练:\n';
    if (data.weaponProficiencies.length > 0) {
      data.weaponProficiencies.forEach(id => {
        const weapon = getWeaponById(id);
        const weaponName = weapon?.name || id;
        const isSpec = data.weaponSpecializations.includes(id);
        text += `  - ${weaponName}${isSpec ? ' (专精)' : ''}\n`;
      });
    } else {
      text += '  无\n';
    }

    text += '非武器熟练:\n';
    if (data.nonweaponProficiencies.length > 0) {
      data.nonweaponProficiencies.forEach(prof => {
        const profData = getProficiencyById(prof.id);
        const profName = profData?.name || prof.id;
        text += `  - ${profName} (${prof.slots}槽)\n`;
      });
    } else {
      text += '  无\n';
    }
    text += '\n';

    // 装备与财富
    text += '【装备与财富】\n';
    text += `起始金币: ${data.startingMoney} GP\n`;
    text += `当前金币: ${data.currentMoney} GP\n`;
    if (data.purchasedEquipment.length > 0) {
      text += '已购装备:\n';
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
        text += `  ${category}:\n`;
        items.forEach(item => {
          text += `    - ${item.name} × ${item.quantity}\n`;
        });
      });
    } else {
      text += '装备: 无\n';
    }
    text += '\n';

    // 法术（如有）
    if (data.spells && cls?.spellcasting) {
      text += '【法术】\n';
      text += '法术位:\n';

      const progression = cls.spellcasting.spellProgression;
      const level1Progression = progression.find(p => p.level === 1);
      if (level1Progression) {
        level1Progression.spells.forEach((baseSlots, index) => {
          if (baseSlots > 0) {
            const spellLevel = index + 1;
            const bonusSlots = getBonusSpellSlots(spellLevel);
            text += `  ${spellLevel}环: ${baseSlots}`;
            if (bonusSlots > 0) text += ` +${bonusSlots}(奖励)`;
            text += ` = ${baseSlots + bonusSlots}\n`;
          }
        });
      }

      if (cls.spellcasting.type === 'wizard') {
        text += '\n法术书:\n';
        if (data.spells.spellbook && data.spells.spellbook.length > 0) {
          data.spells.spellbook.forEach(spellId => {
            const spell = getWizardSpellById(spellId);
            const spellName = spell?.name || spellId;
            text += `  - ${spellName}\n`;
          });
        } else {
          text += '  无\n';
        }
        text += '\n已记忆法术:\n';
        Object.entries(data.spells.memorizedSpells).forEach(([key, spells]) => {
          const level = key.replace('level', '');
          if (spells.length > 0) {
            const spellNames = spells.map(id => getWizardSpellById(id)?.name || id);
            text += `  ${level}环: ${spellNames.join(', ')}\n`;
          }
        });
      } else {
        text += `\n法术领域:\n`;
        text += `  主要: ${cls.spellSpheres?.major.join(', ')}\n`;
        if (cls.spellSpheres?.minor && cls.spellSpheres.minor.length > 0) {
          text += `  次要: ${cls.spellSpheres.minor.join(', ')}\n`;
        }
        text += '\n已记忆法术:\n';
        Object.entries(data.spells.memorizedSpells).forEach(([key, spells]) => {
          const level = key.replace('level', '');
          if (spells.length > 0) {
            const spellNames = spells.map(id => getPriestSpellById(id)?.name || id);
            text += `  ${level}环: ${spellNames.join(', ')}\n`;
          }
        });
      }
      text += '\n';
    }

    // 角色信息
    if (data.appearance || data.background || (data.gender === 'male' && data.penisSize)) {
      text += '【角色信息】\n';
      if (data.appearance) {
        text += `外貌: ${data.appearance}\n\n`;
      }
      if (data.background) {
        text += `背景: ${data.background}\n\n`;
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
        text += `身体特征: 阴茎大小${sizeMap[data.penisSize] || data.penisSize}\n\n`;
      }
    }

    // 种族描述与特性
    text += '【种族描述与特性】\n';
    const raceForDisplay = subrace || race;
    if (raceForDisplay) {
      // 种族描述
      text += `\n${raceForDisplay.description}\n\n`;

      // 种族能力
      const raceAbilities = raceForDisplay.abilities || [];
      if (raceAbilities.length > 0) {
        text += '种族能力:\n';
        raceAbilities.forEach(ability => {
          text += `  • ${ability.name}: ${ability.description}\n`;
        });
        text += '\n';
      }

      // 种族优势
      if (raceForDisplay.specialAdvantages) {
        text += `特殊优势: ${raceForDisplay.specialAdvantages}\n\n`;
      }

      // 种族劣势
      if (raceForDisplay.specialDisadvantages) {
        text += `特殊劣势: ${raceForDisplay.specialDisadvantages}\n\n`;
      }
    }

    // 职业描述与特性
    text += '【职业描述与特性】\n';
    if (cls) {
      // 职业描述
      text += `\n${cls.description}\n\n`;

      // 职业能力（1级）
      const classAbilities = cls.specialAbilities.filter(a => a.level === 1);
      if (classAbilities.length > 0) {
        text += '职业能力:\n';
        classAbilities.forEach(ability => {
          text += `  • ${ability.name}: ${ability.description}\n`;
        });
        text += '\n';
      }

      // 职业说明
      if (cls.specialNotes && cls.specialNotes.length > 0) {
        text += '职业说明:\n';
        cls.specialNotes.forEach(note => {
          text += `  - ${note}\n`;
        });
        text += '\n';
      }

      // 武器与护甲限制
      text += `武器限制: ${cls.weaponRestrictions}\n`;
      text += `护甲限制: ${cls.armorRestrictions}\n`;
    }

    text += '\n═══════════════════════════════════\n';

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
