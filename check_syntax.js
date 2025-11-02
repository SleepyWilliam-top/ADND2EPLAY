const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'dist/ADND2E游戏系统/index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log(`文件大小: ${(html.length / 1024 / 1024).toFixed(2)} MB`);

// 提取 script 标签内容
const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.log('未找到 script 标签');
  process.exit(1);
}

const script = scriptMatch[1];
console.log(`脚本大小: ${(script.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`脚本行数: ${script.split('\n').length}`);

// 尝试执行脚本检查语法
try {
  new Function(script);
  console.log('✅ 脚本语法正确');
} catch (error) {
  console.error('❌ 脚本语法错误:');
  console.error(error.message);

  // 尝试定位错误位置
  const match = error.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    const context = script.substring(Math.max(0, pos - 100), Math.min(script.length, pos + 100));
    console.error('\n错误位置上下文:');
    console.error(context);
  }
}
