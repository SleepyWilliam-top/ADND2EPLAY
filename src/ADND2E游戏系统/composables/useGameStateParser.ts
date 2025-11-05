import toastr from 'toastr';
import { useGameStateStore } from '../stores/gameStateStore';
import { getEquipmentById, searchEquipment, type Armor, type Weapon } from '../utils/equipmentData';
import { emitNpcAdded, emitNpcRemoved, emitNpcUpdated } from '../utils/eventBus';

/**
 * 游戏状态指令接口
 */
export interface GameStateCommand {
  type: string;
  [key: string]: any;
}

/**
 * 解析 <gamestate> 标签中的指令
 */
export function parseGameStateCommands(content: string): GameStateCommand[] {
  const commands: GameStateCommand[] = [];

  // 提取 <gamestate> 标签内容
  const gamestateRegex = /<gamestate>([\s\S]*?)<\/gamestate>/gi;
  const match = gamestateRegex.exec(content);

  if (!match) {
    console.log('[GameState Parser] 未找到 <gamestate> 标签');
    return commands;
  }

  const gamestateContent = match[1].trim();
  console.log('[GameState Parser] 提取到 gamestate 内容:', gamestateContent.substring(0, 200));

  try {
    // 尝试解析为 JSON 数组
    const parsed = JSON.parse(gamestateContent);
    if (Array.isArray(parsed)) {
      console.log('[GameState Parser] 成功解析为 JSON 数组，包含', parsed.length, '条指令');
      return parsed as GameStateCommand[];
    }
  } catch (error) {
    console.log('[GameState Parser] 无法解析为 JSON，尝试函数调用格式');
  }

  // 如果不是 JSON，尝试解析函数调用格式
  // 例如: set({...}) add("ID", {...}) del("ID")
  const functionRegex = /(\w+)\(([\s\S]*?)\)(?=\s*\w+\(|$)/g;
  let funcMatch;

  console.log('[GameState Parser] 开始使用正则匹配函数调用...');

  while ((funcMatch = functionRegex.exec(gamestateContent)) !== null) {
    const funcName = funcMatch[1];
    const funcArgs = funcMatch[2].trim();

    console.log(`[GameState Parser] 匹配到函数: ${funcName}, 参数长度: ${funcArgs.length}`);
    console.log(`[GameState Parser] 参数前100字符:`, funcArgs.substring(0, 100));

    try {
      // 解析参数
      const args = JSON.parse(`[${funcArgs}]`);
      commands.push({
        type: funcName,
        args,
      });
      console.log(`[GameState Parser] 成功解析函数 ${funcName}`);
    } catch (error) {
      console.error(`[GameState Parser] 解析函数 ${funcName} 失败:`, error);
      console.error(`[GameState Parser] 完整参数:`, funcArgs);
    }
  }

  console.log(`[GameState Parser] 最终解析出 ${commands.length} 条指令`);
  return commands;
}

/**
 * 执行游戏状态指令
 */
export function executeGameStateCommand(command: GameStateCommand, messageIndex: number = -1): boolean {
  const gameStateStore = useGameStateStore();

  try {
    let result = false;
    switch (command.type) {
      case 'set':
        result = executeSet(command, gameStateStore);
        break;

      case 'add':
        result = executeAdd(command, gameStateStore);
        break;

      case 'del':
        result = executeDel(command, gameStateStore);
        break;

      case 'updateTime':
        result = executeUpdateTime(command, gameStateStore);
        break;

      case 'updateAttribute':
        result = executeUpdateAttribute(command, gameStateStore);
        break;

      case 'equipItem':
        result = executeEquipItem(command, gameStateStore);
        break;

      case 'unequipItem':
        result = executeUnequipItem(command, gameStateStore);
        break;

      case 'addSmallSummary':
        result = executeAddSmallSummary(command, gameStateStore, messageIndex);
        break;

      case 'addLargeSummary':
        result = executeAddLargeSummary(command, gameStateStore, messageIndex);
        break;

      default:
        console.warn(`[GameState Parser] 未知指令类型: ${command.type}`);
        return false;
    }

    // 🔧 修复：执行成功后立即同步到角色卡变量，确保其他组件能读取到最新数据
    if (result) {
      gameStateStore.syncToCharacterVariables();
      console.log(`[GameState Parser] 已同步 ${command.type} 指令结果到角色卡变量`);
    }

    return result;
  } catch (error) {
    console.error(`[GameState Parser] 执行指令失败:`, command, error);
    return false;
  }
}

/**
 * set - 新增实体
 */
function executeSet(command: GameStateCommand, _storeParam: ReturnType<typeof useGameStateStore>): boolean {
  // 🔧 修复：重新获取 store 以确保引用最新
  const store = useGameStateStore();

  const data = command.args?.[0] || command.data;
  if (!data) return false;

  const table = data.table;
  const id = data.id;

  if (!table || !id) {
    console.error('[GameState Parser] set 指令缺少 table 或 id 字段');
    return false;
  }

  switch (table) {
    case 'npc': {
      // 添加 NPC
      const npc: any = {
        id,
        name: data.name || '未命名NPC',
        ac: data.ac || 10,
        mv: data.mv || 12,
        hd: data.hd || '1',
        hp: data.hp || '1/1',
        thac0: data.thac0 || 20,
        at: data.at || '1',
        dmg: data.dmg || '1d6',
        sz: data.sz || 'M',
        int: data.int || '平均',
        al: data.al || 'N',
        ml: data.ml || 10,
        xp: data.xp || 0,
        sa: data.sa || '无',
        sd: data.sd || '无',
        sw: data.sw || '无',
        sp: data.sp || '无',
        mr: data.mr || '无',
        magicItems: data.magicItems || '无',
        status: data.status || '正常',
        appearance: data.appearance || '',
        personality: data.personality || '',
        relationship: 0,
        relationshipDescription: data.relationship || '中立',
        attitude: data.attitude || 'neutral',
        location: data.location || '',
        isBonded: data.isBonded || false, // 🔧 添加 isBonded 字段支持
        notes: data.notes || '', // 🔧 添加 notes 字段支持
      };

      if (data.maxHp) npc.maxHp = data.maxHp;

      // 🔧 修复：使用 store 的 addNpc 方法，确保直接操作内部 ref
      store.addNpc(npc);
      console.log(`[GameState] 新增 NPC: ${npc.name} (isBonded: ${npc.isBonded})`);
      toastr.info(`${npc.name} 登场`, 'NPC');

      // 🔧 注意：不在这里触发事件，避免 StatusPanel 用旧数据覆盖新数据
      // 事件将在批量执行完毕并同步到角色卡变量后统一触发
      emitNpcAdded(npc.id, npc.name);
      // emitGameDataUpdated(); // ← 移除这个，防止过早触发

      return true;
    }

    case 'item': {
      // 添加物品
      const item = {
        name: data.name || '未命名物品',
        quantity: parseInt(data.quantity || '1'),
        description: data.description || '',
        weight: parseFloat(data.weight || '0'),
      };

      if (!store.gameState) return false;
      store.gameState.inventory.push(item);
      console.log(`[GameState] 新增物品: ${item.name} x${item.quantity}`);
      return true;
    }

    case 'quest': {
      // 添加任务
      const quest = {
        id,
        name: data.name || '未命名任务',
        title: data.title || data.name || '未命名任务', // 🔧 添加 title 字段兼容旧代码
        description: data.description || '',
        objective: data.objective || '',
        reward: data.reward || '',
        status: (data.status || 'active') as 'active' | 'completed' | 'failed' | 'pending',
        difficulty: data.difficulty || '普通',
        giver: data.giver || '',
        location: data.location || '',
        notes: data.notes || '',
        progress: data.progress || '', // 🔧 添加 progress 字段
      };

      if (!store.gameState) return false;
      store.gameState.quests.push(quest);
      console.log(`[GameState] 新增任务: ${quest.name}`);
      toastr.success(`新任务：${quest.name}`, '任务');

      // 🔧 注意：不在这里触发事件，避免过早触发
      // emitGameDataUpdated(); // ← 移除，防止过早触发

      return true;
    }

    case 'spell': {
      // 添加法术
      const spell = {
        id,
        name: data.name || '未命名法术',
        level: parseInt(data.level || '1'),
        school: data.school || '',
        sphere: data.sphere || '',
        components: data.components || 'V,S',
        castingTime: data.castingTime || data.casting_time || '1',
        range: data.range || '0',
        duration: data.duration || '瞬间',
        savingThrow: data.savingThrow || data.saving_throw || '无',
        effect: data.effect || '',
        memorized: data.memorized === true || data.memorized === 'true',
      };

      if (!store.gameState) return false;
      store.gameState.spells.push(spell);
      console.log(`[GameState] 新增法术: ${spell.name}`);
      return true;
    }

    default:
      console.warn(`[GameState Parser] 未知的 table 类型: ${table}`);
      return false;
  }
}

/**
 * add - 更新实体
 */
function executeAdd(command: GameStateCommand, store: ReturnType<typeof useGameStateStore>): boolean {
  const id = command.args?.[0] || command.id;
  const data = command.args?.[1] || command.data;

  if (!id || !data) {
    console.error('[GameState Parser] add 指令缺少 id 或 data 字段');
    return false;
  }

  if (!store.gameState) return false;

  // 特殊处理：玩家角色
  if (id === 'PC') {
    const char = store.gameState.character;
    if (data.hp) {
      const [current, max] = data.hp.split('/');
      char.hp.current = parseInt(current);
      if (max) char.hp.max = parseInt(max);
    }
    if (data.xp) char.xp = parseInt(data.xp);
    if (data.level) char.level = parseInt(data.level);
    if (data.gold) char.gold = parseInt(data.gold);

    // 更新属性
    if (data.str) char.attributes.str = parseInt(data.str);
    if (data.dex) char.attributes.dex = parseInt(data.dex);
    if (data.con) char.attributes.con = parseInt(data.con);
    if (data.int) char.attributes.int = parseInt(data.int);
    if (data.wis) char.attributes.wis = parseInt(data.wis);
    if (data.cha) char.attributes.cha = parseInt(data.cha);

    console.log(`[GameState] 更新玩家角色`, data);

    // 🔧 注意：不在这里触发事件，避免过早触发
    // emitGameDataUpdated(); // ← 移除，防止过早触发

    return true;
  }

  // NPC 更新
  const npcIndex = store.gameState.npcs.findIndex(n => n.id === id);
  if (npcIndex >= 0) {
    Object.assign(store.gameState.npcs[npcIndex], data);
    const npc = store.gameState.npcs[npcIndex];
    console.log(`[GameState] 更新 NPC: ${npc.name}`);

    // 🔧 触发事件通知其他组件
    emitNpcUpdated(npc.id, npc.name, Object.keys(data));
    // emitGameDataUpdated(); // ← 移除，防止过早触发

    return true;
  }

  // 🔧 NPC 更新失败：列出当前存在的 NPC
  const existingNpcs = store.gameState.npcs.map(n => `${n.id}(${n.name})`).join(', ');
  console.warn(
    `[GameState Parser] 找不到 ID 为 "${id}" 的 NPC 以进行更新。\n` + `当前存在的 NPC: ${existingNpcs || '无'}`,
  );
  toastr.warning(`找不到 ID 为 "${id}" 的 NPC`, '更新失败');

  // 任务更新
  const questIndex = store.gameState.quests.findIndex(q => q.id === id);
  if (questIndex >= 0) {
    Object.assign(store.gameState.quests[questIndex], data);
    console.log(`[GameState] 更新任务: ${store.gameState.quests[questIndex].name}`);
    // emitGameDataUpdated(); // ← 移除，防止过早触发
    return true;
  }

  // 法术更新
  const spellIndex = store.gameState.spells.findIndex(s => s.id === id);
  if (spellIndex >= 0) {
    Object.assign(store.gameState.spells[spellIndex], data);
    console.log(`[GameState] 更新法术: ${store.gameState.spells[spellIndex].name}`);
    // emitGameDataUpdated(); // ← 移除，防止过早触发
    return true;
  }

  // 物品更新
  const itemIndex = store.gameState.inventory.findIndex(
    i => i.name === id || i.name.includes(id) || id.includes(i.name),
  );
  if (itemIndex >= 0) {
    if (data.quantity !== undefined) {
      store.gameState.inventory[itemIndex].quantity = parseInt(data.quantity);
    }
    console.log(`[GameState] 更新物品: ${store.gameState.inventory[itemIndex].name}`);
    return true;
  }

  console.warn(`[GameState Parser] 找不到 ID 为 ${id} 的实体`);
  return false;
}

/**
 * del - 删除实体
 */
function executeDel(command: GameStateCommand, store: ReturnType<typeof useGameStateStore>): boolean {
  const id = command.args?.[0] || command.id;

  if (!id) {
    console.error('[GameState Parser] del 指令缺少 id 字段');
    return false;
  }

  if (!store.gameState) return false;

  // 删除 NPC
  const npcIndex = store.gameState.npcs.findIndex(n => n.id === id);
  if (npcIndex >= 0) {
    const npc = store.gameState.npcs[npcIndex];
    const name = npc.name;
    const npcId = npc.id;
    store.gameState.npcs.splice(npcIndex, 1);
    console.log(`[GameState] 删除 NPC: ${name}`);
    toastr.info(`${name} 已离开`, 'NPC');

    // 🔧 触发事件通知其他组件
    emitNpcRemoved(npcId, name);
    // emitGameDataUpdated(); // ← 移除，防止过早触发

    return true;
  }

  // 删除任务
  const questIndex = store.gameState.quests.findIndex(q => q.id === id);
  if (questIndex >= 0) {
    const name = store.gameState.quests[questIndex].name;
    store.gameState.quests.splice(questIndex, 1);
    console.log(`[GameState] 删除任务: ${name}`);
    // emitGameDataUpdated(); // ← 移除，防止过早触发
    return true;
  }

  // 删除法术
  const spellIndex = store.gameState.spells.findIndex(s => s.id === id);
  if (spellIndex >= 0) {
    const name = store.gameState.spells[spellIndex].name;
    store.gameState.spells.splice(spellIndex, 1);
    console.log(`[GameState] 删除法术: ${name}`);
    // emitGameDataUpdated(); // ← 移除，防止过早触发
    return true;
  }

  // 删除物品
  const itemIndex = store.gameState.inventory.findIndex(
    i => i.name === id || i.name.includes(id) || id.includes(i.name),
  );
  if (itemIndex >= 0) {
    const name = store.gameState.inventory[itemIndex].name;
    store.gameState.inventory.splice(itemIndex, 1);
    console.log(`[GameState] 删除物品: ${name}`);
    return true;
  }

  // 🔧 删除失败：列出当前存在的各类实体，帮助 AI 使用正确的 ID
  const existingNpcs = store.gameState.npcs.map(n => `${n.id}(${n.name})`).join(', ');
  const existingQuests = store.gameState.quests.map(q => `${q.id}(${q.name})`).join(', ');
  console.warn(
    `[GameState Parser] 找不到 ID 为 "${id}" 的实体。\n` +
      `当前存在的 NPC: ${existingNpcs || '无'}\n` +
      `当前存在的任务: ${existingQuests || '无'}`,
  );
  toastr.warning(`找不到 ID 为 "${id}" 的实体`, '删除失败');
  return false;
}

/**
 * updateTime - 更新时间地点
 */
function executeUpdateTime(command: GameStateCommand, store: ReturnType<typeof useGameStateStore>): boolean {
  const date = command.args?.[0] || command.date || '';
  const time = command.args?.[1] || command.time || '';
  const location = command.args?.[2] || command.location || '';

  if (!store.gameState) return false;

  // 解析日期和时间
  const dateTimeMatch = date.match(/^(.+?)\s+(上午|下午|黄昏|深夜|清晨|午后|傍晚|夜晚|凌晨)$/);
  if (dateTimeMatch) {
    store.gameState.time.date = dateTimeMatch[1];
    store.gameState.time.current = dateTimeMatch[2];
  } else {
    if (date) store.gameState.time.date = date;
    if (time) store.gameState.time.current = time;
  }

  if (location) {
    store.gameState.location.current = location;
    if (!store.gameState.location.history.includes(location)) {
      store.gameState.location.history.push(location);
    }
  }

  console.log(`[GameState] 更新时间地点: ${date} ${time} - ${location}`);

  // 🔧 注意：不在这里触发事件，避免过早触发
  // emitGameDataUpdated(); // ← 移除，防止过早触发

  return true;
}

/**
 * updateAttribute - 更新属性
 * 格式: updateAttribute("角色ID", "属性名", 当前值, 最大值)
 * 示例: updateAttribute("PC", "力量", 16, 18)
 */
function executeUpdateAttribute(command: GameStateCommand, store: ReturnType<typeof useGameStateStore>): boolean {
  const charId = command.args?.[0];
  const attrName = command.args?.[1];
  const current = command.args?.[2];
  const max = command.args?.[3];

  if (charId !== 'PC') {
    console.warn('[GameState Parser] updateAttribute 目前只支持 PC');
    return false;
  }

  if (!store.gameState) return false;
  const char = store.gameState.character;

  const attrMap: { [key: string]: keyof typeof char.attributes } = {
    力量: 'str',
    敏捷: 'dex',
    体质: 'con',
    智力: 'int',
    灵知: 'wis',
    魅力: 'cha',
    str: 'str',
    dex: 'dex',
    con: 'con',
    int: 'int',
    wis: 'wis',
    cha: 'cha',
  };

  const attrKey = attrMap[attrName];
  if (attrKey) {
    char.attributes[attrKey] = parseInt(current);
    console.log(`[GameState] 更新属性: ${attrName} = ${current}${max ? ` (最大: ${max})` : ''}`);
    toastr.success(`属性 ${attrName} 更新为 ${current}`, '属性变化');
    return true;
  }

  console.warn(`[GameState] 未知属性: ${attrName}`);
  return false;
}

/**
 * equipItem - 装备物品
 * 格式: equipItem("角色ID", "装备槽", {"name": "名称", "bonus": "加成"})
 * 示例: equipItem("PC", "武器", {"name": "长剑+1", "bonus": "攻击+1,伤害+1"})
 */
function executeEquipItem(command: GameStateCommand, store: ReturnType<typeof useGameStateStore>): boolean {
  const charId = command.args?.[0];
  const slotName = command.args?.[1];
  const itemData = command.args?.[2] || {};

  if (charId !== 'PC') {
    console.warn('[GameState Parser] equipItem 目前只支持 PC');
    return false;
  }

  if (!store.gameState) return false;

  // 槽位映射
  const slotMap: { [key: string]: keyof typeof store.gameState.character.equipment } = {
    头盔: 'helmet',
    护甲: 'armor',
    盾牌: 'shield',
    武器: 'weapon',
    主手: 'weapon',
    副手: 'offhand',
    左手: 'offhand',
    戒指1: 'ring1',
    戒指2: 'ring2',
    项链: 'amulet',
    斗篷: 'cloak',
    手套: 'gloves',
    腰带: 'belt',
    靴子: 'boots',
    helmet: 'helmet',
    armor: 'armor',
    shield: 'shield',
    weapon: 'weapon',
    offhand: 'offhand',
    ring1: 'ring1',
    ring2: 'ring2',
    amulet: 'amulet',
    cloak: 'cloak',
    gloves: 'gloves',
    belt: 'belt',
    boots: 'boots',
  };

  const slot = slotMap[slotName];
  if (!slot) {
    console.warn(`[GameState] 未知装备槽位: ${slotName}`);
    return false;
  }

  // 从 equipmentData 获取装备信息
  let equipmentInfo = itemData.id ? getEquipmentById(itemData.id) : undefined;

  // 如果没有 ID，尝试按名称搜索
  if (!equipmentInfo && itemData.name) {
    const results = searchEquipment(itemData.name);
    if (results.length > 0) {
      equipmentInfo = results[0];
    }
  }

  // 创建装备项
  const equippedItem: any = {
    id: itemData.id || itemData.name,
    name: itemData.name,
    slot,
    bonus: itemData.bonus,
    magical: !!itemData.bonus || !!itemData.magical,
    category: equipmentInfo?.category || 'unknown',
    weight: equipmentInfo?.weight || 0,
    price: equipmentInfo?.price || 0,
  };

  // 如果是武器或护甲，添加额外信息
  if (equipmentInfo) {
    if ('damageS' in equipmentInfo) {
      const weaponInfo = equipmentInfo as Weapon;
      equippedItem.damageS = weaponInfo.damageS;
      equippedItem.damageL = weaponInfo.damageL;
      equippedItem.speed = weaponInfo.speed;
      equippedItem.type = weaponInfo.type;
    }
    if ('ac' in equipmentInfo) {
      const armorInfo = equipmentInfo as Armor;
      equippedItem.ac = armorInfo.ac;
      equippedItem.armorType = armorInfo.armorType;
    }
  }

  // 装备物品
  store.gameState.character.equipment[slot] = equippedItem;

  console.log(`[GameState] 装备物品: ${itemData.name} 到 ${slotName}`);
  toastr.success(`已装备 ${itemData.name}`, '装备管理');

  return true;
}

/**
 * unequipItem - 卸下装备
 * 格式: unequipItem("角色ID", "装备槽")
 * 示例: unequipItem("PC", "武器")
 */
function executeUnequipItem(command: GameStateCommand, store: ReturnType<typeof useGameStateStore>): boolean {
  const charId = command.args?.[0];
  const slotName = command.args?.[1];

  if (charId !== 'PC') {
    console.warn('[GameState Parser] unequipItem 目前只支持 PC');
    return false;
  }

  if (!store.gameState) return false;

  // 槽位映射
  const slotMap: { [key: string]: keyof typeof store.gameState.character.equipment } = {
    头盔: 'helmet',
    护甲: 'armor',
    盾牌: 'shield',
    武器: 'weapon',
    主手: 'weapon',
    副手: 'offhand',
    左手: 'offhand',
    戒指1: 'ring1',
    戒指2: 'ring2',
    项链: 'amulet',
    斗篷: 'cloak',
    手套: 'gloves',
    腰带: 'belt',
    靴子: 'boots',
    helmet: 'helmet',
    armor: 'armor',
    shield: 'shield',
    weapon: 'weapon',
    offhand: 'offhand',
    ring1: 'ring1',
    ring2: 'ring2',
    amulet: 'amulet',
    cloak: 'cloak',
    gloves: 'gloves',
    belt: 'belt',
    boots: 'boots',
  };

  const slot = slotMap[slotName];
  if (!slot) {
    console.warn(`[GameState] 未知装备槽位: ${slotName}`);
    return false;
  }

  const item = store.gameState.character.equipment[slot];
  if (!item) {
    console.warn(`[GameState] 槽位 ${slotName} 没有装备`);
    return false;
  }

  const itemName = item.name;
  store.gameState.character.equipment[slot] = undefined;

  console.log(`[GameState] 卸下装备: ${itemName} 从 ${slotName}`);
  toastr.info(`已卸下 ${itemName}`, '装备管理');

  return true;
}

/**
 * addSmallSummary - 添加小总结
 */
function executeAddSmallSummary(
  command: GameStateCommand,
  store: ReturnType<typeof useGameStateStore>,
  messageIndex: number,
): boolean {
  const content = command.args?.[0] || command.content || '';

  if (!store.gameState) return false;

  // 查找是否已有本条消息的总结
  const existing = store.gameState.summaries.find(s => s.messageIndex === messageIndex);
  if (existing) {
    existing.smallSummary = content;
    existing.timestamp = Date.now();
  } else {
    store.gameState.summaries.push({
      timestamp: Date.now(),
      smallSummary: content,
      largeSummary: '',
      messageIndex,
    });
  }

  console.log(`[GameState] 添加小总结 (消息 #${messageIndex})`);
  return true;
}

/**
 * addLargeSummary - 添加大总结
 */
function executeAddLargeSummary(
  command: GameStateCommand,
  store: ReturnType<typeof useGameStateStore>,
  messageIndex: number,
): boolean {
  const content = command.args?.[0] || command.content || '';

  if (!store.gameState) return false;

  // 查找是否已有本条消息的总结
  const existing = store.gameState.summaries.find(s => s.messageIndex === messageIndex);
  if (existing) {
    existing.largeSummary = content;
    existing.timestamp = Date.now();
  } else {
    store.gameState.summaries.push({
      timestamp: Date.now(),
      smallSummary: '',
      largeSummary: content,
      messageIndex,
    });
  }

  console.log(`[GameState] 添加大总结 (消息 #${messageIndex})`);
  return true;
}

/**
 * 处理消息中的游戏状态指令
 */
export function processMessageGameState(content: string, messageIndex: number): void {
  const commands = parseGameStateCommands(content);

  if (commands.length === 0) {
    return;
  }

  console.log(`[GameState Parser] 解析到 ${commands.length} 条指令`);

  // 🔧 优化：批量执行时，先禁用单个指令的同步，最后统一同步一次
  const gameStateStore = useGameStateStore();
  let successCount = 0;

  // 先执行所有指令（不同步）
  commands.forEach(command => {
    if (executeGameStateCommandInternal(command, gameStateStore, messageIndex)) {
      successCount++;
    }
  });

  // 🔧 批量执行完毕后，统一同步一次到角色卡变量
  if (successCount > 0) {
    gameStateStore.syncToCharacterVariables();
    console.log(`[GameState Parser] 批量执行完毕，已同步所有更改到角色卡变量`);
  }

  console.log(`[GameState Parser] 成功执行 ${successCount}/${commands.length} 条指令`);
}

/**
 * 内部执行函数（不自动同步）
 */
function executeGameStateCommandInternal(
  command: GameStateCommand,
  gameStateStore: ReturnType<typeof useGameStateStore>,
  messageIndex: number = -1,
): boolean {
  try {
    switch (command.type) {
      case 'set':
        return executeSet(command, gameStateStore);

      case 'add':
        return executeAdd(command, gameStateStore);

      case 'del':
        return executeDel(command, gameStateStore);

      case 'updateTime':
        return executeUpdateTime(command, gameStateStore);

      case 'updateAttribute':
        return executeUpdateAttribute(command, gameStateStore);

      case 'equipItem':
        return executeEquipItem(command, gameStateStore);

      case 'unequipItem':
        return executeUnequipItem(command, gameStateStore);

      case 'addSmallSummary':
        return executeAddSmallSummary(command, gameStateStore, messageIndex);

      case 'addLargeSummary':
        return executeAddLargeSummary(command, gameStateStore, messageIndex);

      default:
        console.warn(`[GameState Parser] 未知指令类型: ${command.type}`);
        return false;
    }
  } catch (error) {
    console.error(`[GameState Parser] 执行指令失败:`, command, error);
    return false;
  }
}
