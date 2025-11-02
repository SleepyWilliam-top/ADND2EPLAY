// 盗贼技能数据类型定义
export interface ThiefSkillData {
  id: string;
  name: string;
  englishName: string;
  description: string;
}

// 盗贼技能基础数据
export const thiefSkillsData: ThiefSkillData[] = [
  {
    id: 'pickPockets',
    name: '盗窃',
    englishName: 'Pick Pockets',
    description:
      '盗贼使用这个技能从别人的口袋、袖子、腰带、背包里悄悄拿走一些小道具，如果道具足够小（比如钥匙），那完全是手到擒来。技能检定失败意味着盗贼得不到偷窃的目标，但这并不意味着他的动作被察觉到了。',
  },
  {
    id: 'openLocks',
    name: '开锁',
    englishName: 'Open Locks',
    description:
      '盗贼可以尝试打开挂锁、精细的组合锁（如果存在的话）和解谜锁（有暗门、隐藏开关和隐秘钥匙孔的锁）。打开一把锁需要专用的工具。使用典型的盗贼工具会提高你开锁的几率；使用简易的工具则会降低你开锁的几率。开锁需要花费1d10轮时间。',
  },
  {
    id: 'findRemoveTraps',
    name: '寻找/解除陷阱',
    englishName: 'Find/Remove Traps',
    description:
      '盗贼被训练于寻找那些不起眼的陷阱和警报装置，包括毒针、弹簧刀片、致命的气体和警报器。但这个技能并不能有效的找到藏在天花板、废墟里的陷阱或大型的机关陷阱。在寻找陷阱时，盗贼必须能够触摸和检查到陷阱物体。寻找陷阱需要1d10轮的时间，解除陷阱也需要1d10轮的时间。',
  },
  {
    id: 'moveSilently',
    name: '潜行',
    englishName: 'Move Silently',
    description:
      '一个盗贼可以尝试在任何时候潜行，只要他宣布他想要这么做。在潜行时，盗贼的移动力减少到正常情况下的1/3。DM投掷百分骰来确定盗贼是否进入潜行状态，虽然无论如何盗贼都总是会认为自己已经在潜行了。潜行成功会提高盗贼躲避其他人或者绕到敌人背后进行背刺的几率。',
  },
  {
    id: 'hideInShadows',
    name: '阴影躲藏',
    englishName: 'Hide in Shadows',
    description:
      '盗贼可以尝试消失于阴影或其他任何遮蔽物——灌木、窗帘、间隙等等之中。只有在无人注视的时侯，他才可以用这个技能来躲藏，只要盗贼保持一动不动（盗贼可以使用微小、缓慢、小心的动作：比如抽出武器、拧开药剂等等），他就可以永远躲藏下去。技能成功与否由DM秘密掷骰来决定，并且不宣布结果，虽然盗贼总是会认为自己已经躲藏起来了。阴影躲藏技能无法在完全的黑暗中使用。',
  },
  {
    id: 'detectNoise',
    name: '辨声',
    englishName: 'Detect Noise',
    description:
      '优秀的盗贼会注重每一个细节，无论细节多么微小，包括大多数人都会忽略的微弱声响。盗贼听到细微声响（背后沉重的大门、向下的长廊等）的能力比普通人要强很多。不过这种倾听并不是被动的：盗贼必须站立不动，专注地倾听一轮，周围的环境必须保持安静，而他必须摘掉头盔或者帽子。门或者其他障碍物后传来的声音会更加微弱。',
  },
  {
    id: 'climbWalls',
    name: '爬墙',
    englishName: 'Climb Walls',
    description:
      '虽然每个人都可以爬上陡峭的岩壁与山坡，但是盗贼的攀爬能力远远优于其他人。他们不仅比普通人有更大高的攀爬成功率，还能在不使用工具、绳索或攀爬工具的情况下爬上许多陡峭的地方，只有盗贼可以徒手在非常光滑的平面上攀爬。当然，盗贼在爬墙时能做的行动是有限的——无法战斗和有效地保护自己。',
  },
  {
    id: 'readLanguages',
    name: '解读文书',
    englishName: 'Read Languages',
    description:
      '出于某些必要，盗贼往往会学到很多零散的知识。其中包括了阅读多种语言的能力，因为他们在解读藏宝图、契约、秘文之类的东西时会专门用到。从第4级开始，盗贼已经接触了足够多的文书，解读文书的能力也随着经验的积累获得了足够的提升后，他们可以有一定几率解读魔法文书。每次解读一份文书（不仅仅是一种文字），都需要投一次骰子来使用解读文书技能。',
  },
];

// 盗贼职业的基础盗贼技能值（1级）
export const thiefBaseSkills: Record<string, number> = {
  pickPockets: 15,
  openLocks: 10,
  findRemoveTraps: 5,
  moveSilently: 10,
  hideInShadows: 5,
  detectNoise: 15,
  climbWalls: 60,
  readLanguages: 0, // 4级才能使用
};

// 敏捷对盗贼技能的影响
export const dexterityThiefAdjustments: Record<
  number,
  {
    pickPockets: number;
    openLocks: number;
    findRemoveTraps: number;
    moveSilently: number;
    hideInShadows: number;
  }
> = {
  9: { pickPockets: -15, openLocks: -10, findRemoveTraps: -10, moveSilently: -20, hideInShadows: -10 },
  10: { pickPockets: -10, openLocks: -5, findRemoveTraps: -10, moveSilently: -15, hideInShadows: -5 },
  11: { pickPockets: -5, openLocks: 0, findRemoveTraps: -5, moveSilently: -10, hideInShadows: 0 },
  12: { pickPockets: 0, openLocks: 0, findRemoveTraps: 0, moveSilently: -5, hideInShadows: 0 },
  13: { pickPockets: 0, openLocks: 0, findRemoveTraps: 0, moveSilently: 0, hideInShadows: 0 },
  14: { pickPockets: 0, openLocks: 0, findRemoveTraps: 0, moveSilently: 0, hideInShadows: 0 },
  15: { pickPockets: 0, openLocks: 0, findRemoveTraps: 0, moveSilently: 0, hideInShadows: 0 },
  16: { pickPockets: 0, openLocks: 5, findRemoveTraps: 0, moveSilently: 0, hideInShadows: 0 },
  17: { pickPockets: 5, openLocks: 10, findRemoveTraps: 0, moveSilently: 5, hideInShadows: 5 },
  18: { pickPockets: 10, openLocks: 15, findRemoveTraps: 5, moveSilently: 10, hideInShadows: 10 },
  19: { pickPockets: 15, openLocks: 20, findRemoveTraps: 10, moveSilently: 15, hideInShadows: 15 },
};

// 获取敏捷调整（对于超出范围的值进行适当处理）
export function getDexterityAdjustments(dex: number) {
  if (dex <= 9) return dexterityThiefAdjustments[9];
  if (dex >= 19) return dexterityThiefAdjustments[19];
  return dexterityThiefAdjustments[dex] || dexterityThiefAdjustments[13];
}

// 从种族能力描述中解析盗贼技能加成
export function parseRaceThiefSkillAdjustments(raceAbilities: Array<{ name: string; description: string }>) {
  const adjustments: Record<string, number> = {
    pickPockets: 0,
    openLocks: 0,
    findRemoveTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    detectNoise: 0,
    climbWalls: 0,
    readLanguages: 0,
  };

  // 查找名为"盗贼技能调整"的能力
  const thiefSkillAbility = raceAbilities.find(a => a.name === '盗贼技能调整');
  if (!thiefSkillAbility) return adjustments;

  const desc = thiefSkillAbility.description;

  // 解析各项技能的调整
  // 格式示例：潜行+10%，阴影躲藏+5%，爬墙+5%
  const skillMap: Record<string, string> = {
    盗窃: 'pickPockets',
    开锁: 'openLocks',
    '寻找/解除陷阱': 'findRemoveTraps',
    潜行: 'moveSilently',
    阴影躲藏: 'hideInShadows',
    辨声: 'detectNoise',
    爬墙: 'climbWalls',
    解读文书: 'readLanguages',
  };

  // 正则匹配：技能名+数字%
  const regex = /(盗窃|开锁|寻找\/解除陷阱|潜行|阴影躲藏|辨声|爬墙|解读文书)([\+\-]\d+)%/g;
  let match;
  while ((match = regex.exec(desc)) !== null) {
    const skillName = match[1];
    const adjustment = parseInt(match[2]);
    const skillId = skillMap[skillName];
    if (skillId) {
      adjustments[skillId] = adjustment;
    }
  }

  return adjustments;
}

// 根据种族ID获取盗贼技能调整
export function getRaceThiefSkillAdjustments(raceId: string, subraceId: string | undefined): Record<string, number> {
  // 这个函数需要导入种族数据，为了避免循环依赖，在组件中直接调用 parseRaceThiefSkillAdjustments
  return {
    pickPockets: 0,
    openLocks: 0,
    findRemoveTraps: 0,
    moveSilently: 0,
    hideInShadows: 0,
    detectNoise: 0,
    climbWalls: 0,
    readLanguages: 0,
  };
}
