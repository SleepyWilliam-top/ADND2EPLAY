<template>
  <div class="step1-container">
    <!-- 模式选择 -->
    <div class="mode-selector">
      <button
        v-for="mode in modes"
        :key="mode.value"
        class="mode-button"
        :class="{ active: currentMode === mode.value }"
        @click="switchMode(mode.value)"
        v-html="mode.label"
      ></button>
      <div v-if="currentMode === 'point-buy'" class="points-display">
        <span class="points-label">剩余点数:</span>
        <span class="points-value" :class="{ negative: remainingPoints < 0 }">
          {{ remainingPoints }}
        </span>
        <select v-model="pointPool" class="pool-selector" @change="resetAbilities">
          <option :value="80">80点</option>
          <option :value="90">90点</option>
          <option :value="100">100点</option>
        </select>
      </div>
    </div>

    <!-- 属性卡片列表 -->
    <div class="abilities-list">
      <div v-for="ability in abilitiesList" :key="ability.key" class="ability-card">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="ability-title">
            <h3>{{ ability.name }} ({{ ability.en }})</h3>
            <span class="ability-abbr">{{ ability.abbr }}</span>
          </div>
          <button class="expand-button" @click="toggleExpand(ability.key)">
            {{ expandedAbility === ability.key ? '收起▲' : '展开▼' }}
          </button>
        </div>

        <!-- 当前值和关键加成 -->
        <div class="ability-info">
          <div class="ability-value">
            <span class="value-label">值:</span>
            <span :id="`${ability.key}-value`" class="value-number">{{ getAbilityValue(ability.key) ?? '--' }}</span>
          </div>
          <div class="ability-bonuses">
            {{ getKeyBonuses(ability.key) }}
          </div>
        </div>

        <!-- 控制区域（根据模式不同） -->
        <div class="ability-controls">
          <!-- 掷骰模式 -->
          <template v-if="currentMode === 'roll'">
            <button class="roll-button" @click="rollAbility(ability.key, '3d6')">3d6</button>
            <button class="roll-button" @click="rollAbility(ability.key, '4d6k3')">4d6k3</button>
          </template>

          <!-- 点数池模式 -->
          <template v-if="currentMode === 'point-buy'">
            <div class="point-buy-controls">
              <button
                class="adjust-button decrease"
                @click="adjustAbility(ability.key, -1)"
                :disabled="!canDecreaseAbility(ability.key)"
              >
                −
              </button>
              <input
                type="number"
                min="3"
                max="18"
                class="ability-input"
                :value="getAbilityValue(ability.key) ?? ''"
                @change="e => setAbilityFromInput(ability.key, (e.target as HTMLInputElement).value)"
                @blur="e => validateAndSetAbility(ability.key, e.target as HTMLInputElement)"
                placeholder="3-18"
              />
              <button
                class="adjust-button increase"
                @click="adjustAbility(ability.key, 1)"
                :disabled="!canIncreaseAbility(ability.key)"
              >
                +
              </button>
            </div>
          </template>
        </div>

        <!-- 可折叠的详情区域 -->
        <transition name="expand">
          <div v-if="expandedAbility === ability.key" class="ability-details">
            <div class="details-description">
              <p v-html="ability.description"></p>
            </div>
            <div class="details-table" v-html="ability.table"></div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="action-buttons">
      <div class="action-left">
        <button class="back-button" @click="backToMenu">
          <span class="back-icon">←</span>
          返回主菜单
        </button>
      </div>
      <div class="action-center" v-if="currentMode === 'roll'">
        <button class="action-button" @click="rollAll('3d6')">
          <span class="button-icon"><i class="fa-solid fa-dice-d20"></i></span>
          全部投掷(3d6)
        </button>
        <button class="action-button" @click="rollAll('4d6k3')">
          <span class="button-icon"><i class="fa-solid fa-dice-d20"></i></span>
          全部投掷(4d6k3)
        </button>
      </div>
      <div class="action-right">
        <button class="reset-button" @click="resetAbilities">
          <span class="reset-icon">↺</span>
          重置
        </button>
        <button class="next-button" :disabled="!canProceed" @click="nextStep">
          下一步
          <span class="next-icon">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap';
import { computed, ref } from 'vue';
import { useCharacterStore } from '../stores/characterStore';
import {
  getCharismaModifiers,
  getConstitutionModifiers,
  getDexterityModifiers,
  getIntelligenceModifiers,
  getStrengthModifiers,
  getWisdomModifiers,
  roll3d6,
  roll4d6k3,
} from '../utils/abilityCalculator';

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
type Mode = 'roll' | 'point-buy';

const characterStore = useCharacterStore();
const emit = defineEmits<{
  backToMenu: [];
}>();
const currentMode = ref<Mode>('roll');
const expandedAbility = ref<AbilityKey | null>(null);
const pointPool = ref(80);

const modes = [
  { label: '掷 <i class="fa-solid fa-dice-d20"></i> 分配', value: 'roll' as Mode },
  { label: '点数池分配', value: 'point-buy' as Mode },
];

const abilitiesList = [
  {
    key: 'str' as AbilityKey,
    name: '力量',
    en: 'Strength',
    abbr: 'STR',
    description: `力量（Str）代表角色的力气、耐力和精力。这项属性是勇士首要属性，因为他们必须身体强壮才能穿戴护甲和挥舞沉重的武器。如果战士的力量达到16或更高，那么他能得到额外的10%经验值奖励。`,
    table: generateStrengthTable(),
  },
  {
    key: 'dex' as AbilityKey,
    name: '敏捷',
    en: 'Dexterity',
    abbr: 'DEX',
    description: `敏捷（Dex）涵盖了几个身体素质，包括手眼协调度、肢体灵活度、反应速度、反射和平衡能力。敏捷影响角色对威胁或突袭的反应能力，影响他使用投掷武器和弓类武器时的精准度，影响他闪避敌人攻击的能力。`,
    table: generateDexterityTable(),
  },
  {
    key: 'con' as AbilityKey,
    name: '体质',
    en: 'Constitution',
    abbr: 'CON',
    description: `角色的体质（Con）代表了他的体能、身体素质、健康情况及对苦难，伤害，疾病等造成身体损害的因素的抵抗能力。因为这项属性影响角色的生命值和在魔法带来的物理变形的巨大冲击中存活或在濒死中复生的几率，它对所有职业都很重要。`,
    table: generateConstitutionTable(),
  },
  {
    key: 'int' as AbilityKey,
    name: '智力',
    en: 'Intelligence',
    abbr: 'INT',
    description: `智力（Int）代表了一个角色的记忆能力、逻辑能力和学习能力，包括那些不需要用书面文字表述的方面。智力决定了角色可以学习多少种语言。智力是法师的首要属性，他们必须拥有聪明的头脑来理解和记忆法术。`,
    table: generateIntelligenceTable(),
  },
  {
    key: 'wis' as AbilityKey,
    name: '灵知',
    en: 'Wisdom',
    abbr: 'WIS',
    description: `灵知（Wis）描述了角色的教化、判断力、谋略、意志力、常识和直觉。它影响角色对魔法攻击的抵抗力。它是祭司的首要属性，灵知值达到16或更高的祭司能得到额外的10%经验值奖励。`,
    table: generateWisdomTable(),
  },
  {
    key: 'cha' as AbilityKey,
    name: '魅力',
    en: 'Charisma',
    abbr: 'CHA',
    description: `魅力（Cha）估量了角色的口才，个人魅力以及领导力。尽管外表确实发挥一定作用，但这并非外表吸引力的体现。魅力对所有角色都很重要，尤其是在必须与那些非玩家人物（NPCs），雇佣兵，仆从和高智力怪物交流时。`,
    table: generateCharismaTable(),
  },
];

// 计算剩余点数
const remainingPoints = computed(() => {
  if (currentMode.value !== 'point-buy') return 0;

  const abilities = characterStore.characterData.abilities;
  const total =
    (abilities.str || 0) +
    (abilities.dex || 0) +
    (abilities.con || 0) +
    (abilities.int || 0) +
    (abilities.wis || 0) +
    (abilities.cha || 0);

  return pointPool.value - total;
});

// 判断是否可以进入下一步
const canProceed = computed(() => {
  const abilities = characterStore.characterData.abilities;
  const allFilled =
    abilities.str !== null &&
    abilities.dex !== null &&
    abilities.con !== null &&
    abilities.int !== null &&
    abilities.wis !== null &&
    abilities.cha !== null;

  if (currentMode.value === 'point-buy') {
    return allFilled && remainingPoints.value >= 0;
  }

  return allFilled;
});

// 切换模式
function switchMode(mode: Mode) {
  if (currentMode.value !== mode) {
    const confirm = window.confirm('切换模式将清空当前所有属性值，是否继续？');
    if (confirm) {
      currentMode.value = mode;
      resetAbilities();
    }
  }
}

// 获取属性值
function getAbilityValue(key: AbilityKey): number | null {
  return characterStore.characterData.abilities[key];
}

// 设置属性值（内部使用，已经过验证的值）
function setAbility(key: AbilityKey, value: number) {
  if (isNaN(value) || value < 3 || value > 18) {
    characterStore.updateCharacterData(data => {
      data.abilities[key] = null;
    });
    return;
  }

  // 点数池模式下检查点数
  if (currentMode.value === 'point-buy') {
    const oldValue = characterStore.characterData.abilities[key] || 0;
    const diff = value - oldValue;
    if (remainingPoints.value - diff < 0) {
      toastr.warning('点数不足');
      return;
    }
  }

  characterStore.updateCharacterData(data => {
    data.abilities[key] = value;
  });
}

// 从输入框设置属性值（使用 @change 事件，仅在失去焦点或按回车时触发）
function setAbilityFromInput(key: AbilityKey, valueStr: string) {
  const value = parseInt(valueStr);

  if (valueStr === '' || isNaN(value)) {
    // 允许暂时为空，不立即重置
    return;
  }

  if (value < 3 || value > 18) {
    toastr.warning('属性值必须在 3-18 之间');
    return;
  }

  setAbility(key, value);
}

// 验证并设置属性值（在失去焦点时调用）
function validateAndSetAbility(key: AbilityKey, input: HTMLInputElement) {
  const valueStr = input.value;

  if (valueStr === '') {
    // 如果为空，恢复为当前值
    const current = getAbilityValue(key);
    input.value = current !== null ? current.toString() : '';
    return;
  }

  const value = parseInt(valueStr);

  if (isNaN(value) || value < 3 || value > 18) {
    toastr.warning('属性值必须在 3-18 之间');
    // 恢复为当前值
    const current = getAbilityValue(key);
    input.value = current !== null ? current.toString() : '';
    return;
  }

  setAbility(key, value);
}

// 调整属性值（+1 或 -1）
function adjustAbility(key: AbilityKey, delta: number) {
  const current = getAbilityValue(key) || 9; // 默认从9开始
  const newValue = current + delta;

  if (newValue < 3 || newValue > 18) {
    return;
  }

  setAbility(key, newValue);
}

// 检查是否可以减少属性值
function canDecreaseAbility(key: AbilityKey): boolean {
  const current = getAbilityValue(key);
  return current !== null && current > 3;
}

// 检查是否可以增加属性值
function canIncreaseAbility(key: AbilityKey): boolean {
  const current = getAbilityValue(key);
  if (current === null || current >= 18) return false;

  // 检查点数是否足够
  return remainingPoints.value >= 1;
}

// 掷骰
function rollAbility(key: AbilityKey, type: '3d6' | '4d6k3') {
  const result = type === '3d6' ? roll3d6() : roll4d6k3();

  // 使用 updateCharacterData 触发响应式更新
  characterStore.updateCharacterData(data => {
    data.abilities[key] = result;
  });
  toastr.success(`${abilitiesList.find(a => a.key === key)?.name}: ${result}`);
}

// 全部掷骰
function rollAll(type: '3d6' | '4d6k3') {
  characterStore.updateCharacterData(data => {
    abilitiesList.forEach(ability => {
      const result = type === '3d6' ? roll3d6() : roll4d6k3();
      data.abilities[ability.key] = result;
    });
  });
  toastr.success('所有属性已投掷完成');
}

// 重置属性
function resetAbilities() {
  characterStore.updateCharacterData(data => {
    data.abilities = {
      str: null,
      dex: null,
      con: null,
      int: null,
      wis: null,
      cha: null,
    };
  });
}

// 切换展开/收起
function toggleExpand(key: AbilityKey) {
  expandedAbility.value = expandedAbility.value === key ? null : key;
}

// 获取关键加成信息
function getKeyBonuses(key: AbilityKey): string {
  const value = getAbilityValue(key);
  if (value === null) return '未设置属性值';

  switch (key) {
    case 'str': {
      const mods = getStrengthModifiers(value);
      return `命中率: ${mods.hitProb}  伤害: ${mods.damage}  负重: ${mods.weight}`;
    }
    case 'dex': {
      const mods = getDexterityModifiers(value);
      return `突袭: ${mods.surprise}  远程: ${mods.missile}  防御: ${mods.defense}`;
    }
    case 'con': {
      const mods = getConstitutionModifiers(value);
      return `生命值: ${mods.hpAdj}  身体休克: ${mods.systemShock}  复生: ${mods.resurrection}`;
    }
    case 'int': {
      const mods = getIntelligenceModifiers(value);
      return `语言: ${mods.languages}  法术等级: ${mods.spellLevel}  习得率: ${mods.learnSpell}`;
    }
    case 'wis': {
      const mods = getWisdomModifiers(value);
      return `魔法防御: ${mods.magicDefense}  奖励法术: ${mods.bonusSpells}  失败率: ${mods.spellFailure}`;
    }
    case 'cha': {
      const mods = getCharismaModifiers(value);
      return `追随者: ${mods.maxHenchmen}  忠诚: ${mods.loyalty}  反应: ${mods.reaction}`;
    }
    default:
      return '';
  }
}

// 返回主菜单
function backToMenu() {
  const confirm = window.confirm('返回主菜单将丢失当前未保存的数据，是否继续？');
  if (confirm) {
    emit('backToMenu');
  }
}

// 下一步
function nextStep() {
  if (!canProceed.value) return;

  characterStore.updateCharacterData(data => {
    data.step = 2;
  });
  toastr.success('属性设置完成，进入下一步');
}

// 生成属性表格的 HTML
function generateStrengthTable(): string {
  return `
    <table class="ability-table">
      <thead>
        <tr>
          <th>力量值</th>
          <th>命中率</th>
          <th>伤害调整</th>
          <th>负重</th>
          <th>最大负重</th>
          <th>开门</th>
          <th>弯杆/举门</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>3</td><td>-3</td><td>-1</td><td>5</td><td>10</td><td>2</td><td>0%</td></tr>
        <tr><td>4-5</td><td>-2</td><td>-1</td><td>10</td><td>25</td><td>3</td><td>0%</td></tr>
        <tr><td>6-7</td><td>-1</td><td>0</td><td>20</td><td>55</td><td>4</td><td>0%</td></tr>
        <tr><td>8-9</td><td>0</td><td>0</td><td>35</td><td>90</td><td>5</td><td>1%</td></tr>
        <tr><td>10-11</td><td>0</td><td>0</td><td>40</td><td>115</td><td>6</td><td>2%</td></tr>
        <tr><td>12-13</td><td>0</td><td>0</td><td>45</td><td>140</td><td>7</td><td>4%</td></tr>
        <tr><td>14-15</td><td>0</td><td>0</td><td>55</td><td>170</td><td>8</td><td>7%</td></tr>
        <tr><td>16</td><td>0</td><td>+1</td><td>70</td><td>195</td><td>9</td><td>10%</td></tr>
        <tr><td>17</td><td>+1</td><td>+1</td><td>85</td><td>220</td><td>10</td><td>13%</td></tr>
        <tr><td>18</td><td>+1</td><td>+2</td><td>110</td><td>255</td><td>11</td><td>16%</td></tr>
      </tbody>
    </table>
  `;
}

function generateDexterityTable(): string {
  return `
    <table class="ability-table">
      <thead>
        <tr>
          <th>敏捷值</th>
          <th>突袭反应调整</th>
          <th>远程攻击调整</th>
          <th>防御调整</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>3</td><td>-3</td><td>-3</td><td>+4</td></tr>
        <tr><td>4</td><td>-2</td><td>-2</td><td>+3</td></tr>
        <tr><td>5</td><td>-1</td><td>-1</td><td>+2</td></tr>
        <tr><td>6</td><td>0</td><td>0</td><td>+1</td></tr>
        <tr><td>7-14</td><td>0</td><td>0</td><td>0</td></tr>
        <tr><td>15</td><td>0</td><td>0</td><td>-1</td></tr>
        <tr><td>16</td><td>+1</td><td>+1</td><td>-2</td></tr>
        <tr><td>17</td><td>+2</td><td>+2</td><td>-3</td></tr>
        <tr><td>18</td><td>+2</td><td>+2</td><td>-4</td></tr>
      </tbody>
    </table>
  `;
}

function generateConstitutionTable(): string {
  return `
    <table class="ability-table">
      <thead>
        <tr>
          <th>体质值</th>
          <th>生命值调整</th>
          <th>身体休克</th>
          <th>复生存活</th>
          <th>毒素豁免</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>3</td><td>-2</td><td>35%</td><td>40%</td><td>0</td></tr>
        <tr><td>4</td><td>-1</td><td>40%</td><td>45%</td><td>0</td></tr>
        <tr><td>5-6</td><td>-1</td><td>45-50%</td><td>50-55%</td><td>0</td></tr>
        <tr><td>7-14</td><td>0</td><td>55-88%</td><td>60-92%</td><td>0</td></tr>
        <tr><td>15</td><td>+1</td><td>90%</td><td>94%</td><td>0</td></tr>
        <tr><td>16</td><td>+2</td><td>95%</td><td>96%</td><td>0</td></tr>
        <tr><td>17</td><td>+2(+3)</td><td>97%</td><td>98%</td><td>0</td></tr>
        <tr><td>18</td><td>+2(+4)</td><td>99%</td><td>100%</td><td>0</td></tr>
      </tbody>
    </table>
  `;
}

function generateIntelligenceTable(): string {
  return `
    <table class="ability-table">
      <thead>
        <tr>
          <th>智力值</th>
          <th>语言数量</th>
          <th>法术等级</th>
          <th>法术习得率</th>
          <th>每级法术上限</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>9</td><td>2</td><td>4级</td><td>35%</td><td>6</td></tr>
        <tr><td>10-11</td><td>2</td><td>5级</td><td>40-45%</td><td>7</td></tr>
        <tr><td>12</td><td>3</td><td>6级</td><td>50%</td><td>7</td></tr>
        <tr><td>13</td><td>3</td><td>6级</td><td>55%</td><td>9</td></tr>
        <tr><td>14</td><td>4</td><td>7级</td><td>60%</td><td>9</td></tr>
        <tr><td>15</td><td>4</td><td>7级</td><td>65%</td><td>11</td></tr>
        <tr><td>16</td><td>5</td><td>8级</td><td>70%</td><td>11</td></tr>
        <tr><td>17</td><td>6</td><td>8级</td><td>75%</td><td>14</td></tr>
        <tr><td>18</td><td>7</td><td>9级</td><td>85%</td><td>18</td></tr>
      </tbody>
    </table>
  `;
}

function generateWisdomTable(): string {
  return `
    <table class="ability-table">
      <thead>
        <tr>
          <th>灵知值</th>
          <th>魔法防御调整</th>
          <th>奖励法术</th>
          <th>施法失败率</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>3-7</td><td>-3 ~ -1</td><td>--</td><td>50-30%</td></tr>
        <tr><td>8-12</td><td>0</td><td>--/0</td><td>25-5%</td></tr>
        <tr><td>13-14</td><td>0</td><td>1级</td><td>0%</td></tr>
        <tr><td>15</td><td>+1</td><td>2级</td><td>0%</td></tr>
        <tr><td>16</td><td>+2</td><td>2级</td><td>0%</td></tr>
        <tr><td>17</td><td>+3</td><td>3级</td><td>0%</td></tr>
        <tr><td>18</td><td>+4</td><td>4级</td><td>0%</td></tr>
      </tbody>
    </table>
  `;
}

function generateCharismaTable(): string {
  return `
    <table class="ability-table">
      <thead>
        <tr>
          <th>魅力值</th>
          <th>追随者上限</th>
          <th>基础忠诚</th>
          <th>反应调整</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>3</td><td>1</td><td>-6</td><td>-5</td></tr>
        <tr><td>4-5</td><td>1-2</td><td>-5 ~ -4</td><td>-4 ~ -3</td></tr>
        <tr><td>6-7</td><td>2-3</td><td>-3 ~ -2</td><td>-2 ~ -1</td></tr>
        <tr><td>8-12</td><td>3-5</td><td>-1 ~ 0</td><td>0</td></tr>
        <tr><td>13</td><td>5</td><td>0</td><td>+1</td></tr>
        <tr><td>14</td><td>6</td><td>+1</td><td>+2</td></tr>
        <tr><td>15</td><td>7</td><td>+3</td><td>+3</td></tr>
        <tr><td>16</td><td>8</td><td>+4</td><td>+5</td></tr>
        <tr><td>17</td><td>10</td><td>+6</td><td>+6</td></tr>
        <tr><td>18</td><td>15</td><td>+8</td><td>+7</td></tr>
      </tbody>
    </table>
  `;
}
</script>

<style lang="scss" scoped>
.step1-container {
  padding: 30px;
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 20px;
  }
}

// 模式选择器
.mode-selector {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border: 2px solid #000;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.mode-button {
  padding: 10px 20px;
  background-color: #fff;
  border: 2px solid #000;
  font-family: '临海体', serif;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    background-color: #000;
    color: #fff;
  }

  &:hover:not(.active) {
    background-color: #e0e0e0;
  }
}

.points-display {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  font-family: '临海体', serif;

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }

  .points-label {
    font-weight: bold;
  }

  .points-value {
    font-size: 20px;
    font-weight: bold;
    color: #000;

    &.negative {
      color: #d9534f;
    }
  }

  .pool-selector {
    padding: 5px 10px;
    border: 2px solid #000;
    background-color: #fff;
    font-family: '临海体', serif;
    font-size: 14px;
    cursor: pointer;
  }
}

// 属性列表
.abilities-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

// 属性卡片
.ability-card {
  background-color: #fff;
  border: 3px solid #000;
  padding: 20px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border: 1px solid #666;
    pointer-events: none;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #000;
}

.ability-title {
  display: flex;
  align-items: center;
  gap: 15px;

  h3 {
    font-family: '临海体', serif;
    font-size: 20px;
    font-weight: bold;
    margin: 0;

    @media (max-width: 768px) {
      font-size: 18px;
    }
  }

  .ability-abbr {
    font-family: '临海体', serif;
    font-size: 16px;
    font-weight: bold;
    color: #666;
    background-color: #f5f5f5;
    padding: 4px 8px;
    border: 1px solid #999;
  }
}

.expand-button {
  padding: 6px 12px;
  background-color: #fff;
  border: 2px solid #000;
  font-family: '临海体', serif;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #000;
    color: #fff;
  }
}

// 属性信息
.ability-info {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 15px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

.ability-value {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: '临海体', serif;

  .value-label {
    font-size: 16px;
    font-weight: bold;
  }

  .value-number {
    font-size: 32px;
    font-weight: bold;
    font-family: '临海体', serif;
    color: #000;
    min-width: 50px;
    text-align: center;
  }
}

.ability-bonuses {
  font-family: '临海体', serif;
  font-size: 13px;
  color: #333;
  flex: 1;
}

// 控制区域
.ability-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
}

// 点数池控制器
.point-buy-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.adjust-button {
  width: 45px;
  height: 45px;
  padding: 0;
  background-color: #fff;
  border: 2px solid #000;
  font-family: '临海体', serif;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background-color: #000;
    color: #fff;
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    background-color: #f0f0f0;
    border-color: #ccc;
    color: #999;
  }

  &.decrease {
    border-radius: 4px 0 0 4px;
  }

  &.increase {
    border-radius: 0 4px 4px 0;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
}

.point-buy-controls .ability-input {
  flex: 1;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.roll-button {
  flex: 1;
  padding: 12px 20px;
  background-color: #fff;
  border: 2px solid #000;
  font-family: '临海体', serif;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #000;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}

.ability-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #000;
  font-family: '临海体', serif;
  font-size: 20px;
  font-weight: bold;
  text-align: center;

  &:focus {
    outline: none;
    border-color: #333;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }
}

// 详情区域
.ability-details {
  border-top: 2px dashed #666;
  padding-top: 20px;
  margin-top: 10px;
}

.details-description {
  font-family: '临海体', serif;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;

  p {
    margin: 0;
  }
}

.details-table {
  overflow-x: auto;
}

// 表格样式
:deep(.ability-table) {
  width: 100%;
  border-collapse: collapse;
  font-family: '临海体', serif;
  font-size: 12px;
  background-color: #fff;

  th,
  td {
    border: 1px solid #000;
    padding: 8px;
    text-align: center;
  }

  th {
    background-color: #000;
    color: #fff;
    font-weight: bold;
  }

  tbody tr:nth-child(even) {
    background-color: #f5f5f5;
  }
}

// 展开/收起动画
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}

// 底部操作按钮
.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 25px;
  background-color: #f5f5f5;
  border: 3px solid #000;
  border-top: 4px double #000;

  @media (max-width: 1024px) {
    flex-wrap: wrap;
  }
}

.action-left,
.action-center,
.action-right {
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 1024px) {
    &.action-left,
    &.action-right {
      flex: 1 1 100%;
      justify-content: center;
    }

    &.action-center {
      flex: 1 1 100%;
      justify-content: center;
    }
  }
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background-color: #fff;
  border: 2px solid #666;
  color: #666;
  font-family: '临海体', serif;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  .back-icon {
    font-size: 18px;
  }

  &:hover {
    background-color: #666;
    color: #fff;
    transform: translateX(-2px);
    box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateX(0);
  }
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background-color: #fff;
  border: 2px solid #000;
  color: #000;
  font-family: '临海体', serif;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  .button-icon {
    font-size: 16px;
  }

  &:hover {
    background-color: #000;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}

.reset-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background-color: #fff;
  border: 2px solid #d9534f;
  color: #d9534f;
  font-family: '临海体', serif;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  .reset-icon {
    font-size: 18px;
  }

  &:hover {
    background-color: #d9534f;
    color: #fff;
    transform: rotate(-15deg) scale(1.05);
    box-shadow: 0 2px 4px rgba(217, 83, 79, 0.3);
  }

  &:active {
    transform: rotate(-15deg) scale(1);
  }
}

.next-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 30px;
  background-color: #000;
  border: 3px solid #000;
  color: #fff;
  font-family: '临海体', serif;
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  .next-icon {
    font-size: 18px;
  }

  &:hover:not(:disabled) {
    background-color: #333;
    border-color: #333;
    transform: translateX(2px);
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateX(0);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background-color: #999;
    border-color: #999;
    color: #ccc;
    box-shadow: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
