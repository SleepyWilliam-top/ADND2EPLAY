/**
 * 正则文本处理工具
 * 参考 lucklyjkop.html 的实现
 */

export interface RegexRule {
  name: string;
  pattern: string; // 格式如: /pattern/gi 或纯文本 pattern
  replacement: string;
  enabled: boolean;
}

/**
 * 解析正则表达式字符串
 * 支持 /pattern/flags 格式和纯文本格式
 */
function parseRegexString(regexString: string): { pattern: string; flags: string } {
  if (!regexString) {
    return { pattern: '', flags: 'g' };
  }

  // 检查是否是 /pattern/flags 格式
  if (regexString.startsWith('/')) {
    const lastSlash = regexString.lastIndexOf('/');
    if (lastSlash > 0) {
      const pattern = regexString.substring(1, lastSlash);
      const flags = regexString.substring(lastSlash + 1);
      return { pattern, flags };
    }
  }

  // 纯文本格式，默认使用全局匹配
  return { pattern: regexString, flags: 'g' };
}

/**
 * 应用正则规则处理文本
 * @param text 原始文本
 * @param rules 正则规则数组
 * @returns 处理后的文本
 */
export function applyRegexRules(text: string, rules: RegexRule[]): string {
  if (!text || !rules || rules.length === 0) {
    return text;
  }

  let processedText = text;
  let appliedCount = 0;

  rules.forEach((rule, index) => {
    // 跳过禁用的规则
    if (!rule.enabled) {
      console.log(`[RegexProcessor] 跳过禁用规则: ${rule.name}`);
      return;
    }

    // 跳过空规则
    if (!rule.pattern) {
      console.log(`[RegexProcessor] 跳过空规则: ${rule.name}`);
      return;
    }

    try {
      const { pattern, flags } = parseRegexString(rule.pattern);
      console.log(`[RegexProcessor] 应用规则 "${rule.name}":`, {
        原始pattern: rule.pattern,
        解析后pattern: pattern,
        flags: flags,
        replacement: rule.replacement,
      });

      const regex = new RegExp(pattern, flags);
      const beforeLength = processedText.length;
      processedText = processedText.replace(regex, rule.replacement || '');
      const afterLength = processedText.length;

      if (beforeLength !== afterLength) {
        appliedCount++;
        console.log(`[RegexProcessor] 规则 "${rule.name}" 生效，文本长度变化: ${beforeLength} -> ${afterLength}`);
      } else {
        console.log(`[RegexProcessor] 规则 "${rule.name}" 未匹配到任何内容`);
      }
    } catch (error) {
      console.error(`[RegexProcessor] 正则规则 "${rule.name}" (索引 ${index}) 执行失败:`, error);
      console.error(`[RegexProcessor] 规则详情:`, {
        pattern: rule.pattern,
        replacement: rule.replacement,
      });
    }
  });

  console.log(`[RegexProcessor] 总共应用了 ${appliedCount} 条规则`);
  return processedText;
}

/**
 * 从酒馆变量加载正则规则
 * @returns 正则规则数组
 */
export function loadRegexRulesFromVariables(): RegexRule[] {
  try {
    // 使用全局的 getVariables 函数
    const vars = (window as any).getVariables({ type: 'character' });
    const settings = vars?.adnd2e?.textRegexSettings;

    console.log('[RegexProcessor] 加载的变量:', vars?.adnd2e);
    console.log('[RegexProcessor] 正则设置:', settings);

    if (settings && settings.regexRules && Array.isArray(settings.regexRules)) {
      const enabledCount = settings.regexRules.filter((r: RegexRule) => r.enabled).length;
      console.log(`[RegexProcessor] 加载了 ${settings.regexRules.length} 条规则，其中 ${enabledCount} 条已启用`);
      return settings.regexRules;
    } else {
      console.log('[RegexProcessor] 未找到正则规则');
    }
  } catch (error) {
    console.warn('[RegexProcessor] 加载正则规则失败:', error);
  }

  return [];
}

/**
 * 完整的消息格式化函数
 * 先应用正则规则，再进行基础格式化（换行、空格）
 */
export function formatMessageWithRegex(content: string): string {
  if (!content) {
    return '';
  }

  console.log('[RegexProcessor] 开始格式化消息，原始内容长度:', content.length);
  console.log('[RegexProcessor] 原始内容前100字符:', content.substring(0, 100));

  // 1. 应用正则规则
  const rules = loadRegexRulesFromVariables();
  console.log(`[RegexProcessor] 加载了 ${rules.length} 条规则`);

  let processed = applyRegexRules(content, rules);

  // 2. 基础格式化：换行和空格
  processed = processed.replace(/\n/g, '<br>').replace(/ {2}/g, '&nbsp;&nbsp;');

  console.log('[RegexProcessor] 格式化完成，最终内容长度:', processed.length);

  return processed;
}
