const fs = require('fs');

const file = 'dist/ADND2E游戏系统/index.html';
const content = fs.readFileSync(file, 'utf8');

console.log('=== jQuery 检查 ===');
console.log('包含 "jquery":', content.toLowerCase().includes('jquery'));
console.log('包含 "$" 函数定义:', content.includes('function $') || content.includes('function('));
console.log('包含 "window.$":', content.includes('window.$'));

// 查找 jQuery 关键代码
const jQueryPatterns = [
  'jQuery',
  '.fn.jquery',
  'sizzle',
  '.fn.init',
];

console.log('\n=== jQuery 特征码 ===');
jQueryPatterns.forEach(pattern => {
  const found = content.toLowerCase().includes(pattern.toLowerCase());
  console.log(`${pattern}: ${found ? '✓' : '✗'}`);
});

// 检查是否有 external 引用
console.log('\n=== External 检查 ===');
console.log('包含 "var $":', content.includes('var $'));
console.log('包含 CDN 链接:', content.includes('cdn'));

// 搜索 $ 的定义
const dollarMatch = content.match(/\bvar \$\s*=/);
if (dollarMatch) {
  const start = content.indexOf(dollarMatch[0]);
  console.log('\n找到 $ 定义:', content.substring(start, start + 100));
}


















