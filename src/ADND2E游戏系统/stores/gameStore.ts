import { klona } from 'klona';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  debouncedSaveToIndexedDB,
  exportMessagesToFile,
  flushPendingSave,
  loadGameData,
  requestPersistentStorage,
  saveGameData,
  startAutoSync,
  stopAutoSync,
} from '../composables/usePersistence';
import {
  getCharismaModifiers,
  getConstitutionModifiers,
  getDexterityModifiers,
  getIntelligenceModifiers,
  getStrengthModifiers,
  getWisdomModifiers,
} from '../utils/abilityCalculator';
import { getClassById } from '../utils/classData';
import { parseAiResponse } from '../utils/commandParser';
import { removeNpcTags } from '../utils/npcTagRemover';
import { getPriestSpellById } from '../utils/priestSpellData';
import { getProficiencyById } from '../utils/proficiencyData';
import { getRaceById, getSubraceById } from '../utils/raceData';
import { parseSegmentedMemory, removeSegmentedMemoryTags } from '../utils/segmentedMemoryParser';
import { getWeaponById } from '../utils/weaponData';
import { getWizardSpellById } from '../utils/wizardSpellData';
import type { CharacterData } from './characterStore';
import { useGameStateStore } from './gameStateStore';

export interface GameMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
  name?: string;
  timestamp: number;
  stateSnapshot?: string; // 游戏状态快照（JSON 字符串），仅在 AI 输出后保存
  smallSummary?: string; // 小总结（分段记忆）- 50~100字的详细记忆
  largeSummary?: string; // 大总结（分段记忆）- 一句话的模糊记忆
}

export const useGameStore = defineStore('adnd2e-game', () => {
  // 状态
  const messages = ref<GameMessage[]>([]); // 前端消息日志，用于界面显示
  const isGenerating = ref(false);
  const streamingText = ref('');
  const settingsPanelCollapsed = ref(false);
  const statusPanelCollapsed = ref(false);
  const showManualSegmentedMemoryModal = ref(false); // 是否显示手动补充分段记忆弹窗
  const pendingMessageIndex = ref<number | null>(null); // 待补充分段记忆的消息索引

  // 格式化角色卡为文本
  function formatCharacterSheet(character: CharacterData): string {
    const lines: string[] = [];

    // 标题
    lines.push('═══════════════════════════════════════════════');
    lines.push('        ADND 2E 角色卡');
    lines.push('═══════════════════════════════════════════════');
    lines.push('');

    // 基本信息
    lines.push('【基本信息】');
    const charName = character.characterName || character.name || '未命名';
    lines.push(`角色名: ${charName}`);

    const genderText =
      character.gender === 'male'
        ? '男'
        : character.gender === 'female'
          ? '女'
          : character.gender === 'other'
            ? '其他'
            : '未知';
    lines.push(`性别: ${genderText}`);

    // 种族
    const raceInfo = character.race ? getRaceById(character.race) : null;
    const subraceInfo = character.race && character.subrace ? getSubraceById(character.race, character.subrace) : null;
    lines.push(`种族: ${raceInfo?.name || '未知'}${subraceInfo ? ` (${subraceInfo.name})` : ''}`);

    // 职业
    const classInfo = character.class ? getClassById(character.class) : null;
    lines.push(`职业: ${classInfo?.name || '未知'}`);

    // 阵营
    const alignmentMap: Record<string, string> = {
      LG: '守序善良',
      NG: '中立善良',
      CG: '混乱善良',
      LN: '守序中立',
      N: '绝对中立',
      CN: '混乱中立',
      LE: '守序邪恶',
      NE: '中立邪恶',
      CE: '混乱邪恶',
    };
    const alignmentText = character.alignment ? alignmentMap[character.alignment] || character.alignment : '未知';
    lines.push(`阵营: ${alignmentText}`);
    lines.push(`等级: 1`);
    lines.push(`经验值: 0`);
    lines.push('');

    // 角色描述（外貌、背景等）
    if (character.appearance || character.background || (character.gender === 'male' && character.penisSize)) {
      lines.push('【角色描述】');
      if (character.appearance) {
        lines.push(`外貌: ${character.appearance}`);
      }
      if (character.background) {
        lines.push(`背景: ${character.background}`);
      }
      if (character.gender === 'male' && character.penisSize) {
        const sizeMap: Record<string, string> = {
          xs: '特小',
          s: '偏小',
          m: '平均',
          l: '偏大',
          xl: '特大',
          xxl: '超大',
        };
        lines.push(`身体特征: 阴茎大小${sizeMap[character.penisSize] || character.penisSize}`);
      }
      lines.push('');
    }

    // 属性值
    lines.push('【属性值】');
    const abilityNames = {
      str: '力量 (STR)',
      dex: '敏捷 (DEX)',
      con: '体质 (CON)',
      int: '智力 (INT)',
      wis: '灵知 (WIS)',
      cha: '魅力 (CHA)',
    };
    for (const [key, name] of Object.entries(abilityNames)) {
      const value = character.abilities[key as keyof typeof character.abilities];
      lines.push(`${name}: ${value !== null ? value : '?'}`);

      // 添加属性详细加成信息（仅当值存在且有效时）
      if (value !== null && value > 0) {
        const abilityKey = key as keyof typeof character.abilities;
        switch (abilityKey) {
          case 'str': {
            const mods = getStrengthModifiers(value);
            lines.push(`  命中率: ${mods.hitProb}  伤害: ${mods.damage}  负重: ${mods.weight}磅`);
            lines.push(`  最大负重: ${mods.maxPress}磅  开门: ${mods.openDoors}  弯杆/举门: ${mods.bendBars}`);
            break;
          }
          case 'dex': {
            const mods = getDexterityModifiers(value);
            lines.push(`  突袭反应: ${mods.surprise}  远程攻击: ${mods.missile}  防御调整(AC): ${mods.defense}`);
            break;
          }
          case 'con': {
            const mods = getConstitutionModifiers(value);
            lines.push(`  生命值调整: ${mods.hpAdj}  毒素豁免: ${mods.poisonSave}`);
            lines.push(`  身体休克: ${mods.systemShock}  复生存活: ${mods.resurrection}  再生: ${mods.regeneration}`);
            break;
          }
          case 'int': {
            const mods = getIntelligenceModifiers(value);
            lines.push(`  语言数量: ${mods.languages}  法术习得率: ${mods.learnSpell}`);
            let intLine = `  法术等级上限: ${mods.spellLevel}  每级法术上限: ${mods.maxSpells}`;
            if (mods.immunity && mods.immunity !== '--') {
              intLine += `  法术免疫: ${mods.immunity}`;
            }
            lines.push(intLine);
            break;
          }
          case 'wis': {
            const mods = getWisdomModifiers(value);
            lines.push(`  魔法防御: ${mods.magicDefense}  施法失败率: ${mods.spellFailure}`);
            let wisLine = `  奖励法术: ${mods.bonusSpells}`;
            if (mods.immunity && mods.immunity !== '--') {
              wisLine += `  法术免疫: ${mods.immunity}`;
            }
            lines.push(wisLine);
            break;
          }
          case 'cha': {
            const mods = getCharismaModifiers(value);
            lines.push(`  追随者上限: ${mods.maxHenchmen}  基础忠诚: ${mods.loyalty}  反应调整: ${mods.reaction}`);
            break;
          }
        }
      }
    }
    if (character.exceptionalStrength) {
      lines.push(`超凡力量: 18/${character.exceptionalStrength}`);
    }
    lines.push('');

    // 战斗数据
    lines.push('【战斗数据】');
    lines.push(`护甲等级 (AC): ${character.armorClass?.total ?? 10}`);
    lines.push(`生命值 (HP): ${character.hitPoints?.current ?? 0}/${character.hitPoints?.max ?? 0}`);
    lines.push(`移动力: ${character.movement ?? 12}`);
    lines.push(`THAC0: ${character.thac0 ?? 20}`);
    lines.push('');

    // 豁免检定
    if (character.savingThrows) {
      lines.push('【豁免检定】');
      lines.push(`麻痹/毒素/死亡魔法: ${character.savingThrows.paralyzation}`);
      lines.push(`权杖/法杖/魔杖: ${character.savingThrows.rod}`);
      lines.push(`石化/变形: ${character.savingThrows.petrification}`);
      lines.push(`喷吐武器: ${character.savingThrows.breath}`);
      lines.push(`法术: ${character.savingThrows.spell}`);
      lines.push('');
    }

    // 武器熟练
    if (character.weaponProficiencies.length > 0) {
      lines.push('【武器熟练】');
      character.weaponProficiencies.forEach(profId => {
        const weaponInfo = getWeaponById(profId);
        const isSpecialized = character.weaponSpecializations.includes(profId);
        lines.push(`- ${weaponInfo?.name || profId}${isSpecialized ? ' (专精)' : ''}`);
      });
      lines.push('');
    }

    // 非武器熟练
    if (character.nonweaponProficiencies.length > 0) {
      lines.push('【非武器熟练】');
      character.nonweaponProficiencies.forEach(prof => {
        const profInfo = getProficiencyById(prof.id);
        lines.push(`- ${profInfo?.name || prof.id} (${prof.slots}槽)`);
      });
      lines.push('');
    }

    // 装备
    if (character.purchasedEquipment.length > 0) {
      lines.push('【装备】');
      lines.push(`金币: ${character.currentMoney} GP`);

      // 按类别分组装备
      const grouped = new Map<string, typeof character.purchasedEquipment>();
      character.purchasedEquipment.forEach(item => {
        if (!grouped.has(item.category)) {
          grouped.set(item.category, []);
        }
        grouped.get(item.category)!.push(item);
      });

      grouped.forEach((items, category) => {
        lines.push(`${category}:`);
        items.forEach(item => {
          lines.push(`  - ${item.name} × ${item.quantity}`);
        });
      });
      lines.push('');
    }

    // 法术
    if (character.spells) {
      // 获取职业施法信息
      const hasSpellcasting = classInfo?.spellcasting;

      if (hasSpellcasting) {
        lines.push('【法术能力】');

        // 显示施法类型
        const spellcasterType = classInfo.spellcasting?.type === 'wizard' ? '奥术施法者' : '神术施法者';
        lines.push(`类型: ${spellcasterType}`);

        // 显示法术领域（仅祭司）
        if (classInfo.spellcasting?.type === 'priest' && classInfo.spellSpheres) {
          lines.push(`主要领域: ${classInfo.spellSpheres.major.join(', ')}`);
          if (classInfo.spellSpheres.minor && classInfo.spellSpheres.minor.length > 0) {
            lines.push(`次要领域: ${classInfo.spellSpheres.minor.join(', ')}`);
          }
        }

        lines.push('');

        // 显示已记忆的法术
        const hasSpells = Object.values(character.spells.memorizedSpells).some(spells => spells.length > 0);
        if (hasSpells) {
          lines.push('【已记忆法术】');
          for (let level = 1; level <= 9; level++) {
            const spells =
              character.spells.memorizedSpells[`level${level}` as keyof typeof character.spells.memorizedSpells];
            if (spells && spells.length > 0) {
              // 将法术ID转换为法术名称
              const spellNames = spells
                .map(spellId => {
                  // 尝试作为法师法术查找
                  const wizardSpell = getWizardSpellById(spellId);
                  if (wizardSpell) return wizardSpell.name;
                  // 尝试作为祭司法术查找
                  const priestSpell = getPriestSpellById(spellId);
                  if (priestSpell) return priestSpell.name;
                  // 都没找到，返回ID
                  return spellId;
                })
                .join(', ');
              lines.push(`${level}环: ${spellNames}`);
            }
          }
          lines.push('');
        } else {
          lines.push('【已记忆法术】');
          lines.push('当前未记忆任何法术');
          lines.push('');
        }
      }
    }

    // 种族特性
    lines.push('【种族特性】');
    if (raceInfo || subraceInfo) {
      const raceForDisplay = subraceInfo || raceInfo;
      if (raceForDisplay) {
        // 种族描述
        if (raceForDisplay.description) {
          lines.push(raceForDisplay.description);
          lines.push('');
        }

        // 种族能力
        const raceAbilities = raceForDisplay.abilities || [];
        if (raceAbilities.length > 0) {
          lines.push('种族能力:');
          raceAbilities.forEach(ability => {
            lines.push(`• ${ability.name}: ${ability.description}`);
          });
          lines.push('');
        }

        // 种族优势
        if (raceForDisplay.specialAdvantages) {
          lines.push(`特殊优势: ${raceForDisplay.specialAdvantages}`);
        }

        // 种族劣势
        if (raceForDisplay.specialDisadvantages) {
          lines.push(`特殊劣势: ${raceForDisplay.specialDisadvantages}`);
        }
      }
    }
    lines.push('');

    // 职业特性
    lines.push('【职业特性】');
    if (classInfo) {
      // 职业描述
      if (classInfo.description) {
        lines.push(classInfo.description);
        lines.push('');
      }

      // 职业能力（1级）
      const classAbilities = classInfo.specialAbilities.filter(a => a.level === 1);
      if (classAbilities.length > 0) {
        lines.push('职业能力:');
        classAbilities.forEach(ability => {
          lines.push(`• ${ability.name}: ${ability.description}`);
        });
        lines.push('');
      }

      // 职业说明
      if (classInfo.specialNotes && classInfo.specialNotes.length > 0) {
        lines.push('特殊说明:');
        classInfo.specialNotes.forEach(note => {
          lines.push(`- ${note}`);
        });
        lines.push('');
      }

      // 武器与护甲限制
      lines.push(`武器限制: ${classInfo.weaponRestrictions}`);
      lines.push(`护甲限制: ${classInfo.armorRestrictions}`);
    }
    lines.push('═══════════════════════════════════════════════');

    return lines.join('\n');
  }

  // 创建第0层初始消息（角色卡）- 同层游玩模式：不创建新消息楼层
  async function createInitialCharacterMessage(_character: CharacterData) {
    try {
      // 同层游玩：不创建消息楼层，仅在前端显示
      // 角色卡信息只保存在 IndexedDB 和角色卡变量中
      console.log('[Game] 角色卡已准备就绪（同层游玩模式：不创建消息楼层）');

      // 可选：如果想在酒馆中保留一个参考，可以创建一个占位消息
      // 但这不是必需的，因为所有游戏数据都在 IndexedDB 中
    } catch (error) {
      console.error('[Game] 准备角色卡失败:', error);
      throw error;
    }
  }

  // 初始化游戏（使用混合持久化机制：IndexedDB + 酒馆消息楼层）
  async function initializeGame() {
    try {
      // 1. 请求持久化存储权限（学习自 lucklyjkop）
      await requestPersistentStorage();

      // 2. 初始化游戏状态 Store
      const gameStateStore = useGameStateStore();

      // 3. 智能加载游戏数据（优先 IndexedDB，回退到酒馆消息楼层）
      const persistedData = await loadGameData();

      // 4. 从角色卡变量或 IndexedDB 加载角色数据
      let charVars = getVariables({ type: 'character' });
      let savedData = charVars?.adnd2e;

      // 4.1 如果角色卡变量中没有角色数据，尝试从 IndexedDB 恢复
      if (!savedData?.character && persistedData?.character) {
        console.log('[Game] 角色卡变量中未找到角色数据，从 IndexedDB 恢复...');
        console.log('[Game] 从 IndexedDB 恢复角色数据:', persistedData.character.characterName || '未命名');
        charVars = charVars || {};
        charVars.adnd2e = charVars.adnd2e || {};
        charVars.adnd2e.character = persistedData.character;
        charVars.adnd2e.lastSaved = persistedData.lastSaved;
        replaceVariables(charVars, { type: 'character' });
        savedData = charVars.adnd2e;
      } else if (!savedData?.character) {
        throw new Error('无法找到角色数据，请先创建角色');
      }

      console.log('[Game] 角色数据已找到:', savedData.character?.characterName || '未命名');

      if (persistedData && persistedData.messages && persistedData.gameState) {
        // 加载已保存的游戏数据（loadGameData 已经自动更新了第一条消息为最新角色卡）
        console.log('[Game] 加载已保存的游戏数据');

        // 加载游戏状态（先加载状态，后面需要用来补充快照）
        gameStateStore.loadGameState(persistedData.gameState);

        // 加载消息历史（第一条消息已经是最新的角色卡）
        messages.value = persistedData.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp || Date.now(),
        }));

        // 修复旧数据：为没有快照的消息补充快照
        let needsRepair = false;
        const hasAnyMissingSnapshot = messages.value.some(msg => !msg.stateSnapshot);

        if (hasAnyMissingSnapshot) {
          needsRepair = true;
          console.log('[Game] 检测到旧数据缺少快照，开始重建状态快照...');

          // 动态导入 commandParser
          const { parseAiResponse } = await import('../utils/commandParser');

          // 从初始状态开始重建
          gameStateStore.resetGameState();
          gameStateStore.initializeGameState(savedData.character);

          // 为每条消息重建快照
          for (let i = 0; i < messages.value.length; i++) {
            const msg = messages.value[i];

            // 在处理该消息之前，先保存快照（这样删除该消息时可以回溯到这个状态）
            msg.stateSnapshot = JSON.stringify(gameStateStore.exportGameState());

            // 如果是 AI 消息，解析并应用命令，更新游戏状态
            if (msg.role === 'assistant') {
              try {
                const parseResult = parseAiResponse(msg.content);
                if (parseResult.commands.length > 0) {
                  gameStateStore.applyCommands(parseResult.commands);
                }
              } catch (error) {
                console.warn(`[Game] 重建第 ${i + 1} 条消息快照时解析命令失败:`, error);
              }
            }

            console.log(`[Game] 已为第 ${i + 1} 条消息重建状态快照`);
          }

          console.log('[Game] 已修复旧数据：为所有消息重建了准确的状态快照');

          // 立即保存修复后的数据
          // 先同步 character 和 gameState 到角色卡变量
          gameStateStore.syncToCharacterVariables();
          await nextTick();

          await saveGameData({
            messages: klona(messages.value),
            gameState: gameStateStore.exportGameState(),
            // 不需要传递 character，因为 syncToCharacterVariables 已经同步了
          });
          toastr.info('已修复旧数据：为所有消息重建了状态快照');
        }

        toastr.success('游戏数据加载完成');
      } else {
        // 首次初始化或没有保存数据
        console.log('[Game] 首次初始化游戏（同层游玩模式）');

        // 同层游玩：不检查酒馆消息楼层
        await createInitialCharacterMessage(savedData.character);

        // 初始化游戏状态
        gameStateStore.initializeGameState(savedData.character);

        // 直接使用 Step11 保存的完整角色卡（不重新生成）
        if (!savedData.messages || savedData.messages.length === 0 || !savedData.messages[0].content) {
          throw new Error(
            '未找到完整的角色卡数据。请重新创建角色：\n1. 删除当前角色卡变量\n2. 重新走完整的角色创建流程\n3. 在步骤11点击"完成创建"',
          );
        }
        console.log('[Game] 使用 Step11 保存的完整角色卡');
        const characterSheetText = savedData.messages[0].content;

        // 初始化角色卡消息，并保存初始游戏状态快照
        const initialSnapshot = JSON.stringify(gameStateStore.exportGameState());
        messages.value = [
          {
            role: 'system',
            content: characterSheetText,
            name: 'ADND 2E 角色卡',
            timestamp: Date.now(),
            stateSnapshot: initialSnapshot, // 保存初始状态快照
          },
        ];

        // 保存初始状态到 IndexedDB（不创建酒馆消息楼层）
        // 先同步 character 和 gameState 到角色卡变量
        gameStateStore.syncToCharacterVariables();
        await nextTick();

        await saveGameData({
          messages: klona(messages.value),
          gameState: gameStateStore.exportGameState(),
          // 不需要传递 character，因为 syncToCharacterVariables 已经同步了
        });

        toastr.success('游戏初始化完成（同层游玩模式）');
      }

      // 检测并初始化神祇数据（如果背景中包含神祇信息）
      const characterData = savedData.character;
      if (characterData?.background && !gameStateStore.gameState?.character?.deity) {
        const { parseDeityFromCharacterBackground } = await import('../utils/commandParser');
        const bgDeityCommand = parseDeityFromCharacterBackground(characterData.background);
        if (bgDeityCommand && bgDeityCommand.type === 'update_deity') {
          console.log('[Game] 从角色背景初始化神祇数据:', bgDeityCommand.data);
          gameStateStore.applyCommands([bgDeityCommand]);
          toastr.success('已从角色背景中检测并加载神祇数据');

          // 同步更新角色卡变量中的 isDeity 标志
          try {
            const charVars = getVariables({ type: 'character' });
            if (charVars?.adnd2e?.character) {
              charVars.adnd2e.character.isDeity = true;
              replaceVariables(charVars, { type: 'character' });
              console.log('[Game] 已设置角色卡变量 isDeity = true');
            }
          } catch (error) {
            console.error('[Game] 同步 isDeity 标志失败:', error);
          }

          // 保存更新后的游戏状态
          // 先同步 character 和 gameState 到角色卡变量
          gameStateStore.syncToCharacterVariables();
          await nextTick();

          await saveGameData({
            messages: klona(messages.value),
            gameState: gameStateStore.exportGameState(),
            // 不需要传递 character，因为 syncToCharacterVariables 已经同步了
          });
        }
      }

      // 5. 启动自动同步（每30秒将 IndexedDB 同步到酒馆消息楼层）
      startAutoSync(30);

      console.log('[Game] 游戏初始化完成，已启动自动同步');
    } catch (error) {
      toastr.error('游戏初始化失败: ' + (error as Error).message);
      console.error('[Game] 初始化错误:', error);
      throw error;
    }
  }

  /**
   * 根据分段记忆设置构建用于发送给 LLM 的消息列表
   * @returns 处理后的消息列表
   */
  function buildContextMessages(): GameMessage[] {
    try {
      // 读取分段记忆设置
      const charVars = getVariables({ type: 'character' });
      const summarySettings = charVars?.adnd2e?.summarySettings;
      const segmentedMemory = summarySettings?.segmentedMemory;

      // 如果没有启用分段记忆，直接返回所有消息
      if (!segmentedMemory?.enabled) {
        console.log('[Game] 分段记忆未启用，返回所有消息');
        return klona(messages.value);
      }

      const chatLayers = segmentedMemory.chatLayers || 10; // 最新 X 层发送完整内容
      const largeSummaryStart = segmentedMemory.largeSummaryStart || 20; // 从倒数第 Y 层开始只发送大总结

      console.log('[Game] 使用分段记忆设置:', {
        chatLayers,
        largeSummaryStart,
        totalMessages: messages.value.length,
      });

      // 分离 AI 消息和用户消息
      const aiMessages = messages.value.filter(m => m.role === 'assistant');
      const allMessages = klona(messages.value);

      // 如果 AI 消息数量不够，直接返回所有消息
      if (aiMessages.length <= chatLayers) {
        console.log('[Game] AI 消息数量不足，返回所有消息');
        return allMessages;
      }

      // 构建上下文消息列表
      const contextMessages: GameMessage[] = [];

      // 找到所有消息中最近的 chatLayers * 2 条（包括用户消息和 AI 消息）
      const recentMessages = allMessages.slice(-chatLayers * 2);

      // 找到较旧的 AI 消息
      const recentAICount = recentMessages.filter(m => m.role === 'assistant').length;
      const olderAIMessages = aiMessages.slice(0, aiMessages.length - recentAICount);

      // 处理较旧的 AI 消息
      olderAIMessages.forEach(aiMsg => {
        const reverseIndex = aiMessages.length - 1 - aiMessages.indexOf(aiMsg);

        if (largeSummaryStart > 0 && reverseIndex >= largeSummaryStart) {
          // 很旧的消息：只发送大总结
          contextMessages.push({
            ...aiMsg,
            content: aiMsg.largeSummary || aiMsg.smallSummary || aiMsg.content,
          });
        } else {
          // 较旧的消息：发送小总结
          contextMessages.push({
            ...aiMsg,
            content: aiMsg.smallSummary || aiMsg.content,
          });
        }
      });

      // 添加最近的完整消息
      contextMessages.push(...recentMessages);

      // 按时间排序
      contextMessages.sort((a, b) => a.timestamp - b.timestamp);

      console.log('[Game] 分段记忆处理完成:', {
        原始消息数: allMessages.length,
        发送消息数: contextMessages.length,
        使用大总结: olderAIMessages.filter((_, i) => {
          const reverseIndex = aiMessages.length - 1 - aiMessages.indexOf(olderAIMessages[i]);
          return largeSummaryStart > 0 && reverseIndex >= largeSummaryStart;
        }).length,
        使用小总结: olderAIMessages.filter((_, i) => {
          const reverseIndex = aiMessages.length - 1 - aiMessages.indexOf(olderAIMessages[i]);
          return !(largeSummaryStart > 0 && reverseIndex >= largeSummaryStart);
        }).length,
      });

      return contextMessages;
    } catch (error) {
      console.error('[Game] 构建分段记忆上下文失败:', error);
      // 出错时返回所有消息
      return klona(messages.value);
    }
  }

  // 添加消息到前端日志
  function addMessageToLog(message: Omit<GameMessage, 'timestamp'>, saveSnapshot = false) {
    const newMessage: GameMessage = {
      ...message,
      timestamp: Date.now(),
    };

    // 如果是 AI 消息，尝试解析分段记忆并移除标签
    if (message.role === 'assistant' && message.content) {
      let cleanContent = message.content;

      // 1. 解析并移除分段记忆标签
      const segmentedMemory = parseSegmentedMemory(cleanContent);

      if (segmentedMemory) {
        // 提取到分段记忆
        newMessage.smallSummary = segmentedMemory.smallSummary;
        newMessage.largeSummary = segmentedMemory.largeSummary;

        // 移除内容中的分段记忆标记（在正文中不显示）
        cleanContent = removeSegmentedMemoryTags(cleanContent);

        console.log('[Game] 已提取分段记忆:', {
          smallSummary: segmentedMemory.smallSummary.substring(0, 50) + '...',
          largeSummary: segmentedMemory.largeSummary,
        });
      } else {
        // 没有找到分段记忆
        console.warn('[Game] AI 响应中未找到分段记忆标记');

        // 设置为空字符串
        newMessage.smallSummary = '';
        newMessage.largeSummary = '';

        // 检查是否启用了分段记忆
        const charVars = getVariables({ type: 'character' });
        const segmentedMemoryEnabled = charVars?.adnd2e?.summarySettings?.segmentedMemory?.enabled;

        if (segmentedMemoryEnabled) {
          // 如果启用了分段记忆，触发手动补充弹窗
          toastr.warning('AI未生成分段记忆，请手动补充', '分段记忆异常');

          // 2. 移除 NPC 标签（在正文中不显示，但 NPC 管理器已经解析保存了）
          cleanContent = removeNpcTags(cleanContent);
          newMessage.content = cleanContent;

          // 先添加消息，然后标记需要补充
          messages.value.push(newMessage);
          pendingMessageIndex.value = messages.value.length - 1;
          showManualSegmentedMemoryModal.value = true;
          return; // 提前返回，避免重复添加消息
        }
      }

      // 2. 移除 NPC 标签（在正文中不显示，但 NPC 管理器已经解析保存了）
      cleanContent = removeNpcTags(cleanContent);
      newMessage.content = cleanContent;
    }

    // 如果需要保存快照（仅 AI 输出时），保存当前游戏状态
    if (saveSnapshot) {
      try {
        const gameStateStore = useGameStateStore();
        newMessage.stateSnapshot = JSON.stringify(gameStateStore.exportGameState());
        console.log('[Game] 已为消息保存状态快照');
      } catch (error) {
        console.error('[Game] 保存状态快照失败:', error);
      }
    }

    messages.value.push(newMessage);
  }

  // 发送用户输入并触发 AI 生成（真正的同层游玩模式：不创建消息楼层）
  async function sendUserInput(input: string) {
    if (!input.trim() || isGenerating.value) return;

    try {
      const gameStateStore = useGameStateStore();

      // 获取角色名称和角色数据
      const charVars = getVariables({ type: 'character' });
      const characterName = charVars?.adnd2e?.character?.characterName || 'Player';
      const characterData = charVars?.adnd2e?.character;

      // 0.5 检测神祇信息（用户输入或角色背景）
      const { parseDeityFromCharacterBackground } = await import('../utils/commandParser');

      // 检测用户输入中的神祇信息
      const userDeityCommand = parseDeityFromCharacterBackground(input);
      if (userDeityCommand && userDeityCommand.type === 'update_deity') {
        console.log('[Game] 用户输入中检测到神祇信息:', userDeityCommand.data);
        gameStateStore.applyCommands([userDeityCommand]);

        // 同步更新角色卡变量中的 isDeity 标志
        try {
          const charVars = getVariables({ type: 'character' });
          if (charVars?.adnd2e?.character && !charVars.adnd2e.character.isDeity) {
            charVars.adnd2e.character.isDeity = true;
            replaceVariables(charVars, { type: 'character' });
            console.log('[Game] sendUserInput: 已设置角色卡变量 isDeity = true');
          }
        } catch (error) {
          console.error('[Game] sendUserInput: 同步 isDeity 标志失败:', error);
        }
      }

      // 也检测角色背景（以防后来修改了背景但游戏已初始化，且尚未设置神祇数据）
      if (characterData?.background && !gameStateStore.gameState?.character?.deity) {
        const bgDeityCommand = parseDeityFromCharacterBackground(characterData.background);
        if (bgDeityCommand && bgDeityCommand.type === 'update_deity') {
          console.log('[Game] 从角色背景补充检测到神祇信息:', bgDeityCommand.data);
          gameStateStore.applyCommands([bgDeityCommand]);

          // 同步更新角色卡变量中的 isDeity 标志
          try {
            const charVars = getVariables({ type: 'character' });
            if (charVars?.adnd2e?.character && !charVars.adnd2e.character.isDeity) {
              charVars.adnd2e.character.isDeity = true;
              replaceVariables(charVars, { type: 'character' });
              console.log('[Game] sendUserInput (background): 已设置角色卡变量 isDeity = true');
            }
          } catch (error) {
            console.error('[Game] sendUserInput (background): 同步 isDeity 标志失败:', error);
          }
        }
      }

      // 1. 添加用户消息到前端显示（仅前端，不创建酒馆消息楼层）
      // 用户输入时也保存快照，确保删除消息时可以回溯
      addMessageToLog({ role: 'user', content: input, name: characterName }, true);

      // 2. 同层游玩：不调用 createChatMessages，所有消息仅存在于前端界面和 IndexedDB
      // 这样可以实现真正的"同层游玩"，不会增加酒馆的消息楼层数

      // 3. 准备发送给AI的上下文：角色卡 + 历史消息
      // 关键修复：因为采用同层游玩模式，酒馆的chat_history是空的
      // 必须通过 overrides.chat_history.prompts 手动注入角色卡和历史消息
      const chatHistoryPrompts: RolePrompt[] = [];

      // 3.1 首先注入角色卡（作为system消息）- 使用保存的完整角色卡文本
      if (characterData) {
        // 优先使用 Step11 保存的完整角色卡文本
        let characterSheetText: string;
        if (charVars?.adnd2e?.messages && charVars.adnd2e.messages.length > 0 && charVars.adnd2e.messages[0].content) {
          // 使用保存的完整角色卡
          characterSheetText = charVars.adnd2e.messages[0].content;
        } else {
          // 如果没有保存的角色卡（不应该发生），使用前端显示的角色卡
          const firstMessage = messages.value.find(m => m.role === 'system' && m.name === 'ADND 2E 角色卡');
          if (firstMessage) {
            characterSheetText = firstMessage.content;
          } else {
            // 最后的回退（不应该到这里）
            characterSheetText = formatCharacterSheet(characterData);
          }
        }

        chatHistoryPrompts.push({
          role: 'system',
          content: characterSheetText,
        });
      }

      // 3.1.5 注入当前场上的NPC列表（让AI知道当前有哪些NPC在场）
      const currentNpcs = gameStateStore.gameState?.npcs || [];
      if (currentNpcs.length > 0) {
        const npcListText = `## 当前场上的NPC列表

以下NPC当前在场，请在剧情中合理使用这些NPC，不要重复创建已存在的NPC：

${currentNpcs
  .map(
    (npc, index) =>
      `${index + 1}. **${npc.name}** ${npc.race ? `(${npc.race})` : ''}
   - 生命值: ${npc.hp}${npc.maxHp ? `/${npc.maxHp}` : ''}
   - 护甲等级: ${npc.ac}
   - 态度: ${npc.attitude || '中立'}
   - 状态: ${npc.status || '正常'}${npc.location ? `\n   - 位置: ${npc.location}` : ''}`,
  )
  .join('\n\n')}

**重要提示**：
- 如果需要更新已存在的NPC状态，使用 update_npc 命令
- 如果NPC离场或死亡，使用 remove_npc 命令移除
- 只有在引入新NPC时才使用 add_npc 或 NPC标签格式创建
- 特别关心的NPC (⭐) 不会自动移除，需要手动管理
`;

        chatHistoryPrompts.push({
          role: 'system',
          content: npcListText,
        });

        console.log(`[Game] 已向AI注入 ${currentNpcs.length} 个当前在场NPC的信息`);
      }

      // 3.2 然后注入历史对话消息（排除刚刚添加的用户输入）
      const historyMessages = messages.value.slice(0, -1); // 排除最后一条（刚添加的用户输入）
      for (const msg of historyMessages) {
        // 跳过角色卡消息（已经在上面注入了最新的角色卡）
        if (msg.role === 'system' && msg.name === 'ADND 2E 角色卡') {
          continue;
        }
        chatHistoryPrompts.push({
          role: msg.role,
          content: msg.content,
        });
      }

      // 4. 触发 AI 生成（启用流式传输，并注入完整上下文）
      isGenerating.value = true;
      streamingText.value = '';

      const response = await generate({
        user_input: input,
        should_stream: true,
        generation_id: 'adnd2e-game',
        // 关键修复：通过 overrides 覆盖 chat_history，注入角色卡和历史消息
        overrides: {
          chat_history: {
            with_depth_entries: true, // 保留世界书条目
            prompts: chatHistoryPrompts,
          },
        },
      });

      // 4. 解析 AI 响应中的命令（学习 lucklyjkop 的命令驱动机制）
      const parseResult = parseAiResponse(response);

      if (parseResult.errors.length > 0) {
        console.warn('[Game] 命令解析错误:', parseResult.errors);
        parseResult.errors.forEach(error => {
          toastr.warning(`命令错误: ${error}`);
        });
      }

      // 5. 应用命令到游戏状态
      if (parseResult.commands.length > 0) {
        const successCount = gameStateStore.applyCommands(parseResult.commands);
        console.log(`[Game] 应用了 ${successCount}/${parseResult.commands.length} 个命令`);
      }

      // 6. 添加纯净的内容（不含命令）到前端显示（仅前端，不创建酒馆消息楼层）
      const cleanContent = parseResult.content || response;
      // AI 输出时保存状态快照，用于删除消息后的状态回溯
      addMessageToLog({ role: 'assistant', content: cleanContent, name: 'DM' }, true);

      // 7. 同层游玩：不调用 createChatMessages
      // 所有对话历史都保存在 IndexedDB 中，可通过导出功能手动导出到酒馆

      // 8. 快速保存到 IndexedDB（自动同步会定期同步到角色卡变量）
      await saveProgress();

      console.log('[Game] 消息已保存到 IndexedDB（同层游玩：不创建酒馆消息楼层）');
    } catch (error) {
      toastr.error('生成失败: ' + (error as Error).message);
      console.error('[Game] 生成失败:', error);
    } finally {
      isGenerating.value = false;
      streamingText.value = '';
    }
  }

  // 停止生成
  async function stopGeneration() {
    try {
      await stopGenerationById('adnd2e-game');
      isGenerating.value = false;
      streamingText.value = '';
      toastr.info('已停止生成');
    } catch (error) {
      console.error('停止生成失败:', error);
    }
  }

  // 保存进度（防抖保存到 IndexedDB，自动同步会处理酒馆消息楼层）
  async function saveProgress() {
    try {
      const gameStateStore = useGameStateStore();

      // 使用防抖保存到 IndexedDB（性能优化：避免频繁写入）
      await debouncedSaveToIndexedDB({
        messages: klona(messages.value), // 消息历史（去除 proxy）
        gameState: gameStateStore.exportGameState(), // 结构化游戏状态
      });

      console.log('[Game] 进度已加入保存队列（防抖机制）');
    } catch (error) {
      console.error('[Game] 保存失败:', error);
    }
  }

  // 立即保存（跳过防抖，用于关键时刻）
  async function saveProgressImmediately() {
    try {
      await flushPendingSave();
      console.log('[Game] 进度已立即保存');
    } catch (error) {
      console.error('[Game] 立即保存失败:', error);
    }
  }

  // 从酒馆加载消息作为上下文（不同步，仅作为参考）
  async function loadTavernMessagesAsContext() {
    try {
      const lastMessageId = getLastMessageId();
      if (lastMessageId < 0) {
        console.log('[Game] 酒馆无消息');
        return [];
      }

      const tavernMessages = getChatMessages(`0-${lastMessageId}`, { include_swipes: false });
      const contextMessages = tavernMessages.map(msg => ({
        role: msg.role as 'system' | 'assistant' | 'user',
        content: msg.message,
        name: msg.name,
        timestamp: (msg as any).gen_started || Date.now(),
      }));

      console.log('[Game] 已加载酒馆消息作为上下文参考，共', contextMessages.length, '条');
      return contextMessages;
    } catch (error) {
      console.error('[Game] 加载酒馆消息失败:', error);
      return [];
    }
  }

  // 清理函数：停止自动同步并刷新待保存的数据
  async function cleanup() {
    await stopAutoSync(); // stopAutoSync 内部会调用 flushPendingSave
    console.log('[Game] 已清理资源');
  }

  // 导出游戏记录为文件
  async function exportToFile() {
    await exportMessagesToFile();
  }

  // 手动补充分段记忆
  function supplementSegmentedMemory(smallSummary: string, largeSummary: string) {
    if (pendingMessageIndex.value !== null && pendingMessageIndex.value < messages.value.length) {
      const message = messages.value[pendingMessageIndex.value];
      message.smallSummary = smallSummary;
      message.largeSummary = largeSummary;

      console.log('[Game] 已手动补充分段记忆:', {
        index: pendingMessageIndex.value,
        smallSummary: smallSummary.substring(0, 50) + '...',
        largeSummary,
      });

      toastr.success('分段记忆已补充');

      // 保存到 IndexedDB
      saveProgress();
    }

    // 关闭弹窗
    showManualSegmentedMemoryModal.value = false;
    pendingMessageIndex.value = null;
  }

  // 关闭手动补充弹窗
  function closeManualSegmentedMemoryModal() {
    showManualSegmentedMemoryModal.value = false;
    pendingMessageIndex.value = null;
  }

  return {
    // 状态
    messages,
    isGenerating,
    streamingText,
    settingsPanelCollapsed,
    statusPanelCollapsed,
    showManualSegmentedMemoryModal, // 手动补充分段记忆弹窗状态
    pendingMessageIndex, // 待补充消息索引

    // 方法
    initializeGame,
    addMessageToLog,
    buildContextMessages, // 构建分段记忆上下文
    sendUserInput,
    stopGeneration,
    saveProgress,
    saveProgressImmediately, // 立即保存（性能优化）
    loadTavernMessagesAsContext, // 可选：加载酒馆消息作为参考
    formatCharacterSheet,
    createInitialCharacterMessage, // 创建第0层初始角色卡
    cleanup, // 清理函数
    exportToFile, // 导出为文件
    supplementSegmentedMemory, // 手动补充分段记忆
    closeManualSegmentedMemoryModal, // 关闭手动补充弹窗
  };
});
