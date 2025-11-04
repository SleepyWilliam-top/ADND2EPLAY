// ADND 2E 属性计算器

export interface AbilityModifiers {
  [key: string]: string | number;
}

// 力量属性计算
export function getStrengthModifiers(str: number | null): AbilityModifiers {
  if (str === null) return {};

  const modifiers: AbilityModifiers = {};

  if (str <= 1) {
    modifiers.hitProb = '-5';
    modifiers.damage = '-4';
    modifiers.weight = 1;
    modifiers.maxPress = 3;
    modifiers.openDoors = 1;
    modifiers.bendBars = '0%';
  } else if (str === 2) {
    modifiers.hitProb = '-3';
    modifiers.damage = '-2';
    modifiers.weight = 1;
    modifiers.maxPress = 5;
    modifiers.openDoors = 1;
    modifiers.bendBars = '0%';
  } else if (str === 3) {
    modifiers.hitProb = '-3';
    modifiers.damage = '-1';
    modifiers.weight = 5;
    modifiers.maxPress = 10;
    modifiers.openDoors = 2;
    modifiers.bendBars = '0%';
  } else if (str >= 4 && str <= 5) {
    modifiers.hitProb = '-2';
    modifiers.damage = '-1';
    modifiers.weight = 10;
    modifiers.maxPress = 25;
    modifiers.openDoors = 3;
    modifiers.bendBars = '0%';
  } else if (str >= 6 && str <= 7) {
    modifiers.hitProb = '-1';
    modifiers.damage = '0';
    modifiers.weight = 20;
    modifiers.maxPress = 55;
    modifiers.openDoors = 4;
    modifiers.bendBars = '0%';
  } else if (str >= 8 && str <= 9) {
    modifiers.hitProb = '0';
    modifiers.damage = '0';
    modifiers.weight = 35;
    modifiers.maxPress = 90;
    modifiers.openDoors = 5;
    modifiers.bendBars = '1%';
  } else if (str >= 10 && str <= 11) {
    modifiers.hitProb = '0';
    modifiers.damage = '0';
    modifiers.weight = 40;
    modifiers.maxPress = 115;
    modifiers.openDoors = 6;
    modifiers.bendBars = '2%';
  } else if (str >= 12 && str <= 13) {
    modifiers.hitProb = '0';
    modifiers.damage = '0';
    modifiers.weight = 45;
    modifiers.maxPress = 140;
    modifiers.openDoors = 7;
    modifiers.bendBars = '4%';
  } else if (str >= 14 && str <= 15) {
    modifiers.hitProb = '0';
    modifiers.damage = '0';
    modifiers.weight = 55;
    modifiers.maxPress = 170;
    modifiers.openDoors = 8;
    modifiers.bendBars = '7%';
  } else if (str === 16) {
    modifiers.hitProb = '0';
    modifiers.damage = '+1';
    modifiers.weight = 70;
    modifiers.maxPress = 195;
    modifiers.openDoors = 9;
    modifiers.bendBars = '10%';
  } else if (str === 17) {
    modifiers.hitProb = '+1';
    modifiers.damage = '+1';
    modifiers.weight = 85;
    modifiers.maxPress = 220;
    modifiers.openDoors = 10;
    modifiers.bendBars = '13%';
  } else if (str === 18) {
    modifiers.hitProb = '+1';
    modifiers.damage = '+2';
    modifiers.weight = 110;
    modifiers.maxPress = 255;
    modifiers.openDoors = 11;
    modifiers.bendBars = '16%';
  } else if (str === 19) {
    modifiers.hitProb = '+3';
    modifiers.damage = '+7';
    modifiers.weight = 485;
    modifiers.maxPress = 640;
    modifiers.openDoors = '16(8)';
    modifiers.bendBars = '50%';
  } else if (str === 20) {
    modifiers.hitProb = '+3';
    modifiers.damage = '+8';
    modifiers.weight = 535;
    modifiers.maxPress = 700;
    modifiers.openDoors = '17(10)';
    modifiers.bendBars = '60%';
  } else if (str === 21) {
    modifiers.hitProb = '+4';
    modifiers.damage = '+9';
    modifiers.weight = 635;
    modifiers.maxPress = 810;
    modifiers.openDoors = '17(12)';
    modifiers.bendBars = '70%';
  } else if (str === 22) {
    modifiers.hitProb = '+4';
    modifiers.damage = '+10';
    modifiers.weight = 785;
    modifiers.maxPress = 970;
    modifiers.openDoors = '18(14)';
    modifiers.bendBars = '80%';
  } else if (str === 23) {
    modifiers.hitProb = '+5';
    modifiers.damage = '+11';
    modifiers.weight = 935;
    modifiers.maxPress = 1130;
    modifiers.openDoors = '18(16)';
    modifiers.bendBars = '90%';
  } else if (str === 24) {
    modifiers.hitProb = '+6';
    modifiers.damage = '+12';
    modifiers.weight = 1235;
    modifiers.maxPress = 1440;
    modifiers.openDoors = '19(17)';
    modifiers.bendBars = '95%';
  } else if (str >= 25) {
    modifiers.hitProb = '+7';
    modifiers.damage = '+14';
    modifiers.weight = 1440;
    modifiers.maxPress = 1750;
    modifiers.openDoors = '19(18)';
    modifiers.bendBars = '99%';
  }

  return modifiers;
}

// 敏捷属性计算
export function getDexterityModifiers(dex: number | null): AbilityModifiers {
  if (dex === null) return {};

  const modifiers: AbilityModifiers = {};

  if (dex <= 1) {
    modifiers.surprise = '-6';
    modifiers.missile = '-6';
    modifiers.defense = '+5';
  } else if (dex === 2) {
    modifiers.surprise = '-4';
    modifiers.missile = '-4';
    modifiers.defense = '+5';
  } else if (dex === 3) {
    modifiers.surprise = '-3';
    modifiers.missile = '-3';
    modifiers.defense = '+4';
  } else if (dex === 4) {
    modifiers.surprise = '-2';
    modifiers.missile = '-2';
    modifiers.defense = '+3';
  } else if (dex === 5) {
    modifiers.surprise = '-1';
    modifiers.missile = '-1';
    modifiers.defense = '+2';
  } else if (dex === 6) {
    modifiers.surprise = '0';
    modifiers.missile = '0';
    modifiers.defense = '+1';
  } else if (dex >= 7 && dex <= 14) {
    modifiers.surprise = '0';
    modifiers.missile = '0';
    modifiers.defense = '0';
  } else if (dex === 15) {
    modifiers.surprise = '0';
    modifiers.missile = '0';
    modifiers.defense = '-1';
  } else if (dex === 16) {
    modifiers.surprise = '+1';
    modifiers.missile = '+1';
    modifiers.defense = '-2';
  } else if (dex === 17) {
    modifiers.surprise = '+2';
    modifiers.missile = '+2';
    modifiers.defense = '-3';
  } else if (dex === 18) {
    modifiers.surprise = '+2';
    modifiers.missile = '+2';
    modifiers.defense = '-4';
  } else if (dex >= 19 && dex <= 20) {
    modifiers.surprise = '+3';
    modifiers.missile = '+3';
    modifiers.defense = '-4';
  } else if (dex >= 21 && dex <= 23) {
    modifiers.surprise = '+4';
    modifiers.missile = '+4';
    modifiers.defense = '-5';
  } else if (dex >= 24) {
    modifiers.surprise = '+5';
    modifiers.missile = '+5';
    modifiers.defense = '-6';
  }

  return modifiers;
}

// 体质属性计算
export function getConstitutionModifiers(con: number | null): AbilityModifiers {
  if (con === null) return {};

  const modifiers: AbilityModifiers = {};

  if (con <= 1) {
    modifiers.hpAdjust = '-3';
    modifiers.systemShock = '25%';
    modifiers.resurrection = '30%';
    modifiers.poison = '-2';
    modifiers.regeneration = '无';
  } else if (con === 2) {
    modifiers.hpAdjust = '-2';
    modifiers.systemShock = '30%';
    modifiers.resurrection = '35%';
    modifiers.poison = '-1';
    modifiers.regeneration = '无';
  } else if (con === 3) {
    modifiers.hpAdjust = '-2';
    modifiers.systemShock = '35%';
    modifiers.resurrection = '40%';
    modifiers.poison = '0';
    modifiers.regeneration = '无';
  } else if (con === 4) {
    modifiers.hpAdjust = '-1';
    modifiers.systemShock = '40%';
    modifiers.resurrection = '45%';
    modifiers.poison = '0';
    modifiers.regeneration = '无';
  } else if (con >= 5 && con <= 6) {
    modifiers.hpAdjust = '-1';
    modifiers.systemShock = con === 5 ? '45%' : '50%';
    modifiers.resurrection = con === 5 ? '50%' : '55%';
    modifiers.poison = '0';
    modifiers.regeneration = '无';
  } else if (con >= 7 && con <= 14) {
    modifiers.hpAdjust = '0';
    modifiers.systemShock = ['55%', '60%', '65%', '70%', '75%', '80%', '85%', '88%'][con - 7];
    modifiers.resurrection = ['60%', '65%', '70%', '75%', '80%', '85%', '90%', '92%'][con - 7];
    modifiers.poison = '0';
    modifiers.regeneration = '无';
  } else if (con === 15) {
    modifiers.hpAdjust = '+1';
    modifiers.systemShock = '90%';
    modifiers.resurrection = '94%';
    modifiers.poison = '0';
    modifiers.regeneration = '无';
  } else if (con === 16) {
    modifiers.hpAdjust = '+2';
    modifiers.systemShock = '95%';
    modifiers.resurrection = '96%';
    modifiers.poison = '0';
    modifiers.regeneration = '无';
  } else if (con === 17) {
    modifiers.hpAdjust = '+2(+3)';
    modifiers.systemShock = '97%';
    modifiers.resurrection = '98%';
    modifiers.poison = '0';
    modifiers.regeneration = '无';
  } else if (con === 18) {
    modifiers.hpAdjust = '+2(+4)';
    modifiers.systemShock = '99%';
    modifiers.resurrection = '100%';
    modifiers.poison = '0';
    modifiers.regeneration = '无';
  } else if (con === 19) {
    modifiers.hpAdjust = '+2(+5)';
    modifiers.systemShock = '99%';
    modifiers.resurrection = '100%';
    modifiers.poison = '+1';
    modifiers.regeneration = '无';
  } else if (con === 20) {
    modifiers.hpAdjust = '+2(+5)';
    modifiers.systemShock = '99%';
    modifiers.resurrection = '100%';
    modifiers.poison = '+1';
    modifiers.regeneration = '1/6轮';
  } else if (con === 21) {
    modifiers.hpAdjust = '+2(+6)';
    modifiers.systemShock = '99%';
    modifiers.resurrection = '100%';
    modifiers.poison = '+2';
    modifiers.regeneration = '1/5轮';
  } else if (con === 22) {
    modifiers.hpAdjust = '+2(+6)';
    modifiers.systemShock = '99%';
    modifiers.resurrection = '100%';
    modifiers.poison = '+2';
    modifiers.regeneration = '1/4轮';
  } else if (con === 23) {
    modifiers.hpAdjust = '+2(+6)';
    modifiers.systemShock = '99%';
    modifiers.resurrection = '100%';
    modifiers.poison = '+3';
    modifiers.regeneration = '1/3轮';
  } else if (con === 24) {
    modifiers.hpAdjust = '+2(+7)';
    modifiers.systemShock = '99%';
    modifiers.resurrection = '100%';
    modifiers.poison = '+3';
    modifiers.regeneration = '1/2轮';
  } else if (con >= 25) {
    modifiers.hpAdjust = '+2(+7)';
    modifiers.systemShock = '100%';
    modifiers.resurrection = '100%';
    modifiers.poison = '+4';
    modifiers.regeneration = '1/1轮';
  }

  // 为了向后兼容，添加别名
  if (modifiers.hpAdjust) {
    modifiers.hpAdj = modifiers.hpAdjust;
  }
  if (modifiers.poison) {
    modifiers.poisonSave = modifiers.poison;
  }

  return modifiers;
}

// 智力属性计算
export function getIntelligenceModifiers(int: number | null): AbilityModifiers {
  if (int === null) return {};

  const modifiers: AbilityModifiers = {};

  if (int <= 1) {
    modifiers.languages = '0*';
    modifiers.spellLevel = '--';
    modifiers.learnSpell = '--';
    modifiers.maxSpells = '--';
  } else if (int >= 2 && int <= 8) {
    modifiers.languages = '1';
    modifiers.spellLevel = '--';
    modifiers.learnSpell = '--';
    modifiers.maxSpells = '--';
  } else if (int === 9) {
    modifiers.languages = '2';
    modifiers.spellLevel = '4';
    modifiers.learnSpell = '35%';
    modifiers.maxSpells = '6';
  } else if (int === 10) {
    modifiers.languages = '2';
    modifiers.spellLevel = '5';
    modifiers.learnSpell = '40%';
    modifiers.maxSpells = '7';
  } else if (int === 11) {
    modifiers.languages = '2';
    modifiers.spellLevel = '5';
    modifiers.learnSpell = '45%';
    modifiers.maxSpells = '7';
  } else if (int === 12) {
    modifiers.languages = '3';
    modifiers.spellLevel = '6';
    modifiers.learnSpell = '50%';
    modifiers.maxSpells = '7';
  } else if (int === 13) {
    modifiers.languages = '3';
    modifiers.spellLevel = '6';
    modifiers.learnSpell = '55%';
    modifiers.maxSpells = '9';
  } else if (int === 14) {
    modifiers.languages = '4';
    modifiers.spellLevel = '7';
    modifiers.learnSpell = '60%';
    modifiers.maxSpells = '9';
  } else if (int === 15) {
    modifiers.languages = '4';
    modifiers.spellLevel = '7';
    modifiers.learnSpell = '65%';
    modifiers.maxSpells = '11';
  } else if (int === 16) {
    modifiers.languages = '5';
    modifiers.spellLevel = '8';
    modifiers.learnSpell = '70%';
    modifiers.maxSpells = '11';
  } else if (int === 17) {
    modifiers.languages = '6';
    modifiers.spellLevel = '8';
    modifiers.learnSpell = '75%';
    modifiers.maxSpells = '14';
  } else if (int === 18) {
    modifiers.languages = '7';
    modifiers.spellLevel = '9';
    modifiers.learnSpell = '85%';
    modifiers.maxSpells = '18';
    modifiers.immunity = '--';
  } else if (int === 19) {
    modifiers.languages = '8';
    modifiers.spellLevel = '9';
    modifiers.learnSpell = '95%';
    modifiers.maxSpells = '任意';
    modifiers.immunity = '1级幻术';
  } else if (int === 20) {
    modifiers.languages = '9';
    modifiers.spellLevel = '9';
    modifiers.learnSpell = '96%';
    modifiers.maxSpells = '任意';
    modifiers.immunity = '1-2级幻术';
  } else if (int === 21) {
    modifiers.languages = '10';
    modifiers.spellLevel = '9';
    modifiers.learnSpell = '97%';
    modifiers.maxSpells = '任意';
    modifiers.immunity = '1-3级幻术';
  } else if (int === 22) {
    modifiers.languages = '11';
    modifiers.spellLevel = '9';
    modifiers.learnSpell = '98%';
    modifiers.maxSpells = '任意';
    modifiers.immunity = '1-4级幻术';
  } else if (int === 23) {
    modifiers.languages = '12';
    modifiers.spellLevel = '9';
    modifiers.learnSpell = '99%';
    modifiers.maxSpells = '任意';
    modifiers.immunity = '1-5级幻术';
  } else if (int === 24) {
    modifiers.languages = '15';
    modifiers.spellLevel = '9';
    modifiers.learnSpell = '100%';
    modifiers.maxSpells = '任意';
    modifiers.immunity = '1-6级幻术';
  } else if (int >= 25) {
    modifiers.languages = '20';
    modifiers.spellLevel = '9';
    modifiers.learnSpell = '100%';
    modifiers.maxSpells = '任意';
    modifiers.immunity = '1-7级幻术';
  }

  return modifiers;
}

// 灵知属性计算
export function getWisdomModifiers(wis: number | null): AbilityModifiers {
  if (wis === null) return {};

  const modifiers: AbilityModifiers = {};

  if (wis <= 1) {
    modifiers.magicDefense = '-6';
    modifiers.bonusSpells = '--';
    modifiers.spellFailure = '80%';
  } else if (wis === 2) {
    modifiers.magicDefense = '-4';
    modifiers.bonusSpells = '--';
    modifiers.spellFailure = '60%';
  } else if (wis === 3) {
    modifiers.magicDefense = '-3';
    modifiers.bonusSpells = '--';
    modifiers.spellFailure = '50%';
  } else if (wis === 4) {
    modifiers.magicDefense = '-2';
    modifiers.bonusSpells = '--';
    modifiers.spellFailure = '45%';
  } else if (wis >= 5 && wis <= 7) {
    modifiers.magicDefense = '-1';
    modifiers.bonusSpells = '--';
    modifiers.spellFailure = ['40%', '35%', '30%'][wis - 5];
  } else if (wis === 8) {
    modifiers.magicDefense = '0';
    modifiers.bonusSpells = '--';
    modifiers.spellFailure = '25%';
  } else if (wis >= 9 && wis <= 12) {
    modifiers.magicDefense = '0';
    modifiers.bonusSpells = '0';
    modifiers.spellFailure = ['20%', '15%', '10%', '5%'][wis - 9];
  } else if (wis >= 13 && wis <= 14) {
    modifiers.magicDefense = '0';
    modifiers.bonusSpells = '1级';
    modifiers.spellFailure = '0%';
  } else if (wis === 15) {
    modifiers.magicDefense = '+1';
    modifiers.bonusSpells = '2级';
    modifiers.spellFailure = '0%';
  } else if (wis === 16) {
    modifiers.magicDefense = '+2';
    modifiers.bonusSpells = '2级';
    modifiers.spellFailure = '0%';
  } else if (wis === 17) {
    modifiers.magicDefense = '+3';
    modifiers.bonusSpells = '3级';
    modifiers.spellFailure = '0%';
  } else if (wis === 18) {
    modifiers.magicDefense = '+4';
    modifiers.bonusSpells = '4级';
    modifiers.spellFailure = '0%';
    modifiers.immunity = '--';
  } else if (wis === 19) {
    modifiers.magicDefense = '+4';
    modifiers.bonusSpells = '1级，3级';
    modifiers.spellFailure = '0%';
    modifiers.immunity = '惊恐术、魅惑人类、命令术、友伴术、催眠术';
  } else if (wis === 20) {
    modifiers.magicDefense = '+4';
    modifiers.bonusSpells = '2级，4级';
    modifiers.spellFailure = '0%';
    modifiers.immunity = '惊恐术、魅惑人类、命令术、友伴术、催眠术、遗忘咒、人类定身术、衰弱射线、恐吓术';
  } else if (wis === 21) {
    modifiers.magicDefense = '+4';
    modifiers.bonusSpells = '3级，5级';
    modifiers.spellFailure = '0%';
    modifiers.immunity = '惊恐术、魅惑人类、命令术、友伴术、催眠术、遗忘咒、人类定身术、衰弱射线、恐吓术、恐惧术';
  } else if (wis === 22) {
    modifiers.magicDefense = '+4';
    modifiers.bonusSpells = '4级，5级';
    modifiers.spellFailure = '0%';
    modifiers.immunity = '惊恐术、魅惑人类、命令术、友伴术、催眠术、遗忘咒、人类定身术、衰弱射线、恐吓术、恐惧术、魅惑怪物、困惑术、控制情感、笨拙术、暗示术';
  } else if (wis === 23) {
    modifiers.magicDefense = '+4';
    modifiers.bonusSpells = '1级，6级';
    modifiers.spellFailure = '0%';
    modifiers.immunity = '惊恐术、魅惑人类、命令术、友伴术、催眠术、遗忘咒、人类定身术、衰弱射线、恐吓术、恐惧术、魅惑怪物、困惑术、控制情感、笨拙术、暗示术、混乱术、弱智术、怪物定身术、魔魂壶、使命术';
  } else if (wis === 24) {
    modifiers.magicDefense = '+4';
    modifiers.bonusSpells = '5级，6级';
    modifiers.spellFailure = '0%';
    modifiers.immunity = '惊恐术、魅惑人类、命令术、友伴术、催眠术、遗忘咒、人类定身术、衰弱射线、恐吓术、恐惧术、魅惑怪物、困惑术、控制情感、笨拙术、暗示术、混乱术、弱智术、怪物定身术、魔魂壶、使命术、指使术、群体暗示术、统治权杖';
  } else if (wis >= 25) {
    modifiers.magicDefense = '+4';
    modifiers.bonusSpells = '6级，7级';
    modifiers.spellFailure = '0%';
    modifiers.immunity = '惊恐术、魅惑人类、命令术、友伴术、催眠术、遗忘咒、人类定身术、衰弱射线、恐吓术、恐惧术、魅惑怪物、困惑术、控制情感、笨拙术、暗示术、混乱术、弱智术、怪物定身术、魔魂壶、使命术、指使术、群体暗示术、统治权杖、厌恶/吸引术、死亡法咒、群体魅惑';
  }

  return modifiers;
}

// 魅力属性计算
export function getCharismaModifiers(cha: number | null): AbilityModifiers {
  if (cha === null) return {};

  const modifiers: AbilityModifiers = {};

  if (cha <= 1) {
    modifiers.maxHenchmen = '0';
    modifiers.loyalty = '-8';
    modifiers.reaction = '-7';
  } else if (cha === 2) {
    modifiers.maxHenchmen = '1';
    modifiers.loyalty = '-7';
    modifiers.reaction = '-6';
  } else if (cha === 3) {
    modifiers.maxHenchmen = '1';
    modifiers.loyalty = '-6';
    modifiers.reaction = '-5';
  } else if (cha === 4) {
    modifiers.maxHenchmen = '1';
    modifiers.loyalty = '-5';
    modifiers.reaction = '-4';
  } else if (cha === 5) {
    modifiers.maxHenchmen = '2';
    modifiers.loyalty = '-4';
    modifiers.reaction = '-3';
  } else if (cha === 6) {
    modifiers.maxHenchmen = '2';
    modifiers.loyalty = '-3';
    modifiers.reaction = '-2';
  } else if (cha === 7) {
    modifiers.maxHenchmen = '3';
    modifiers.loyalty = '-2';
    modifiers.reaction = '-1';
  } else if (cha === 8) {
    modifiers.maxHenchmen = '3';
    modifiers.loyalty = '-1';
    modifiers.reaction = '0';
  } else if (cha >= 9 && cha <= 11) {
    modifiers.maxHenchmen = '4';
    modifiers.loyalty = '0';
    modifiers.reaction = '0';
  } else if (cha === 12) {
    modifiers.maxHenchmen = '5';
    modifiers.loyalty = '0';
    modifiers.reaction = '0';
  } else if (cha === 13) {
    modifiers.maxHenchmen = '5';
    modifiers.loyalty = '0';
    modifiers.reaction = '+1';
  } else if (cha === 14) {
    modifiers.maxHenchmen = '6';
    modifiers.loyalty = '+1';
    modifiers.reaction = '+2';
  } else if (cha === 15) {
    modifiers.maxHenchmen = '7';
    modifiers.loyalty = '+3';
    modifiers.reaction = '+3';
  } else if (cha === 16) {
    modifiers.maxHenchmen = '8';
    modifiers.loyalty = '+4';
    modifiers.reaction = '+5';
  } else if (cha === 17) {
    modifiers.maxHenchmen = '10';
    modifiers.loyalty = '+6';
    modifiers.reaction = '+6';
  } else if (cha === 18) {
    modifiers.maxHenchmen = '15';
    modifiers.loyalty = '+8';
    modifiers.reaction = '+7';
  } else if (cha === 19) {
    modifiers.maxHenchmen = '20';
    modifiers.loyalty = '+10';
    modifiers.reaction = '+8';
  } else if (cha === 20) {
    modifiers.maxHenchmen = '25';
    modifiers.loyalty = '+12';
    modifiers.reaction = '+9';
  } else if (cha === 21) {
    modifiers.maxHenchmen = '30';
    modifiers.loyalty = '+14';
    modifiers.reaction = '+10';
  } else if (cha === 22) {
    modifiers.maxHenchmen = '35';
    modifiers.loyalty = '+16';
    modifiers.reaction = '+11';
  } else if (cha === 23) {
    modifiers.maxHenchmen = '40';
    modifiers.loyalty = '+18';
    modifiers.reaction = '+12';
  } else if (cha === 24) {
    modifiers.maxHenchmen = '45';
    modifiers.loyalty = '+20';
    modifiers.reaction = '+13';
  } else if (cha >= 25) {
    modifiers.maxHenchmen = '50';
    modifiers.loyalty = '+20';
    modifiers.reaction = '+14';
  }

  return modifiers;
}

// 掷骰函数
export function roll3d6(): number {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 6) + 1).reduce((sum, val) => sum + val, 0);
}

export function roll4d6k3(): number {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => b - a);
  return rolls.slice(0, 3).reduce((sum, val) => sum + val, 0);
}
