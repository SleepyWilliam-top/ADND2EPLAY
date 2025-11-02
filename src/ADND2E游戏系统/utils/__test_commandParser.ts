/**
 * 命令解析器测试文件
 * 运行方式: 在浏览器 Console 中调用 testCommandParser()
 */

import { parseAiResponse } from './commandParser';

/**
 * 测试智能文本解析功能
 */
export function testCommandParser() {
  console.log('=== 开始测试命令解析器 ===\n');

  // 测试用例 1: 仅包含自然语言描述（无命令块）
  console.log('【测试 1】自然语言描述 - 位置、时间、天气');
  const test1 = `
清晨的阳光透过树叶洒在地上，你来到了深林旅店。
天气晴朗温暖，正是适合冒险的好时候。
旅店老板热情地招呼你进来休息。
`;
  const result1 = parseAiResponse(test1);
  console.log('提取的命令:', result1.commands);
  console.log('期望: 位置=深林旅店, 时间=清晨, 天气=晴朗, 温度=温暖');
  console.log('');

  // 测试用例 2: 包含命令块
  console.log('【测试 2】标准命令块格式');
  const test2 = `
<!-- <gamestate>
[
  {"type": "update_location", "data": {"location": "地精巢穴"}},
  {"type": "update_time", "data": {"current": "黄昏", "date": "第3天"}},
  {"type": "take_damage", "data": {"amount": 8, "source": "地精的匕首"}}
]
</gamestate> -->

黄昏降临，你来到了地精巢穴。你挥剑砍向地精，但它灵活地躲开，并用匕首划伤了你的手臂（受到8点伤害）。
`;
  const result2 = parseAiResponse(test2);
  console.log('提取的命令:', result2.commands);
  console.log('期望: 3个命令（位置、时间、伤害）+ 可能的智能解析命令');
  console.log('');

  // 测试用例 3: 仅时间变化
  console.log('【测试 3】时间变化的多种表达');
  const test3_1 = '此时已是午后时分，阳光变得炽热。';
  const test3_2 = '夜晚降临，四周陷入黑暗。';
  const test3_3 = '时间已经是深夜了，村庄一片寂静。';

  console.log('  3.1:', test3_1);
  console.log('  提取:', parseAiResponse(test3_1).commands);

  console.log('  3.2:', test3_2);
  console.log('  提取:', parseAiResponse(test3_2).commands);

  console.log('  3.3:', test3_3);
  console.log('  提取:', parseAiResponse(test3_3).commands);
  console.log('');

  // 测试用例 4: 位置变化的多种表达
  console.log('【测试 4】位置变化的多种表达');
  const test4_1 = '你走进了暗影森林。';
  const test4_2 = '经过长途跋涉，你终于到达了王城。';
  const test4_3 = '你现在在铁匠铺内。';

  console.log('  4.1:', test4_1);
  console.log('  提取:', parseAiResponse(test4_1).commands);

  console.log('  4.2:', test4_2);
  console.log('  提取:', parseAiResponse(test4_2).commands);

  console.log('  4.3:', test4_3);
  console.log('  提取:', parseAiResponse(test4_3).commands);
  console.log('');

  // 测试用例 5: 天气变化
  console.log('【测试 5】天气变化');
  const test5_1 = '天空变得阴沉，开始下起雨来。';
  const test5_2 = '天气晴朗，微风拂面。';
  const test5_3 = '气温变得寒冷，你感到一阵冷意。';

  console.log('  5.1:', test5_1);
  console.log('  提取:', parseAiResponse(test5_1).commands);

  console.log('  5.2:', test5_2);
  console.log('  提取:', parseAiResponse(test5_2).commands);

  console.log('  5.3:', test5_3);
  console.log('  提取:', parseAiResponse(test5_3).commands);
  console.log('');

  // 测试用例 6: 混合场景
  console.log('【测试 6】混合场景 - 位置、时间、天气同时出现');
  const test6 = `
第5天的清晨，你来到了精灵之森。
森林里晴朗温暖，鸟儿在树枝上欢快地歌唱。
前方的道路通向森林深处。
`;
  const result6 = parseAiResponse(test6);
  console.log('文本:', test6.trim());
  console.log('提取的命令:', result6.commands);
  console.log('期望: 位置、时间(清晨+第5天)、天气');
  console.log('');

  // 测试用例 7: 无相关信息
  console.log('【测试 7】无相关环境信息的普通对话');
  const test7 = '旅店老板微笑着说："欢迎光临！需要休息吗？"';
  const result7 = parseAiResponse(test7);
  console.log('文本:', test7);
  console.log('提取的命令:', result7.commands);
  console.log('期望: 空数组（无环境信息）');
  console.log('');

  console.log('=== 测试完成 ===');
  console.log('请检查上述结果是否符合预期');
}

// 将测试函数挂载到全局（仅在开发环境）
if (typeof window !== 'undefined') {
  (window as any).testCommandParser = testCommandParser;
  console.log('[CommandParser] 测试函数已加载，在 Console 中运行 testCommandParser() 进行测试');
}
