/**
 * NPC 标签移除工具
 * 用于从显示内容中移除 NPC 标签，使其在正文中不可见
 * （但原始数据仍保留在后台，供 NPC 管理器使用）
 */

/**
 * 移除文本中的所有 NPC 标签，返回干净的正文
 * 支持三种格式：
 * 1. 标准 ADND2E 格式：<[名称]：AC...> 或 <名称：AC...>
 * 2. XML 格式：<npc ...>...</npc>
 * 3. 管道分隔格式：<npc>...</npc>
 *
 * @param content 原始内容
 * @returns 移除 NPC 标签后的内容
 */
export function removeNpcTags(content: string): string {
  try {
    let cleanContent = content;

    // 1. 移除标准 ADND2E 格式的 NPC（包含完整的属性列表）
    // 匹配 <[名称]：AC...> 或 <名称：AC...>
    // 必须包含核心 ADND2E 属性关键词（AC、MV、HD 等）以避免误删
    const standardPattern =
      /<(?:\[[^\]]+?\]|[^<>:：]+?)[:：]\s*(?:AC\s+[^；;<>]+?)?[；;]?\s*(?:MV\s+[^；;<>]+?)?[；;]?\s*(?:HD\s+[^；;<>]+?)?[；;]?\s*(?:hp\s+[^；;<>]+?)?[；;]?\s*(?:THAC0\s+[^；;<>]+?)?[；;]?\s*(?:#AT\s+[^；;<>]+?)?[；;]?\s*(?:Dmg\s+[^；;<>]+?)?[；;]?\s*(?:SA\s+[^；;<>]+?)?[；;]?\s*(?:SD\s+[^；;<>]+?)?[；;]?\s*(?:SW\s+[^；;<>]+?)?[；;]?\s*(?:SP\s+[^；;<>]+?)?[；;]?\s*(?:MR\s+[^；;<>]+?)?[；;]?\s*(?:SZ\s+[^；;<>]+?)?[；;]?\s*(?:Int\s+[^；;<>]+?)?[；;]?\s*(?:AL\s+[^；;<>]+?)?[；;]?\s*(?:ML\s+[^；;<>]+?)?[；;]?\s*(?:XP\s+[^；;<>]+?)?[；;]?\s*(?:MagicItem\s+[^；;<>]+?)?[；;]?\s*(?:状态\s+[^；;<>]+?)?[；;]?\s*(?:外貌\s+[^；;<>]+?)?[；;]?\s*(?:性格\s+[^；;<>]+?)?[；;]?\s*(?:与角色关系\s+[^；;<>]+?)?\s*>/gi;
    cleanContent = cleanContent.replace(standardPattern, '');

    // 2. 移除 XML 格式的 NPC 标签
    cleanContent = cleanContent.replace(/<npc\s+[^>]+>[\s\S]*?<\/npc>/gi, '');

    // 3. 移除管道分隔格式的 NPC 标签
    cleanContent = cleanContent.replace(/<npc>[^<]+<\/npc>/gi, '');

    return cleanContent.trim();
  } catch (error) {
    console.error('[NpcTagRemover] 清理 NPC 标签失败:', error);
    return content;
  }
}

/**
 * 检查文本中是否包含 NPC 标签
 * @param content 要检查的文本
 * @returns 是否包含 NPC 标签
 */
export function hasNpcTags(content: string): boolean {
  try {
    // 检查标准 ADND2E 格式（至少包含 AC 和 hp 关键词）
    const hasStandard = /<(?:\[[^\]]+?\]|[^<>:：]+?)[:：][\s\S]*?(?:AC|hp|THAC0)[\s\S]*?>/i.test(content);

    // 检查 XML 格式
    const hasXml = /<npc\s+[^>]+>[\s\S]*?<\/npc>/i.test(content);

    // 检查管道分隔格式
    const hasSimple = /<npc>[^<]+<\/npc>/i.test(content);

    return hasStandard || hasXml || hasSimple;
  } catch (error) {
    console.error('[NpcTagRemover] 检查 NPC 标签失败:', error);
    return false;
  }
}
