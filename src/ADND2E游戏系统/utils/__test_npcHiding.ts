/**
 * NPC 格式隐藏功能测试
 * 用于验证正则规则是否正确隐藏NPC标准格式
 */

import { applyRegexRules, DEFAULT_REGEX_RULES } from './regexProcessor';

// 测试用例
const testCases = [
  {
    name: '完整的NPC格式',
    input:
      '你遇到了一个地精战士。<[地精战士]：AC 6；MV 6；HD 1-1；hp 4；THAC0 20；#AT 1；Dmg 1d6；SZ S；Int 低（5-7）；AL LE；ML 8；XP 15>他向你发起攻击！',
    expected: '你遇到了一个地精战士。他向你发起攻击！',
  },
  {
    name: '带可选字段的NPC格式',
    input:
      '一个强大的巫师出现了。<[巫师艾尔温]：AC 10；MV 12；HD 5；hp 20；THAC0 18；#AT 1；Dmg 1d4；SA 法术；SD 魔法护盾；SP 5级法术；MR 无；SZ M；Int 高（16）；AL N；ML 14；XP 650；MagicItem 法杖+2>',
    expected: '一个强大的巫师出现了。',
  },
  {
    name: '多个NPC格式',
    input:
      '三个敌人围了过来。<[土匪A]：AC 8；MV 12；HD 1；hp 5；THAC0 20；#AT 1；Dmg 1d6；SZ M；Int 8-10；AL CE；ML 10；XP 15><[土匪B]：AC 8；MV 12；HD 1；hp 6；THAC0 20；#AT 1；Dmg 1d6；SZ M；Int 8-10；AL CE；ML 10；XP 15><[土匪C]：AC 7；MV 12；HD 1；hp 7；THAC0 20；#AT 1；Dmg 1d8；SZ M；Int 8-10；AL CE；ML 10；XP 20>战斗开始！',
    expected: '三个敌人围了过来。战斗开始！',
  },
  {
    name: '部分字段的NPC格式',
    input: '一只野猫出现了。<[野猫]：AC 7；HD 1-1；hp 3；#AT 3；Dmg 1d2/1d2/1d3；SZ S；Int 动物（1）；AL N；XP 7>',
    expected: '一只野猫出现了。',
  },
  {
    name: '中文分号的NPC格式',
    input:
      '守卫队长站在门口。<[守卫队长]：AC 5；MV 12；HD 3；hp 18；THAC0 18；#AT 1；Dmg 1d8；SZ M；Int 10；AL LG；ML 14；XP 65>',
    expected: '守卫队长站在门口。',
  },
  {
    name: '没有NPC格式的普通文本',
    input: '这是一段普通的游戏叙述文本，没有任何NPC数据格式。',
    expected: '这是一段普通的游戏叙述文本，没有任何NPC数据格式。',
  },
];

// 运行测试
console.log('========== NPC 格式隐藏测试 ==========\n');

let passedCount = 0;
let failedCount = 0;

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}: ${testCase.name}`);
  console.log(`输入: ${testCase.input}`);

  const result = applyRegexRules(testCase.input, DEFAULT_REGEX_RULES);

  console.log(`期望: ${testCase.expected}`);
  console.log(`实际: ${result}`);

  if (result === testCase.expected) {
    console.log('✅ 测试通过\n');
    passedCount++;
  } else {
    console.log('❌ 测试失败\n');
    failedCount++;
  }
});

console.log('========== 测试结果 ==========');
console.log(`通过: ${passedCount}/${testCases.length}`);
console.log(`失败: ${failedCount}/${testCases.length}`);
console.log(`成功率: ${((passedCount / testCases.length) * 100).toFixed(1)}%`);

if (failedCount === 0) {
  console.log('\n🎉 所有测试通过！');
} else {
  console.log('\n⚠️  部分测试失败，请检查正则表达式。');
}
