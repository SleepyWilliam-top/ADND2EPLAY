<template>
  <div class="step4-combat-stats">
    <!-- 顶部：角色信息摘要 -->
    <div class="stats-header">
      <h3>战斗数据 > {{ characterSummary }}</h3>
      <div class="level-info">1级角色</div>
    </div>

    <!-- 主内容区 -->
    <div class="stats-content">
      <!-- 生命值掷骰（跨列）-->
      <div class="hitpoints-section">
        <h4 class="section-title">
          <span class="icon"><i class="fa-solid fa-heart"></i></span>
          <span>生命值 (Hit Points)</span>
        </h4>
        <div class="hitpoints-card">
          <div v-if="!hitPoints" class="roll-prompt">
            <p class="prompt-text">点击下方按钮掷骰生命值。生命值决定角色能承受多少伤害。</p>
            <button class="roll-button" @click="rollHitPoints">
              <span class="dice-icon"><i class="fa-solid fa-dice-d20"></i></span>
              <span>掷骰生命值 ({{ hitDiceType }})</span>
            </button>
          </div>
          <div v-else class="hitpoints-result">
            <div class="hp-display">
              <div class="hp-total">
                <span class="label">最大生命值：</span>
                <span class="value">{{ hitPoints.max }}</span>
              </div>
              <button class="reroll-button" title="重新掷骰" @click="rollHitPoints">
                <span class="dice-icon"><i class="fa-solid fa-dice-d20"></i></span>
                <span>重新掷骰</span>
              </button>
            </div>
            <div class="hp-breakdown">
              <div class="breakdown-item">
                <span class="label">掷骰结果 ({{ hitDiceType }})：</span>
                <span class="value">{{ hitPoints.rolled }}</span>
              </div>
              <div v-if="hitPoints.constitutionBonus !== 0" class="breakdown-item">
                <span class="label">体质加成：</span>
                <span
                  class="value"
                  :class="{ positive: hitPoints.constitutionBonus > 0, negative: hitPoints.constitutionBonus < 0 }"
                >
                  {{ hitPoints.constitutionBonus > 0 ? '+' : '' }}{{ hitPoints.constitutionBonus }}
                </span>
              </div>
              <div v-if="hitPoints.racialBonus > 0" class="breakdown-item">
                <span class="label">种族加成：</span>
                <span class="value positive">+{{ hitPoints.racialBonus }}</span>
              </div>
            </div>
            <div class="constitution-note">
              <p>
                <strong>体质说明：</strong>当前体质{{ adjustedConstitution }}，每生命骰
                {{ getConstitutionBonusText() }}。
                <span v-if="!isWarrior && adjustedConstitution >= 17"> （非勇士职业最多每骰+2） </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 左侧：移动力 -->
      <div class="movement-section">
        <h4 class="section-title">
          <span class="icon">🏃</span>
          <span>移动力 (MV)</span>
        </h4>
        <div class="movement-card">
          <div class="movement-item primary">
            <span class="label">地面移动：</span>
            <span class="value">{{ movementData.ground }}</span>
            <span class="hint">（每轮 {{ movementData.ground * 10 }} 码）</span>
          </div>
          <div v-if="movementData.fly" class="movement-item special">
            <span class="label">飞行速度：</span>
            <span class="value">{{ movementData.fly.speed }}</span>
            <span class="hint">（机动性 {{ movementData.fly.maneuverability }}）</span>
          </div>
          <div v-if="movementData.swim" class="movement-item special">
            <span class="label">游泳速度：</span>
            <span class="value">{{ movementData.swim }}</span>
          </div>
          <div v-if="movementData.special" class="movement-note">
            <span class="note-icon">ℹ️</span>
            <span>{{ movementData.special }}</span>
          </div>
          <div class="movement-explanation">
            <p>
              <strong>说明：</strong
              >正常情况下，角色每轮可以行走相当于其移动力10码的距离。在地下城环境时，每轮可以行走相当于其移动力10英尺的距离（谨慎移动）。
            </p>
            <p>在战斗轮中，角色最多可以移动10倍于其移动力的英尺数。</p>
          </div>
        </div>
      </div>

      <!-- 右侧：THAC0和豁免值 -->
      <div class="combat-section">
        <!-- THAC0 -->
        <div class="thac0-section">
          <h4 class="section-title">
            <span class="icon"><i class="fa-solid fa-khanda"></i></span>
            <span>零级命中值 (THAC0)</span>
          </h4>
          <div class="thac0-card">
            <div class="thac0-value">{{ thac0 }}</div>
            <div class="thac0-description">
              <p>
                <strong>什么是THAC0？</strong>THAC0表示"To Hit Armor Class 0"（零级命中值），即击中AC
                0目标所需的攻击检定值。
              </p>
              <p><strong>如何使用：</strong>攻击检定时，投1d20，如果结果 ≥ (THAC0 - 目标AC)，则命中。</p>
              <p class="category-note">
                <strong>职业类别：</strong>{{ classCategoryName }}
                <span class="growth-rate">(成长率: {{ getGrowthRate() }})</span>
              </p>
            </div>
          </div>
        </div>

        <!-- 豁免检定 -->
        <div class="saving-throws-section">
          <h4 class="section-title">
            <span class="icon"><i class="fa-solid fa-shield"></i></span>
            <span>豁免检定值</span>
          </h4>
          <div class="saving-throws-card">
            <table class="saves-table">
              <thead>
                <tr>
                  <th>豁免类型</th>
                  <th>目标值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(value, key) in savingThrows" :key="key">
                  <td class="save-name">
                    {{ getSavingThrowName(key as keyof typeof savingThrows) }}
                  </td>
                  <td class="save-value">{{ value }}</td>
                </tr>
              </tbody>
            </table>
            <div class="saves-explanation">
              <p>
                <strong>说明：</strong>进行豁免检定时，投1d20，如果结果 ≥
                表中的目标值，则豁免成功。豁免检定用于抵抗各种魔法和特殊攻击的效果。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button class="adnd-button secondary" @click="goToPreviousStep">
        <span class="button-icon">←</span>
        <span>返回</span>
      </button>
      <button class="adnd-button primary" :disabled="!canProceed" :title="canProceedTooltip" @click="goToNextStep">
        <span>下一步：武器熟练</span>
        <span class="button-icon">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCharacterStore } from '../stores/characterStore';
import { getClassById } from '../utils/classData';
import { getClassCategory, getSavingThrows, getTHAC0, SAVING_THROW_NAMES } from '../utils/combatData';
import type { MovementData } from '../utils/raceData';
import { getRaceById, getSubraceById } from '../utils/raceData';

const characterStore = useCharacterStore();

// 获取调整后的体质值
const adjustedConstitution = computed(() => {
  return characterStore.adjustedAbilities.con || 10;
});

// 判断是否为勇士职业
const isWarrior = computed(() => {
  return classCategory.value === 'warrior';
});

// 获取生命骰类型
const hitDiceType = computed(() => {
  const classData = getClassById(characterStore.characterData.class || '');
  if (!classData) return 'd10';
  // 从 experienceLevels 中获取1级的 hitDice
  const level1 = classData.experienceLevels.find(l => l.level === 1);
  return level1?.hitDice || 'd10';
});

// 获取当前生命值数据
const hitPoints = computed(() => {
  return characterStore.characterData.hitPoints;
});

// 获取种族生命值加成
function getRacialHPBonus(): number {
  const raceId = characterStore.characterData.race;
  if (!raceId) return 0;

  const race = getRaceById(raceId);
  if (!race) return 0;

  // 查找"奖励生命值"能力
  const hpAbility = race.abilities.find(a => a.name === '奖励生命值');
  if (!hpAbility) return 0;

  // 解析描述中的数字（例如 "1级时额外获得+3生命值"）
  const match = hpAbility.description.match(/\+(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return 0;
}

// 获取体质加成
function getConstitutionBonus(constitution: number, isWarrior: boolean): number {
  // 体质加成表（表格3）
  const bonusTable: Record<number, number> = {
    1: -3,
    2: -2,
    3: -2,
    4: -1,
    5: -1,
    6: -1,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 1,
    16: 2,
    17: isWarrior ? 3 : 2, // 非勇士最多+2
    18: isWarrior ? 4 : 2,
    19: isWarrior ? 5 : 2,
    20: isWarrior ? 5 : 2,
    21: isWarrior ? 6 : 2,
    22: isWarrior ? 6 : 2,
    23: isWarrior ? 6 : 2,
    24: isWarrior ? 7 : 2,
    25: isWarrior ? 7 : 2,
  };

  return bonusTable[constitution] || 0;
}

// 掷骰生命值
function rollHitPoints() {
  // 从 "1d10" 或 "d10" 格式中提取骰子类型
  const match = hitDiceType.value.match(/d(\d+)/);
  if (!match) {
    console.error('无法解析生命骰类型:', hitDiceType.value);
    return;
  }

  const diceType = parseInt(match[1], 10); // 提取骰子面数
  const rolled = Math.floor(Math.random() * diceType) + 1; // 1到diceType的随机数

  const constitutionBonus = getConstitutionBonus(adjustedConstitution.value, isWarrior.value);
  const racialBonus = getRacialHPBonus();

  // 计算最终生命值（最少为1）
  const max = Math.max(1, rolled + constitutionBonus + racialBonus);

  // 使用 updateCharacterData 更新数据
  characterStore.updateCharacterData(data => {
    data.hitPoints = {
      rolled,
      constitutionBonus,
      racialBonus,
      current: max,
      max,
    };
  });
}

// 获取体质加成说明文本
function getConstitutionBonusText(): string {
  const bonus = getConstitutionBonus(adjustedConstitution.value, isWarrior.value);
  if (bonus > 0) return `+${bonus}`;
  if (bonus < 0) return `${bonus}`;
  return '无调整';
}

// 计算角色摘要
const characterSummary = computed(() => {
  const raceName = getRaceById(characterStore.characterData.race || '')?.name || '未知';
  const className = getClassById(characterStore.characterData.class || '')?.name || '未知';
  return `${raceName} ${className}`;
});

// 获取移动力数据
const movementData = computed((): MovementData => {
  const raceId = characterStore.characterData.race;
  const subraceId = characterStore.characterData.subrace;

  if (!raceId) {
    return { ground: 12 }; // 默认值
  }

  const race = getRaceById(raceId);
  if (!race) {
    return { ground: 12 };
  }

  // 如果有亚种，优先使用亚种的移动力
  if (subraceId) {
    const subrace = getSubraceById(raceId, subraceId);
    if (subrace?.movement) {
      return subrace.movement;
    }
  }

  // 使用种族的移动力，如果没有定义则使用默认值
  return race.movement || { ground: 12 };
});

// 获取职业类别
const classCategory = computed(() => {
  const classData = getClassById(characterStore.characterData.class || '');
  if (!classData) return 'warrior';
  return getClassCategory(classData.name);
});

const classCategoryName = computed(() => {
  const categoryNames: Record<string, string> = {
    warrior: '勇士',
    wizard: '法师',
    priest: '祭司',
    rogue: '游荡者',
  };
  return categoryNames[classCategory.value] || '勇士';
});

// 获取THAC0
const thac0 = computed(() => {
  return getTHAC0(classCategory.value, 1);
});

// 获取豁免值
const savingThrows = computed(() => {
  return getSavingThrows(classCategory.value, 1);
});

// 获取豁免检定名称
function getSavingThrowName(key: keyof typeof savingThrows.value): string {
  return SAVING_THROW_NAMES[key] || key;
}

// 获取成长率说明
function getGrowthRate(): string {
  const rates: Record<string, string> = {
    warrior: '每级-1',
    wizard: '每3级-1',
    priest: '每3级-2',
    rogue: '每2级-1',
  };
  return rates[classCategory.value] || '每级-1';
}

// 返回上一步
// 验证是否可以继续
const canProceed = computed(() => {
  // 必须已经掷过生命值
  return !!characterStore.characterData.hitPoints;
});

const canProceedTooltip = computed(() => {
  if (!canProceed.value) {
    return '请先掷骰生命值';
  }
  return '';
});

function goToPreviousStep() {
  characterStore.updateCharacterData(data => {
    data.step = 3;
  });
}

// 前进到下一步：武器熟练
function goToNextStep() {
  if (!canProceed.value) {
    toastr.warning('请先掷骰生命值');
    return;
  }
  characterStore.updateCharacterData(data => {
    data.step = 5;
  });
}
</script>

<style lang="scss" scoped>
.step4-combat-stats {
  width: 100%;
  font-family: '临海体', serif;
}

// 顶部区域
.stats-header {
  padding: 20px 30px;
  border-bottom: 2px solid #000;
  background-color: #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    font-size: 20px;
    font-weight: bold;
  }

  .level-info {
    font-size: 16px;
    color: #666;
    padding: 5px 15px;
    border: 2px solid #666;
    background-color: #fff;
  }
}

// 主内容区
.stats-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  padding: 30px;
  background-color: #fff;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }

  // 生命值区块跨列
  .hitpoints-section {
    grid-column: 1 / -1;

    .hitpoints-card {
      border: 2px solid #000;
      padding: 30px;
      background-color: #f9f9f9;

      .roll-prompt {
        text-align: center;

        .prompt-text {
          font-size: 16px;
          margin-bottom: 20px;
          color: #333;
          line-height: 1.6;
        }

        .roll-button {
          padding: 15px 40px;
          font-size: 18px;
          font-weight: bold;
          background-color: #d9534f;
          color: #fff;
          border: 3px solid #c9302c;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 10px;

          &:hover {
            background-color: #c9302c;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }

          &:active {
            transform: translateY(0);
            box-shadow: none;
          }

          .dice-icon {
            font-size: 24px;
          }
        }
      }

      .hitpoints-result {
        .hp-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background-color: #fff;
          border: 3px solid #5cb85c;
          margin-bottom: 20px;

          .hp-total {
            display: flex;
            align-items: baseline;
            gap: 15px;

            .label {
              font-size: 20px;
              font-weight: bold;
            }

            .value {
              font-size: 36px;
              color: #d9534f;
              font-weight: bold;
            }
          }

          .reroll-button {
            padding: 10px 20px;
            font-size: 14px;
            font-weight: bold;
            background-color: #f0ad4e;
            color: #fff;
            border: 2px solid #eea236;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 8px;

            &:hover {
              background-color: #ec971f;
              transform: translateY(-1px);
            }

            .dice-icon {
              font-size: 16px;
            }
          }
        }

        .hp-breakdown {
          padding: 15px;
          background-color: #fff;
          border-left: 4px solid #5bc0de;
          margin-bottom: 15px;

          .breakdown-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;

            &:last-child {
              border-bottom: none;
            }

            .label {
              font-size: 16px;
              color: #666;
            }

            .value {
              font-size: 18px;
              font-weight: bold;

              &.positive {
                color: #5cb85c;
              }

              &.negative {
                color: #d9534f;
              }
            }
          }
        }

        .constitution-note {
          padding: 15px;
          background-color: #d9edf7;
          border-left: 4px solid #31b0d5;

          p {
            margin: 0;
            line-height: 1.6;
            font-size: 14px;

            strong {
              color: #31708f;
            }
          }
        }
      }
    }
  }
}

// 区块标题
.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #000;
  display: flex;
  align-items: center;
  gap: 10px;

  .icon {
    font-size: 24px;
  }
}

// 移动力区块
.movement-section {
  .movement-card {
    border: 2px solid #000;
    padding: 20px;
    background-color: #f9f9f9;

    .movement-item {
      display: flex;
      align-items: baseline;
      gap: 10px;
      padding: 12px;
      margin-bottom: 10px;
      background-color: #fff;
      border-left: 4px solid #5cb85c;

      &.primary {
        border-left-color: #5cb85c;
        font-size: 18px;
        font-weight: bold;
      }

      &.special {
        border-left-color: #5bc0de;
      }

      .label {
        font-weight: bold;
      }

      .value {
        font-size: 20px;
        color: #d9534f;
        font-weight: bold;
      }

      .hint {
        font-size: 14px;
        color: #666;
        font-style: italic;
      }
    }

    .movement-note {
      padding: 10px;
      background-color: #fffacd;
      border: 1px solid #f0ad4e;
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 10px;

      .note-icon {
        font-size: 18px;
      }
    }

    .movement-explanation {
      margin-top: 20px;
      padding: 15px;
      background-color: #e8f5e9;
      border-left: 4px solid #4caf50;

      p {
        margin: 8px 0;
        line-height: 1.6;
        font-size: 14px;

        strong {
          color: #2e7d32;
        }
      }
    }
  }
}

// 战斗区块
.combat-section {
  display: flex;
  flex-direction: column;
  gap: 30px;

  .thac0-section {
    .thac0-card {
      border: 2px solid #000;
      padding: 20px;
      background-color: #f9f9f9;
      display: flex;
      align-items: center;
      gap: 20px;

      .thac0-value {
        font-size: 72px;
        font-weight: bold;
        color: #d9534f;
        min-width: 120px;
        text-align: center;
        border-right: 2px solid #ccc;
        padding-right: 20px;
      }

      .thac0-description {
        flex: 1;

        p {
          margin: 8px 0;
          line-height: 1.6;
          font-size: 14px;
        }

        .category-note {
          margin-top: 15px;
          padding: 10px;
          background-color: #fff3cd;
          border-left: 4px solid #f0ad4e;

          .growth-rate {
            color: #856404;
            font-style: italic;
          }
        }
      }
    }
  }

  .saving-throws-section {
    .saving-throws-card {
      border: 2px solid #000;
      padding: 20px;
      background-color: #f9f9f9;

      .saves-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
        background-color: #fff;

        th,
        td {
          border: 1px solid #ddd;
          padding: 12px;
        }

        th {
          background-color: #5bc0de;
          color: #fff;
          font-weight: bold;
          text-align: left;
        }

        .save-name {
          font-weight: bold;
        }

        .save-value {
          text-align: center;
          font-size: 18px;
          color: #d9534f;
          font-weight: bold;
        }

        tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        tbody tr:hover {
          background-color: #e8f5e9;
        }
      }

      .saves-explanation {
        padding: 15px;
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;

        p {
          margin: 0;
          line-height: 1.6;
          font-size: 14px;

          strong {
            color: #1565c0;
          }
        }
      }
    }
  }
}

// 底部操作按钮
.bottom-actions {
  display: flex;
  justify-content: space-between;
  padding: 20px 30px;
  border-top: 2px solid #000;
  background-color: #f5f5f5;
  gap: 15px;

  button {
    display: flex;
    align-items: center;
    gap: 8px;

    .button-icon {
      font-size: 16px;
    }

    &.primary {
      margin-left: auto;
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .stats-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .stats-content {
    padding: 20px;
  }

  .thac0-card {
    flex-direction: column !important;

    .thac0-value {
      border-right: none !important;
      border-bottom: 2px solid #ccc;
      padding-right: 0 !important;
      padding-bottom: 20px;
    }
  }

  .bottom-actions {
    flex-wrap: wrap;
  }
}
</style>
