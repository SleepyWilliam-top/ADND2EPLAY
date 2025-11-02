<template>
  <div class="adnd-status-panel" :class="{ 'in-modal': props.isInModal }">
    <!-- 标签页导航 -->
    <div class="panel-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <i :class="tab.icon"></i>
        {{ tab.label }}
      </div>
    </div>

    <!-- 标签页内容 -->
    <div class="panel-content">
      <!-- 基本信息标签 -->
      <div v-show="activeTab === 'basic'" class="tab-pane">
        <div class="info-row">
          <span class="label">姓名</span>
          <span class="value">{{ characterName }}</span>
        </div>
        <div class="info-row">
          <span class="label">性别</span>
          <span class="value">{{ characterGender }}</span>
        </div>
        <div class="info-row">
          <span class="label">种族</span>
          <span class="value">{{ characterRace }}</span>
        </div>
        <div class="info-row">
          <span class="label">职业</span>
          <span class="value">{{ characterClass }}</span>
        </div>
        <div class="info-row">
          <span class="label">阵营</span>
          <span class="value">{{ characterAlignment }}</span>
        </div>
        <div class="info-row">
          <span class="label">等级</span>
          <span class="value">{{ characterLevel }}</span>
        </div>
        <div class="info-row">
          <span class="label">经验值</span>
          <span class="value">{{ characterExperience }}</span>
        </div>
      </div>

      <!-- 属性标签 -->
      <div v-show="activeTab === 'attributes'" class="tab-pane attributes-pane">
        <!-- 力量 -->
        <div class="ability-section" :class="{ collapsed: collapsedSections.str }">
          <div class="ability-header" @click="toggleSection('str')">
            <span class="ability-name">力量 (STR)</span>
            <span class="ability-score">{{ strength }}</span>
            <span class="collapse-icon">{{ collapsedSections.str ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.str" class="ability-modifiers">
            <div class="modifier-row">
              <span class="mod-label">命中率:</span>
              <span class="mod-value">{{ strMods.hitProb }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">伤害调整:</span>
              <span class="mod-value">{{ strMods.damage }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">负重:</span>
              <span class="mod-value">{{ strMods.weight }} 磅</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">最大负重:</span>
              <span class="mod-value">{{ strMods.maxPress }} 磅</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">开门:</span>
              <span class="mod-value">{{ strMods.openDoors }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">弯杆/举门:</span>
              <span class="mod-value">{{ strMods.bendBars }}</span>
            </div>
          </div>
        </div>

        <!-- 敏捷 -->
        <div class="ability-section" :class="{ collapsed: collapsedSections.dex }">
          <div class="ability-header" @click="toggleSection('dex')">
            <span class="ability-name">敏捷 (DEX)</span>
            <span class="ability-score">{{ dexterity }}</span>
            <span class="collapse-icon">{{ collapsedSections.dex ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.dex" class="ability-modifiers">
            <div class="modifier-row">
              <span class="mod-label">突袭反应:</span>
              <span class="mod-value">{{ dexMods.surprise }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">远程攻击:</span>
              <span class="mod-value">{{ dexMods.missile }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">防御调整:</span>
              <span class="mod-value">{{ dexMods.defense }}</span>
            </div>
          </div>
        </div>

        <!-- 体质 -->
        <div class="ability-section" :class="{ collapsed: collapsedSections.con }">
          <div class="ability-header" @click="toggleSection('con')">
            <span class="ability-name">体质 (CON)</span>
            <span class="ability-score">{{ constitution }}</span>
            <span class="collapse-icon">{{ collapsedSections.con ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.con" class="ability-modifiers">
            <div class="modifier-row">
              <span class="mod-label">HP调整:</span>
              <span class="mod-value">{{ conMods.hpAdjust }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">身体休克:</span>
              <span class="mod-value">{{ conMods.systemShock }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">复生存活:</span>
              <span class="mod-value">{{ conMods.resurrection }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">毒素豁免:</span>
              <span class="mod-value">{{ conMods.poison }}</span>
            </div>
            <div v-if="conMods.regeneration !== '无'" class="modifier-row">
              <span class="mod-label">再生:</span>
              <span class="mod-value">{{ conMods.regeneration }}</span>
            </div>
          </div>
        </div>

        <!-- 智力 -->
        <div class="ability-section" :class="{ collapsed: collapsedSections.int }">
          <div class="ability-header" @click="toggleSection('int')">
            <span class="ability-name">智力 (INT)</span>
            <span class="ability-score">{{ intelligence }}</span>
            <span class="collapse-icon">{{ collapsedSections.int ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.int" class="ability-modifiers">
            <div class="modifier-row">
              <span class="mod-label">语言数量:</span>
              <span class="mod-value">{{ intMods.languages }}</span>
            </div>
            <div v-if="intMods.spellLevel !== '--'" class="modifier-row">
              <span class="mod-label">法术等级:</span>
              <span class="mod-value">{{ intMods.spellLevel }}</span>
            </div>
            <div v-if="intMods.learnSpell !== '--'" class="modifier-row">
              <span class="mod-label">习得几率:</span>
              <span class="mod-value">{{ intMods.learnSpell }}</span>
            </div>
            <div v-if="intMods.maxSpells !== '--'" class="modifier-row">
              <span class="mod-label">每级上限:</span>
              <span class="mod-value">{{ intMods.maxSpells }}</span>
            </div>
            <div v-if="intMods.immunity !== '--'" class="modifier-row">
              <span class="mod-label">幻术免疫:</span>
              <span class="mod-value">{{ intMods.immunity }}</span>
            </div>
          </div>
        </div>

        <!-- 灵知 -->
        <div class="ability-section" :class="{ collapsed: collapsedSections.wis }">
          <div class="ability-header" @click="toggleSection('wis')">
            <span class="ability-name">灵知 (WIS)</span>
            <span class="ability-score">{{ wisdom }}</span>
            <span class="collapse-icon">{{ collapsedSections.wis ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.wis" class="ability-modifiers">
            <div class="modifier-row">
              <span class="mod-label">魔法防御:</span>
              <span class="mod-value">{{ wisMods.magicDefense }}</span>
            </div>
            <div v-if="wisMods.bonusSpells !== '--'" class="modifier-row">
              <span class="mod-label">奖励法术:</span>
              <span class="mod-value">{{ wisMods.bonusSpells }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">施法失败:</span>
              <span class="mod-value">{{ wisMods.spellFailure }}</span>
            </div>
            <div v-if="wisMods.immunity !== '--'" class="modifier-row">
              <span class="mod-label">法术免疫:</span>
              <span class="mod-value">{{ wisMods.immunity }}</span>
            </div>
          </div>
        </div>

        <!-- 魅力 -->
        <div class="ability-section" :class="{ collapsed: collapsedSections.cha }">
          <div class="ability-header" @click="toggleSection('cha')">
            <span class="ability-name">魅力 (CHA)</span>
            <span class="ability-score">{{ charisma }}</span>
            <span class="collapse-icon">{{ collapsedSections.cha ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.cha" class="ability-modifiers">
            <div class="modifier-row">
              <span class="mod-label">追随者上限:</span>
              <span class="mod-value">{{ chaMods.maxHenchmen }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">基础忠诚:</span>
              <span class="mod-value">{{ chaMods.loyalty }}</span>
            </div>
            <div class="modifier-row">
              <span class="mod-label">反应调整:</span>
              <span class="mod-value">{{ chaMods.reaction }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 战斗标签 -->
      <div v-show="activeTab === 'combat'" class="tab-pane">
        <div class="info-row">
          <span class="label">生命值</span>
          <span class="value">{{ char.hitPoints?.current ?? 10 }} / {{ char.hitPoints?.max ?? 10 }}</span>
        </div>
        <div class="info-row">
          <span class="label">护甲等级(AC)</span>
          <span class="value">{{ char.armorClass?.total ?? 10 }}</span>
        </div>
        <div class="info-row">
          <span class="label">THAC0</span>
          <span class="value">{{ char.thac0 ?? 20 }}</span>
        </div>
        <div class="info-row">
          <span class="label">移动力</span>
          <span class="value">{{ char.movement ?? 12 }}</span>
        </div>
        <div class="info-row">
          <span class="label">#AT (每轮攻击次数)</span>
          <span class="value">{{ attacksPerRound }}</span>
        </div>

        <!-- 武器信息 -->
        <div class="collapsible-section" :class="{ collapsed: collapsedSections.equippedWeapons }">
          <div class="section-title clickable" @click="toggleSection('equippedWeapons')">
            装备武器
            <span class="collapse-icon">{{ collapsedSections.equippedWeapons ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.equippedWeapons">
            <div v-if="equippedWeapons.length > 0" class="weapon-list">
              <div
                v-for="weapon in equippedWeapons"
                :key="weapon.id"
                class="weapon-detail"
                :class="{ collapsed: isWeaponCollapsed(weapon.id) }"
              >
                <div class="weapon-header clickable" @click="toggleWeapon(weapon.id)">
                  <span class="weapon-name">{{ weapon.name }}</span>
                  <span v-if="weapon.quantity > 1" class="weapon-quantity">x{{ weapon.quantity }}</span>
                  <span class="collapse-icon">{{ isWeaponCollapsed(weapon.id) ? '▼' : '▲' }}</span>
                </div>
                <div v-show="!isWeaponCollapsed(weapon.id)" class="weapon-stats">
                  <div class="weapon-stat-row">
                    <span class="stat-label">种类:</span>
                    <span class="stat-value">{{ weapon.weaponType }}</span>
                  </div>
                  <div class="weapon-stat-row">
                    <span class="stat-label">速率:</span>
                    <span class="stat-value">{{ weapon.speed }}</span>
                  </div>
                  <div class="weapon-stat-row">
                    <span class="stat-label">THAC0:</span>
                    <span class="stat-value">{{ char.thac0 ?? 20 }}</span>
                  </div>
                  <div class="weapon-stat-row">
                    <span class="stat-label">#AT:</span>
                    <span class="stat-value">{{ weapon.attacksPerRound }}</span>
                  </div>
                  <div class="weapon-stat-row">
                    <span class="stat-label">命中调整:</span>
                    <span class="stat-value">{{ weapon.hitBonus }}</span>
                  </div>
                  <div class="weapon-stat-row">
                    <span class="stat-label">伤害值:</span>
                    <span class="stat-value">
                      <template v-if="weapon.ammunition">
                        对S: {{ weapon.ammunition.damageS }}
                        {{ weapon.damageBonus !== '+0' ? weapon.damageBonus : '' }} / 对L:
                        {{ weapon.ammunition.damageL }} {{ weapon.damageBonus !== '+0' ? weapon.damageBonus : '' }}
                      </template>
                      <template v-else>
                        对S: {{ weapon.damageS }} {{ weapon.damageBonus !== '+0' ? weapon.damageBonus : '' }} / 对L:
                        {{ weapon.damageL }} {{ weapon.damageBonus !== '+0' ? weapon.damageBonus : '' }}
                      </template>
                    </span>
                  </div>
                  <div v-if="weapon.ammunition" class="weapon-stat-row ammunition-row">
                    <span class="stat-label">弹药:</span>
                    <span class="stat-value">{{ weapon.ammunition.name }} (x{{ weapon.ammunition.quantity }})</span>
                  </div>
                  <div class="weapon-stat-row">
                    <span class="stat-label">伤害类型:</span>
                    <span class="stat-value">{{ weapon.damageTypeText }}</span>
                  </div>
                  <div class="weapon-stat-row">
                    <span class="stat-label">尺寸:</span>
                    <span class="stat-value">{{ weapon.sizeText }}</span>
                  </div>
                  <div v-if="weapon.range" class="weapon-stat-row">
                    <span class="stat-label">射程:</span>
                    <span class="stat-value"
                      >近{{ weapon.range.short }}/中{{ weapon.range.medium }}/远{{ weapon.range.long }}</span
                    >
                  </div>
                  <div v-if="weapon.rof" class="weapon-stat-row">
                    <span class="stat-label">射速:</span>
                    <span class="stat-value">{{ weapon.rof }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-text">未装备武器</div>
          </div>
        </div>
      </div>

      <!-- 技能标签 -->
      <div v-show="activeTab === 'skills'" class="tab-pane">
        <div class="collapsible-section" :class="{ collapsed: collapsedSections.weaponProf }">
          <div class="section-title clickable" @click="toggleSection('weaponProf')">
            武器熟练
            <span class="collapse-icon">{{ collapsedSections.weaponProf ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.weaponProf" class="skill-list">
            <div v-for="weapon in translatedWeaponProfs" :key="weapon" class="skill-item">{{ weapon }}</div>
            <div v-if="translatedWeaponProfs.length === 0" class="empty-text">无</div>
          </div>
        </div>

        <div class="collapsible-section" :class="{ collapsed: collapsedSections.weaponSpec }">
          <div class="section-title clickable" @click="toggleSection('weaponSpec')">
            武器专精
            <span class="collapse-icon">{{ collapsedSections.weaponSpec ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.weaponSpec" class="skill-list">
            <div v-for="weapon in translatedWeaponSpecs" :key="weapon" class="skill-item">{{ weapon }}</div>
            <div v-if="translatedWeaponSpecs.length === 0" class="empty-text">无</div>
          </div>
        </div>

        <div class="collapsible-section" :class="{ collapsed: collapsedSections.nonweaponProf }">
          <div class="section-title clickable" @click="toggleSection('nonweaponProf')">
            非武器熟练
            <span class="collapse-icon">{{ collapsedSections.nonweaponProf ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.nonweaponProf" class="skill-list">
            <div
              v-for="prof in translatedNonweaponProfs"
              :key="prof.id"
              class="skill-item clickable-skill"
              @click="showProficiencyDetail(prof.id)"
            >
              {{ prof.名称 }}
              <span class="info-icon">ℹ️</span>
            </div>
            <div v-if="translatedNonweaponProfs.length === 0" class="empty-text">无</div>
          </div>
        </div>

        <!-- 盗贼技能 -->
        <div
          v-if="shouldShowThiefSkills"
          class="collapsible-section"
          :class="{ collapsed: collapsedSections.thiefSkills }"
        >
          <div class="section-title clickable" @click="toggleSection('thiefSkills')">
            盗贼技能
            <span v-if="!isThief" class="skill-note">(种族能力)</span>
            <span class="collapse-icon">{{ collapsedSections.thiefSkills ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.thiefSkills" class="thief-skills-grid">
            <div v-for="skill in displayedThiefSkills" :key="skill.id" class="thief-skill-item">
              <div class="skill-name-row">
                <span class="skill-name">{{ skill.name }}</span>
                <span class="skill-value">{{ skill.value }}%</span>
              </div>
              <div class="skill-description">{{ skill.description }}</div>
              <div v-if="skill.breakdown" class="skill-breakdown">
                {{ skill.breakdown }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 特性标签 -->
      <div v-show="activeTab === 'abilities'" class="tab-pane">
        <div class="collapsible-section" :class="{ collapsed: collapsedSections.racialAbilities }">
          <div class="section-title clickable" @click="toggleSection('racialAbilities')">
            种族能力
            <span class="collapse-icon">{{ collapsedSections.racialAbilities ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.racialAbilities" class="ability-list">
            <div v-for="ability in racialAbilities" :key="ability.名称" class="ability-item">
              <div class="ability-name">{{ ability.名称 }}</div>
              <div class="ability-desc">{{ ability.描述 }}</div>
            </div>
            <div v-if="racialAbilities.length === 0" class="empty-text">无</div>
          </div>
        </div>

        <div class="collapsible-section" :class="{ collapsed: collapsedSections.classAbilities }">
          <div class="section-title clickable" @click="toggleSection('classAbilities')">
            职业能力
            <span class="collapse-icon">{{ collapsedSections.classAbilities ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.classAbilities" class="ability-list">
            <div
              v-for="ability in classAbilities"
              :key="ability.名称"
              class="ability-item clickable-ability"
              @click="showClassAbilityDetail(ability)"
            >
              <div class="ability-name">
                {{ ability.名称 }}
                <span class="info-icon">ℹ️</span>
              </div>
              <div class="ability-desc">{{ ability.描述 }}</div>
            </div>
            <div v-if="classAbilities.length === 0" class="empty-text">无</div>
          </div>
        </div>
      </div>

      <!-- 装备标签 -->
      <div v-show="activeTab === 'equipment'" class="tab-pane">
        <div class="collapsible-section" :class="{ collapsed: collapsedSections.currency }">
          <div class="section-title clickable" @click="toggleSection('currency')">
            货币
            <span class="collapse-icon">{{ collapsedSections.currency ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.currency" class="info-row">
            <span class="label">金币(GP)</span>
            <span class="value">{{ Math.floor(char.currentMoney ?? 0) }}</span>
          </div>
        </div>

        <div class="collapsible-section" :class="{ collapsed: collapsedSections.backpack }">
          <div class="section-title clickable" @click="toggleSection('backpack')">
            背包
            <span class="collapse-icon">{{ collapsedSections.backpack ? '▼' : '▲' }}</span>
          </div>
          <div v-show="!collapsedSections.backpack" class="equipment-list">
            <div v-for="(item, index) in char.purchasedEquipment" :key="index" class="equipment-item">
              {{ item.name }} x{{ item.quantity }}
            </div>
            <div v-if="!char.purchasedEquipment || char.purchasedEquipment.length === 0" class="empty-text">空</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 非武器熟练详情弹窗 -->
  <div v-if="showProfDetail" class="proficiency-modal" @click.self="closeProfDetail">
    <div class="proficiency-modal-content">
      <div class="modal-header">
        <h2>{{ selectedProficiency?.name }}</h2>
        <button class="close-button" @click="closeProfDetail">✕</button>
      </div>
      <div v-if="selectedProficiency" class="modal-body">
        <div class="prof-info-row">
          <span class="prof-label">英文名:</span>
          <span class="prof-value">{{ selectedProficiency.englishName }}</span>
        </div>
        <div class="prof-info-row">
          <span class="prof-label">分组:</span>
          <span class="prof-value">{{ getProfGroupName(selectedProficiency.group) }}</span>
        </div>
        <div class="prof-info-row">
          <span class="prof-label">槽位消耗:</span>
          <span class="prof-value">{{ selectedProficiency.slots }}槽</span>
        </div>
        <div class="prof-info-row">
          <span class="prof-label">相关属性:</span>
          <span class="prof-value">{{ getAbilityName(selectedProficiency.relatedAbility) }}</span>
        </div>
        <div class="prof-info-row">
          <span class="prof-label">检定调整:</span>
          <span class="prof-value"
            >{{ selectedProficiency.checkModifier >= 0 ? '+' : '' }}{{ selectedProficiency.checkModifier }}</span
          >
        </div>
        <div class="prof-description">
          <h3>详细说明</h3>
          <p>{{ selectedProficiency.description }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 职业能力详情弹窗 -->
  <div v-if="showAbilityDetail" class="proficiency-modal" @click.self="closeAbilityDetail">
    <div class="proficiency-modal-content">
      <div class="modal-header">
        <h2>{{ selectedAbility?.name }}</h2>
        <button class="close-button" @click="closeAbilityDetail">✕</button>
      </div>
      <div v-if="selectedAbility" class="modal-body">
        <div v-if="selectedAbility.level" class="prof-info-row">
          <span class="prof-label">获得等级:</span>
          <span class="prof-value">{{ selectedAbility.level }}级</span>
        </div>
        <div class="prof-description">
          <h3>详细说明</h3>
          <p>{{ selectedAbility.description }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 斥退亡灵详情模态框 -->
  <div v-if="showTurnUndead" class="proficiency-modal turn-undead-modal" @click.self="closeTurnUndeadDetail">
    <div class="proficiency-modal-content turn-undead-content">
      <div class="modal-header">
        <h2>{{ turnUndeadRules.title }}</h2>
        <button class="close-button" @click="closeTurnUndeadDetail">✕</button>
      </div>
      <div class="modal-body turn-undead-body">
        <!-- 简介 -->
        <div class="turn-section">
          <p>{{ turnUndeadRules.introduction }}</p>
          <p>{{ turnUndeadRules.mechanism }}</p>
        </div>

        <!-- 斥退亡灵表格 -->
        <div class="turn-section">
          <h3>表格61：斥退亡灵</h3>
          <div class="turn-table-wrapper">
            <table class="turn-undead-table">
              <thead>
                <tr>
                  <th>亡灵类型</th>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10-11</th>
                  <th>12-13</th>
                  <th>14+</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in turnUndeadTable" :key="row.undeadType">
                  <td class="undead-name">{{ row.undeadType }}</td>
                  <td
                    v-for="level in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14]"
                    :key="level"
                    :class="{
                      'result-auto-turn': row.results[level] === 'T',
                      'result-auto-destroy': row.results[level] === 'D',
                      'result-auto-destroy-plus': row.results[level] === 'D*',
                      'result-impossible': row.results[level] === '—',
                      'current-level':
                        (level === 10 && effectiveTurnLevel >= 10 && effectiveTurnLevel <= 11) ||
                        (level === 13 && effectiveTurnLevel >= 12 && effectiveTurnLevel <= 13) ||
                        (level === 14 && effectiveTurnLevel >= 14) ||
                        (level < 10 && level === effectiveTurnLevel),
                    }"
                  >
                    {{ row.results[level] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="turn-notes">
            <p v-for="(note, index) in turnUndeadRules.notes" :key="index" class="note-item">{{ note }}</p>
          </div>
        </div>

        <!-- 如何使用 -->
        <div class="turn-section">
          <h3>{{ turnUndeadRules.howToUse.title }}</h3>
          <ul>
            <li v-for="(item, index) in turnUndeadRules.howToUse.content" :key="index">{{ item }}</li>
          </ul>
        </div>

        <!-- 结算斥退 -->
        <div class="turn-section">
          <h3>{{ turnUndeadRules.resolution.title }}</h3>
          <ul>
            <li v-for="(item, index) in turnUndeadRules.resolution.content" :key="index">{{ item }}</li>
          </ul>
        </div>

        <!-- 示例 -->
        <div class="turn-section turn-example">
          <h3>{{ turnUndeadRules.example.title }}</h3>
          <p>{{ turnUndeadRules.example.content }}</p>
        </div>

        <!-- 斥退效果 -->
        <div class="turn-section">
          <h3>{{ turnUndeadRules.effects.title }}</h3>
          <ul>
            <li v-for="(item, index) in turnUndeadRules.effects.content" :key="index">{{ item }}</li>
          </ul>
        </div>

        <!-- 邪恶祭司与亡灵 -->
        <div class="turn-section">
          <h3>{{ turnUndeadRules.evilPriests.title }}</h3>
          <ul>
            <li v-for="(item, index) in turnUndeadRules.evilPriests.content" :key="index">{{ item }}</li>
          </ul>
        </div>

        <!-- 斥退圣武士 -->
        <div class="turn-section">
          <h3>{{ turnUndeadRules.turningPaladins.title }}</h3>
          <ul>
            <li v-for="(item, index) in turnUndeadRules.turningPaladins.content" :key="index">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  getCharismaModifiers,
  getConstitutionModifiers,
  getDexterityModifiers,
  getIntelligenceModifiers,
  getStrengthModifiers,
  getWisdomModifiers,
} from '../utils/abilityCalculator';
import { getAlignmentById } from '../utils/alignmentData';
import { getClassById } from '../utils/classData';
import type { Weapon } from '../utils/equipmentData';
import { getEquipmentById } from '../utils/equipmentData';
import { getGroupName, getProficiencyById, type NonweaponProficiency } from '../utils/proficiencyData';
import { getRaceById, getSubraceById } from '../utils/raceData';
import {
  getDexterityAdjustments,
  parseRaceThiefSkillAdjustments,
  thiefBaseSkills,
  thiefSkillsData,
} from '../utils/thiefSkillsData';
import { turnUndeadRules, turnUndeadTable } from '../utils/turnUndeadData';
import { getWeaponById } from '../utils/weaponData';

const props = defineProps<{
  isInModal?: boolean; // 是否在弹窗中显示
}>();

const activeTab = ref('basic');

// 折叠状态管理（默认全部折叠）
const collapsedSections = reactive<Record<string, boolean>>({
  str: true,
  dex: true,
  con: true,
  int: true,
  wis: true,
  cha: true,
  weaponProf: true,
  weaponSpec: true,
  nonweaponProf: true,
  thiefSkills: true,
  racialAbilities: true,
  classAbilities: true,
  equippedWeapons: true, // 装备武器
  currency: true, // 货币
  backpack: true, // 背包
});

// 武器详情折叠状态（默认全部折叠）
const collapsedWeapons = reactive<Record<string, boolean>>({});

// 切换折叠状态
function toggleSection(section: string) {
  collapsedSections[section] = !collapsedSections[section];
}

// 切换武器详情折叠状态
function toggleWeapon(weaponId: string) {
  if (collapsedWeapons[weaponId] === undefined) {
    collapsedWeapons[weaponId] = false;
  } else {
    collapsedWeapons[weaponId] = !collapsedWeapons[weaponId];
  }
}

// 检查武器是否折叠
function isWeaponCollapsed(weaponId: string): boolean {
  return collapsedWeapons[weaponId] ?? true; // 默认折叠
}

// 非武器熟练详情弹窗
const showProfDetail = ref(false);
const selectedProficiency = ref<NonweaponProficiency | null>(null);

function showProficiencyDetail(profId: string) {
  const prof = getProficiencyById(profId);
  if (prof) {
    selectedProficiency.value = prof;
    showProfDetail.value = true;
  }
}

function closeProfDetail() {
  showProfDetail.value = false;
  selectedProficiency.value = null;
}

// 职业能力详情弹窗
const showAbilityDetail = ref(false);
const selectedAbility = ref<{ name: string; description: string; level?: number } | null>(null);

function showClassAbilityDetail(ability: { 名称: string; 描述: string }) {
  // 检查是否为斥退亡灵能力
  if (ability.名称 === '斥退亡灵') {
    showTurnUndeadDetail();
    return;
  }

  // 从classData中查找完整的能力信息
  const classId = char.value?.class;
  if (classId) {
    const classData = getClassById(classId);
    if (classData) {
      const fullAbility = classData.specialAbilities.find(a => a.name === ability.名称);
      if (fullAbility) {
        selectedAbility.value = {
          name: fullAbility.name,
          description: fullAbility.description,
          level: fullAbility.level,
        };
        showAbilityDetail.value = true;
      }
    }
  }
}

function closeAbilityDetail() {
  showAbilityDetail.value = false;
  selectedAbility.value = null;
}

// 斥退亡灵详情弹窗
const showTurnUndead = ref(false);

function showTurnUndeadDetail() {
  showTurnUndead.value = true;
}

function closeTurnUndeadDetail() {
  showTurnUndead.value = false;
}

// 计算当前角色的有效等级（圣武士-2）
const effectiveTurnLevel = computed(() => {
  const level = char.value.level ?? 1;
  const classId = char.value?.class;
  if (classId === 'paladin') {
    return Math.max(1, level - 2);
  }
  return level;
});

function getProfGroupName(group: string) {
  return getGroupName(group as any);
}

function getAbilityName(ability: string) {
  const names: Record<string, string> = {
    str: '力量',
    dex: '敏捷',
    con: '体质',
    int: '智力',
    wis: '灵知',
    cha: '魅力',
    none: '无',
  };
  return names[ability] || ability;
}

const tabs = [
  { id: 'basic', label: '基本', icon: 'fas fa-user' },
  { id: 'attributes', label: '属性', icon: 'fas fa-dumbbell' },
  { id: 'combat', label: '战斗', icon: 'fas fa-shield-alt' },
  { id: 'skills', label: '技能', icon: 'fas fa-book' },
  { id: 'abilities', label: '特性', icon: 'fas fa-star' },
  { id: 'equipment', label: '装备', icon: 'fas fa-shopping-bag' },
];

// 从角色卡变量读取角色数据
const char = computed(() => {
  const charVars = getVariables({ type: 'character' });
  return charVars?.adnd2e?.character || {};
});

// 使用酒馆的用户名作为默认值
const defaultName = (typeof SillyTavern !== 'undefined' && SillyTavern.name1) || 'Player';

// 基本信息
const characterName = computed(() => char.value.characterName || defaultName);
const characterGender = computed(() =>
  char.value.gender === 'male' ? '男性' : char.value.gender === 'female' ? '女性' : '其他',
);

// 种族信息
const race = computed(() => (char.value.race ? getRaceById(char.value.race) : null));
const subrace = computed(() =>
  char.value.subrace && char.value.race ? getSubraceById(char.value.race, char.value.subrace) : null,
);
const characterRace = computed(() => {
  const r = race.value;
  const sr = subrace.value;
  if (sr) return `${r?.name}(${sr.name})`;
  return r?.name || '人类';
});

// 职业信息
const classInfo = computed(() => (char.value.class ? getClassById(char.value.class) : null));
const characterClass = computed(() => classInfo.value?.name || '战士');

// 阵营信息
const alignment = computed(() => (char.value.alignment ? getAlignmentById(char.value.alignment) : null));
const characterAlignment = computed(() => alignment.value?.name || '守序善良');

// 等级和经验值
const characterLevel = computed(() => char.value.level ?? 1);
const characterExperience = computed(() => char.value.experience ?? 0);

// 六项属性
const strength = computed(() => char.value.abilities?.str ?? 10);
const dexterity = computed(() => char.value.abilities?.dex ?? 10);
const constitution = computed(() => char.value.abilities?.con ?? 10);
const intelligence = computed(() => char.value.abilities?.int ?? 10);
const wisdom = computed(() => char.value.abilities?.wis ?? 10);
const charisma = computed(() => char.value.abilities?.cha ?? 10);

// 属性调整值
const strMods = computed(() => getStrengthModifiers(strength.value));
const dexMods = computed(() => getDexterityModifiers(dexterity.value));
const conMods = computed(() => getConstitutionModifiers(constitution.value));
const intMods = computed(() => getIntelligenceModifiers(intelligence.value));
const wisMods = computed(() => getWisdomModifiers(wisdom.value));
const chaMods = computed(() => getCharismaModifiers(charisma.value));

// 翻译武器熟练
const translatedWeaponProfs = computed(() =>
  (char.value.weaponProficiencies || []).map((id: string) => {
    const weapon = getWeaponById(id);
    return weapon?.name || id;
  }),
);

const translatedWeaponSpecs = computed(() =>
  (char.value.weaponSpecializations || []).map((id: string) => {
    const weapon = getWeaponById(id);
    return weapon?.name || id;
  }),
);

// 翻译非武器熟练
const translatedNonweaponProfs = computed(() =>
  (char.value.nonweaponProficiencies || []).map((prof: any) => {
    const profData = getProficiencyById(prof.id);
    return {
      id: prof.id,
      名称: profData?.name || prof.id,
      槽位: prof.slots,
    };
  }),
);

// 构建种族能力列表
const racialAbilities = computed(() => {
  const abilities: Array<{ 名称: string; 描述: string }> = [];
  const sr = subrace.value;
  const r = race.value;

  if (sr && sr.abilities.length > 0) {
    abilities.push(...sr.abilities.map(a => ({ 名称: a.name, 描述: a.description })));
  } else if (r) {
    abilities.push(...r.abilities.map(a => ({ 名称: a.name, 描述: a.description })));
  }
  return abilities;
});

// 构建职业能力列表
const classAbilities = computed(() => {
  const abilities: Array<{ 名称: string; 描述: string }> = [];
  const ci = classInfo.value;
  if (ci) {
    const level1Abilities = ci.specialAbilities.filter(a => a.level === 1);
    abilities.push(...level1Abilities.map(a => ({ 名称: a.name, 描述: a.description })));
  }
  return abilities;
});

// 弹药ID列表
const AMMUNITION_IDS = [
  'arrow-flight',
  'arrow-sheaf',
  'quarrel-hand',
  'quarrel-light',
  'quarrel-heavy',
  'dart-barbed',
  'dart-needle',
  'sling-bullet',
  'sling-stone',
];

// 弹药兼容性映射：武器ID -> 兼容的弹药ID列表
const AMMUNITION_COMPATIBILITY: Record<string, string[]> = {
  // 弓类武器使用箭矢
  'bow-short': ['arrow-flight', 'arrow-sheaf'],
  'bow-long': ['arrow-flight', 'arrow-sheaf'],
  'bow-composite-short': ['arrow-flight', 'arrow-sheaf'],
  'bow-composite-long': ['arrow-flight', 'arrow-sheaf'],
  // 弩类武器使用弩矢
  'crossbow-hand': ['quarrel-hand'],
  'crossbow-light': ['quarrel-light'],
  'crossbow-heavy': ['quarrel-heavy'],
  // 吹筒使用吹针/吹箭
  blowgun: ['dart-barbed', 'dart-needle'],
  // 投索使用弹丸/投石
  sling: ['sling-bullet', 'sling-stone'],
};

// 获取装备的武器列表
const equippedWeapons = computed(() => {
  const purchasedEquipment = char.value.purchasedEquipment || [];
  const weapons: Array<{
    id: string;
    name: string;
    quantity: number;
    weaponType: string;
    speed: number;
    damageS: string;
    damageL: string;
    damageTypeText: string;
    sizeText: string;
    range?: { short: number; medium: number; long: number };
    rof?: string;
    attacksPerRound: string;
    hitBonus: string;
    damageBonus: string;
    ammunition?: {
      // 已装填的弹药信息
      name: string;
      quantity: number;
      damageS: string;
      damageL: string;
    };
  }> = [];

  // 筛选出武器类别的装备（排除弹药）
  for (const item of purchasedEquipment) {
    if (item.category !== 'weapons') continue;

    // 跳过弹药类物品
    if (AMMUNITION_IDS.includes(item.id)) continue;

    const equipmentData = getEquipmentById(item.id);
    if (!equipmentData || equipmentData.category !== 'weapons') continue;

    const weaponData = equipmentData as Weapon;

    // 判断武器类型文本
    const typeMap: Record<string, string> = {
      B: '钝击',
      P: '穿刺',
      S: '挥砍',
      'P/B': '穿刺/钝击',
      'P/S': '穿刺/挥砍',
    };
    const weaponType = typeMap[weaponData.type] || weaponData.type;

    // 判断尺寸文本
    const sizeMap: Record<string, string> = {
      S: '小型',
      M: '中型',
      L: '大型',
    };
    const sizeText = sizeMap[weaponData.size] || weaponData.size;

    // 计算命中加值（力量 + 敏捷 + 专精）
    let hitBonus = 0;
    // 近战武器使用力量加值
    if (!weaponData.range) {
      const strHitBonus =
        typeof strMods.value.hitProb === 'number' ? strMods.value.hitProb : parseInt(strMods.value.hitProb) || 0;
      hitBonus += strHitBonus;
    } else {
      // 远程武器使用敏捷加值
      const dexHitBonus =
        typeof dexMods.value.missile === 'number' ? dexMods.value.missile : parseInt(dexMods.value.missile) || 0;
      hitBonus += dexHitBonus;
    }

    // 检查是否专精
    const isSpecialized = (char.value.weaponSpecializations || []).includes(item.id);
    if (isSpecialized) {
      hitBonus += 1; // 专精获得+1命中
    }

    // 计算伤害加值（力量）
    let damageBonus = 0;
    if (!weaponData.range) {
      // 近战武器使用力量伤害加值
      const strDamageBonus =
        typeof strMods.value.damage === 'number' ? strMods.value.damage : parseInt(strMods.value.damage) || 0;
      damageBonus += strDamageBonus;
    }
    if (isSpecialized) {
      damageBonus += 2; // 专精获得+2伤害
    }

    // 计算攻击次数
    let attacksPerRound = '1';
    if (isSpecialized) {
      attacksPerRound = '3/2'; // 专精获得3/2次攻击
    } else if (classInfo.value?.id === 'fighter') {
      attacksPerRound = '1';
    }

    // 如果是远程武器，查找兼容的弹药
    let ammunition: { name: string; quantity: number; damageS: string; damageL: string } | undefined;
    if (weaponData.range && AMMUNITION_COMPATIBILITY[item.id]) {
      const compatibleAmmoIds = AMMUNITION_COMPATIBILITY[item.id];

      // 查找背包中的兼容弹药（优先选择数量最多的）
      for (const ammoId of compatibleAmmoIds) {
        const ammoItem = purchasedEquipment.find((e: any) => e.id === ammoId);
        if (ammoItem && ammoItem.quantity > 0) {
          const ammoData = getEquipmentById(ammoId) as Weapon | undefined;
          if (ammoData) {
            ammunition = {
              name: ammoItem.name,
              quantity: ammoItem.quantity,
              damageS: ammoData.damageS,
              damageL: ammoData.damageL,
            };
            break; // 找到第一个兼容的弹药就停止
          }
        }
      }
    }

    // 构建武器数据
    const weaponInfo: any = {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      weaponType,
      speed: weaponData.speed,
      damageS: weaponData.damageS,
      damageL: weaponData.damageL,
      damageTypeText: weaponType,
      sizeText,
      range: weaponData.range,
      rof: weaponData.rateOfFire,
      attacksPerRound,
      hitBonus: hitBonus >= 0 ? `+${hitBonus}` : `${hitBonus}`,
      damageBonus: damageBonus >= 0 ? `+${damageBonus}` : `${damageBonus}`,
    };

    // 如果有弹药，添加弹药信息
    if (ammunition) {
      weaponInfo.ammunition = ammunition;
    }

    weapons.push(weaponInfo);
  }

  return weapons;
});

// 每轮攻击次数（基础）
const attacksPerRound = computed(() => {
  // 1级角色默认1次攻击
  // 如果有专精武器，则为3/2
  const hasSpecialization = (char.value.weaponSpecializations || []).length > 0;
  return hasSpecialization ? '3/2' : '1';
});

// ==================== 盗贼技能相关 ====================

// 判断是否为盗贼职业
const isThief = computed(() => {
  return classInfo.value?.id === 'thief';
});

// 获取种族盗贼技能调整
const raceThiefSkillAdjustments = computed(() => {
  const sr = subrace.value;
  const r = race.value;

  // 获取种族能力列表
  const abilities = sr && sr.abilities.length > 0 ? sr.abilities : r?.abilities || [];

  // 解析盗贼技能调整
  return parseRaceThiefSkillAdjustments(abilities);
});

// 判断是否有任何盗贼技能（种族或职业）
const hasAnyThiefSkills = computed(() => {
  // 如果是盗贼职业，始终显示
  if (isThief.value) return true;

  // 如果种族有任何非零的盗贼技能调整，也显示
  const adjustments = raceThiefSkillAdjustments.value;
  return Object.values(adjustments).some(value => value !== 0);
});

// 是否应该显示盗贼技能部分
const shouldShowThiefSkills = computed(() => {
  return hasAnyThiefSkills.value;
});

// 计算盗贼技能的完整列表
const displayedThiefSkills = computed(() => {
  const level = char.value.level ?? 1;
  const dex = dexterity.value;
  const dexAdj = getDexterityAdjustments(dex);
  const raceAdj = raceThiefSkillAdjustments.value;

  const skills = thiefSkillsData.map(skillData => {
    const skillId = skillData.id;

    // 基础值（盗贼职业才有）
    const baseValue = isThief.value ? thiefBaseSkills[skillId] || 0 : 0;

    // 敏捷调整（只对部分技能生效）
    let dexAdjustment = 0;
    if (
      isThief.value &&
      (skillId === 'pickPockets' ||
        skillId === 'openLocks' ||
        skillId === 'findRemoveTraps' ||
        skillId === 'moveSilently' ||
        skillId === 'hideInShadows')
    ) {
      dexAdjustment = (dexAdj as any)[skillId] || 0;
    }

    // 种族调整
    const raceAdjustment = raceAdj[skillId] || 0;

    // 总值
    let totalValue = baseValue + dexAdjustment + raceAdjustment;

    // 特殊处理：解读文书在4级前为0
    if (skillId === 'readLanguages' && level < 4) {
      totalValue = 0;
    }

    // 限制在0-100之间（除了爬墙可以超过100）
    if (skillId !== 'climbWalls') {
      totalValue = Math.max(0, Math.min(100, totalValue));
    } else {
      totalValue = Math.max(0, totalValue);
    }

    // 生成详细说明
    let breakdown = '';
    if (isThief.value && !isThief.value) {
      // 非盗贼职业，只显示种族调整
      if (raceAdjustment !== 0) {
        breakdown = `种族: ${raceAdjustment > 0 ? '+' : ''}${raceAdjustment}%`;
      }
    } else if (isThief.value) {
      // 盗贼职业，显示完整分解
      const parts = [];
      if (baseValue > 0) parts.push(`基础: ${baseValue}%`);
      if (dexAdjustment !== 0) parts.push(`敏捷: ${dexAdjustment > 0 ? '+' : ''}${dexAdjustment}%`);
      if (raceAdjustment !== 0) parts.push(`种族: ${raceAdjustment > 0 ? '+' : ''}${raceAdjustment}%`);
      breakdown = parts.join(', ');
    }

    // 对于非盗贼且没有种族加成的技能，不显示
    if (!isThief.value && raceAdjustment === 0) {
      return null;
    }

    // 对于解读文书，如果是0则不显示（除非是盗贼职业）
    if (skillId === 'readLanguages' && totalValue === 0 && !isThief.value) {
      return null;
    }

    return {
      id: skillId,
      name: skillData.name,
      description: skillData.description,
      value: totalValue,
      breakdown: breakdown || undefined,
    };
  });

  // 过滤掉null值
  return skills.filter(s => s !== null) as Array<{
    id: string;
    name: string;
    description: string;
    value: number;
    breakdown?: string;
  }>;
});
</script>

<style lang="scss" scoped>
// ADND 2E 黑白复古风格
.adnd-status-panel {
  width: 280px;
  height: 100%;
  background-color: #fff;
  border-right: 4px solid #000;
  display: flex;
  flex-direction: column;
  font-family: 'Times New Roman', serif;
  color: #000;
  box-shadow: inset 0 0 0 2px #666;

  &.in-modal {
    width: 100%;
    height: auto;
    border: 3px solid #000;
    box-shadow: none;
  }
}

.panel-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 3px solid #000;
  overflow-x: auto;

  .tab-item {
    flex: 1;
    padding: 10px 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    border-right: 2px solid #000;
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background-color: #fff;
    color: #000;
    white-space: nowrap;

    &:last-child {
      border-right: none;
    }

    &:hover {
      background-color: #000;
      color: #fff;
    }

    &.active {
      background-color: #000;
      color: #fff;
      box-shadow: inset 0 0 0 2px #666;
    }

    i {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background-color: #f5f5f5;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 1px,
    rgba(0, 0, 0, 0.03) 1px,
    rgba(0, 0, 0, 0.03) 2px
  );
}

.tab-pane {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 2px solid #000;
  background-color: #fff;
  margin-bottom: 2px;

  .label {
    color: #000;
    font-size: 13px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    color: #000;
    font-weight: bold;
    font-size: 14px;
    font-family: 'Courier New', monospace;
  }
}

.attributes-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ability-section {
  background-color: #fff;
  border: 3px solid #000;
  position: relative;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    border: 1px solid #666;
    pointer-events: none;
  }

  &.collapsed {
    .ability-header {
      border-bottom: none;
    }
  }
}

.ability-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #000;
  color: #fff;
  border-bottom: 2px solid #000;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #333;
  }

  .collapse-icon {
    font-size: 12px;
    margin-left: 8px;
    user-select: none;
  }
}

.ability-name {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ability-score {
  font-family: 'Courier New', monospace;
  font-size: 24px;
  font-weight: bold;
  min-width: 40px;
  text-align: right;
}

.ability-modifiers {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modifier-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  border-bottom: 1px dashed #ddd;

  &:last-child {
    border-bottom: none;
  }
}

.mod-label {
  font-weight: bold;
  color: #333;
}

.mod-value {
  font-weight: bold;
  color: #000;
  text-align: right;
}

.section-title {
  font-size: 13px;
  font-weight: bold;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 15px 0 10px 0;
  padding: 8px 12px;
  border: 2px solid #000;
  background-color: #fff;
  box-shadow: 3px 3px 0 #000;
  position: relative;

  &.clickable {
    cursor: pointer;
    transition: background-color 0.2s;
    user-select: none;

    &:hover {
      background-color: #f0f0f0;
    }

    .collapse-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
    }
  }

  .skill-note {
    font-size: 10px;
    font-weight: normal;
    color: #666;
    margin-left: 8px;
    font-style: italic;
  }
}

.collapsible-section {
  transition: all 0.3s ease;

  &.collapsed {
    .section-title {
      margin-bottom: 15px;
    }
  }
}

.skill-list,
.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .skill-item,
  .equipment-item {
    background-color: #fff;
    padding: 8px 12px;
    border: 2px solid #000;
    border-left: 4px solid #000;
    font-size: 13px;
    font-family: 'Courier New', monospace;
    position: relative;

    &.clickable-skill {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: #f8f8f8;
        border-left-color: #4a90e2;
        transform: translateX(2px);
      }

      .info-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 14px;
        opacity: 0.6;
      }
    }
  }
}

.ability-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .ability-item {
    background-color: #fff;
    padding: 10px;
    border: 3px solid #000;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      right: 3px;
      bottom: 3px;
      border: 1px solid #666;
      pointer-events: none;
    }

    &.clickable-ability {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: #f8f8f8;
        border-left-width: 6px;
        border-left-color: #4a90e2;
        transform: translateX(2px);
      }

      .ability-name {
        .info-icon {
          font-size: 14px;
          opacity: 0.6;
          margin-left: 8px;
        }
      }
    }

    .ability-name {
      font-weight: bold;
      color: #000;
      margin-bottom: 6px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .ability-desc {
      color: #333;
      font-size: 11px;
      line-height: 1.5;
    }
  }
}

.empty-text {
  color: #999;
  font-style: italic;
  padding: 10px;
  text-align: center;
  background-color: #fff;
  border: 2px dashed #ccc;
}

// 武器详情样式
.weapon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weapon-detail {
  background-color: #fff;
  border: 3px solid #000;
  position: relative;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    border: 1px solid #666;
    pointer-events: none;
  }

  &.collapsed {
    .weapon-header {
      border-bottom: none;
    }
  }
}

.weapon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #000;
  color: #fff;
  border-bottom: 2px solid #000;
  position: relative;

  &.clickable {
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #333;
    }
  }

  .weapon-name {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    flex: 1;
  }

  .weapon-quantity {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    font-weight: bold;
    background-color: #fff;
    color: #000;
    padding: 2px 8px;
    border: 2px solid #000;
    margin-right: 8px;
  }

  .collapse-icon {
    font-size: 12px;
    margin-left: 8px;
    user-select: none;
  }
}

.weapon-stats {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.weapon-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 4px 6px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  border-bottom: 1px dashed #ddd;
  gap: 8px;

  &:last-child {
    border-bottom: none;
  }

  .stat-label {
    font-weight: bold;
    color: #333;
    min-width: 80px;
    flex-shrink: 0;
  }

  .stat-value {
    font-weight: bold;
    color: #000;
    text-align: right;
    flex: 1;
    word-break: break-word;
  }
}

// 弹药行特殊样式
.ammunition-row {
  background-color: #fffacd;
  border: 1px solid #ffd700;
  padding: 6px;
  margin: 2px 0;

  .stat-label {
    color: #8b7500;
  }

  .stat-value {
    color: #8b7500;
  }
}

// 盗贼技能样式
.thief-skills-section {
  margin-top: 20px;

  .section-title {
    position: relative;

    .skill-note {
      font-size: 10px;
      font-weight: normal;
      color: #666;
      margin-left: 8px;
      font-style: italic;
    }
  }
}

.thief-skills-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.thief-skill-item {
  background-color: #fff;
  border: 3px solid #000;
  padding: 10px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    right: 3px;
    bottom: 3px;
    border: 1px solid #666;
    pointer-events: none;
  }

  .skill-name-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 2px solid #000;

    .skill-name {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000;
    }

    .skill-value {
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: bold;
      color: #000;
      background-color: #f0f0f0;
      padding: 2px 8px;
      border: 2px solid #000;
    }
  }

  .skill-description {
    font-size: 11px;
    line-height: 1.4;
    color: #333;
    margin-bottom: 6px;
  }

  .skill-breakdown {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    color: #666;
    font-style: italic;
    padding-top: 4px;
    border-top: 1px dashed #ddd;
  }
}

// 非武器熟练详情弹窗样式
.proficiency-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.proficiency-modal-content {
  background-color: #f5e6d3;
  border: 4px solid #000;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.5);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  animation: slideIn 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    border: 2px solid #666;
    pointer-events: none;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  background-color: #000;
  color: #fff;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #000;

  h2 {
    margin: 0;
    font-size: 18px;
    font-family: 'Courier New', monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .close-button {
    background: none;
    border: 2px solid #fff;
    color: #fff;
    font-size: 20px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s;

    &:hover {
      background-color: #fff;
      color: #000;
    }
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.prof-info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #fff;
  border: 2px solid #000;
  border-left: 4px solid #000;

  .prof-label {
    font-weight: bold;
    font-size: 13px;
    font-family: 'Courier New', monospace;
    min-width: 100px;
    color: #000;
  }

  .prof-value {
    font-size: 13px;
    font-family: 'Courier New', monospace;
    color: #333;
  }
}

.prof-description {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff;
  border: 3px solid #000;
  box-shadow: 3px 3px 0 #000;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    border: 1px solid #666;
    pointer-events: none;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-family: 'Courier New', monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #000;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: #333;
    white-space: pre-wrap;
    font-family: 'Arial', sans-serif;
  }
}

// ==================== 斥退亡灵模态框样式 ====================
.turn-undead-modal {
  .turn-undead-content {
    max-width: 900px;
    width: 95%;
  }

  .turn-undead-body {
    overflow-y: auto;
    max-height: 70vh;
  }

  .turn-section {
    margin-bottom: 24px;
    padding: 15px;
    background-color: #fff;
    border: 3px solid #000;
    box-shadow: 3px 3px 0 #000;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
      border: 1px solid #666;
      pointer-events: none;
    }

    h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-family: 'Courier New', monospace;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #000;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
    }

    p {
      font-size: 13px;
      line-height: 1.7;
      color: #333;
      margin: 10px 0;
      font-family: 'Arial', sans-serif;
    }

    ul {
      margin: 10px 0;
      padding-left: 25px;
      font-size: 13px;
      line-height: 1.7;
      color: #333;
      font-family: 'Arial', sans-serif;

      li {
        margin: 8px 0;
      }
    }
  }

  .turn-example {
    background-color: #fffacd;

    p {
      font-style: italic;
    }
  }

  .turn-table-wrapper {
    overflow-x: auto;
    margin: 15px 0;
  }

  .turn-undead-table {
    width: 100%;
    border-collapse: collapse;
    background-color: #fff;
    font-family: 'Courier New', monospace;
    font-size: 12px;

    thead {
      background-color: #000;
      color: #fff;

      th {
        padding: 8px;
        border: 2px solid #000;
        font-weight: bold;
        text-align: center;
        white-space: nowrap;
      }
    }

    tbody {
      td {
        padding: 6px 8px;
        border: 2px solid #000;
        text-align: center;
        font-weight: bold;

        &.undead-name {
          text-align: left;
          background-color: #f5f5f5;
          white-space: nowrap;
        }

        &.result-auto-turn {
          background-color: #90ee90;
          color: #000;
        }

        &.result-auto-destroy {
          background-color: #ffd700;
          color: #000;
        }

        &.result-auto-destroy-plus {
          background-color: #ff6347;
          color: #fff;
        }

        &.result-impossible {
          background-color: #ddd;
          color: #999;
        }

        &.current-level {
          outline: 3px solid #1e90ff;
          outline-offset: -3px;
          box-shadow: inset 0 0 8px rgba(30, 144, 255, 0.4);
        }
      }
    }

    tr:nth-child(even) {
      td:not(.undead-name):not(.result-auto-turn):not(.result-auto-destroy):not(.result-auto-destroy-plus):not(
          .result-impossible
        ) {
        background-color: #f9f9f9;
      }
    }
  }

  .turn-notes {
    margin-top: 15px;
    padding: 10px;
    background-color: #fffacd;
    border: 2px solid #daa520;
    border-radius: 4px;

    .note-item {
      font-size: 11px;
      line-height: 1.5;
      color: #666;
      margin: 5px 0;
      font-style: italic;

      &::before {
        content: '※ ';
        color: #daa520;
      }
    }
  }
}
</style>
