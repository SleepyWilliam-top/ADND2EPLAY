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
    | 'add_effect' // 添加效果/状态
    | 'remove_effect' // 移除效果
    | 'gain_xp' // 获得经验
    | 'level_up' // 升级
    | 'take_damage' // 受到伤害
    | 'heal' // 治疗
    | 'rest'; // 休息
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
 */
function parseIntelligentText(text: string): GameCommand[] {
  const commands: GameCommand[] = [];

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

5. NPC管理：
   {"type": "add_npc", "data": {"name": "安迪", "hp": 10, "ac": 5, "attitude": "friendly"}}
   {"type": "update_npc", "data": {"name": "安迪", "hp": 5}}
   {"type": "remove_npc", "data": {"name": "哥布林"}}

6. 更新位置：
   {"type": "update_location", "data": {"location": "深林旅店"}}

7. 更新时间：
   {"type": "update_time", "data": {"current": "午后", "date": "第3天", "season": "春季"}}

8. 更新天气：
   {"type": "update_weather", "data": {"current": "晴朗", "temperature": "温暖"}}

9. 任务管理：
   {"type": "add_quest", "data": {"title": "击败地精", "description": "清除洞穴中的地精"}}
   {"type": "update_quest", "data": {"title": "击败地精", "status": "completed"}}

10. 效果/状态：
    {"type": "add_effect", "data": {"effect": "中毒", "duration": "3轮"}}
    {"type": "remove_effect", "data": {"effect": "中毒"}}

11. 战斗相关：
    {"type": "take_damage", "data": {"amount": 10, "source": "地精的匕首"}}
    {"type": "heal", "data": {"amount": 15, "source": "治疗药水"}}

12. 进度：
    {"type": "gain_xp", "data": {"amount": 50, "source": "击败地精"}}
    {"type": "level_up", "data": {"newLevel": 2}}

13. 休息：
    {"type": "rest", "data": {"type": "short"}}  // 或 "long"

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
 * 简单的命令序列化（用于调试）
 */
export function serializeCommands(commands: GameCommand[]): string {
  return JSON.stringify(commands, null, 2);
}
