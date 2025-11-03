/**
 * 神祇能力数据
 * 包含神祇共有能力和各等级特有能力
 */

export interface DeityAbility {
  name: string;
  nameEn: string;
  description: string;
  usageTime: string; // 使用时机
  details?: string[]; // 详细说明（数组形式）
  limitations?: string[]; // 限制条件
}

// ==================== 神祇共有能力 ====================
export const commonDeityAbilities: DeityAbility[] = [
  {
    name: '神职',
    nameEn: 'Portfolios',
    description: '神祇统治/驱动/控制的特定主题/事物/概念/情感',
    usageTime: '判定神祇影响范围、力量强弱、能否干涉特定事务时',
    details: ['神祇在神职范围内通常最强', '同一神职神力里，只有一个可以抵达比半神更高位的层次，其余均为半神'],
    limitations: ['神职可能因消逝复活、同神系神祇消逝、性格转变、神格升降、神系重大变故而变化'],
  },
  {
    name: '不朽',
    nameEn: 'Immortality',
    description: '无年龄限制，只能通过特殊手段死亡',
    usageTime: '判定神祇是否会因年龄或普通伤害死亡时',
    details: [
      '神祇无年龄，只能通过特殊手段死亡',
      '死亡方式：被更高神格神力在魔法或物理战斗中毁灭、被遗忘以至于完全没有信众',
    ],
    limitations: ['遭受足以毁灭的攻击后崩散并重组（掷1d100决定天数）'],
  },
  {
    name: '传送',
    nameEn: 'Teleportation',
    description: '立即传送到同位面任意位置，随意使用，无偏差',
    usageTime: '神祇需要移动到同位面任意位置时',
    details: ['可立即传送到同位面任意位置', '随意使用，无偏差'],
  },
  {
    name: '先攻',
    nameEn: 'Initiative',
    description: '自动获得最早先攻权，可选择等待观察凡人行动',
    usageTime: '神祇与凡人进行战斗或互动时',
    details: ['自动获得最早先攻权', '可选择等待观察凡人行动'],
  },
  {
    name: '沟通',
    nameEn: 'Communication',
    description: '理解并使用任何语言，可穿越任何屏障直接秘密交流',
    usageTime: '神祇需要与任何生物交流或传递信息时',
    details: [
      '理解并使用任何语言（书写/阅读/特殊沟通方式如气味语言）',
      '穿越虚空/物理屏障/魔法屏障直接秘密地向任何存在说话',
      '超越空间和位面界限（通常不超越时间）',
    ],
  },
  {
    name: '魔法使用',
    nameEn: 'Magic Use',
    description: '可使用任何等级的任何法术，无需任何成分，仅需心念一动',
    usageTime: '神祇需要施展法术或魔法效果时',
    details: [
      '可使用任何等级的任何法术（祭司或法师法术）',
      '无需法术书/祈祷/材料成分/言语成分/姿势成分',
      '可即兴发明新法术或改变法术',
      '仅需心念一动',
    ],
  },
  {
    name: '免疫',
    nameEn: 'Immunities',
    description: '对特定武器和魔法效果免疫',
    usageTime: '判定神祇是否受到武器或魔法伤害时',
    details: [
      '免疫即死魔法（豁免失败自动死亡或无豁免立即死亡）',
      '免疫能量吸取或生命等级吸取',
      '免疫所有符文或徽记的力量',
      '免疫所有非神性存在施展的灵能能力',
      '免疫神格等级比自己低的神祇施展的灵能能力',
    ],
  },
  {
    name: '授予能力',
    nameEn: 'Granted Abilities',
    description: '可授予祭司/圣武士/游侠法术和能力',
    usageTime: '判定祭司/圣武士/游侠能否获得法术和能力时',
    details: [
      '可授予任何能力和任何等级法术给祭司（不超过自身能力）',
      '通过此能力给予祭司/圣武士/游侠魔法能力和法术',
      '仅神力和准神性地位生物（如塔纳厘领主）能授予法术',
    ],
  },
];

// ==================== 高等神力能力 ====================
export const greaterDeityAbilities: DeityAbility[] = [
  {
    name: '改变现形',
    nameEn: 'Shapeshifting',
    description: '可变形为任何对象（有生命或无生命），无尺寸体型限制',
    usageTime: '高等神力需要改变形态或伪装时',
    details: ['可变形为任何对象（有生命或无生命）', '无尺寸体型限制（已知案例可呈现为行星大小）'],
  },
  {
    name: '魔法抗力',
    nameEn: 'Magic Resistance',
    description: '对不同来源的魔法具有高度抗性',
    usageTime: '高等神力受到法术攻击时',
    details: ['对凡人魔法: 100%抗力', '对较低神格神祇魔法: 75%抗力', '对其他高等神力法术: 50%抗力'],
  },
  {
    name: '豁免检定',
    nameEn: 'Saving Throws',
    description: '自动通过所有豁免检定',
    usageTime: '高等神力需要进行豁免检定时',
    details: ['自动通过所有豁免检定', '反映伟大能力/精神力量/肉体力量'],
  },
  {
    name: '位面旅行',
    nameEn: 'Planar Travel',
    description: '随意使用，无误地在各实存位面间旅行',
    usageTime: '高等神力需要跨位面移动时',
    details: ['随意使用，无误地在各实存位面间旅行'],
    limitations: ['不能旅行到主物质位面'],
  },
  {
    name: '感知能力',
    nameEn: 'Sensing Ability',
    description: '知晓广大范围内发生的一切事件',
    usageTime: '判定高等神力是否知晓特定事件或信息时',
    details: [
      '总是知晓自己栖居的整个位面发生之事',
      '总是知晓自己和盟友的崇拜者或圣物所在整个位面发生之事',
      '某人念出其名讳或头衔后一年内，知晓该位面发生之事',
      '可基于广博知识准确预测凡人和其他神祇的精确行动',
    ],
    limitations: ['可被同地位神力有意效果阻碍'],
  },
  {
    name: '创造',
    nameEn: 'Creation',
    description: '可创造任何对象（有生命或无生命），仅受想象力限制',
    usageTime: '高等神力需要凭空创造物体或生物时',
    details: ['可创造任何对象（有生命或无生命）', '仅受想象力限制'],
    limitations: ['耗散性过程，需将自身能量储备转化为物质对象'],
  },
  {
    name: '生命与死亡',
    nameEn: 'Life and Death',
    description: '可以一个念头杀死任何活物或复活任何死者',
    usageTime: '高等神力需要杀死或复活生物时',
    details: ['以一个念头杀死任何活物', '在任何地方赋予任何被杀凡物生命'],
    limitations: ['另一位高等神力可立即扭转此效果'],
  },
  {
    name: '一心多用',
    nameEn: 'Multitasks',
    description: '可一次执行任意数量行动，不会因复杂性受到惩罚',
    usageTime: '高等神力需要同时执行多个行动时',
    details: ['可一次执行任意数量行动', '不会因复杂性受到惩罚'],
    limitations: ['当前物理形态的自然限制仍可能适用'],
  },
  {
    name: '化身',
    nameEn: 'Avatars',
    description: '可同时操纵最多10尊化身',
    usageTime: '高等神力需要在多个地点同时显现时',
    details: ['可同时操纵最多10尊化身', '随意使用，可在位面间移动化身', '化身被毁灭后需1天制造新化身'],
  },
];

// ==================== 中等神力能力 ====================
export const intermediateDeityAbilities: DeityAbility[] = [
  {
    name: '改变现形',
    nameEn: 'Shapeshifting',
    description: '可变形为任何对象（有生命或无生命）',
    usageTime: '中等神力需要改变形态或伪装时',
    details: ['可变形为任何对象（有生命或无生命）'],
    limitations: ['不能变得比该自然或魔法物品存在过的最大体型更大'],
  },
  {
    name: '魔法抗力',
    nameEn: 'Magic Resistance',
    description: '对不同来源的魔法具有高度抗性',
    usageTime: '中等神力受到法术攻击时',
    details: [
      '对凡人魔法: 95%抗力',
      '对较低神格神祇魔法: 70%抗力',
      '对其他中等神力法术: 50%抗力',
      '对高等神力法术: 25%抗力',
    ],
  },
  {
    name: '豁免检定',
    nameEn: 'Saving Throws',
    description: '所有类型豁免检定为2，仅在掷出自然骰1时失败',
    usageTime: '中等神力需要进行豁免检定时',
    details: ['所有类型豁免检定为2', '仅在掷出自然骰1时失败'],
  },
  {
    name: '位面旅行',
    nameEn: 'Planar Travel',
    description: '如同高等神力在位面间旅行，总能无误到达希望到的地方',
    usageTime: '中等神力需要跨位面移动时',
    details: ['如同高等神力在位面间旅行', '总能无误到达希望到的地方'],
    limitations: ['不能进入主物质位面'],
  },
  {
    name: '感知能力',
    nameEn: 'Sensing Ability',
    description: '知晓100英里范围内发生的一切事件',
    usageTime: '判定中等神力是否知晓特定事件或信息时',
    details: [
      '总是知晓当前位置100英里内发生之事',
      '可延展感官了解自己和盟友的崇拜者或圣物100英里内发生之事',
      '某人念出其名讳或头衔后一个月内，可延展感知知晓100英里内发生之事',
    ],
    limitations: ['可被同等或更高地位神力有意识努力阻止'],
  },
  {
    name: '创造',
    nameEn: 'Creation',
    description: '可召唤或创造所持任何物品的复制品',
    usageTime: '中等神力需要创造物体或生物时',
    details: ['可召唤或创造所持任何物品的复制品'],
    limitations: ['不能无中生有，需在同一位面可获得合适材料'],
  },
  {
    name: '生命与死亡',
    nameEn: 'Life and Death',
    description: '可安排致命意外或复活死者',
    usageTime: '中等神力需要杀死或复活生物时',
    details: [
      '可在任何地方安排足以杀死任何凡物的意外事故（随意使用）',
      '可将任何之前有生命的存在从死亡中复活（自动成功，无论死亡时间和躯体状况）',
    ],
    limitations: ['不能直接导致活物死亡，只能安排意外'],
  },
  {
    name: '一心多用',
    nameEn: 'Multitasks',
    description: '可一次执行最多100项行动而不受惩罚',
    usageTime: '中等神力需要同时执行多个行动时',
    details: ['可一次执行最多100项行动而不受惩罚'],
    limitations: ['当前物理形态的自然限制仍可能适用'],
  },
  {
    name: '化身',
    nameEn: 'Avatars',
    description: '可同时操纵最多5尊化身',
    usageTime: '中等神力需要在多个地点同时显现时',
    details: ['可同时操纵最多5尊化身', '随意使用，可在位面间移动化身', '化身被毁灭后需5天制造新化身'],
  },
];

// ==================== 弱等神力能力 ====================
export const lesserDeityAbilities: DeityAbility[] = [
  {
    name: '改变现形',
    nameEn: 'Shapeshifting',
    description: '可变形为期望的对象',
    usageTime: '弱等神力需要改变形态或伪装时',
    details: ['可变形为期望的对象'],
    limitations: ['新形态只是该生物的平均个体（或许额外伴随浅薄的神圣化特殊效果）'],
  },
  {
    name: '魔法抗力',
    nameEn: 'Magic Resistance',
    description: '对不同来源的魔法具有抗性',
    usageTime: '弱等神力受到法术攻击时',
    details: [
      '对凡人魔法: 90%抗力',
      '对较低神格神祇魔法: 60%抗力',
      '对其他弱等神力法术: 45%抗力',
      '对更高地位神力魔法: 20%抗力',
    ],
  },
  {
    name: '豁免检定',
    nameEn: 'Saving Throws',
    description: '所有类型豁免检定为2，仅在掷出自然骰1和2时失败',
    usageTime: '弱等神力需要进行豁免检定时',
    details: ['所有类型豁免检定为2', '仅在掷出自然骰1和2时失败（除非化身豁免检定更好）'],
  },
  {
    name: '位面旅行',
    nameEn: 'Planar Travel',
    description: '随意使用，能在位面间旅行，绝对不会被传送去目标之外的地方',
    usageTime: '弱等神力需要跨位面移动时',
    details: ['随意使用，能在位面间旅行', '无物理或物质屏障可阻碍', '绝对不会被传送去目标之外的地方'],
    limitations: ['被禁止进入主物质位面'],
  },
  {
    name: '感知能力',
    nameEn: 'Sensing Ability',
    description: '知晓10英里范围内发生的一切事件',
    usageTime: '判定弱等神力是否知晓特定事件或信息时',
    details: [
      '知晓自身10英里内发生之事',
      '可延展感知容纳任何崇拜者或圣物10英里内所揭露的知识',
      '某人念出其名讳或头衔后1天内，可延展感知知晓10英里内发生之事',
    ],
    limitations: ['可被同等地位神力有意识努力、或更高地位神力无意识愿望阻止'],
  },
  {
    name: '创造',
    nameEn: 'Creation',
    description: '知晓在哪里可以找到想要的存世之物',
    usageTime: '弱等神力需要获取物体或生物时',
    details: ['知晓在哪里可以找到想要的存世之物', '若物品不存在，能感知到能制造该物品的人'],
    limitations: ['不能凭空创造或复制任何对象', '通常与中等或高等神力结盟，依靠更强大的朋友协助事物创造'],
  },
  {
    name: '一心多用',
    nameEn: 'Multitasks',
    description: '可一次执行最多5项行动而不受惩罚',
    usageTime: '弱等神力需要同时执行多个行动时',
    details: ['可一次执行最多5项行动而不受惩罚'],
    limitations: ['当前物理形态的自然限制仍可能适用'],
  },
  {
    name: '化身',
    nameEn: 'Avatars',
    description: '可同时操纵最多2尊化身',
    usageTime: '弱等神力需要在多个地点同时显现时',
    details: ['可同时操纵最多2尊化身', '随意使用，可在整个位面移动化身', '化身被毁灭后需1个月制造新化身'],
  },
];

// ==================== 半神力能力 ====================
export const demigodAbilities: DeityAbility[] = [
  {
    name: '改变现形',
    nameEn: 'Shapeshifting',
    description: '只能变形为与其天性和神职契合的有生命对象',
    usageTime: '半神力需要改变形态或伪装时',
    details: ['只能变形为与其天性和神职契合的有生命对象'],
    limitations: ['新形态只是该生物的平均个体（或许额外伴随浅薄的神圣化特殊效果）'],
  },
  {
    name: '魔法抗力',
    nameEn: 'Magic Resistance',
    description: '对不同来源的魔法具有基础抗性',
    usageTime: '半神力受到法术攻击时',
    details: ['对凡人魔法: 70%抗力', '对其他半神力魔法: 40%抗力', '对更高地位神力魔法: 20%抗力'],
  },
  {
    name: '豁免检定',
    nameEn: 'Saving Throws',
    description: '所有类型豁免检定为4，仅在掷出自然骰3或更低时失败',
    usageTime: '半神力需要进行豁免检定时',
    details: ['所有类型豁免检定为4', '仅在掷出自然骰3或更低时失败（除非化身豁免检定更好）'],
  },
  {
    name: '位面旅行',
    nameEn: 'Planar Travel',
    description: '只能依赖魔法法术和设备在位面间旅行',
    usageTime: '半神力需要跨位面移动时',
    details: ['只能依赖魔法法术和设备在位面间旅行'],
    limitations: [
      '无法像其他神力那样随意位面旅行',
      '因此缺陷，半神力更倾向于逗留在某个位面（不少半神居住在物质位面）',
      '但可以进入主物质位面（与其他神格不同）',
    ],
  },
  {
    name: '感知能力',
    nameEn: 'Sensing Ability',
    description: '知晓1英里范围内发生的一切事件',
    usageTime: '判定半神力是否知晓特定事件或信息时',
    details: [
      '知晓自身/任何追随者/圣物1英里内发生之事',
      '某人念出其名讳或头衔后1小时内，可延展感知知晓1英里内发生之事',
    ],
    limitations: ['可被同等地位神力有意识努力、或更高地位神力无意识愿望阻止'],
  },
  {
    name: '创造',
    nameEn: 'Creation',
    description: '必须通过感知能力收集信息，寻找或创造想要的物品',
    usageTime: '半神力需要获取物体或生物时',
    details: [
      '必须通过感知能力收集信息，尝试寻觅想要的存世之物',
      '或花费时间和努力用合适原材料创造',
      '或找到能造出它们之人',
    ],
    limitations: ['不能凭空创造或复制任何对象', '通常与中等或高等神力结盟，依靠更强大的朋友协助事物创造'],
  },
  {
    name: '生命与死亡',
    nameEn: 'Life and Death',
    description: '可从死亡中复活任何之前有生命的凡物',
    usageTime: '半神力需要复活生物时',
    details: ['可从死亡中复活任何之前有生命的凡物', '随意使用，不论躯体当前状况'],
    limitations: ['复活的躯体所在位置必须有某尊化身或某件圣物在场'],
  },
  {
    name: '一心多用',
    nameEn: 'Multitasks',
    description: '可一次执行任何2项行动而不受惩罚',
    usageTime: '半神力需要同时执行多个行动时',
    details: ['可一次执行任何2项行动而不受惩罚'],
    limitations: ['极少数情况下当前物理形态会限制此能力'],
  },
  {
    name: '化身',
    nameEn: 'Avatars',
    description: '同一时间只能操纵1尊化身',
    usageTime: '半神力需要显现化身时',
    details: ['同一时间只能操纵1尊化身', '化身被毁灭后需1整年塑造新化身'],
    limitations: ['有些半神力无法操纵化身，或选择不这样做'],
  },
];

/**
 * 根据神格等级获取该等级的特有能力
 */
export function getDeityAbilitiesByRank(rank: 'greater' | 'intermediate' | 'lesser' | 'demigod'): DeityAbility[] {
  switch (rank) {
    case 'greater':
      return greaterDeityAbilities;
    case 'intermediate':
      return intermediateDeityAbilities;
    case 'lesser':
      return lesserDeityAbilities;
    case 'demigod':
      return demigodAbilities;
    default:
      return [];
  }
}

/**
 * 获取神格等级的中文名称
 */
export function getDeityRankName(rank: 'greater' | 'intermediate' | 'lesser' | 'demigod'): string {
  const rankMap = {
    greater: '高等神力',
    intermediate: '中等神力',
    lesser: '弱等神力',
    demigod: '半神力',
  };
  return rankMap[rank] || rank;
}

/**
 * 获取完整的神祇能力列表（共有能力 + 该等级特有能力 + 自定义能力）
 */
export function getFullDeityAbilities(
  rank: 'greater' | 'intermediate' | 'lesser' | 'demigod',
  customAbilities: DeityAbility[] = [],
): DeityAbility[] {
  return [...commonDeityAbilities, ...getDeityAbilitiesByRank(rank), ...customAbilities];
}
