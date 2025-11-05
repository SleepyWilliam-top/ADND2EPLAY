/**
 * 分段记忆解析器测试
 */

import { parseSegmentedMemory, removeSegmentedMemoryTags } from './segmentedMemoryParser';

// 测试用例1：用户提供的实际案例（字符串内部包含单引号）
const testCase1 = `addSmallSummary("周锦与两个动物伙伴在野外露营过夜。他给野猪起名'獠牙'，家猪起名'圆滚滚'。凭借狼裔的敏锐感官，他保持警觉守夜，同时思考着明天的行程。时间：深夜；地点：无名森林边缘") addLargeSummary("游侠周锦与动物伙伴在森林边缘露营，为它们命名并守夜。深夜，无名森林")`;

console.log('=== 测试用例1：包含单引号的字符串 ===');
const result1 = parseSegmentedMemory(testCase1);
console.log('解析结果:', result1);
console.log('小总结:', result1?.smallSummary);
console.log('大总结:', result1?.largeSummary);
console.log('');

// 测试用例2：XML 格式
const testCase2 = `
<segmented-memory>
  <small-summary>周锦与两个动物伙伴在野外露营过夜。</small-summary>
  <large-summary>游侠周锦露营守夜</large-summary>
</segmented-memory>
`;

console.log('=== 测试用例2：XML 格式 ===');
const result2 = parseSegmentedMemory(testCase2);
console.log('解析结果:', result2);
console.log('');

// 测试用例3：单引号包裹（包含双引号）
const testCase3 = `addSmallSummary('他说："你好"') addLargeSummary('简短的"测试"')`;

console.log('=== 测试用例3：单引号包裹（包含双引号）===');
const result3 = parseSegmentedMemory(testCase3);
console.log('解析结果:', result3);
console.log('');

// 测试用例4：移除标记
const testCase4 = `这是正文内容\n\naddSmallSummary("周锦与两个动物伙伴在野外露营过夜。他给野猪起名'獠牙'，家猪起名'圆滚滚'。") addLargeSummary("游侠周锦露营守夜")\n\n更多正文`;

console.log('=== 测试用例4：移除分段记忆标记 ===');
console.log('原始内容:', testCase4);
const cleaned4 = removeSegmentedMemoryTags(testCase4);
console.log('清理后:', cleaned4);
console.log('');

// 验证结果
if (result1 && result1.smallSummary.includes("獠牙") && result1.largeSummary.includes("森林")) {
  console.log('✅ 测试通过！修复成功，现在可以正确解析包含引号的字符串了。');
} else {
  console.error('❌ 测试失败！');
  console.error('期望小总结包含"獠牙"');
  console.error('期望大总结包含"森林"');
}

