/**
 * ADND2E 游戏命令解析器
 */

export interface GameCommand {
  type:
    | 'update_hp' // 更新生命值
    | 'update_attribute' // 更新属性
    | 'add_item' // 添加物品
    | 'remove_item' // 移除物品
    | 'update_gold' // 更新金币
    | 'add_npc' // 添加NPC
    | 'update_npc' // 更新NPC
    | 'remove_npc' // 移除NPC
    | 'update_location' // 更新位置
    | 'update_time' // 更新时间
    | 'update_weather' // 更新天气
    | 'add_quest' // 添加任务
    | 'update_quest' // 更新任务
    | 'add_extra_ability' // 添加额外能力
    | 'remove_extra_ability' // 移除额外能力
    | 'add_effect' // 添加效果/状态
    | 'remove_effect' // 移除效果
    | 'gain_xp' // 获得经验
    | 'level_up' // 升级
    | 'take_damage' // 受到伤害
    | 'heal' // 治疗
    | 'rest' // 休息
    | 'update_deity' // 更新神祇数据
    | 'add_divine_ability' // 添加神力能力
    | 'update_magic_resistance' // 更新魔法抗力
    | 'cast_spell'; // 🔧 新增：施展法术（消耗已记忆的法术）
  data: Record<string, any>;
}

export interface ParseResult {
  commands: GameCommand[];
  content: string;
  errors: string[];
}

/**
 * 从 AI 输出中提取命令块
 * 格式：<!-- <gamestate>命令列表</gamestate> -->
 */
export function parseAiResponse(response: string): ParseResult {
  const commands: GameCommand[] = [];
  const errors: string[] = [];

  // 提取命令块
  const commandBlockRegex = /<!--\s*<gamestate>([\s\S]*?)<\/gamestate>\s*-->/g;
  let content = response;
  let match;

  while ((match = commandBlockRegex.exec(response)) !== null) {
    const commandBlock = match[1].trim();
    // 从内容中移除命令块
    content = content.replace(match[0], '');

    // 解析命令
    try {
      const parsedCommands = parseCommandBlock(commandBlock);
      commands.push(...parsedCommands);
    } catch (error) {
      errors.push(`解析命令块失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 智能文本解析：从自然语言中提取状态变化
  const intelligentCommands = parseIntelligentText(content);
  commands.push(...intelligentCommands);

  return {
    commands,
    content: content.trim(),
    errors,
  };
}

/**
 * 智能文本解析：从 AI 的自然语言输出中自动提取状态变化
 * 即使 AI 没有使用命令块，也能识别位置、时间、天气等信息的变化
 *
 * 增强功能：
 * - 自动识别NPC（带描述的角色名）
 * - 自动识别新能力描述
 * - 自动提取关键信息到游戏状态
 * - 自动解析任务（新任务、任务完成/失败等）
 */
function parseIntelligentText(text: string): GameCommand[] {
  const commands: GameCommand[] = [];

  // 0.3 🔧 新增：解析施法（检测AI输出中的施法描述）
  const spellCommands = parseSpellCastingFromText(text);
  commands.push(...spellCommands);

  // 0.4 🔧 新增：解析任务变化（参考 lucklyjkop.html 的任务系统）
  const questCommands = parseQuestsFromText(text);
  commands.push(...questCommands);

  // 0.5 解析额外能力（特殊能力等）
  const abilityCommands = parseAbilitiesFromText(text);
  commands.push(...abilityCommands);

  // 1. 解析位置变化
  const locationPatterns = [
    /(?:来到|到达|进入|走进|抵达|前往)(?:了)?[「『"]?([^「『"。！？\n]{2,20})[」』"]?/g,
    /(?:位置|地点)(?:是|为|：|:)\s*[「『"]?([^「『"。！？\n]{2,20})[」』"]?/g,
    /(?:现在|目前)(?:在|于|处于)\s*[「『"]?([^「『"。！？\n]{2,20})[」』"]?/g,
  ];

  for (const pattern of locationPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const location = match[1].trim();
      if (location && location.length >= 2) {
        commands.push({
          type: 'update_location',
          data: { location },
        });
        console.log('[智能解析] 检测到位置变化:', location);
        break; // 只取第一个匹配的位置
      }
    }
    if (commands.some(cmd => cmd.type === 'update_location')) break;
  }

  // 2. 解析时间变化
  const timePatterns = [
    /(?:时间|时刻)(?:是|为|已经|已|：|:)\s*[「『"]?([^「『"。！？\n]{2,10})[」』"]?/g,
    /(?:此时|此刻|现在|当前)(?:是|为|已经)?\s*[「『"]?([清晨|早晨|上午|中午|午后|下午|傍晚|黄昏|夜晚|深夜|午夜|凌晨][^「『"。！？\n]{0,10})[」』"]?/g,
    /([清晨|早晨|上午|中午|午后|下午|傍晚|黄昏|夜晚|深夜|午夜|凌晨])(?:时分|的阳光|的天空|降临)/g,
  ];

  for (const pattern of timePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const timeDesc = match[1].trim();
      if (timeDesc) {
        commands.push({
          type: 'update_time',
          data: { current: timeDesc },
        });
        console.log('[智能解析] 检测到时间变化:', timeDesc);
        break;
      }
    }
    if (commands.some(cmd => cmd.type === 'update_time')) break;
  }

  // 3. 解析日期变化
  const datePatterns = [/第\s*(\d+)\s*天/g, /(?:日期|今天)(?:是|为|：|:)\s*([^。！？\n]{2,15})/g];

  for (const pattern of datePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      let dateDesc = match[1]?.trim();
      if (match[0].includes('第') && match[1]) {
        dateDesc = `第${match[1]}天`;
      }
      if (dateDesc) {
        // 如果已经有 update_time 命令，更新它；否则创建新命令
        const existingTimeCmd = commands.find(cmd => cmd.type === 'update_time');
        if (existingTimeCmd) {
          existingTimeCmd.data.date = dateDesc;
        } else {
          commands.push({
            type: 'update_time',
            data: { date: dateDesc },
          });
        }
        console.log('[智能解析] 检测到日期变化:', dateDesc);
        break;
      }
    }
  }

  // 4. 解析天气变化（增强版 - 更多天气关键词）
  const weatherPatterns = [
    // 直接描述：天气是/为/变成 XX
    /(?:天气|天空|气候)(?:是|为|变得|变成|转为|：|:)\s*[「『"]?([晴朗|多云|阴天|雨天|下雨|暴雨|雪天|下雪|大雪|雾天|大雾|多雾|风雨交加|雷雨|小雨|中雨|大雨|毛毛雨|细雨|雨夹雪][^「『"。！？\n]{0,10})[」』"]?/g,
    // 天气形容：XX的天气/天空
    /([晴朗|多云|阴天|雨天|暴雨|雪天|大雪|雾天|大雾|晴|阴|雨|雪])的天(?:气|空)/g,
    // 天空状态
    /(?:天空|天气)([晴朗|阴沉|昏暗|明亮|灰暗])/g,
    // 开始/停止下雨下雪
    /(?:开始|停止|正在)(?:下雨|下雪|降雨|降雪)/g,
    // 单独的天气关键词（在句首或句中）
    /^(晴朗|多云|阴天|雨天|雪天|雾天|暴雨|大雪)[，。,\s]/gm,
    /[，。,\s](晴朗|多云|阴天|雨天|雪天|雾天|暴雨|大雪)[，。,\s]/g,
  ];

  for (const pattern of weatherPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      let weatherDesc = match[1]?.trim() || match[0]?.trim();
      if (weatherDesc) {
        // 清理可能的标点符号
        weatherDesc = weatherDesc.replace(/[，。,\s]+/g, '');
        if (weatherDesc.length >= 2) {
          commands.push({
            type: 'update_weather',
            data: { current: weatherDesc },
          });
          console.log('[智能解析] 检测到天气变化:', weatherDesc);
          break;
        }
      }
    }
    if (commands.some(cmd => cmd.type === 'update_weather')) break;
  }

  // 5. 解析温度变化
  const temperaturePatterns = [
    /(?:温度|气温|天气)(?:是|为|变得|：|:)\s*[「『"]?([温暖|炎热|寒冷|酷热|凉爽|微寒|冰冷][^「『"。！？\n]{0,8})[」』"]?/g,
    /([温暖|炎热|寒冷|酷热|凉爽|微寒|冰冷])的(?:天气|空气|微风)/g,
  ];

  for (const pattern of temperaturePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const tempDesc = match[1].trim();
      if (tempDesc) {
        // 如果已经有 update_weather 命令，更新它；否则创建新命令
        const existingWeatherCmd = commands.find(cmd => cmd.type === 'update_weather');
        if (existingWeatherCmd) {
          existingWeatherCmd.data.temperature = tempDesc;
        } else {
          commands.push({
            type: 'update_weather',
            data: { temperature: tempDesc },
          });
        }
        console.log('[智能解析] 检测到温度变化:', tempDesc);
        break;
      }
    }
  }

  return commands;
}

/**
 * 解析命令块
 * 支持 JSON 格式的命令列表
 */
function parseCommandBlock(commandBlock: string): GameCommand[] {
  const commands: GameCommand[] = [];

  try {
    // 尝试解析为 JSON 数组
    const parsed = JSON.parse(commandBlock);

    if (Array.isArray(parsed)) {
      parsed.forEach((cmd, index) => {
        if (cmd.type && cmd.data) {
          commands.push(cmd as GameCommand);
        } else {
          console.warn(`[CommandParser] 命令格式错误 (索引 ${index}):`, cmd);
        }
      });
    } else {
      console.warn('[CommandParser] 命令块不是数组:', parsed);
    }
  } catch (error) {
    console.error('[CommandParser] 解析 JSON 失败:', error);
    throw new Error(`无效的 JSON 格式: ${error instanceof Error ? error.message : String(error)}`);
  }

  return commands;
}

/**
 * 验证命令的有效性
 */
export function validateCommand(command: GameCommand): boolean {
  if (!command.type || !command.data) {
    return false;
  }

  // 根据命令类型验证必需的数据字段
  switch (command.type) {
    case 'update_hp':
      return typeof command.data.current === 'number';

    case 'update_attribute':
      return typeof command.data.attribute === 'string' && typeof command.data.value === 'number';

    case 'add_item':
    case 'remove_item':
      return typeof command.data.name === 'string';

    case 'update_gold':
      return typeof command.data.amount === 'number';

    case 'add_npc':
    case 'update_npc':
      return typeof command.data.name === 'string';

    case 'update_location':
      return typeof command.data.location === 'string';

    case 'update_time':
      return (
        typeof command.data.current === 'string' ||
        typeof command.data.date === 'string' ||
        typeof command.data.season === 'string'
      );

    case 'update_weather':
      return typeof command.data.current === 'string' || typeof command.data.temperature === 'string';

    case 'add_quest':
    case 'update_quest':
      return typeof command.data.title === 'string';

    case 'add_extra_ability':
      return typeof command.data.name === 'string';

    case 'remove_extra_ability':
      return typeof command.data.name === 'string';

    case 'add_effect':
    case 'remove_effect':
      return typeof command.data.effect === 'string';

    case 'gain_xp':
    case 'take_damage':
    case 'heal':
      return typeof command.data.amount === 'number';

    case 'level_up':
    case 'rest':
      return true;

    default:
      return false;
  }
}

/**
 * 生成 AI Prompt 中的命令说明
 */
export function getCommandInstructions(): string {
  return `
你可以使用以下命令来更新游戏状态（放在 HTML 注释中）：

格式：<!-- <gamestate>[命令数组的JSON]</gamestate> -->

可用命令：

1. 更新生命值：
   {"type": "update_hp", "data": {"current": 25}}

2. 更新属性：
   {"type": "update_attribute", "data": {"attribute": "str", "value": 16}}

3. 添加/移除物品：
   {"type": "add_item", "data": {"name": "长剑+1", "quantity": 1, "description": "一把锋利的魔法剑"}}
   {"type": "remove_item", "data": {"name": "治疗药水", "quantity": 1}}

4. 更新金币：
   {"type": "update_gold", "data": {"amount": 100}}  // 正数增加，负数减少

5. NPC管理（完整 ADND2E 格式）：
   // 添加 NPC - 完整格式（推荐）
   {"type": "add_npc", "data": {
     "name": "地精",
     "ac": 6,           // 护甲等级，必需
     "mv": 6,           // 移动速度，必需
     "hd": "1-1",       // 生命骰，必需
     "hp": 4,           // 当前生命值，必需
     "maxHp": 4,        // 最大生命值，可选，默认等于hp
     "thac0": 20,       // 命中值，必需
     "at": "1",         // 攻击次数，必需
     "dmg": "1d6",      // 伤害骰，必需
     "sz": "S",         // 体型（T/S/M/L/H/G），必需
     "int": "低（5-7）", // 智力，必需
     "al": "LE",        // 阵营，必需
     "ml": 8,           // 士气，必需
     "xp": 15,          // 经验值，必需
     "sa": "无",      // 特殊攻击，可选
     "sd": "无",        // 特殊防御，可选
     "sw": "畏光,攻击检定和士气检定获得-1惩罚",      // 特殊弱点，可选
     "sp": "无",        // 法术能力，可选
     "mr": "无",        // 魔法抗力，可选
     "magicItems": "无", // 魔法物品，可选
     "race": "地精",    // 种族，可选
     "class": "无",   // 职业，可选
     "location": "洞穴", // 位置，可选
     "status": "警戒",  // 状态，可选
     "attitude": "hostile" // 态度，可选
   }}

   // 简化格式（仅必需字段）
   {"type": "add_npc", "data": {"name": "村民", "hp": 4, "ac": 10, "mv": 12, "hd": "1", "hp": 4, "thac0": 20, "at": "1", "dmg": "1d4", "sz": "M", "int": "8-10", "al": "N", "ml": 10, "xp": 10}}

   // 更新 NPC
   {"type": "update_npc", "data": {"name": "地精战士", "hp": 2, "status": "受伤"}}

   // 移除 NPC
   {"type": "remove_npc", "data": {"name": "地精战士"}}

6. 更新位置：
   {"type": "update_location", "data": {"location": "深林旅店"}}

7. 更新时间：
   {"type": "update_time", "data": {"current": "午后", "date": "第3天", "season": "春季"}}

8. 更新天气：
   {"type": "update_weather", "data": {"current": "晴朗", "temperature": "温暖"}}

9. 任务管理：
   {"type": "add_quest", "data": {"title": "击败地精", "description": "清除洞穴中的地精"}}
   {"type": "update_quest", "data": {"title": "击败地精", "status": "completed"}}

10. 额外能力管理（角色特殊能力）：
   // 添加额外能力
   {"type": "add_extra_ability", "data": {
     "name": "哀号",
     "description": "这是所有亡灵能力中最可怕最强大的能力之一。每当拥有这个能力的生物发出哀号时，30英尺内的所有生物必须进行一次对抗死亡魔法的豁免检定。检定失败的受害者会立即死亡",
     "effect": "每当拥有这个能力的生物发出哀号时，30英尺内的所有生物必须进行一次对抗死亡魔法的豁免检定。检定失败的受害者会立即死亡",
     "conditions": "无",
     "uses": "永久",
     "source": "亡灵能力"
   }}

   // 移除额外能力
   {"type": "remove_extra_ability", "data": {"name": "哀号"}}

11. 效果/状态
    {"type": "add_effect", "data": {"effect": "中毒", "duration": "3轮"}}
    {"type": "remove_effect", "data": {"effect": "中毒"}}

12. 战斗相关：
    {"type": "take_damage", "data": {"amount": 10, "source": "地精的匕首"}}
    {"type": "heal", "data": {"amount": 15, "source": "治疗药水"}}

13. 进度：
    {"type": "gain_xp", "data": {"amount": 50, "source": "击败地精"}}
    {"type": "level_up", "data": {"newLevel": 2}}

14. 休息（ADND2E 自然治疗）：
    {"type": "rest", "data": {"type": "normal"}}  // 普通休息（少量活动），每天恢复1点HP
    {"type": "rest", "data": {"type": "bed"}}     // 卧床休息，每天恢复3点HP，满一周额外加体质奖励

示例输出：
<!-- <gamestate>
[
  {"type": "take_damage", "data": {"amount": 8, "source": "地精的匕首"}},
  {"type": "update_location", "data": {"location": "地精巢穴"}},
  {"type": "update_time", "data": {"current": "黄昏"}},
  {"type": "add_npc", "data": {"name": "地精首领", "hp": 12, "ac": 6}}
]
</gamestate> -->

黄昏降临，你来到了地精巢穴。你挥剑砍向地精，但它灵活地躲开，并用匕首划伤了你的手臂（受到8点伤害）。

**智能文本解析**：
即使你不使用命令块，系统也会自动从你的自然语言描述中提取位置、时间、天气等信息。
例如：
- "你来到了深林旅店" → 自动更新位置
- "此时已是午后时分" → 自动更新时间
- "天气变得晴朗温暖" → 自动更新天气
`;
}

/**
 * 从自然文本中解析额外能力和神祇相关信息
 */
function parseAbilitiesFromText(text: string): GameCommand[] {
  const commands: GameCommand[] = [];

  // === 识别神祇觉醒/神格变化 ===
  // 🔧 修复：扩展神祇检测模式，与 parseDeityFromCharacterBackground 保持一致
  const deityAwakeningPatterns = [
    /(?:成为|晋升为|获得了?|是一名?|是个?|是位?)([半]?神|守护[半]?神|神[祇祗])/g,
    /接受了仪式/g,
    /神性|神格|神力/g,
    /半神|微弱神|弱等神|次级神|中等神|高等神|强大神|伟大神/g,
    /DemiPower|Demi\s*Power|Lesser\s*Power|Intermediate\s*Power|Greater\s*Power/gi,
  ];

  let isDivine = false;
  for (const pattern of deityAwakeningPatterns) {
    if (pattern.test(text)) {
      isDivine = true;
      break;
    }
  }

  if (isDivine) {
    // 🔧 修复：扩展神格等级检测，支持英文和更多表述
    let divineRank: 'demigod' | 'lesser' | 'intermediate' | 'greater' = 'demigod';
    if (/(半神|微弱神|DemiPower|Demi\s*Power)/i.test(text)) divineRank = 'demigod';
    else if (/(弱等神|次级神|Lesser\s*Power)/i.test(text)) divineRank = 'lesser';
    else if (/(中等神|Intermediate\s*Power)/i.test(text)) divineRank = 'intermediate';
    else if (/(高等神|强大神|伟大神|Greater\s*Power)/i.test(text)) divineRank = 'greater';

    // 提取神职
    const portfolios: string[] = [];

    // 方式1: 从【神职：xxx】提取
    const bracketPattern = /【神职[：:]\s*([^】]+)】/g;
    for (const match of text.matchAll(bracketPattern)) {
      const domains = match[1].trim().split(/[、，,]/);
      portfolios.push(...domains.map(d => d.trim()).filter(d => d));
    }

    // 方式2: 从"神职："提取
    if (portfolios.length === 0) {
      const portfolioPattern = /神职[：:]\s*([^。！？\n【】]+)/g;
      for (const match of text.matchAll(portfolioPattern)) {
        const domains = match[1].trim().split(/[、，,]/);
        portfolios.push(...domains.map(d => d.trim()).filter(d => d));
      }
    }

    commands.push({
      type: 'update_deity',
      data: {
        divineRank,
        portfolios,
      },
    });
    console.log('[智能解析] 检测到神祇觉醒:', divineRank, portfolios);
  }

  return commands;
}

/**
 * 从角色卡背景中解析神祇信息
 * 用于角色创建完成时或游戏初始化时同步神祇数据到游戏状态
 */
export function parseDeityFromCharacterBackground(background: string): GameCommand | null {
  if (!background) return null;

  // 🔧 修复：扩展神祇检测模式，支持"是一名...半神"等更多表达方式
  const deityPatterns = [
    /(?:成为|晋升为|获得了?|已经是|现在是|是一名?|是个?|是位?)([半]?神|守护[半]?神|神[祇祗])/,
    /神格|神力|神性/,
    /半神|微弱神|弱等神|次级神|中等神|高等神|强大神|伟大神/,
    /DemiPower|Demi\s*Power|Lesser\s*Power|Intermediate\s*Power|Greater\s*Power/i, // 支持英文
  ];

  let isDivine = false;
  for (const pattern of deityPatterns) {
    if (pattern.test(background)) {
      isDivine = true;
      console.log('[解析背景] 匹配到神祇模式:', pattern, '文本片段:', background.match(pattern)?.[0]);
      break;
    }
  }

  if (!isDivine) {
    console.log('[解析背景] 未检测到神祇模式');
    return null;
  }

  // 🔧 修复：扩展神格等级检测，支持英文和更多中文表述
  let divineRank: 'demigod' | 'lesser' | 'intermediate' | 'greater' = 'demigod';
  if (/(半神|微弱神|DemiPower|Demi\s*Power)/i.test(background)) divineRank = 'demigod';
  else if (/(弱等神|次级神|Lesser\s*Power)/i.test(background)) divineRank = 'lesser';
  else if (/(中等神|Intermediate\s*Power)/i.test(background)) divineRank = 'intermediate';
  else if (/(高等神|强大神|伟大神|Greater\s*Power)/i.test(background)) divineRank = 'greater';

  // 提取神职
  const portfolios: string[] = [];

  // 方式1: 从【神职：xxx】提取
  const bracketPattern = /【神职[：:]\s*([^】]+)】/g;
  let match;
  while ((match = bracketPattern.exec(background)) !== null) {
    const domains = match[1].trim().split(/[、，,]/);
    portfolios.push(...domains.map(d => d.trim()).filter(d => d));
  }

  // 方式2: 从"神职："提取
  if (portfolios.length === 0) {
    const portfolioPattern = /神职[：:]\s*([^。！？\n【】]+)/g;
    while ((match = portfolioPattern.exec(background)) !== null) {
      const domains = match[1].trim().split(/[、，,]/);
      portfolios.push(...domains.map(d => d.trim()).filter(d => d));
    }
  }

  console.log('[解析背景] 检测到神祇:', { divineRank, portfolios });

  return {
    type: 'update_deity',
    data: {
      divineRank,
      portfolios,
    },
  };
}

/**
 * 🔧 新增：从文本中解析施法行为
 * 检测AI输出中的施法描述，如"你施展了魔法飞弹"、"使用了治疗轻伤"等
 * 自动从已记忆的法术中移除已使用的法术
 */
function parseSpellCastingFromText(text: string): GameCommand[] {
  const commands: GameCommand[] = [];

  // 法术施放模式（中文）
  const castPatterns = [
    /(?:你|我|角色|施法者|法师|巫师|祭司|牧师|德鲁伊)(?:施展|施放|使用|释放|念咒|吟唱)(?:了)?[「『"《]?([^「』"》。！？\n]{2,20})[」』"》]?(?:法术)?/gi,
    /[「『"《]([^「』"》]{2,20})[」』"》](?:法术)?(?:被|已)?(?:施展|施放|使用|释放)/gi,
    /(?:cast|casted|casting)\s+(?:spell\s+)?[「『"《]?([^「』"》。！？\n]{2,20})[」』"》]?/gi,
  ];

  const detectedSpells = new Set<string>(); // 避免重复检测

  for (const pattern of castPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const spellName = match[1].trim();
      // 过滤无效匹配
      if (
        spellName.length < 2 ||
        spellName.length > 20 ||
        /[\d]+/.test(spellName) || // 排除纯数字
        detectedSpells.has(spellName)
      ) {
        continue;
      }

      detectedSpells.add(spellName);
      commands.push({
        type: 'cast_spell',
        data: { spellName },
      });
      console.log('[智能解析] 检测到施法:', spellName);
    }
  }

  return commands;
}

/**
 * 🔧 新增：从文本中解析任务变化（参考 lucklyjkop.html 的实现）
 *
 * 支持的任务操作：
 * 1. 新任务：检测"接受任务"、"获得任务"、"任务：XXX"等模式
 * 2. 任务完成：检测"完成任务"、"任务完成"等模式
 * 3. 任务失败：检测"任务失败"、"失败了任务"等模式
 * 4. 任务进度更新：检测"任务进度"、"XXX任务的进度"等模式
 *
 * 与 lucklyjkop.html 的差异：
 * - lucklyjkop.html 使用 currentState['6'] 存储任务（表格数据库）
 * - ADND2E 使用角色卡变量的 adnd2e.quests 数组存储任务
 */
function parseQuestsFromText(text: string): GameCommand[] {
  const commands: GameCommand[] = [];

  // 1. 检测新任务
  const newQuestPatterns = [
    // 「任务：XXX」或【任务：XXX】格式
    /[「『【《"](任务|委托|Quest)[：:]\s*([^」』】》"]{2,50})[」』】》"]/gi,
    // "接受了XXX任务"、"获得了XXX任务"
    /(?:接受|获得|承接|领取)(?:了)?[「『"]?([^「』"]{2,30})[」』"]?任务/gi,
    // "XXX委托你XXX"、"XXX要求你XXX"
    /([^。！？\n]{2,15})(?:委托|要求|请求|希望)(?:你|我|角色)([^。！？\n]{5,50})/gi,
  ];

  const detectedQuests = new Set<string>(); // 避免重复

  for (const pattern of newQuestPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      let questTitle = '';
      let questDescription = '';

      if (match[0].includes('任务') || match[0].includes('Quest')) {
        // 格式1：「任务：标题」描述
        questTitle = match[2]?.trim() || '';
        questDescription = questTitle; // 默认描述与标题相同
      } else if (match[0].includes('接受') || match[0].includes('获得')) {
        // 格式2：接受了XXX任务
        questTitle = match[1]?.trim() || '';
        questDescription = questTitle;
      } else {
        // 格式3：XXX委托你XXX
        const npcName = match[1]?.trim() || '';
        const taskDesc = match[2]?.trim() || '';
        questTitle = `${npcName}的委托`;
        questDescription = taskDesc;
      }

      // 过滤无效任务
      if (
        !questTitle ||
        questTitle.length < 2 ||
        questTitle.length > 50 ||
        detectedQuests.has(questTitle) ||
        /^[\d\s]+$/.test(questTitle) // 排除纯数字
      ) {
        continue;
      }

      detectedQuests.add(questTitle);
      commands.push({
        type: 'add_quest',
        data: {
          title: questTitle,
          description: questDescription,
          status: 'active',
        },
      });
      console.log('[智能解析] 检测到新任务:', questTitle);
    }
  }

  // 2. 检测任务完成
  const completedQuestPatterns = [
    /(?:完成|达成|完结|结束)(?:了)?[「『"]?([^「』"]{2,30})[」』"]?任务/gi,
    /[「『"]?([^「』"]{2,30})[」』"]?任务(?:已)?完成/gi,
    /任务[「『"]?([^「』"]{2,30})[」』"]?(?:已)?(?:完成|达成)/gi,
  ];

  for (const pattern of completedQuestPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const questTitle = match[1]?.trim();
      if (questTitle && questTitle.length >= 2 && questTitle.length <= 50) {
        commands.push({
          type: 'update_quest',
          data: {
            title: questTitle,
            status: 'completed',
          },
        });
        console.log('[智能解析] 检测到任务完成:', questTitle);
      }
    }
  }

  // 3. 检测任务失败
  const failedQuestPatterns = [
    /(?:失败|放弃|未能完成)(?:了)?[「『"]?([^「』"]{2,30})[」』"]?任务/gi,
    /[「『"]?([^「』"]{2,30})[」』"]?任务(?:已)?失败/gi,
    /任务[「『"]?([^「』"]{2,30})[」』"]?(?:已)?失败/gi,
  ];

  for (const pattern of failedQuestPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const questTitle = match[1]?.trim();
      if (questTitle && questTitle.length >= 2 && questTitle.length <= 50) {
        commands.push({
          type: 'update_quest',
          data: {
            title: questTitle,
            status: 'failed',
          },
        });
        console.log('[智能解析] 检测到任务失败:', questTitle);
      }
    }
  }

  // 4. 检测任务进度更新
  const progressPatterns = [
    /[「『"]?([^「』"]{2,30})[」』"]?任务的?进度[：:]?\s*([^。！？\n]{2,100})/gi,
    /任务[「『"]?([^「』"]{2,30})[」』"]?的?进度[：:]?\s*([^。！？\n]{2,100})/gi,
  ];

  for (const pattern of progressPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const questTitle = match[1]?.trim();
      const progress = match[2]?.trim();
      if (questTitle && progress && questTitle.length >= 2 && questTitle.length <= 50) {
        commands.push({
          type: 'update_quest',
          data: {
            title: questTitle,
            progress: progress,
          },
        });
        console.log('[智能解析] 检测到任务进度更新:', questTitle, progress);
      }
    }
  }

  return commands;
}

/**
 * 简单的命令序列化（用于调试）
 */
export function serializeCommands(commands: GameCommand[]): string {
  return JSON.stringify(commands, null, 2);
}
