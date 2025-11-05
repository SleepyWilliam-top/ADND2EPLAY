const webpack = require('webpack');
const config = require('./webpack.config.ts').default;

console.log('=== Webpack 配置数量 ===');
console.log('配置数量:', config.length);

config.forEach((cfg, index) => {
  const resolved = typeof cfg === 'function' ? cfg({}, { mode: 'production' }) : cfg;
  console.log(`\n=== 配置 ${index + 1} ===`);
  console.log('Entry:', resolved.entry);
  console.log('Output Path:', resolved.output?.path);
  console.log('Has HTML?:', resolved.plugins?.some(p => p.constructor.name === 'HtmlWebpackPlugin'));
  
  // 测试 externals 函数
  if (resolved.externals) {
    console.log('\n测试 externals:');
    const testRequests = ['jquery', 'vue', 'lodash', 'toastr'];
    testRequests.forEach(req => {
      resolved.externals({ context: '/test', request: req }, (err, result) => {
        console.log(`  ${req}: ${result || '(打包进来)'}`);
      });
    });
  }
});



















