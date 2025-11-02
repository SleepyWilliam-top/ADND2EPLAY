<template>
  <div class="step3-class-selection">
    <!-- 顶部：当前属性显示 -->
    <div class="selection-header">
      <h3>职业选择 > {{ currentRaceName }}</h3>
      <div class="abilities-display">
        <span>力量 {{ characterStore.adjustedAbilities.str }}</span>
        <span>敏捷 {{ characterStore.adjustedAbilities.dex }}</span>
        <span>体质 {{ characterStore.adjustedAbilities.con }}</span>
        <span>智力 {{ characterStore.adjustedAbilities.int }}</span>
        <span>灵知 {{ characterStore.adjustedAbilities.wis }}</span>
        <span>魅力 {{ characterStore.adjustedAbilities.cha }}</span>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="selection-content">
      <!-- 左侧：职业列表 -->
      <div class="class-list">
        <div
          v-for="cls in classes"
          :key="cls.id"
          class="class-card"
          :class="{
            selected: selectedClass === cls.id,
            disabled: !canSelectClass(cls),
          }"
          :data-category="cls.category"
          @click="selectClass(cls.id)"
        >
          <div class="class-icon">{{ cls.icon }}</div>
          <div class="class-info">
            <div class="class-name">{{ cls.name }}</div>
            <div class="class-category">{{ categoryNames[cls.category] }}</div>
          </div>
          <div v-if="selectedClass === cls.id" class="selected-indicator">✓</div>
          <div v-else-if="!canSelectClass(cls)" class="disabled-indicator">✗</div>
        </div>
      </div>

      <!-- 右侧：职业详情 -->
      <div class="class-details">
        <div v-if="selectedClassData" class="details-content">
          <!-- 职业标题 -->
          <div class="detail-header">
            <h2>{{ selectedClassData.name }} ({{ selectedClassData.englishName }})</h2>
            <p class="level-limit">{{ getLevelLimitText() }}</p>
          </div>

          <div class="divider"></div>

          <!-- 职业图片 -->
          <div v-if="selectedClassData.image" class="detail-section class-image-section">
            <img :src="selectedClassData.image" :alt="selectedClassData.name" class="class-image" />
            <p v-if="selectedClassData.imageCredit" class="image-credit">{{ selectedClassData.imageCredit }}</p>
          </div>

          <!-- 职业描述 -->
          <div class="detail-section">
            <h4>职业描述</h4>
            <p class="description">{{ selectedClassData.description }}</p>
          </div>

          <!-- 属性要求 -->
          <div class="detail-section">
            <h4>属性要求</h4>
            <div class="ability-requirements">
              <div v-for="(ability, key) in abilityLabels" :key="key" class="ability-requirement">
                <span class="ability-label">{{ ability }}</span>
                <span class="requirement-value">{{ getRequirementText(key) }}</span>
                <span
                  class="requirement-status"
                  :class="{
                    met: checkRequirement(key),
                    unmet: !checkRequirement(key),
                  }"
                >
                  {{ checkRequirement(key) ? '✓' : '✗' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 首要属性 -->
          <div class="detail-section">
            <h4>首要属性</h4>
            <p class="prime-requisites">
              {{ selectedClassData.primeRequisites.join('、') }}
              <span class="hint">（全部达到16或以上时获得10%经验加成）</span>
            </p>
          </div>

          <!-- 武器和护甲限制 -->
          <div class="detail-section">
            <h4>武器和护甲</h4>
            <p><strong>武器：</strong>{{ selectedClassData.weaponRestrictions }}</p>
            <p><strong>护甲：</strong>{{ selectedClassData.armorRestrictions }}</p>
          </div>

          <div class="detail-section">
            <h4>经验等级表</h4>
            <table class="xp-table">
              <thead>
                <tr>
                  <th>等级</th>
                  <th>所需经验</th>
                  <th>生命骰</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="level in selectedClassData.experienceLevels.slice(0, 20)" :key="level.level">
                  <td>{{ level.level }}</td>
                  <td>{{ level.xp.toLocaleString() }}</td>
                  <td>{{ level.hitDice }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 特殊能力列表 -->
          <div class="detail-section">
            <h4>特殊能力</h4>
            <ul class="abilities-list">
              <li v-for="(ability, index) in selectedClassData.specialAbilities" :key="index">
                <strong>{{ ability.level }}级：{{ ability.name }}</strong>
                <span> - {{ ability.description }}</span>
              </li>
            </ul>
          </div>

          <!-- 法术能力（如果有） -->
          <div v-if="selectedClassData.spellcasting" class="detail-section">
            <h4>法术能力（{{ selectedClassData.spellcasting.type === 'wizard' ? '奥术' : '神术' }}）</h4>
            <p class="section-hint">法术进程表（每个等级可施展的法术数量）</p>
            <table class="spell-table">
              <thead>
                <tr>
                  <th>等级</th>
                  <th v-for="i in getMaxSpellLevel()" :key="i">{{ i }}级法术</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="prog in selectedClassData.spellcasting.spellProgression.slice(0, 10)" :key="prog.level">
                  <td>{{ prog.level }}</td>
                  <td v-for="(count, idx) in prog.spells" :key="idx">{{ count || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 特殊说明 -->
          <div
            v-if="selectedClassData.specialNotes && selectedClassData.specialNotes.length > 0"
            class="detail-section notes-section"
          >
            <h4>特殊说明</h4>
            <ul class="notes-list">
              <li v-for="(note, index) in selectedClassData.specialNotes" :key="index">{{ note }}</li>
            </ul>
          </div>

          <!-- 超凡力量掷骰 -->
          <div v-if="characterStore.canHaveExceptionalStrength()" class="detail-section exceptional-strength-section">
            <h4>超凡力量（Exceptional Strength）</h4>
            <div class="exceptional-strength-content">
              <p class="hint">🎲 你的力量值为18，且选择了勇士系职业！你可以掷超凡力量（1d100），获得额外的力量加成。</p>
              <div class="exceptional-strength-roll">
                <div v-if="characterStore.characterData.exceptionalStrength" class="roll-result">
                  <span class="result-label">超凡力量：</span>
                  <span class="result-value">{{ characterStore.formatExceptionalStrength() }}</span>
                </div>
                <button
                  class="adnd-button primary"
                  :class="{ reroll: characterStore.characterData.exceptionalStrength }"
                  @click="handleRollExceptionalStrength"
                >
                  {{ characterStore.characterData.exceptionalStrength ? '🔄 重新掷骰' : '🎲 掷超凡力量' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-selection">
          <p>请从左侧选择一个职业</p>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button class="adnd-button secondary" @click="goToPreviousStep">
        <span class="button-icon">←</span>
        <span>返回</span>
      </button>
      <button class="adnd-button secondary" @click="resetSelection">重置选择</button>
      <button
        class="adnd-button primary"
        :disabled="!selectedClass || !canSelectClass(selectedClassData!)"
        @click="confirmSelection"
      >
        <span>确认选择</span>
        <span class="button-icon">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Abilities } from '../stores/characterStore';
import { useCharacterStore } from '../stores/characterStore';
import { canRaceSelectClass, categoryNames, classes, getClassById } from '../utils/classData';
import { getRaceById } from '../utils/raceData';

const characterStore = useCharacterStore();

// 当前选择的职业
const selectedClass = ref<string | null>(null);

// 属性标签
const abilityLabels: Record<keyof Abilities, string> = {
  str: '力量',
  dex: '敏捷',
  con: '体质',
  int: '智力',
  wis: '灵知',
  cha: '魅力',
};

// 计算属性
const currentRaceName = computed(() => {
  const raceId = characterStore.characterData.race;
  if (!raceId) return '未选择种族';
  const race = getRaceById(raceId);
  return race?.name || '未知种族';
});

const selectedClassData = computed(() => {
  if (!selectedClass.value) return null;
  return getClassById(selectedClass.value);
});

// 方法
function goToPreviousStep() {
  characterStore.characterData.step = 2;
}

function resetSelection() {
  selectedClass.value = null;
}

// 检查是否可以选择某个职业
function canSelectClass(cls: any): boolean {
  if (!cls) return false;

  // 1. 检查种族限制
  const currentRace = characterStore.characterData.race;
  if (!currentRace) return false;

  const raceCheck = canRaceSelectClass(currentRace, cls.name);
  if (!raceCheck.allowed) return false;

  // 2. 检查属性要求
  const adjusted = characterStore.adjustedAbilities;
  for (const [key, minValue] of Object.entries(cls.abilityRequirements)) {
    const abilityKey = key as keyof Abilities;
    if ((adjusted[abilityKey] ?? 0) < (minValue as number)) {
      return false;
    }
  }

  return true;
}

// 选择职业
function selectClass(classId: string) {
  const cls = getClassById(classId);
  if (!cls || !canSelectClass(cls)) return;
  selectedClass.value = classId;
}

// 确认选择
function confirmSelection() {
  if (!selectedClass.value || !selectedClassData.value) return;

  if (!canSelectClass(selectedClassData.value)) {
    toastr.error('不满足该职业的要求');
    return;
  }

  // 检查是否更改了职业
  const previousClass = characterStore.characterData.class;
  const classChanged = previousClass !== selectedClass.value;

  // 保存选择
  characterStore.characterData.class = selectedClass.value;

  // 如果职业改变，清空后续步骤的相关数据
  if (classChanged) {
    // 清空超凡力量
    characterStore.characterData.exceptionalStrength = null;

    // 清空武器熟练数据
    characterStore.characterData.weaponProficiencies = [];
    characterStore.characterData.weaponSpecializations = [];

    // 清空非武器熟练数据
    characterStore.characterData.nonweaponProficiencies = [];
    characterStore.characterData.languageSlotsToWeapon = 0;
    characterStore.characterData.languageSlotsToNonweapon = 0;

    // 清空装备购买数据
    characterStore.characterData.startingMoney = 0;
    characterStore.characterData.currentMoney = 0;
    characterStore.characterData.purchasedEquipment = [];

    // 清空法术数据
    if (characterStore.characterData.spells) {
      characterStore.characterData.spells = {
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

  // 前进到下一步
  characterStore.characterData.step = 4;
  toastr.success('职业选择成功');
}

// 掷超凡力量
function handleRollExceptionalStrength() {
  const roll = characterStore.rollExceptionalStrength();
  if (roll > 0) {
    const formatted = characterStore.formatExceptionalStrength();
    toastr.success(`掷出超凡力量：${formatted}！`);
  }
}

// 获取等级上限文本
function getLevelLimitText(): string {
  if (!selectedClassData.value) return '';

  const currentRace = characterStore.characterData.race;
  if (!currentRace) return '';

  const check = canRaceSelectClass(currentRace, selectedClassData.value.name);
  if (check.levelLimit === 'U') return '等级上限：无限制';
  return `等级上限：${check.levelLimit}级`;
}

// 获取属性要求文本
function getRequirementText(abilityKey: keyof Abilities): string {
  if (!selectedClassData.value) return '无限制';

  const keyMap: Record<keyof Abilities, string> = {
    str: 'str',
    dex: 'dex',
    con: 'con',
    int: 'int',
    wis: 'wis',
    cha: 'cha',
  };

  const reqKey = keyMap[abilityKey];
  const minValue = selectedClassData.value.abilityRequirements[reqKey];

  if (minValue === undefined) return '无限制';
  return `最低 ${minValue}`;
}

// 检查属性要求
function checkRequirement(abilityKey: keyof Abilities): boolean {
  if (!selectedClassData.value) return false;

  const keyMap: Record<keyof Abilities, string> = {
    str: 'str',
    dex: 'dex',
    con: 'con',
    int: 'int',
    wis: 'wis',
    cha: 'cha',
  };

  const reqKey = keyMap[abilityKey];
  const minValue = selectedClassData.value.abilityRequirements[reqKey];

  if (minValue === undefined) return true;

  const adjusted = characterStore.adjustedAbilities;
  return (adjusted[abilityKey] ?? 0) >= minValue;
}

// 获取最大法术等级
function getMaxSpellLevel(): number {
  if (!selectedClassData.value?.spellcasting) return 0;
  const firstProg = selectedClassData.value.spellcasting.spellProgression[0];
  return firstProg?.spells.length || 0;
}
</script>

<style lang="scss" scoped>
.step3-class-selection {
  width: 100%;
  font-family: 'Times New Roman', serif;
}

// 顶部区域
.selection-header {
  padding: 20px 30px;
  border-bottom: 2px solid #000;
  background-color: #f5f5f5;

  h3 {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 15px;
  }

  .abilities-display {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;

    span {
      font-size: 14px;
      padding: 3px 8px;
      border: 1px solid #666;
    }
  }
}

// 主内容区
.selection-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// 左侧：职业列表
.class-list {
  width: 280px;
  border-right: 2px solid #000;
  overflow-y: auto;
  background-color: #f9f9f9;
  padding: 15px;

  .class-card {
    background-color: #fff;
    border: 2px solid #000;
    padding: 15px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;

    .class-icon {
      font-size: 32px;
    }

    .class-info {
      flex: 1;

      .class-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .class-category {
        font-size: 12px;
        color: #666;
      }
    }

    .selected-indicator,
    .disabled-indicator {
      font-size: 18px;
      font-weight: bold;
    }

    .selected-indicator {
      color: #5cb85c;
    }

    .disabled-indicator {
      color: #d9534f;
    }

    &.selected {
      background-color: #000;
      color: #fff;
      border-width: 3px;

      .class-category {
        color: #ccc;
      }
    }

    &.disabled {
      background-color: #e0e0e0;
      color: #999;
      cursor: not-allowed;
      border-color: #999;

      .class-category {
        color: #bbb;
      }
    }

    &:not(.disabled):not(.selected):hover {
      border-width: 3px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    // 职业类别颜色标识
    &[data-category='warrior']:not(.disabled):not(.selected) {
      border-left: 4px solid #d9534f;
    }

    &[data-category='wizard']:not(.disabled):not(.selected) {
      border-left: 4px solid #5bc0de;
    }

    &[data-category='priest']:not(.disabled):not(.selected) {
      border-left: 4px solid #f0ad4e;
    }

    &[data-category='rogue']:not(.disabled):not(.selected) {
      border-left: 4px solid #5cb85c;
    }
  }
}

// 右侧：职业详情
.class-details {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  background-color: #fff;

  .no-selection {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #999;
    font-size: 18px;
  }

  .details-content {
    max-width: 900px;
  }

  .detail-header {
    margin-bottom: 20px;

    h2 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .level-limit {
      font-size: 14px;
      color: #666;
      font-style: italic;
    }
  }

  .divider {
    height: 2px;
    background-color: #000;
    margin: 20px 0;
  }

  .detail-section {
    margin-bottom: 25px;

    h4 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 12px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }

    .description {
      line-height: 1.8;
      text-align: justify;
    }

    // 职业图片样式
    &.class-image-section {
      text-align: center;
      border: 2px solid #000;
      padding: 15px;
      background-color: #f9f9f9;

      .class-image {
        max-width: 100%;
        height: auto;
        border: 1px solid #ddd;
        display: block;
        margin: 0 auto;
      }

      .image-credit {
        margin-top: 10px;
        font-size: 12px;
        color: #666;
        font-style: italic;
      }
    }

    .ability-requirements {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      .ability-requirement {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border: 1px solid #ddd;

        .ability-label {
          font-weight: bold;
          min-width: 40px;
        }

        .requirement-value {
          flex: 1;
          color: #666;
        }

        .requirement-status {
          font-weight: bold;
          font-size: 16px;

          &.met {
            color: #5cb85c;
          }

          &.unmet {
            color: #d9534f;
          }
        }
      }
    }

    .prime-requisites {
      font-size: 16px;
      line-height: 1.6;

      .hint {
        display: block;
        font-size: 14px;
        color: #666;
        font-style: italic;
        margin-top: 5px;
      }
    }

    .section-hint {
      font-size: 14px;
      color: #666;
      font-style: italic;
      margin-bottom: 10px;
    }

    // 表格样式
    .xp-table,
    .spell-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;

      th,
      td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: center;
      }

      th {
        background-color: #f5f5f5;
        font-weight: bold;
      }

      tr:nth-child(even) {
        background-color: #fafafa;
      }
    }

    .abilities-list {
      list-style: none;
      padding: 0;

      li {
        margin-bottom: 12px;
        line-height: 1.6;
        padding-left: 15px;
        position: relative;

        &::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #666;
          font-weight: bold;
        }
      }
    }

    &.notes-section {
      background-color: #fffacd;
      padding: 15px;
      border-left: 4px solid #f0ad4e;

      h4 {
        color: #856404;
        border-bottom-color: #f0ad4e;
      }

      .notes-list {
        list-style: disc;
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          line-height: 1.6;
        }
      }
    }

    // 超凡力量区块
    &.exceptional-strength-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-left: none;
      border: 3px solid #5a67d8;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

      h4 {
        color: #fff;
        border-bottom-color: rgba(255, 255, 255, 0.3);
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      }

      .exceptional-strength-content {
        .hint {
          color: #fff;
          background-color: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 5px;
          margin-bottom: 15px;
          font-size: 14px;
          line-height: 1.6;
        }

        .exceptional-strength-roll {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;

          .roll-result {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

            .result-label {
              font-weight: bold;
              color: #333;
            }

            .result-value {
              font-size: 24px;
              font-weight: bold;
              color: #d9534f;
            }
          }

          button {
            padding: 10px 20px;
            font-size: 16px;
            background-color: #fff;
            color: #667eea;
            border: 2px solid #fff;
            transition: all 0.3s ease;

            &:hover {
              background-color: #667eea;
              color: #fff;
              transform: scale(1.05);
            }

            &.reroll {
              background-color: rgba(255, 255, 255, 0.2);
              color: #fff;

              &:hover {
                background-color: #fff;
                color: #667eea;
              }
            }
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
@media (max-width: 968px) {
  .selection-content {
    flex-direction: column;

    .class-list {
      width: 100%;
      border-right: none;
      border-bottom: 2px solid #000;
      max-height: 300px;
    }
  }
}

@media (max-width: 768px) {
  .class-details {
    padding: 20px;

    .detail-section .ability-requirements {
      grid-template-columns: 1fr;
    }
  }

  .bottom-actions {
    flex-wrap: wrap;
  }
}
</style>
