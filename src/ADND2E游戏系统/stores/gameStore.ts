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
import { getClassById } from '../utils/classData';
import { parseAiResponse } from '../utils/commandParser';
import { getPriestSpellById } from '../utils/priestSpellData';
import { getProficiencyById } from '../utils/proficiencyData';
import { getRaceById, getSubraceById } from '../utils/raceData';
import { getWeaponById } from '../utils/weaponData';
import { getWizardSpellById } from '../utils/wizardSpellData';
import type { CharacterData } from './characterStore';
import { useGameStateStore } from './gameStateStore';

export interface GameMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
  name?: string;
  timestamp: number;
}

export const useGameStore = defineStore('adnd2e-game', () => {
  // 状态
  const messages = ref<GameMessage[]>([]); // 前端消息日志，用于界面显示
  const isGenerating = ref(false);
  const streamingText = ref('');
  const settingsPanelCollapsed = ref(false);
  const statusPanelCollapsed = ref(false);

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

    // 属性值
    lines.push('【属性值】');
    const abilityNames = {
      str: '力量 (STR)',
      dex: '敏捷 (DEX)',
      con: '体质 (CON)',
      int: '智力 (INT)',
      wis: '感知 (WIS)',
      cha: '魅力 (CHA)',
    };
    for (const [key, name] of Object.entries(abilityNames)) {
      const value = character.abilities[key as keyof typeof character.abilities];
      lines.push(`${name}: ${value !== null ? value : '?'}`);
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

    // 外貌
    if (character.appearance) {
      lines.push('【外貌描述】');
      lines.push(character.appearance);
      lines.push('');
    }

    // 背景
    if (character.background) {
      lines.push('【背景故事】');
      lines.push(character.background);
      lines.push('');
    }

    // 种族描述与特性
    lines.push('【种族描述与特性】');
    const raceForDisplay = subraceInfo || raceInfo;
    if (raceForDisplay) {
      // 种族描述
      lines.push('');
      lines.push(raceForDisplay.description);
      lines.push('');

      // 种族能力
      const raceAbilities = raceForDisplay.abilities || [];
      if (raceAbilities.length > 0) {
        lines.push('种族能力:');
        raceAbilities.forEach(ability => {
          lines.push(`  • ${ability.name}: ${ability.description}`);
        });
        lines.push('');
      }

      // 种族优势
      if (raceForDisplay.specialAdvantages) {
        lines.push(`特殊优势: ${raceForDisplay.specialAdvantages}`);
        lines.push('');
      }

      // 种族劣势
      if (raceForDisplay.specialDisadvantages) {
        lines.push(`特殊劣势: ${raceForDisplay.specialDisadvantages}`);
        lines.push('');
      }
    }

    // 职业描述与特性
    lines.push('【职业描述与特性】');
    if (classInfo) {
      // 职业描述
      lines.push('');
      lines.push(classInfo.description);
      lines.push('');

      // 职业能力（1级）
      const classAbilities = classInfo.specialAbilities.filter(a => a.level === 1);
      if (classAbilities.length > 0) {
        lines.push('职业能力:');
        classAbilities.forEach(ability => {
          lines.push(`  • ${ability.name}: ${ability.description}`);
        });
        lines.push('');
      }

      // 职业说明
      if (classInfo.specialNotes && classInfo.specialNotes.length > 0) {
        lines.push('职业说明:');
        classInfo.specialNotes.forEach(note => {
          lines.push(`  - ${note}`);
        });
        lines.push('');
      }

      // 武器与护甲限制
      lines.push(`武器限制: ${classInfo.weaponRestrictions}`);
      lines.push(`护甲限制: ${classInfo.armorRestrictions}`);
    }

    lines.push('');
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
        // 加载已保存的游戏数据
        console.log('[Game] 加载已保存的游戏数据');

        // 加载消息历史
        messages.value = persistedData.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp || Date.now(),
        }));

        // 加载游戏状态
        gameStateStore.loadGameState(persistedData.gameState);

        toastr.success('游戏数据加载完成');
      } else {
        // 首次初始化或没有保存数据
        console.log('[Game] 首次初始化游戏（同层游玩模式）');

        // 同层游玩：不检查酒馆消息楼层
        await createInitialCharacterMessage(savedData.character);

        // 初始化游戏状态
        gameStateStore.initializeGameState(savedData.character);

        // 将角色卡添加到前端显示日志（仅前端，不创建酒馆消息）
        const characterSheetText = formatCharacterSheet(savedData.character);
        messages.value = [
          {
            role: 'system',
            content: characterSheetText,
            name: 'ADND 2E 角色卡',
            timestamp: Date.now(),
          },
        ];

        // 保存初始状态到 IndexedDB（不创建酒馆消息楼层）
        await saveGameData({
          messages: klona(messages.value),
          gameState: gameStateStore.exportGameState(),
          character: savedData.character,
        });

        toastr.success('游戏初始化完成（同层游玩模式）');
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

  // 添加消息到前端日志
  function addMessageToLog(message: Omit<GameMessage, 'timestamp'>) {
    messages.value.push({
      ...message,
      timestamp: Date.now(),
    });
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

      // 1. 添加用户消息到前端显示（仅前端，不创建酒馆消息楼层）
      addMessageToLog({ role: 'user', content: input, name: characterName });

      // 2. 同层游玩：不调用 createChatMessages，所有消息仅存在于前端界面和 IndexedDB
      // 这样可以实现真正的"同层游玩"，不会增加酒馆的消息楼层数

      // 3. 准备发送给AI的上下文：角色卡 + 历史消息
      // 关键修复：因为采用同层游玩模式，酒馆的chat_history是空的
      // 必须通过 overrides.chat_history.prompts 手动注入角色卡和历史消息
      const chatHistoryPrompts: RolePrompt[] = [];

      // 3.1 首先注入角色卡（作为system消息）
      if (characterData) {
        const characterSheetText = formatCharacterSheet(characterData);
        chatHistoryPrompts.push({
          role: 'system',
          content: characterSheetText,
        });
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
      addMessageToLog({ role: 'assistant', content: cleanContent, name: 'DM' });

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
      const gameStateStore = useGameStateStore();

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

  return {
    // 状态
    messages,
    isGenerating,
    streamingText,
    settingsPanelCollapsed,
    statusPanelCollapsed,

    // 方法
    initializeGame,
    addMessageToLog,
    sendUserInput,
    stopGeneration,
    saveProgress,
    saveProgressImmediately, // 立即保存（性能优化）
    loadTavernMessagesAsContext, // 可选：加载酒馆消息作为参考
    formatCharacterSheet,
    createInitialCharacterMessage, // 创建第0层初始角色卡
    cleanup, // 清理函数
    exportToFile, // 导出为文件
  };
});
