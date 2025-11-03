<template>
  <div class="step11-character-sheet">
    <!-- 顶部标题 -->
    <div class="sheet-header">
      <h2>角色卡预览</h2>
      <p class="subtitle">请确认所有信息无误后点击完成创建</p>
    </div>

    <!-- 主要角色卡区域 -->
    <div class="character-sheet-container">
      <div class="character-sheet">
        <!-- 第一行：基本信息 -->
        <section class="section-basic-info">
          <h3>基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">角色名:</span>
              <span class="value">{{ characterName }}</span>
            </div>
            <div class="info-item">
              <span class="label">性别:</span>
              <span class="value">{{ genderText }}</span>
            </div>
            <div class="info-item">
              <span class="label">种族:</span>
              <span class="value">{{ raceName }} {{ subraceName ? `(${subraceName})` : '' }}</span>
            </div>
            <div class="info-item">
              <span class="label">职业:</span>
              <span class="value">{{ className }}</span>
            </div>
            <div class="info-item">
              <span class="label">阵营:</span>
              <span class="value">{{ alignmentName }}</span>
            </div>
            <div class="info-item">
              <span class="label">等级:</span>
              <span class="value">1</span>
            </div>
            <div class="info-item">
              <span class="label">经验值:</span>
              <span class="value">0</span>
            </div>
            <div v-if="xpModifier !== 0" class="info-item full-width">
              <span class="label">经验值调整:</span>
              <span class="value" :class="xpModifier > 0 ? 'bonus' : 'penalty'">
                {{ xpModifierText }}
              </span>
            </div>
          </div>
        </section>

        <!-- 第二行：六大属性 -->
        <section class="section-abilities">
          <h3>属性值</h3>
          <div class="abilities-grid">
            <div v-for="(value, key) in finalAbilities" :key="key" class="ability-box">
              <div class="ability-name">{{ abilityNames[key] }}</div>
              <div class="ability-value">{{ value }}</div>
              <div v-if="abilityAdjustments[key]" class="ability-adjust">
                (原始: {{ originalAbilities[key] }} {{ abilityAdjustments[key] > 0 ? '+' : ''
                }}{{ abilityAdjustments[key] }})
              </div>
            </div>
          </div>
          <div v-if="exceptionalStrength" class="exceptional-strength">超凡力量: {{ exceptionalStrength }}</div>
        </section>

        <!-- 第三行：战斗数据 -->
        <section class="section-combat">
          <h3>战斗数据</h3>
          <div class="combat-grid">
            <div class="combat-item">
              <span class="label">护甲等级 (AC):</span>
              <span class="value">{{ armorClass }}</span>
            </div>
            <div class="combat-item">
              <span class="label">生命值 (HP):</span>
              <span class="value">{{ hitPoints }}</span>
            </div>
            <div class="combat-item">
              <span class="label">移动力:</span>
              <span class="value">{{ movement }}</span>
            </div>
            <div class="combat-item">
              <span class="label">THAC0:</span>
              <span class="value">{{ thac0 }}</span>
            </div>
          </div>
          <div class="saving-throws">
            <h4>豁免检定</h4>
            <div class="throws-grid">
              <div>麻痹/毒素/死亡魔法: {{ savingThrows.paralyzation }}</div>
              <div>权杖/法杖/魔杖: {{ savingThrows.rod }}</div>
              <div>石化/变形: {{ savingThrows.petrification }}</div>
              <div>喷吐武器: {{ savingThrows.breath }}</div>
              <div>法术: {{ savingThrows.spell }}</div>
            </div>
          </div>
        </section>

        <!-- 第四行：熟练与技能 -->
        <section class="section-proficiencies">
          <h3>熟练</h3>

          <div class="proficiency-subsection">
            <h4>武器熟练</h4>
            <ul v-if="weaponProfs.length > 0">
              <li v-for="prof in weaponProfs" :key="prof.id">
                {{ prof.name }} {{ prof.isSpecialized ? '(专精)' : '' }}
              </li>
            </ul>
            <p v-else class="empty-text">无</p>
          </div>

          <div class="proficiency-subsection">
            <h4>非武器熟练</h4>
            <ul v-if="nonweaponProfs.length > 0">
              <li v-for="prof in nonweaponProfs" :key="prof.id">{{ prof.name }} ({{ prof.slots }}槽)</li>
            </ul>
            <p v-else class="empty-text">无</p>
          </div>

          <div v-if="languageSlotsInfo" class="proficiency-subsection">
            <h4>语言槽转换</h4>
            <p>{{ languageSlotsInfo }}</p>
          </div>
        </section>

        <!-- 第五行：装备与财富 -->
        <section class="section-equipment">
          <h3>装备与财富</h3>
          <div class="money-info">
            <div>起始金币: {{ startingMoney }} GP</div>
            <div>当前金币: {{ currentMoney }} GP</div>
          </div>

          <div v-if="groupedEquipment.length > 0" class="equipment-list">
            <div v-for="group in groupedEquipment" :key="group.category" class="equipment-group">
              <h4>{{ group.category }}</h4>
              <ul>
                <li v-for="item in group.items" :key="item.id">
                  {{ item.name }} × {{ item.quantity }}
                  <span v-if="item.weight" class="weight">({{ item.totalWeight }}磅)</span>
                </li>
              </ul>
            </div>
          </div>
          <p v-else class="empty-text">无装备</p>
        </section>

        <!-- 第六行：法术（如有） -->
        <section v-if="hasSpells" class="section-spells">
          <h3>法术</h3>

          <div class="spell-slots">
            <h4>法术位</h4>
            <div class="slots-grid">
              <div v-for="(slots, level) in spellSlots" :key="level">
                <template v-if="slots.total > 0">
                  {{ level }}环: {{ slots.base }}
                  <span v-if="slots.bonus > 0" class="bonus"> +{{ slots.bonus }} (奖励)</span>
                  = {{ slots.total }}
                </template>
              </div>
            </div>
          </div>

          <div v-if="isWizard" class="spellbook">
            <h4>法术书</h4>
            <div v-for="(spells, level) in memorizedSpells" :key="level">
              <template v-if="spells.length > 0">
                <strong>{{ level }}环:</strong>
                <span>{{ spells.join(', ') }}</span>
              </template>
            </div>
          </div>

          <div v-if="isPriest" class="spell-spheres">
            <h4>法术领域</h4>
            <div v-if="majorSpheres.length > 0">主要: {{ majorSpheres.join(', ') }}</div>
            <div v-if="minorSpheres.length > 0">次要: {{ minorSpheres.join(', ') }}</div>

            <h4>已记忆法术</h4>
            <div v-for="(spells, level) in memorizedSpells" :key="level">
              <template v-if="spells.length > 0">
                <strong>{{ level }}环:</strong>
                <span>{{ spells.join(', ') }}</span>
              </template>
            </div>
          </div>
        </section>

        <!-- 第七行：角色信息 -->
        <section v-if="hasCharacterInfo" class="section-character-info">
          <h3>角色信息</h3>

          <div v-if="appearance" class="info-subsection">
            <h4>外貌描述</h4>
            <p>{{ appearance }}</p>
          </div>

          <div v-if="background" class="info-subsection">
            <h4>背景故事</h4>
            <p>{{ background }}</p>
          </div>

          <div v-if="gender === 'male' && penisSize" class="info-subsection">
            <h4>身体特征</h4>
            <p>阴茎大小: {{ penisSizeText }}</p>
          </div>
        </section>

        <!-- 第八行：种族特性 -->
        <section class="section-racial-abilities">
          <h3>种族特性</h3>

          <div v-if="raceAbilities.length > 0" class="abilities-list">
            <div v-for="ability in raceAbilities" :key="ability.name" class="ability-item">
              <strong>{{ ability.name }}:</strong> {{ ability.description }}
            </div>
          </div>

          <div v-if="raceAdvantages" class="subsection">
            <h4>种族优势</h4>
            <p>{{ raceAdvantages }}</p>
          </div>

          <div v-if="raceDisadvantages" class="subsection">
            <h4>种族劣势</h4>
            <p>{{ raceDisadvantages }}</p>
          </div>
        </section>

        <!-- 第九行：职业特性 -->
        <section class="section-class-abilities">
          <h3>职业特性</h3>

          <div v-if="classAbilities.length > 0" class="abilities-list">
            <div v-for="ability in classAbilities" :key="ability.name" class="ability-item">
              <strong>{{ ability.name }} ({{ ability.level }}级):</strong> {{ ability.description }}
            </div>
          </div>

          <div v-if="classNotes.length > 0" class="subsection">
            <h4>职业说明</h4>
            <ul>
              <li v-for="(note, index) in classNotes" :key="index">{{ note }}</li>
            </ul>
          </div>
        </section>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button class="adnd-button secondary" @click="goBack">
        <span class="button-icon">←</span>
        <span>返回上一步</span>
      </button>
      <button class="adnd-button primary" :disabled="isCreating" @click="completeCreation">
        <span>{{ isCreating ? '正在创建...' : '完成创建' }}</span>
        <span v-if="!isCreating" class="button-icon">✓</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Abilities } from '../stores/characterStore';
import { useCharacterStore } from '../stores/characterStore';
import { getAlignmentById } from '../utils/alignmentData';
import { getClassById } from '../utils/classData';
import { getClassCategory, getSavingThrows, getTHAC0 } from '../utils/combatData';
import { getProficiencyById } from '../utils/proficiencyData';
import { getRaceById, getSubraceById } from '../utils/raceData';
import { getWeaponById } from '../utils/weaponData';

const router = useRouter();
const characterStore = useCharacterStore();
const isCreating = ref(false);

// 基本信息
const characterName = computed(() => {
  const name = characterStore.characterData.characterName;
  if (name) return name;
  // 如果没有设置角色名，使用酒馆的用户名
  return (typeof SillyTavern !== 'undefined' && SillyTavern.name1) || 'Player';
});
const gender = computed(() => characterStore.characterData.gender);
const genderText = computed(() => {
  switch (gender.value) {
    case 'male':
      return '男性';
    case 'female':
      return '女性';
    case 'other':
      return '其他';
    default:
      return '未设置';
  }
});

// 种族、职业、阵营
const raceData = computed(() => getRaceById(characterStore.characterData.race || ''));
const subraceData = computed(() => {
  if (!characterStore.characterData.subrace) return null;
  return getSubraceById(characterStore.characterData.race || '', characterStore.characterData.subrace);
});
const classData = computed(() => getClassById(characterStore.characterData.class || ''));
const alignmentData = computed(() => getAlignmentById(characterStore.characterData.alignment || ''));

const raceName = computed(() => raceData.value?.name || '');
const subraceName = computed(() => subraceData.value?.name || '');
const className = computed(() => classData.value?.name || '');
const alignmentName = computed(() => alignmentData.value?.name || '');

// 经验值调整计算
const xpModifier = computed(() => {
  let modifier = 0;

  // 种族经验值惩罚
  const raceXpPenalty = subraceData.value?.xpPenalty || 0;
  modifier -= raceXpPenalty;

  // 职业经验值奖励（首要属性达到16+）
  if (classData.value) {
    const primeReqs = classData.value.primeRequisites;
    const abilities = characterStore.adjustedAbilities;

    let allPrimeReqsMet = true;
    primeReqs.forEach(req => {
      const abilityKey = getAbilityKey(req);
      if ((abilities[abilityKey] || 0) < 16) {
        allPrimeReqsMet = false;
      }
    });

    if (allPrimeReqsMet) {
      modifier += 10; // +10%经验值奖励
    }
  }

  return modifier;
});

const xpModifierText = computed(() => {
  const parts = [];

  const raceXpPenalty = subraceData.value?.xpPenalty || 0;
  if (raceXpPenalty > 0) {
    parts.push(`种族惩罚 -${raceXpPenalty}%`);
  }

  if (classData.value) {
    const primeReqs = classData.value.primeRequisites;
    const abilities = characterStore.adjustedAbilities;

    let allPrimeReqsMet = true;
    primeReqs.forEach(req => {
      const abilityKey = getAbilityKey(req);
      if ((abilities[abilityKey] || 0) < 16) {
        allPrimeReqsMet = false;
      }
    });

    if (allPrimeReqsMet) {
      parts.push(`职业奖励 +10%`);
    }
  }

  if (parts.length === 0) return '无调整';
  return `${parts.join(', ')} = ${xpModifier.value > 0 ? '+' : ''}${xpModifier.value}%`;
});

// 属性值
const abilityNames: Record<string, string> = {
  str: '力量',
  dex: '敏捷',
  con: '体质',
  int: '智力',
  wis: '灵知',
  cha: '魅力',
};

const originalAbilities = computed(() => characterStore.characterData.abilities);
const finalAbilities = computed(() => characterStore.adjustedAbilities);
const abilityAdjustments = computed(() => {
  const adjustments: Record<string, number> = {};
  Object.keys(abilityNames).forEach(key => {
    const original = originalAbilities.value[key as keyof Abilities] || 0;
    const final = finalAbilities.value[key as keyof Abilities] || 0;
    const diff = final - original;
    if (diff !== 0) {
      adjustments[key] = diff;
    }
  });
  return adjustments;
});

const exceptionalStrength = computed(() => characterStore.characterData.exceptionalStrength);

// 战斗数据
const hitPoints = computed(() => {
  // 使用实际掷骰的生命值
  return characterStore.characterData.hitPoints?.max || 0;
});

const armorClass = computed(() => {
  // 基础AC为10，如果有护甲数据则使用
  return characterStore.characterData.armorClass?.total || 10;
});

const movement = computed(() => {
  const race = subraceData.value || raceData.value;
  if (!race?.movement) return 12;
  return race.movement.ground || 12;
});

// 战斗数据
const classCategory = computed(() => {
  const classId = characterStore.characterData.class;
  if (!classId) return 'warrior';
  return getClassCategory(classId);
});

const thac0 = computed(() => {
  return getTHAC0(classCategory.value, 1);
});

const savingThrows = computed(() => {
  return getSavingThrows(classCategory.value, 1);
});

// 熟练
const weaponProfs = computed(() => {
  return characterStore.characterData.weaponProficiencies.map(id => {
    const weapon = getWeaponById(id);
    return {
      id,
      name: weapon?.name || id,
      isSpecialized: characterStore.characterData.weaponSpecializations.includes(id),
    };
  });
});

const nonweaponProfs = computed(() => {
  return characterStore.characterData.nonweaponProficiencies.map(prof => {
    const profData = getProficiencyById(prof.id);
    return {
      id: prof.id,
      name: profData?.name || prof.id,
      slots: prof.slots,
    };
  });
});

const languageSlotsInfo = computed(() => {
  const toWeapon = characterStore.characterData.languageSlotsToWeapon;
  const toNonweapon = characterStore.characterData.languageSlotsToNonweapon;
  if (toWeapon === 0 && toNonweapon === 0) return null;
  const parts = [];
  if (toWeapon > 0) parts.push(`${toWeapon}槽转武器熟练`);
  if (toNonweapon > 0) parts.push(`${toNonweapon}槽转非武器熟练`);
  return parts.join(', ');
});

// 装备与财富
const startingMoney = computed(() => characterStore.characterData.startingMoney);
const currentMoney = computed(() => characterStore.characterData.currentMoney);

const groupedEquipment = computed(() => {
  const equipment = characterStore.characterData.purchasedEquipment;
  const groups = new Map<string, typeof equipment>();

  equipment.forEach(item => {
    const category = item.category || '其他';
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(item);
  });

  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    items,
  }));
});

// 法术
const hasSpells = computed(() => {
  return characterStore.canCastSpellsAtLevel1();
});

const isWizard = computed(() => classData.value?.spellcasting?.type === 'wizard');
const isPriest = computed(() => classData.value?.spellcasting?.type === 'priest');

const spellSlots = computed(() => {
  if (!hasSpells.value || !classData.value) return {};

  const slots: Record<string, { base: number; bonus: number; total: number }> = {};
  const progression = classData.value.spellcasting?.spellProgression;
  if (!progression) return {};

  const level1Progression = progression.find(p => p.level === 1);
  if (!level1Progression) return {};

  level1Progression.spells.forEach((baseSlots, index) => {
    if (baseSlots > 0) {
      const spellLevel = index + 1;
      const bonusSlots = characterStore.getBonusSpellSlots(spellLevel);
      slots[`${spellLevel}`] = {
        base: baseSlots,
        bonus: bonusSlots,
        total: baseSlots + bonusSlots,
      };
    }
  });

  return slots;
});

const memorizedSpells = computed(() => {
  const spells = characterStore.characterData.spells?.memorizedSpells;
  if (!spells) return {};

  const result: Record<string, string[]> = {};
  Object.entries(spells).forEach(([key, spellIds]) => {
    const level = key.replace('level', '');
    if (spellIds.length > 0) {
      result[level] = spellIds.map(id => {
        // 这里应该根据法术ID获取法术名称，但为了简化直接显示ID
        // 在实际应用中应该导入法术数据并查找名称
        return id;
      });
    }
  });

  return result;
});

const majorSpheres = computed(() => classData.value?.spellSpheres?.major || []);
const minorSpheres = computed(() => classData.value?.spellSpheres?.minor || []);

// 角色信息
const appearance = computed(() => characterStore.characterData.appearance);
const background = computed(() => characterStore.characterData.background);
const penisSize = computed(() => characterStore.characterData.penisSize);

const hasCharacterInfo = computed(() => {
  return Boolean(appearance.value || background.value || (gender.value === 'male' && penisSize.value));
});

const penisSizeText = computed(() => {
  const size = penisSize.value;
  if (!size) return '';
  const sizeMap: Record<string, string> = {
    xs: '特小',
    s: '偏小',
    m: '平均',
    l: '偏大',
    xl: '特大',
    xxl: '超大',
  };
  return sizeMap[size] || size;
});

// 种族特性
const raceAbilities = computed(() => {
  const race = subraceData.value || raceData.value;
  return race?.abilities || [];
});

const raceAdvantages = computed(() => {
  const race = subraceData.value || raceData.value;
  return race?.specialAdvantages || '';
});

const raceDisadvantages = computed(() => {
  const race = subraceData.value || raceData.value;
  return race?.specialDisadvantages || '';
});

// 职业特性
const classAbilities = computed(() => {
  const cls = classData.value;
  if (!cls) return [];
  return cls.specialAbilities.filter(a => a.level === 1);
});

const classNotes = computed(() => {
  return classData.value?.specialNotes || [];
});

// 完成创建
async function completeCreation() {
  console.log('🎯 [Step11] 开始完成创建...');

  if (isCreating.value) {
    console.log('[Step11] 正在创建中，忽略重复点击');
    toastr.warning('正在创建中，请勿重复点击');
    return;
  }

  isCreating.value = true;
  toastr.info('正在创建角色，请稍候...');

  try {
    // 1. 标记角色创建完成（使用 updateCharacterData）
    console.log('[Step11] 步骤1: 标记角色创建完成');
    characterStore.updateCharacterData(data => {
      data.completed = true;
    });

    // 2. 生成文本角色卡
    console.log('[Step11] 步骤2: 生成角色卡文本');
    const characterCardText = characterStore.generateCharacterCardText();
    console.log('[Step11] 角色卡文本长度:', characterCardText.length);

    // 3. 保存到角色卡变量（核心步骤，必须完成）
    console.log('[Step11] 步骤3: 保存到角色卡变量');
    const characterDataToSave = {
      ...characterStore.characterData,
      abilities: characterStore.adjustedAbilities,
      completed: true,
      // 保存计算后的战斗数据
      thac0: thac0.value,
      savingThrows: savingThrows.value,
      movement: movement.value,
    };

    replaceVariables(
      {
        adnd2e: {
          character: characterDataToSave,
          messages: [
            {
              role: 'system',
              content: characterCardText,
              name: '角色卡',
            },
          ],
          lastSaved: new Date().toISOString(),
        },
      },
      { type: 'character' },
    );
    console.log('[Step11] 角色卡变量保存完成');

    // 4. 发送角色卡为第一条消息到酒馆聊天
    console.log('[Step11] 步骤4: 发送角色卡到聊天');
    try {
      const lastMessageId = getLastMessageId();
      console.log(`📝 [Step11] 当前最后消息ID: ${lastMessageId}`);

      // 无论聊天是否为空，都发送角色卡作为第一条可被 AI 读取的系统消息
      // 这样可以确保 AI 能够读取到角色的完整信息
      if (lastMessageId < 0) {
        console.log('[Step11] 聊天为空，发送角色卡作为第一条消息');
        await createChatMessages([
          {
            role: 'system',
            name: 'ADND 2E 角色卡',
            message: characterCardText,
            is_hidden: false,
          },
        ]);
        console.log('[Step11] 角色卡已发送到聊天');
      } else {
        console.log('[Step11] 聊天中已有消息，检查是否已有角色卡...');
        // 即使聊天中已有消息，也在第一条消息前插入角色卡
        // 以确保 AI 能够在对话开始时就知道角色的完整信息
        const messages = getChatMessages('0-{{lastMessageId}}');
        const hasCharacterCard = messages.some(msg => msg.name === 'ADND 2E 角色卡' || msg.name === '角色卡');

        if (!hasCharacterCard) {
          console.log('[Step11] 未找到角色卡消息，在开头插入角色卡');
          await createChatMessages(
            [
              {
                role: 'system',
                name: 'ADND 2E 角色卡',
                message: characterCardText,
                is_hidden: false,
              },
            ],
            { insert_at: -1 },
          );
          console.log('[Step11] 角色卡已插入到聊天开头');
        } else {
          console.log('[Step11] 角色卡消息已存在，跳过发送');
        }
      }
    } catch (error) {
      console.error('[Step11] 发送角色卡到聊天失败:', error);
      // 不抛出错误，因为角色创建的核心步骤（保存到变量）已完成
      toastr.warning('角色卡发送到聊天失败，但角色数据已保存');
    }

    // 清除 loading toastr
    toastr.clear();

    // 5. 显示成功提示并立即跳转
    console.log('[Step11] 步骤5: 跳转到游戏界面');
    toastr.success('角色创建完成！进入游戏...');

    // 立即跳转，不使用 setTimeout
    console.log('[Step11] 正在执行路由跳转...');
    await router.push('/game');
    console.log('[Step11] 路由跳转完成，所有步骤完成');

    isCreating.value = false;
  } catch (error) {
    console.error('❌ [Step11] 创建失败:', error);
    toastr.clear();
    toastr.error('角色创建失败: ' + (error as Error).message);
    if (error instanceof Error) {
      console.error('错误堆栈:', error.stack);
    }
    isCreating.value = false;
  }
}

function goBack() {
  characterStore.updateCharacterData(data => {
    data.step = 10;
  });
}

// 辅助函数：将中文属性名转换为英文key
function getAbilityKey(chineseName: string): keyof Abilities {
  const map: Record<string, keyof Abilities> = {
    力量: 'str',
    敏捷: 'dex',
    体质: 'con',
    智力: 'int',
    灵知: 'wis',
    魅力: 'cha',
  };
  return map[chineseName] || 'str';
}
</script>

<style scoped lang="scss">
.step11-character-sheet {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.sheet-header {
  text-align: center;
  margin-bottom: 32px;

  h2 {
    font-size: 32px;
    margin-bottom: 8px;
    color: #8b4513;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .subtitle {
    font-size: 16px;
    color: #666;
  }
}

.character-sheet-container {
  margin-bottom: 24px;
}

.character-sheet {
  border: 3px solid #8b4513;
  background: #f9f6f0;
  font-family: '临海体', serif;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

  section {
    border: 2px solid #8b4513;
    padding: 20px;
    margin: 16px;
    background: linear-gradient(to bottom, #fffef8, #f5f2e8);
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);

    h3 {
      border-bottom: 2px solid #8b4513;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      font-size: 20px;
      color: #8b4513;
      font-weight: bold;
    }

    h4 {
      font-size: 16px;
      margin: 16px 0 8px 0;
      text-decoration: underline;
      color: #8b4513;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;

    &.full-width {
      grid-column: 1 / -1;
    }

    .label {
      font-weight: bold;
      color: #666;
    }

    .value {
      color: #000;

      &.bonus {
        color: #28a745;
        font-weight: bold;
      }

      &.penalty {
        color: #dc3545;
        font-weight: bold;
      }
    }
  }
}

.abilities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;

  .ability-box {
    border: 2px solid #8b4513;
    padding: 16px;
    text-align: center;
    background: #fff;
    border-radius: 8px;

    .ability-name {
      font-size: 14px;
      font-weight: bold;
      color: #666;
      margin-bottom: 8px;
    }

    .ability-value {
      font-size: 28px;
      font-weight: bold;
      color: #8b4513;
      margin-bottom: 4px;
    }

    .ability-adjust {
      font-size: 12px;
      color: #666;
    }
  }
}

.exceptional-strength {
  margin-top: 16px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #8b4513;
}

.combat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;

  .combat-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;

    .label {
      font-weight: bold;
      color: #666;
    }

    .value {
      color: #000;
      font-weight: bold;
    }
  }
}

.saving-throws {
  background: white;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #ddd;

  .throws-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    font-size: 14px;
  }
}

.proficiency-subsection {
  margin-bottom: 16px;

  ul {
    list-style-type: disc;
    padding-left: 24px;
    margin: 8px 0;

    li {
      margin: 4px 0;
    }
  }
}

.money-info {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  font-weight: bold;
  font-size: 16px;
}

.equipment-list {
  .equipment-group {
    margin-bottom: 16px;

    ul {
      list-style-type: disc;
      padding-left: 24px;
      margin: 8px 0;

      li {
        margin: 4px 0;

        .weight {
          color: #666;
          font-size: 14px;
        }
      }
    }
  }
}

.spell-slots {
  margin-bottom: 16px;

  .slots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    margin-top: 8px;

    .bonus {
      color: #28a745;
      font-weight: bold;
    }
  }
}

.spellbook,
.spell-spheres {
  margin-top: 16px;

  div {
    margin: 8px 0;
  }
}

.info-subsection {
  margin-bottom: 16px;

  p {
    white-space: pre-wrap;
    line-height: 1.6;
  }
}

.abilities-list {
  .ability-item {
    margin: 12px 0;
    line-height: 1.6;

    strong {
      color: #8b4513;
    }
  }
}

.subsection {
  margin-top: 16px;

  ul {
    list-style-type: disc;
    padding-left: 24px;
    margin: 8px 0;

    li {
      margin: 4px 0;
      line-height: 1.6;
    }
  }
}

.empty-text {
  color: #999;
  font-style: italic;
}

.bottom-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;

  .adnd-button {
    flex: 1;
    max-width: 300px;
    padding: 16px 32px;
    font-size: 18px;
    font-weight: bold;
    border: 2px solid #8b4513;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .button-icon {
      font-size: 20px;
    }

    &.primary {
      background: linear-gradient(135deg, #d4af37, #c9a227);
      color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);

      &:hover {
        background: linear-gradient(135deg, #e0bb44, #d4af37);
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.4);
      }
    }

    &.secondary {
      background: white;
      color: #8b4513;

      &:hover {
        background: #f5f2e8;
        transform: translateY(-2px);
      }
    }
  }
}
</style>
