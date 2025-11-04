import { ref, watch } from 'vue';
import { useGameStore } from '../stores/gameStore';

/**
 * NPC 数据接口（增强版 - 学习 lucklyjkop 的优点）
 */
export interface NPC {
  id: string; // 唯一标识符
  name: string;
  avatar?: string;

  // 基本信息
  gender?: 'male' | 'female' | 'other'; // 性别
  race?: string; // 种族
  class?: string; // 职业
  location?: string; // 当前位置
  status?: string; // 当前状态（受伤、中毒等）

  // 战斗属性
  ac: number | string;
  mv: number | string;
  hd: string;
  hp: number | string;
  maxHp?: number | string; // 最大生命值
  thac0: number | string;
  at: string;
  dmg: string;
  sa?: string; // 特殊攻击
  sd?: string; // 特殊防御
  sw?: string; // 豁免检定
  sp?: string; // 法术能力
  mr?: string; // 魔法抗性
  sz: string;
  int: string;
  al: string;
  ml: number | string;
  xp: number | string;

  // 描述信息
  appearance?: string; // 外貌描述
  personality?: string; // 性格描述
  background?: string; // 背景故事
  motivation?: string; // 动机/目标

  // 装备与物品
  magicItems?: string;
  equipment?: NpcEquipment; // 装备详情
  inventory?: NpcInventoryItem[]; // 物品清单

  // 关系系统
  relationship?: number; // 与玩家的关系值（-100 到 100）
  relationshipDescription?: string; // 关系描述
  attitude?: 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'helpful'; // 态度

  // 管理信息
  favorite: boolean; // 是否特别关心（永久保留）
  lastSeen: number; // 最后一次出现的消息时间戳
  firstSeen?: number; // 首次出现时间
  interactionCount?: number; // 交互次数
  notes?: string; // 玩家笔记
  tags?: string[]; // 标签（盟友、敌人、商人等）
}

/**
 * NPC 装备接口
 */
export interface NpcEquipment {
  weapon?: string; // 武器
  armor?: string; // 护甲
  shield?: string; // 盾牌
  accessories?: string[]; // 配饰
}

/**
 * NPC 物品接口
 */
export interface NpcInventoryItem {
  name: string;
  quantity: number;
  description?: string;
}

/**
 * AI 输出的 NPC 格式支持三种方式：
 *
 * 1. **标准 ADND2E 格式（推荐）**：
 *    格式1（带方括号）：<[名称]：AC [AC值]；MV [MV值]；...>
 *    格式2（不带方括号）：<名称：AC [AC值]；MV [MV值]；...>
 *
 *    示例：
 *    <[地精战士]：AC 6；MV 6；HD 1-1；hp 4；THAC0 20；#AT 1；Dmg 1d6；SZ S；Int 低（5-7）；AL LE；ML 8；XP 15>
 *    <托姆·铜须：AC -2；MV 12；HD 15；hp 120；THAC0 5；#AT 2；Dmg 1d6+3；SA 幸运诅咒；SD 魔法抗力70%；SW 无；SP 每日任意1-5级祭司/法师法术各6个；MR 70%；SZ S；Int 18；AL 混乱中立；ML 19；XP --；MagicItem 幸运骰子；状态 健康；外貌 矮小的矮人，留着火红的胡子；性格 狡黠且爱恶作剧；与角色关系 盟友>
 *
 *    字段说明：
 *    - AC: 护甲等级（Armor Class），数值越低越好，10为无甲，可为负数
 *    - MV: 移动速度（Movement），通常为6-15，人类平民12
 *    - HD: 生命骰（Hit Dice），如"1"表示1d8，"1-1"表示1d8-1，平民通常为1，骰子默认d6/d8
 *    - hp: 生命值（Hit Points），当前生命值
 *    - THAC0: 命中值（To Hit AC 0），数值越低越好，普通人20
 *    - #AT: 每轮攻击次数（# of Attacks），如"1"、"2"、"3/2"
 *    - Dmg: 伤害骰（Damage），如"1d6"、"1d8+2"、"2d4"
 *    - SA: 特殊攻击（Special Attacks），可选，如"背刺×2"
 *    - SD: 特殊防御（Special Defenses），可选，如"免疫魅惑"
 *    - SW: 特殊弱点（Special Weaknesses），可选，如"畏惧阳光"
 *    - SP: 法术能力（Spells），可选，如"可使用1级法术"
 *    - MR: 魔法抗力（Magic Resistance），可选，如"15%"、"70%"或"无"
 *    - SZ: 体型（Size），T(微型)/S(小型)/M(中型)/L(大型)/H(超大型)/G(巨型)
 *    - Int: 智力（Intelligence），如"高（13-14）"、"8-10"、"18"、"动物（1）"
 *    - AL: 阵营（Alignment），如"LG"(守序善良)、"CE"(混乱邪恶)、"N"(中立)、"混乱中立"
 *    - ML: 士气（Morale），2-20，普通人10，精英12-14
 *    - XP: 经验值（Experience Points），击败该生物获得的经验，可用"--"表示不适用
 *    - MagicItem: 魔法物品（可选），如"长剑+1"
 *    - 状态: NPC当前状态（可选），如"健康"、"受伤"、"中毒"
 *    - 外貌: NPC外貌描述（可选），如"高大的人类骑士，身着银色铠甲"
 *    - 性格: NPC性格描述（可选），如"正直勇敢"、"狡诈多疑"
 *    - 与角色关系: 与玩家角色的关系（可选），如"朋友"、"敌人"、"盟友"
 *
 * 2. **XML 格式**：
 *    <npc name="卫兵队长" ac="5" mv="12" hd="1" hp="5" thac0="18" at="1" dmg="1d8" sz="M" int="8-10" al="LG" ml="12" xp="15">
 *      一位经验丰富的城卫兵队长，身着链甲，手持长剑。
 *    </npc>
 *
 * 3. **管道分隔格式**：
 *    <npc>卫兵队长|AC:5|MV:12|HD:1|HP:5|THAC0:18|#AT:1|Dmg:1d8|SZ:M|Int:8-10|AL:LG|ML:12|XP:15</npc>
 *
 * 🔧 注意：当AI输出包含NPC数据时，游戏界面将自动隐藏
 */

/**
 * 使用 NPC 自动检测和管理
 */
export function useNpcAutoDetection() {
  const gameStore = useGameStore();

  const npcList = ref<NPC[]>([]);
  const isProcessing = ref(false);

  /**
   * 从角色卡变量加载 NPC 列表
   */
  function loadNpcList() {
    try {
      const charVars = getVariables({ type: 'character' });
      const savedNpcs = charVars?.adnd2e?.npcs;

      if (savedNpcs && Array.isArray(savedNpcs)) {
        npcList.value = savedNpcs;
        console.log('[NPC Auto] 从角色卡变量加载 NPC 列表，共', npcList.value.length, '个');
      } else {
        npcList.value = [];
        console.log('[NPC Auto] 无已保存的 NPC');
      }
    } catch (error) {
      console.error('[NPC Auto] 加载 NPC 列表失败:', error);
      npcList.value = [];
    }
  }

  /**
   * 保存 NPC 列表到角色卡变量
   */
  function saveNpcList() {
    try {
      const charVars = getVariables({ type: 'character' });
      replaceVariables(
        {
          adnd2e: {
            ...charVars?.adnd2e,
            npcs: npcList.value,
          },
        },
        { type: 'character' },
      );
      console.log('[NPC Auto] NPC 列表已保存');
    } catch (error) {
      console.error('[NPC Auto] 保存 NPC 列表失败:', error);
    }
  }

  /**
   * 解析 AI 输出中的 NPC 标签
   * 支持三种格式：
   * 1. 标准 ADND2E 格式：[名称]：AC 值；MV 值；...
   * 2. 简单格式：<npc>Name|AC:5|MV:12|HD:3|...</npc>
   * 3. XML 格式：<npc name="Name" ac="5" mv="12" hd="3">...</npc>
   */
  function parseNpcTags(text: string): NPC[] {
    const npcs: NPC[] = [];

    // 1. 解析标准 ADND2E 格式（优先级最高）
    const standardNpcs = parseStandardAdnd2eFormat(text);
    npcs.push(...standardNpcs);

    // 2. 匹配 XML 格式的 NPC 标签
    const xmlRegex = /<npc\s+([^>]+)>[\s\S]*?<\/npc>/gi;
    let xmlMatch;

    while ((xmlMatch = xmlRegex.exec(text)) !== null) {
      const attributesStr = xmlMatch[1];
      const npc = parseXmlAttributes(attributesStr);
      if (npc) {
        npcs.push(npc);
      }
    }

    // 3. 匹配简单格式的 NPC 标签（管道分隔）
    const simpleRegex = /<npc>([^<]+)<\/npc>/gi;
    let simpleMatch;

    while ((simpleMatch = simpleRegex.exec(text)) !== null) {
      const content = simpleMatch[1].trim();
      const npc = parseSimpleFormat(content);
      if (npc) {
        npcs.push(npc);
      }
    }

    return npcs;
  }

  /**
   * 解析 XML 属性格式的 NPC（增强版）
   */
  function parseXmlAttributes(attributesStr: string): NPC | null {
    try {
      const attrs: Record<string, string> = {};
      const attrRegex = /(\w+)="([^"]*)"/g;
      let match;

      while ((match = attrRegex.exec(attributesStr)) !== null) {
        attrs[match[1].toLowerCase()] = match[2];
      }

      if (!attrs.name) {
        console.warn('[NPC Auto] NPC 缺少 name 属性:', attributesStr);
        return null;
      }

      // 生成唯一ID
      const id = attrs.id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        id,
        name: attrs.name,
        avatar: attrs.avatar,

        // 基本信息
        gender: attrs.gender as 'male' | 'female' | 'other',
        race: attrs.race,
        class: attrs.class,
        location: attrs.location,
        status: attrs.status,

        // 战斗属性
        ac: attrs.ac || '10',
        mv: attrs.mv || '12',
        hd: attrs.hd || '1',
        hp: attrs.hp || '4',
        maxHp: attrs.maxhp || attrs.hp || '4',
        thac0: attrs.thac0 || '20',
        at: attrs.at || '1',
        dmg: attrs.dmg || '1d6',
        sa: attrs.sa,
        sd: attrs.sd,
        sw: attrs.sw,
        sp: attrs.sp,
        mr: attrs.mr,
        sz: attrs.sz || 'M',
        int: attrs.int || '8-10',
        al: attrs.al || 'N',
        ml: attrs.ml || '10',
        xp: attrs.xp || '35',

        // 描述信息
        appearance: attrs.appearance,
        personality: attrs.personality,
        background: attrs.background,
        motivation: attrs.motivation,

        // 装备与物品
        magicItems: attrs.magicitems || attrs.magic,

        // 关系系统
        relationship: attrs.relationship ? parseInt(attrs.relationship) : 0,
        relationshipDescription: attrs.relationshipdesc,
        attitude: (attrs.attitude as NPC['attitude']) || 'neutral',

        // 管理信息
        favorite: false,
        lastSeen: Date.now(),
        firstSeen: Date.now(),
        interactionCount: 0,
        tags: attrs.tags ? attrs.tags.split(',').map(t => t.trim()) : [],
      };
    } catch (error) {
      console.error('[NPC Auto] 解析 XML 格式 NPC 失败:', error);
      return null;
    }
  }

  /**
   * 解析标准 ADND2E NPC 格式
   * 格式: "<[名称]：AC [AC值]；..." 或 "<名称：AC [AC值]；..."（支持有无方括号）
   *
   * 示例：
   * <[地精战士]：AC 6；MV 6；HD 1-1；hp 4；THAC0 20；#AT 1；Dmg 1d6；SZ S；Int 低（5-7）；AL LE；ML 8；XP 15>
   * <托姆·铜须：AC -2；MV 12；HD 15；hp 120；THAC0 5；#AT 2；Dmg 1d6+3；状态 健康；外貌 矮人，红色胡子；性格 友善；与角色关系 朋友>
   */
  function parseStandardAdnd2eFormat(text: string): NPC[] {
    const npcs: NPC[] = [];

    // 匹配完整的 ADND2E NPC 格式（带尖括号）
    // 支持中英文分号和空格
    // 支持有无方括号两种格式：<[名称]：...> 或 <名称：...>
    // 🆕 新增：支持状态、外貌、性格、与角色关系字段
    const npcPattern = new RegExp(
      '<(?:\\[([^\\[\\]]+?)\\]|([^<>:：]+?))[:：]\\s*' + // 改进：支持有无方括号
        '(?:AC\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:MV\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:HD\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:hp\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:THAC0\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:#AT\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:Dmg\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:SA\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:SD\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:SW\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:SP\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:MR\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:SZ\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:Int\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:AL\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:ML\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:XP\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:MagicItem\\s+([^；;<>]+?))?[；;]?\\s*' +
        '(?:状态\\s+([^；;<>]+?))?[；;]?\\s*' + // 🆕 新增字段
        '(?:外貌\\s+([^；;<>]+?))?[；;]?\\s*' + // 🆕 新增字段
        '(?:性格\\s+([^；;<>]+?))?[；;]?\\s*' + // 🆕 新增字段
        '(?:与角色关系\\s+([^；;<>]+?))?\\s*>', // 🆕 新增字段
      'gi',
    );

    let match;
    while ((match = npcPattern.exec(text)) !== null) {
      // match[1] 是带方括号的名称，match[2] 是不带方括号的名称
      const [
        ,
        nameWithBracket,
        nameWithoutBracket,
        ac,
        mv,
        hd,
        hp,
        thac0,
        at,
        dmg,
        sa,
        sd,
        sw,
        sp,
        mr,
        sz,
        int,
        al,
        ml,
        xp,
        magicItem,
        status, // 🆕 新增字段
        appearance, // 🆕 新增字段
        personality, // 🆕 新增字段
        relationship, // 🆕 新增字段
      ] = match;
      const name = nameWithBracket || nameWithoutBracket;

      if (!name) continue;

      const id = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      npcs.push({
        id,
        name: name.trim(),
        ac: ac?.trim() || '10',
        mv: mv?.trim() || '12',
        hd: hd?.trim() || '1',
        hp: hp?.trim() || '4',
        maxHp: hp?.trim() || '4',
        thac0: thac0?.trim() || '20',
        at: at?.trim() || '1',
        dmg: dmg?.trim() || '1d6',
        sa: sa?.trim(),
        sd: sd?.trim(),
        sw: sw?.trim(),
        sp: sp?.trim(),
        mr: mr?.trim(),
        sz: sz?.trim() || 'M',
        int: int?.trim() || '8-10',
        al: al?.trim() || 'N',
        ml: ml?.trim() || '10',
        xp: xp?.trim() || '15',
        magicItems: magicItem?.trim(),
        status: status?.trim(), // 🆕 保存状态字段
        appearance: appearance?.trim(), // 🆕 保存外貌字段
        personality: personality?.trim(), // 🆕 保存性格字段
        relationshipDescription: relationship?.trim(), // 🆕 保存与角色关系字段
        favorite: false,
        lastSeen: Date.now(),
        firstSeen: Date.now(),
        interactionCount: 0,
      });

      console.log('[NPC Auto] 解析标准 ADND2E 格式 NPC:', name.trim());
    }

    return npcs;
  }

  /**
   * 解析简单格式的 NPC（管道分隔）- 增强版
   * 格式示例：Name|AC:5|MV:12|HD:3|HP:20|THAC0:18|#AT:1|Dmg:1d8|SZ:M|Int:8-10|AL:LG|ML:12|XP:65
   */
  function parseSimpleFormat(content: string): NPC | null {
    try {
      const parts = content.split('|').map(p => p.trim());
      if (parts.length === 0) return null;

      const npc: Partial<NPC> = {
        name: parts[0],
        favorite: false,
        lastSeen: Date.now(),
        firstSeen: Date.now(),
        interactionCount: 0,
      };

      // 解析剩余的键值对
      for (let i = 1; i < parts.length; i++) {
        const [key, value] = parts[i].split(':').map(s => s.trim());
        if (!key || !value) continue;

        const lowerKey = key.toLowerCase();
        switch (lowerKey) {
          case 'ac':
            npc.ac = value;
            break;
          case 'mv':
            npc.mv = value;
            break;
          case 'hd':
            npc.hd = value;
            break;
          case 'hp':
            npc.hp = value;
            break;
          case 'maxhp':
            npc.maxHp = value;
            break;
          case 'thac0':
            npc.thac0 = value;
            break;
          case '#at':
          case 'at':
            npc.at = value;
            break;
          case 'dmg':
          case 'damage':
            npc.dmg = value;
            break;
          case 'sa':
            npc.sa = value;
            break;
          case 'sd':
            npc.sd = value;
            break;
          case 'sw':
            npc.sw = value;
            break;
          case 'sp':
            npc.sp = value;
            break;
          case 'mr':
            npc.mr = value;
            break;
          case 'sz':
          case 'size':
            npc.sz = value;
            break;
          case 'int':
            npc.int = value;
            break;
          case 'al':
          case 'alignment':
            npc.al = value;
            break;
          case 'ml':
          case 'morale':
            npc.ml = value;
            break;
          case 'xp':
            npc.xp = value;
            break;
          case 'magic':
          case 'magicitems':
            npc.magicItems = value;
            break;
          case 'gender':
            npc.gender = value as 'male' | 'female' | 'other';
            break;
          case 'race':
            npc.race = value;
            break;
          case 'class':
            npc.class = value;
            break;
          case 'location':
            npc.location = value;
            break;
          case 'status':
            npc.status = value;
            break;
          case 'relationship':
            npc.relationship = parseInt(value);
            break;
          case 'attitude':
            npc.attitude = value as NPC['attitude'];
            break;
        }
      }

      // 填充默认值
      const id = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        id,
        name: npc.name!,
        avatar: npc.avatar,
        gender: npc.gender,
        race: npc.race,
        class: npc.class,
        location: npc.location,
        status: npc.status,
        ac: npc.ac || '10',
        mv: npc.mv || '12',
        hd: npc.hd || '1',
        hp: npc.hp || '4',
        maxHp: npc.maxHp || npc.hp || '4',
        thac0: npc.thac0 || '20',
        at: npc.at || '1',
        dmg: npc.dmg || '1d6',
        sa: npc.sa,
        sd: npc.sd,
        sw: npc.sw,
        sp: npc.sp,
        mr: npc.mr,
        sz: npc.sz || 'M',
        int: npc.int || '8-10',
        al: npc.al || 'N',
        ml: npc.ml || '10',
        xp: npc.xp || '15',
        magicItems: npc.magicItems,
        relationship: npc.relationship || 0,
        attitude: npc.attitude || 'neutral',
        favorite: false,
        lastSeen: Date.now(),
        firstSeen: Date.now(),
        interactionCount: 0,
      };
    } catch (error) {
      console.error('[NPC Auto] 解析简单格式 NPC 失败:', error);
      return null;
    }
  }

  /**
   * 添加或更新 NPC（增强版 - 智能合并）
   * @returns 返回是否是新增的NPC（true=新增，false=更新）
   */
  function addOrUpdateNpc(npc: NPC): boolean {
    const existingIndex = npcList.value.findIndex(n => n.id === npc.id || n.name === npc.name);

    if (existingIndex !== -1) {
      // 更新现有 NPC（智能合并，保留重要信息）
      const existing = npcList.value[existingIndex];
      npcList.value[existingIndex] = {
        ...npc,
        id: existing.id, // 保留原ID
        favorite: existing.favorite, // 保留特别关心状态
        avatar: npc.avatar || existing.avatar, // 优先新头像，否则保留
        firstSeen: existing.firstSeen || npc.firstSeen, // 保留首次出现时间
        interactionCount: existing.interactionCount || 0, // 保留交互次数
        notes: existing.notes, // 保留玩家笔记

        // 如果新数据没有这些信息，保留旧数据
        appearance: npc.appearance || existing.appearance,
        personality: npc.personality || existing.personality,
        background: npc.background || existing.background,
        motivation: npc.motivation || existing.motivation,
        equipment: npc.equipment || existing.equipment,
        inventory: npc.inventory || existing.inventory,

        // 关系系统保留旧值（除非新数据明确更新）
        relationship: npc.relationship !== undefined ? npc.relationship : existing.relationship,
        relationshipDescription: npc.relationshipDescription || existing.relationshipDescription,
        attitude: npc.attitude || existing.attitude,
      };
      console.log('[NPC Auto] 更新 NPC:', npc.name);
      saveNpcList();
      return false; // 返回false表示是更新
    } else {
      // 添加新 NPC
      npcList.value.push(npc);
      console.log('[NPC Auto] 新增 NPC:', npc.name);
      toastr.info(`新 NPC 登场: ${npc.name}`);
      saveNpcList();
      return true; // 返回true表示是新增
    }
  }

  /**
   * 处理 AI 消息，检测并记录 NPC
   */
  function processAiMessage(content: string) {
    if (isProcessing.value) return;

    try {
      isProcessing.value = true;

      const npcs = parseNpcTags(content);
      if (npcs.length > 0) {
        console.log(`[NPC Auto] 在消息中检测到 ${npcs.length} 个 NPC`);

        // 记录本次新增的NPC名称
        const newlyAddedNpcNames = new Set<string>();
        npcs.forEach(npc => {
          const isNew = addOrUpdateNpc(npc);
          if (isNew) {
            newlyAddedNpcNames.add(npc.name);
          }
        });

        // 🔧 禁用自动清理功能（避免误删NPC）
        // 改为只能手动管理：用户需要在NPC管理器中手动移除不需要的NPC
        // 或者通过 remove_npc 命令让AI主动移除离场的NPC
        console.log('[NPC Auto] 自动清理已禁用，请手动管理NPC或使用 remove_npc 命令');
      }
    } catch (error) {
      console.error('[NPC Auto] 处理 AI 消息失败:', error);
    } finally {
      isProcessing.value = false;
    }
  }

  /**
   * 🔧 智能清理不在场的 NPC
   *
   * 清理逻辑（已优化，避免误删）：
   * 1. 收集最近所有消息中提及的 NPC 名称（包括标签和普通文本提及）
   * 2. 将当前 NPC 列表与最近提及的 NPC 对比
   * 3. 如果某个 NPC 在最近30条消息中都没有被提及（无论是标签还是名字），说明它已经离场，应该被移除
   * 4. 特别关心的 NPC 永远不会被自动移除
   * 5. 刚刚新增的 NPC 不会被移除（避免秒删问题）
   *
   * @param recentMessagesCount 检查最近几条消息（默认 30 条，增加容错性）
   * @param excludeNpcNames 排除的NPC名称集合（本次新增的NPC，避免秒删）
   */
  function autoCleanupAbsentNpcs(recentMessagesCount: number = 30, excludeNpcNames: Set<string> = new Set()) {
    // 🔧 安全检查：如果NPC列表为空，直接返回
    if (npcList.value.length === 0) {
      return;
    }

    // 获取最近的所有消息（包括用户和AI消息）
    const recentMessages = gameStore.messages.slice(-recentMessagesCount);

    // 🔧 容错：如果消息数量太少（少于5条），不执行清理（避免误删）
    if (recentMessages.length < 5) {
      console.log('[NPC Auto] 消息历史太短（少于5条），跳过NPC清理以避免误删');
      return;
    }

    // 收集最近消息中所有提及的 NPC 名称（标签 + 文本提及）
    const recentNpcNames = new Set<string>();

    // 🔧 额外保护：最近3条消息中的NPC绝对不删除
    const veryRecentNpcNames = new Set<string>();
    const veryRecentMessages = gameStore.messages.slice(-3);

    recentMessages.forEach(msg => {
      if (msg.content) {
        const isVeryRecent = veryRecentMessages.includes(msg);

        // 1. 解析 NPC 标签（完整的 NPC 数据）
        const npcsInMessage = parseNpcTags(msg.content);
        npcsInMessage.forEach(npc => {
          recentNpcNames.add(npc.name);
          if (isVeryRecent) veryRecentNpcNames.add(npc.name);
        });

        // 2. 检查文本中是否提及现有 NPC 的名字（即使没有完整标签）
        npcList.value.forEach(npc => {
          if (msg.content.includes(npc.name)) {
            recentNpcNames.add(npc.name);
            if (isVeryRecent) veryRecentNpcNames.add(npc.name);
          }
        });
      }
    });

    // 找出不在最近消息中的 NPC
    const toRemove: string[] = [];
    npcList.value.forEach(npc => {
      if (npc.favorite) {
        return; // 跳过特别关心的 NPC（不会自动移除）
      }

      // 🔧 跳过本次新增的 NPC（避免秒删问题）
      if (excludeNpcNames.has(npc.name)) {
        console.log(`[NPC Auto] 跳过检查刚刚新增的 NPC: ${npc.name}`);
        return;
      }

      // 🔧 额外保护：最近3条消息中的NPC绝对不删除
      if (veryRecentNpcNames.has(npc.name)) {
        console.log(`[NPC Auto] ${npc.name} 在最近3条消息中出现，受到保护`);
        return;
      }

      // 如果这个 NPC 在最近30条消息中都没有被提及，说明它已经离场了
      if (!recentNpcNames.has(npc.name)) {
        toRemove.push(npc.name);
        console.log(`[NPC Auto] 检测到 ${npc.name} 已在最近${recentMessagesCount}条消息中未出现`);
      }
    });

    // 移除不在场的 NPC
    if (toRemove.length > 0) {
      npcList.value = npcList.value.filter(npc => !toRemove.includes(npc.name));
      saveNpcList();

      console.log('[NPC Auto] 自动移除长时间未出现的 NPC:', toRemove);
      toastr.info(`${toRemove.join('、')} 已长时间未出现，已自动清除`, 'NPC 管理');
    }
  }

  /**
   * 清理离场的 NPC（非特别关心的且超过指定时间未出现）
   * @param hoursThreshold 离场阈值（小时）
   */
  function cleanupAbsentNpcs(hoursThreshold: number = 24) {
    const now = Date.now();
    const threshold = hoursThreshold * 60 * 60 * 1000;

    const removedCount = npcList.value.length;
    npcList.value = npcList.value.filter(npc => {
      // 保留特别关心的 NPC
      if (npc.favorite) return true;

      // 保留最近出现过的 NPC
      return now - npc.lastSeen < threshold;
    });

    const actualRemoved = removedCount - npcList.value.length;
    if (actualRemoved > 0) {
      console.log(`[NPC Auto] 清理了 ${actualRemoved} 个离场 NPC`);
      toastr.info(`${actualRemoved} 个NPC已离场`);
      saveNpcList();
    }
  }

  /**
   * 切换 NPC 的特别关心状态
   */
  function toggleNpcFavorite(name: string) {
    const npc = npcList.value.find(n => n.name === name);
    if (npc) {
      npc.favorite = !npc.favorite;
      saveNpcList();
      console.log(`[NPC Auto] ${npc.name} 特别关心状态:`, npc.favorite);
    }
  }

  /**
   * 手动移除 NPC
   */
  function removeNpc(name: string) {
    const index = npcList.value.findIndex(n => n.name === name);
    if (index !== -1) {
      npcList.value.splice(index, 1);
      saveNpcList();
      console.log(`[NPC Auto] 手动移除 NPC: ${name}`);
    }
  }

  /**
   * 更新 NPC 关系值
   */
  function updateNpcRelationship(nameOrId: string, delta: number) {
    const npc = npcList.value.find(n => n.id === nameOrId || n.name === nameOrId);
    if (npc) {
      const oldValue = npc.relationship || 0;
      npc.relationship = Math.max(-100, Math.min(100, oldValue + delta));

      // 根据关系值自动更新态度
      if (npc.relationship >= 75) {
        npc.attitude = 'helpful';
      } else if (npc.relationship >= 25) {
        npc.attitude = 'friendly';
      } else if (npc.relationship >= -25) {
        npc.attitude = 'neutral';
      } else if (npc.relationship >= -75) {
        npc.attitude = 'unfriendly';
      } else {
        npc.attitude = 'hostile';
      }

      saveNpcList();
      console.log(`[NPC Auto] ${npc.name} 关系值: ${oldValue} -> ${npc.relationship} (${npc.attitude})`);

      if (delta > 0) {
        toastr.success(`${npc.name} 的好感度提升了！`);
      } else if (delta < 0) {
        toastr.warning(`${npc.name} 的好感度下降了...`);
      }
    }
  }

  /**
   * 记录 NPC 交互
   */
  function recordInteraction(nameOrId: string) {
    const npc = npcList.value.find(n => n.id === nameOrId || n.name === nameOrId);
    if (npc) {
      npc.interactionCount = (npc.interactionCount || 0) + 1;
      npc.lastSeen = Date.now();
      saveNpcList();
      console.log(`[NPC Auto] ${npc.name} 交互次数: ${npc.interactionCount}`);
    }
  }

  /**
   * 更新 NPC 笔记
   */
  function updateNpcNotes(nameOrId: string, notes: string) {
    const npc = npcList.value.find(n => n.id === nameOrId || n.name === nameOrId);
    if (npc) {
      npc.notes = notes;
      saveNpcList();
      console.log(`[NPC Auto] ${npc.name} 笔记已更新`);
    }
  }

  /**
   * 添加/移除 NPC 标签
   */
  function toggleNpcTag(nameOrId: string, tag: string) {
    const npc = npcList.value.find(n => n.id === nameOrId || n.name === nameOrId);
    if (npc) {
      if (!npc.tags) npc.tags = [];
      const index = npc.tags.indexOf(tag);
      if (index !== -1) {
        npc.tags.splice(index, 1);
      } else {
        npc.tags.push(tag);
      }
      saveNpcList();
      console.log(`[NPC Auto] ${npc.name} 标签更新:`, npc.tags);
    }
  }

  /**
   * 根据 ID 获取 NPC
   */
  function getNpcById(id: string): NPC | undefined {
    return npcList.value.find(n => n.id === id);
  }

  /**
   * 根据名称获取 NPC
   */
  function getNpcByName(name: string): NPC | undefined {
    return npcList.value.find(n => n.name === name);
  }

  /**
   * 事件处理器（保存引用以便清理）
   */
  let generationEndedHandler: ((text: string, generationId: string) => void) | null = null;
  let gameDataUpdatedHandler: (() => void) | null = null;

  /**
   * 初始化：监听游戏消息变化和酒馆事件
   */
  function initialize() {
    loadNpcList();

    // 🔧 性能优化：使用 watchEffect 代替 deep watch，只监听消息数组长度
    // 方式1：监听前端消息日志变化（作为备用）
    watch(
      () => gameStore.messages.length,
      (newLength, oldLength) => {
        // 只在新增消息时处理（不处理删除）
        if (newLength > oldLength) {
          const lastMessage = gameStore.messages[gameStore.messages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            processAiMessage(lastMessage.content);
          }
        }
      },
    );

    // 方式2：监听酒馆生成完成事件（主要检测方式，更及时）
    generationEndedHandler = (text: string, generationId: string) => {
      // 只处理本游戏的生成
      if (generationId === 'adnd2e-game' && text) {
        console.log('[NPC Auto] 检测到 AI 生成完成，开始解析 NPC');
        processAiMessage(text);
      }
    };
    eventOn(iframe_events.GENERATION_ENDED, generationEndedHandler);

    // 🔧 方式3：监听游戏数据更新事件（确保编辑/删除消息后能同步 NPC 列表）
    gameDataUpdatedHandler = () => {
      console.log('[NPC Auto] 收到游戏数据更新事件，重新加载 NPC 列表');
      loadNpcList();
    };
    eventOn('adnd2e_game_data_updated', gameDataUpdatedHandler);
    eventOn('adnd2e_character_data_synced', gameDataUpdatedHandler);

    console.log('[NPC Auto] NPC 自动检测已初始化（三重监听：消息变化 + 生成完成 + 数据更新）');
  }

  /**
   * 清理：移除事件监听器
   */
  function cleanup() {
    if (generationEndedHandler) {
      eventRemoveListener(iframe_events.GENERATION_ENDED, generationEndedHandler);
      generationEndedHandler = null;
      console.log('[NPC Auto] 已清理 GENERATION_ENDED 事件监听器');
    }
    // 🔧 新增：清理 gameDataUpdatedHandler
    if (gameDataUpdatedHandler) {
      eventRemoveListener('adnd2e_game_data_updated', gameDataUpdatedHandler);
      eventRemoveListener('adnd2e_character_data_synced', gameDataUpdatedHandler);
      gameDataUpdatedHandler = null;
      console.log('[NPC Auto] 已清理游戏数据更新事件监听器');
    }
  }

  return {
    // 状态
    npcList,
    isProcessing,

    // 基础功能
    loadNpcList,
    saveNpcList,
    processAiMessage,
    cleanupAbsentNpcs, // 手动清理（基于时间）
    autoCleanupAbsentNpcs, // 🔧 新增：智能清理（基于剧情）
    initialize,
    cleanup, // 新增清理函数

    // 管理功能
    toggleNpcFavorite,
    removeNpc,
    getNpcById,
    getNpcByName,

    // 交互功能
    updateNpcRelationship,
    recordInteraction,
    updateNpcNotes,
    toggleNpcTag,
  };
}
