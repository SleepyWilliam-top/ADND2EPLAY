/**
 * 分段记忆解析器
 * 用于从 AI 响应中提取小总结和大总结
 */

export interface SegmentedMemory {
  smallSummary: string;
  largeSummary: string;
}

/**
 * 从 AI 响应文本中提取分段记忆
 * @param content AI 生成的完整响应内容
 * @returns 提取到的分段记忆对象，如果没有找到则返回 null
 */
export function parseSegmentedMemory(content: string): SegmentedMemory | null {
  try {
    // 方法1：解析 <segmented-memory> XML 格式
    const segmentedMemoryMatch = content.match(/<segmented-memory>([\s\S]*?)<\/segmented-memory>/i);

    if (segmentedMemoryMatch) {
      const memoryBlock = segmentedMemoryMatch[1];

      const smallSummaryMatch = memoryBlock.match(/<small-summary>([\s\S]*?)<\/small-summary>/i);
      const largeSummaryMatch = memoryBlock.match(/<large-summary>([\s\S]*?)<\/large-summary>/i);

      if (smallSummaryMatch && largeSummaryMatch) {
        return {
          smallSummary: smallSummaryMatch[1].trim(),
          largeSummary: largeSummaryMatch[1].trim(),
        };
      }
    }

    // 方法2：兼容 lucklyjkop 的指令格式（作为 fallback）
    // 🐛 修复：支持字符串内部包含引号的情况
    // 优先匹配双引号包裹的字符串，然后匹配单引号包裹的字符串
    const smallSummaryFnMatch = 
      content.match(/addSmallSummary\s*\(\s*"([^"]*)"\s*\)/i) || 
      content.match(/addSmallSummary\s*\(\s*'([^']*)'\s*\)/i);
    
    const largeSummaryFnMatch = 
      content.match(/addLargeSummary\s*\(\s*"([^"]*)"\s*\)/i) || 
      content.match(/addLargeSummary\s*\(\s*'([^']*)'\s*\)/i);

    if (smallSummaryFnMatch && largeSummaryFnMatch) {
      return {
        smallSummary: smallSummaryFnMatch[1].trim(),
        largeSummary: largeSummaryFnMatch[1].trim(),
      };
    }

    // 没有找到任何格式的分段记忆
    return null;
  } catch (error) {
    console.error('[SegmentedMemoryParser] 解析失败:', error);
    return null;
  }
}

/**
 * 移除文本中的分段记忆标记，返回干净的正文
 * @param content 原始内容
 * @returns 移除分段记忆标记后的内容
 */
export function removeSegmentedMemoryTags(content: string): string {
  try {
    // 移除 XML 格式的分段记忆
    let cleanContent = content.replace(/<segmented-memory>[\s\S]*?<\/segmented-memory>/gi, '');

    // 🐛 修复：移除函数格式的分段记忆（支持双引号和单引号）
    cleanContent = cleanContent.replace(/addSmallSummary\s*\(\s*(?:"[^"]*"|'[^']*')\s*\)\s*/gi, '');
    cleanContent = cleanContent.replace(/addLargeSummary\s*\(\s*(?:"[^"]*"|'[^']*')\s*\)\s*/gi, '');

    return cleanContent.trim();
  } catch (error) {
    console.error('[SegmentedMemoryParser] 清理内容失败:', error);
    return content;
  }
}

/**
 * 验证分段记忆格式是否符合要求
 * @param memory 分段记忆对象
 * @returns 验证结果和错误信息
 */
export function validateSegmentedMemory(memory: SegmentedMemory): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 检查小总结长度（50~150字）
  if (!memory.smallSummary || memory.smallSummary.length === 0) {
    errors.push('小总结不能为空');
  } else if (memory.smallSummary.length < 20) {
    errors.push('小总结过短（建议50~100字）');
  } else if (memory.smallSummary.length > 200) {
    errors.push('小总结过长（建议50~100字）');
  }

  // 检查大总结长度（一句话，50字以内）
  if (!memory.largeSummary || memory.largeSummary.length === 0) {
    errors.push('大总结不能为空');
  } else if (memory.largeSummary.length < 10) {
    errors.push('大总结过短');
  } else if (memory.largeSummary.length > 80) {
    errors.push('大总结过长（建议50字以内）');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
