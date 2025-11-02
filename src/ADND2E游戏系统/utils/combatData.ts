// 豁免检定接口
export interface SavingThrows {
  paralyzation: number; // 麻痹、毒素或死亡魔法
  rod: number; // 来自权杖、法杖或魔杖的攻击
  petrification: number; // 石化或变形
  breath: number; // 喷吐武器
  spell: number; // 法术
}

// THAC0表格（表格53：计算零级命中值）
export const THAC0_TABLE: Record<string, number[]> = {
  priest: [20, 20, 20, 18, 18, 18, 16, 16, 16, 14, 14, 14, 12, 12, 12, 10, 10, 10, 8, 8],
  rogue: [20, 20, 19, 19, 18, 18, 17, 17, 16, 16, 15, 15, 14, 14, 13, 13, 12, 12, 11, 11],
  warrior: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  wizard: [20, 20, 20, 19, 19, 19, 18, 18, 18, 17, 17, 17, 16, 16, 16, 15, 15, 15, 14, 14],
};

// 豁免值表格（表格60：角色的豁免检定）
export const SAVING_THROW_TABLE: Record<string, Record<string, SavingThrows>> = {
  priest: {
    '1-3': { paralyzation: 10, rod: 14, petrification: 13, breath: 16, spell: 15 },
    '4-6': { paralyzation: 9, rod: 13, petrification: 12, breath: 15, spell: 14 },
    '7-9': { paralyzation: 7, rod: 11, petrification: 10, breath: 13, spell: 12 },
    '10-12': { paralyzation: 6, rod: 10, petrification: 9, breath: 12, spell: 11 },
    '13-15': { paralyzation: 5, rod: 9, petrification: 8, breath: 11, spell: 10 },
    '16-18': { paralyzation: 4, rod: 8, petrification: 7, breath: 10, spell: 9 },
    '19+': { paralyzation: 2, rod: 6, petrification: 5, breath: 8, spell: 7 },
  },
  rogue: {
    '1-4': { paralyzation: 13, rod: 14, petrification: 12, breath: 16, spell: 15 },
    '5-8': { paralyzation: 12, rod: 12, petrification: 11, breath: 15, spell: 13 },
    '9-12': { paralyzation: 11, rod: 10, petrification: 10, breath: 14, spell: 11 },
    '13-16': { paralyzation: 10, rod: 8, petrification: 9, breath: 13, spell: 9 },
    '17-20': { paralyzation: 9, rod: 6, petrification: 8, breath: 12, spell: 7 },
    '21+': { paralyzation: 8, rod: 4, petrification: 7, breath: 11, spell: 5 },
  },
  warrior: {
    '0': { paralyzation: 16, rod: 18, petrification: 17, breath: 20, spell: 19 },
    '1-2': { paralyzation: 14, rod: 16, petrification: 15, breath: 17, spell: 17 },
    '3-4': { paralyzation: 13, rod: 15, petrification: 14, breath: 16, spell: 16 },
    '5-6': { paralyzation: 11, rod: 13, petrification: 12, breath: 13, spell: 14 },
    '7-8': { paralyzation: 10, rod: 12, petrification: 11, breath: 12, spell: 13 },
    '9-10': { paralyzation: 8, rod: 10, petrification: 9, breath: 9, spell: 11 },
    '11-12': { paralyzation: 7, rod: 9, petrification: 8, breath: 8, spell: 10 },
    '13-14': { paralyzation: 5, rod: 7, petrification: 6, breath: 5, spell: 8 },
    '15-16': { paralyzation: 4, rod: 6, petrification: 5, breath: 4, spell: 7 },
    '17+': { paralyzation: 3, rod: 5, petrification: 4, breath: 4, spell: 6 },
  },
  wizard: {
    '1-5': { paralyzation: 14, rod: 11, petrification: 13, breath: 15, spell: 12 },
    '6-10': { paralyzation: 13, rod: 9, petrification: 11, breath: 13, spell: 10 },
    '11-15': { paralyzation: 11, rod: 7, petrification: 9, breath: 11, spell: 8 },
    '16-20': { paralyzation: 10, rod: 5, petrification: 7, breath: 9, spell: 6 },
    '21+': { paralyzation: 8, rod: 3, petrification: 5, breath: 7, spell: 4 },
  },
};

// 豁免检定类型的中文名称
export const SAVING_THROW_NAMES: Record<keyof SavingThrows, string> = {
  paralyzation: '麻痹/毒素/死亡魔法',
  rod: '权杖/法杖/魔杖',
  petrification: '石化/变形',
  breath: '喷吐武器',
  spell: '法术',
};

// 辅助函数：根据职业类别和等级获取THAC0
export function getTHAC0(category: string, level: number): number {
  const table = THAC0_TABLE[category];
  if (!table) return 20;
  const index = Math.min(level - 1, 19);
  if (index < 0) return 20;
  return table[index] || 20;
}

// 辅助函数：根据职业类别和等级获取豁免值
export function getSavingThrows(category: string, level: number): SavingThrows {
  const categoryTable = SAVING_THROW_TABLE[category];
  if (!categoryTable) {
    // 默认返回1级warrior的豁免值
    return { paralyzation: 14, rod: 16, petrification: 15, breath: 17, spell: 17 };
  }

  // 根据等级找到对应的范围
  for (const [range, saves] of Object.entries(categoryTable)) {
    if (range.includes('-')) {
      const [min, max] = range.split('-').map(Number);
      if (level >= min && level <= max) {
        return saves;
      }
    } else if (range.includes('+')) {
      const min = parseInt(range);
      if (level >= min) {
        return saves;
      }
    } else {
      // 单个数字
      const specificLevel = parseInt(range);
      if (level === specificLevel) {
        return saves;
      }
    }
  }

  // 如果没有找到，返回该类别的第一个条目
  const firstKey = Object.keys(categoryTable)[0];
  return categoryTable[firstKey];
}

// 辅助函数：根据职业名称获取类别
export function getClassCategory(className: string): string {
  const categoryMap: Record<string, string> = {
    战士: 'warrior',
    圣武士: 'warrior',
    游侠: 'warrior',
    巫师: 'wizard',
    牧师: 'priest',
    德鲁伊: 'priest',
    盗贼: 'rogue',
    吟游诗人: 'rogue',
  };
  return categoryMap[className] || 'warrior';
}
