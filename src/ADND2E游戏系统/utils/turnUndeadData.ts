/**
 * 斥退亡灵数据
 * Turning Undead Data
 */

/**
 * 斥退结果类型
 */
export type TurnResult = number | 'T' | 'D' | 'D*' | '—';

/**
 * 亡灵类型接口
 */
export interface UndeadType {
  /** ID */
  id: string;
  /** 名称 */
  name: string;
  /** 生命骰 */
  hitDice: string;
  /** 描述 */
  description?: string;
}

/**
 * 斥退亡灵表格行
 */
export interface TurnUndeadTableRow {
  /** 亡灵类型 */
  undeadType: string;
  /** 生命骰 */
  hitDice: string;
  /** 各等级祭司的斥退结果 (1-14+级) */
  results: {
    [level: number]: TurnResult;
  };
}

/**
 * 亡灵类型列表
 */
export const undeadTypes: UndeadType[] = [
  {
    id: 'skeleton',
    name: '骷髅',
    hitDice: '1 HD',
    description: '死者的骨架被邪恶魔法驱动而复活',
  },
  {
    id: 'zombie',
    name: '丧尸',
    hitDice: '2 HD',
    description: '腐烂的尸体被黑暗力量驱使而行动',
  },
  {
    id: 'ghoul',
    name: '食尸鬼',
    hitDice: '2 HD',
    description: '以尸体为食的邪恶亡灵生物，能够麻痹活物',
  },
  {
    id: 'shadow',
    name: '阴影',
    hitDice: '3-4 HD',
    description: '无形的黑暗存在，会吸取生者的力量',
  },
  {
    id: 'wight',
    name: '尸妖',
    hitDice: '5 HD',
    description: '恶毒的亡灵战士，能够吸取生命能量',
  },
  {
    id: 'ghast',
    name: '妖鬼',
    hitDice: '4 HD',
    description: '比食尸鬼更强大的亡灵，散发恶臭',
  },
  {
    id: 'wraith',
    name: '缚灵',
    hitDice: '6 HD',
    description: '怨恨的灵魂，会吸取生命等级',
  },
  {
    id: 'mummy',
    name: '木乃伊',
    hitDice: '7 HD',
    description: '古代被诅咒的尸体，攻击会导致疾病',
  },
  {
    id: 'spectre',
    name: '幽灵',
    hitDice: '8 HD',
    description: '强大的非实体亡灵，能够吸取生命等级',
  },
  {
    id: 'vampire',
    name: '吸血鬼',
    hitDice: '9 HD',
    description: '以血液为生的强大亡灵，拥有众多特殊能力',
  },
  {
    id: 'ghost',
    name: '幽魂',
    hitDice: '10 HD',
    description: '被束缚在世间的灵魂，通常有未竟之事',
  },
  {
    id: 'lich',
    name: '巫妖',
    hitDice: '11+ HD',
    description: '不死的法师，通过黑暗仪式保持意识和力量',
  },
  {
    id: 'special',
    name: '特殊',
    hitDice: '变化',
    description: '特殊的生物包括独特的亡灵、处于负能量界的拥有自由意志的亡灵、以及那些居住在外层界的亡灵',
  },
];

/**
 * 斥退亡灵表格
 * 表格61：斥退亡灵
 */
export const turnUndeadTable: TurnUndeadTableRow[] = [
  {
    undeadType: '骷髅或1HD',
    hitDice: '1',
    results: {
      1: 10,
      2: 7,
      3: 4,
      4: 'T',
      5: 'T',
      6: 'D',
      7: 'D',
      8: 'D*',
      9: 'D*',
      10: 'D*',
      11: 'D*',
      12: 'D*',
      13: 'D*',
      14: 'D*',
    },
  },
  {
    undeadType: '丧尸',
    hitDice: '2',
    results: {
      1: 13,
      2: 10,
      3: 7,
      4: 4,
      5: 'T',
      6: 'T',
      7: 'D',
      8: 'D',
      9: 'D*',
      10: 'D*',
      11: 'D*',
      12: 'D*',
      13: 'D*',
      14: 'D*',
    },
  },
  {
    undeadType: '食尸鬼或2 HD',
    hitDice: '2',
    results: {
      1: 16,
      2: 13,
      3: 10,
      4: 7,
      5: 4,
      6: 'T',
      7: 'T',
      8: 'D',
      9: 'D',
      10: 'D*',
      11: 'D*',
      12: 'D*',
      13: 'D*',
      14: 'D*',
    },
  },
  {
    undeadType: '阴影或3-4 HD',
    hitDice: '3-4',
    results: {
      1: 19,
      2: 16,
      3: 13,
      4: 10,
      5: 7,
      6: 4,
      7: 'T',
      8: 'T',
      9: 'D',
      10: 'D',
      11: 'D*',
      12: 'D*',
      13: 'D*',
      14: 'D*',
    },
  },
  {
    undeadType: '尸妖或5HD',
    hitDice: '5',
    results: {
      1: 20,
      2: 19,
      3: 16,
      4: 13,
      5: 10,
      6: 7,
      7: 4,
      8: 'T',
      9: 'T',
      10: 'D',
      11: 'D',
      12: 'D*',
      13: 'D*',
      14: 'D*',
    },
  },
  {
    undeadType: '妖鬼',
    hitDice: '4',
    results: {
      1: '—',
      2: 20,
      3: 19,
      4: 16,
      5: 13,
      6: 10,
      7: 7,
      8: 4,
      9: 'T',
      10: 'T',
      11: 'D',
      12: 'D',
      13: 'D',
      14: 'D',
    },
  },
  {
    undeadType: '缚灵或6HD',
    hitDice: '6',
    results: {
      1: '—',
      2: '—',
      3: 20,
      4: 19,
      5: 16,
      6: 13,
      7: 10,
      8: 7,
      9: 4,
      10: 'T',
      11: 'T',
      12: 'D',
      13: 'D',
      14: 'D',
    },
  },
  {
    undeadType: '木乃伊或7 HD',
    hitDice: '7',
    results: {
      1: '—',
      2: '—',
      3: '—',
      4: 20,
      5: 19,
      6: 16,
      7: 13,
      8: 10,
      9: 7,
      10: 4,
      11: 'T',
      12: 'T',
      13: 'T',
      14: 'T',
    },
  },
  {
    undeadType: '幽灵或8HD',
    hitDice: '8',
    results: {
      1: '—',
      2: '—',
      3: '—',
      4: '—',
      5: 20,
      6: 19,
      7: 16,
      8: 13,
      9: 10,
      10: 7,
      11: 4,
      12: 'T',
      13: 'T',
      14: 'T',
    },
  },
  {
    undeadType: '吸血鬼或9 HD',
    hitDice: '9',
    results: {
      1: '—',
      2: '—',
      3: '—',
      4: '—',
      5: '—',
      6: 20,
      7: 19,
      8: 16,
      9: 13,
      10: 10,
      11: 7,
      12: 4,
      13: 4,
      14: 4,
    },
  },
  {
    undeadType: '幽魂或10 HD',
    hitDice: '10',
    results: {
      1: '—',
      2: '—',
      3: '—',
      4: '—',
      5: '—',
      6: '—',
      7: 20,
      8: 19,
      9: 16,
      10: 13,
      11: 10,
      12: 7,
      13: 7,
      14: 7,
    },
  },
  {
    undeadType: '巫妖或11+ HD',
    hitDice: '11+',
    results: {
      1: '—',
      2: '—',
      3: '—',
      4: '—',
      5: '—',
      6: '—',
      7: '—',
      8: 20,
      9: 19,
      10: 16,
      11: 13,
      12: 10,
      13: 10,
      14: 10,
    },
  },
  {
    undeadType: '特殊**',
    hitDice: '变化',
    results: {
      1: '—',
      2: '—',
      3: '—',
      4: '—',
      5: '—',
      6: '—',
      7: '—',
      8: '—',
      9: 20,
      10: 19,
      11: 16,
      12: 13,
      13: 13,
      14: 13,
    },
  },
];

/**
 * 获取祭司对特定亡灵的斥退结果
 * @param clericLevel 祭司等级
 * @param undeadType 亡灵类型
 * @returns 斥退结果
 */
export function getTurnResult(clericLevel: number, undeadType: string): TurnResult {
  // 调整等级范围
  let adjustedLevel = clericLevel;
  if (clericLevel >= 14) {
    adjustedLevel = 14;
  } else if (clericLevel >= 12) {
    adjustedLevel = 13;
  } else if (clericLevel >= 10) {
    adjustedLevel = 10;
  }

  const row = turnUndeadTable.find(r => r.undeadType === undeadType);
  if (!row) {
    return '—';
  }

  return row.results[adjustedLevel] || '—';
}

/**
 * 获取圣武士对特定亡灵的斥退结果（圣武士等级-2）
 * @param paladinLevel 圣武士等级
 * @param undeadType 亡灵类型
 * @returns 斥退结果
 */
export function getPaladinTurnResult(paladinLevel: number, undeadType: string): TurnResult {
  const effectiveLevel = Math.max(1, paladinLevel - 2);
  return getTurnResult(effectiveLevel, undeadType);
}

/**
 * 解释斥退结果
 * @param result 斥退结果
 * @returns 结果说明
 */
export function explainTurnResult(result: TurnResult): string {
  if (result === '—') {
    return '无法斥退此类亡灵';
  }
  if (result === 'T') {
    return '自动斥退成功，亡灵会被斥退';
  }
  if (result === 'D') {
    return '自动驱散成功，亡灵会被彻底摧毁';
  }
  if (result === 'D*') {
    return '自动驱散成功，亡灵会被彻底摧毁（可影响额外的2d4个生物）';
  }
  if (typeof result === 'number') {
    return `需要掷1d20，结果大于${result}则斥退成功`;
  }
  return '未知结果';
}

/**
 * 斥退亡灵规则文本
 */
export const turnUndeadRules = {
  title: '斥退亡灵（Turning Undead）',
  introduction:
    '斥退亡灵是只有祭司和圣武士才能使用的重要的战斗能力，它在关键时刻甚至能够拯救生命。这种特殊能力是由角色所信仰的神祇赋予的。德鲁伊无法斥退亡灵，而其他特殊宗教的祭司能否使用它则要视乎于DM的决定。',

  mechanism:
    '神祇通过祭司或者圣武士来显现自己的部分力量，这会使邪恶的亡灵惊惧，或甚至直接将其摧毁。不过，由于这种力量必须以凡躯为媒介来进行引导，因此并非每次都能确保成功。',

  howToUse: {
    title: '如何使用',
    content: [
      '牧师和圣武士在遭遇亡灵生物的时候可以尝试斥退它们（切记，圣武士在斥退亡灵时视作低两级——也就是说，5级的圣武士使用的表格61的3级那一列）',
      '每个角色每次遭遇只能进行一次斥退，但多个角色可以同时进行尝试（斥退结果也分别进行结算）',
      '试图斥退算作一个需要一轮的行动，并且会根据角色的先攻顺序而在该轮中发生（因此被斥退的亡灵有可能在角色斥退它们之前行动）',
      '角色光是站在那里是不够的——重要的是，由角色所进行一点戏剧性的行为。发言和手势都是重要的，因此角色必须空出双手、处于适合发言的位置',
      '不过，斥退和施法是不同的，即使角色在过程中受到攻击也不会被打断',
    ],
  },

  resolution: {
    title: '结算斥退',
    content: [
      '在表格61中根据被斥退的亡灵的生命骰或种类，以及角色的等级来查找结果（圣武士的等级要低2级）',
      '如果结果是数字则掷1d20，当掷骰结果高于列出的数字则斥退成功，亡灵会被斥退',
      '如果结果是T（斥退），则斥退尝试不需要掷骰而自动成功',
      '如果结果是D（驱散），则这次斥退彻底摧毁了亡灵',
      '如果出现一条横杠（—），意思就是祭司或圣武士无法斥退这种亡灵',
      '成功的斥退或驱散会影响2d6个亡灵，如果被影响的亡灵中混有不同的种类，生命骰最低的那些会首先受到影响',
      '在同一轮中，无论角色试图斥退多少亡灵，都只掷一次骰子。根据每个亡灵的类型来分别查找结果',
    ],
  },

  example: {
    title: '示例',
    content:
      '7级的祭司戈鲁斯和他的团队一起受到被一个尸妖和一个幽灵带领的2个骷髅的攻击。他尝试进行斥退，掷出了12。\n\n戈鲁斯的玩家在查表时，对所有的三种亡灵使用同一个掷骰结果（也就是12）。骷髅被摧毁了（和戈鲁斯预料的一样），而尸妖被斥退（需要掷出4或者更高的结果）并逃跑了。幽灵则不屈不挠地继续前进（因为要斥退幽灵需要16或更好的掷骰结果）。',
  },

  effects: {
    title: '斥退效果',
    content: [
      '被其他人的命令束缚的亡灵遭到斥退时只是单纯地撤退，从而让角色和他的同伴得以通过或完成他们的行动',
      '拥有自由意志的亡灵则会试图逃离斥退它们的角色所在的区域，直到离开视线范围',
      '如果它们没法逃跑，它们会在一定距离外徘徊，围着角色绕成一圈，而不会接近到角色的10英尺以内，只要角色继续维持斥退（不需要继续掷骰）',
      '如果角色迫使拥有自由意志的亡灵接近10英尺以内（比如说，把它们逼到角落里），斥退就会被破坏，亡灵就可以正常地攻击',
    ],
  },

  evilPriests: {
    title: '邪恶祭司与亡灵（Evil Priests and Undead）',
    content: [
      '邪恶的祭司通常被看作是亡灵的同党，或至少和它们有着共通的目标与追求。因此，他们没有斥退亡灵的能力。但是与此同时，他们可以尝试命令这些存在',
      '这和斥退尝试的处理方法是一样的。邪恶祭司最多可以命令12个亡灵',
      '"T"的结果表示亡灵自动服从邪恶祭司，而"D"表示这个亡灵完全沦为邪恶祭司的从属。它们会服从他的命令（竭尽它的能力和理解力的极限），直到被其他人斥退、命令或者摧毁为止',
    ],
  },

  turningPaladins: {
    title: '斥退圣武士',
    content: [
      '邪恶祭司也有影响圣武士的能力，能够像斥退亡灵一样斥退他们。不过由于令圣武士的活着的精神屈服、崩溃要远远困难得多，因此圣武士更难以被斥退',
      '试图斥退圣武士的时候，邪恶祭司看作比他实际的等级低3级。因此，7级的邪恶祭司使用4级祭司的那一列斥退圣武士',
      '他只有相当小的机会斥退7级的圣武士（7HD），而且完全不能斥退8级的（使用圣武士的级别当作他们被斥退时的生命骰）',
      '所有对圣武士的"D"结果都被视作"T"',
    ],
  },

  notes: [
    '* 这种斥退可以影响额外的2d4个生物',
    '** 特殊的生物包括独特的亡灵、处于负能量界的拥有自由意志的亡灵、某些高等或次等的神祇、以及那些居住在外层界的亡灵',
    '† 圣武士在斥退亡灵时视作低两级的祭司',
  ],
};
