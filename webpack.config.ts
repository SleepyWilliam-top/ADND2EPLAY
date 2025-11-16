<<<<<<< HEAD
import HtmlInlineScriptWebpackPlugin from 'html-inline-script-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import url from 'node:url';
=======
import { FSWatcher, watch } from 'chokidar';
import HtmlInlineScriptWebpackPlugin from 'html-inline-script-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import _ from 'lodash';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
import RemarkHTML from 'remark-html';
import { Server } from 'socket.io';
import TerserPlugin from 'terser-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import unpluginAutoImport from 'unplugin-auto-import/webpack';
import { VueUseComponentsResolver, VueUseDirectiveResolver } from 'unplugin-vue-components/resolvers';
import unpluginVueComponents from 'unplugin-vue-components/webpack';
import { VueLoaderPlugin } from 'vue-loader';
import webpack from 'webpack';
import WebpackObfuscator from 'webpack-obfuscator';
const require = createRequire(import.meta.url);
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

<<<<<<< HEAD
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

=======
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
interface Config {
  port: number;
  entries: Entry[];
}
interface Entry {
  script: string;
  html?: string;
}

function parse_entry(script_file: string) {
  const html = path.join(path.dirname(script_file), 'index.html');
  if (fs.existsSync(html)) {
    return { script: script_file, html };
  }
  return { script: script_file };
}

function common_path(lhs: string, rhs: string) {
  const lhs_parts = lhs.split(path.sep);
  const rhs_parts = rhs.split(path.sep);
  for (let i = 0; i < Math.min(lhs_parts.length, rhs_parts.length); i++) {
    if (lhs_parts[i] !== rhs_parts[i]) {
      return lhs_parts.slice(0, i).join(path.sep);
    }
  }
  return lhs_parts.join(path.sep);
}

function glob_script_files() {
  const files: string[] = fs
<<<<<<< HEAD
    .globSync(`src/**/index.{ts,js}`)
    .filter(file => process.env.CI !== 'true' || !fs.readFileSync(path.join(__dirname, file)).includes('@no-ci'));
=======
    .globSync(`src/**/index.{ts,tsx,js,jsx}`)
    .filter(
      file => process.env.CI !== 'true' || !fs.readFileSync(path.join(import.meta.dirname, file)).includes('@no-ci'),
    );
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e

  const results: string[] = [];
  const handle = (file: string) => {
    const file_dirname = path.dirname(file);
    for (const [index, result] of results.entries()) {
      const result_dirname = path.dirname(result);
      const common = common_path(result_dirname, file_dirname);
      if (common === result_dirname) {
        return;
      }
      if (common === file_dirname) {
        results.splice(index, 1, file);
        return;
      }
    }
    results.push(file);
  };
  files.forEach(handle);
  return results;
}

const config: Config = {
  port: 6621,
  entries: glob_script_files().map(parse_entry),
};

let io: Server;
function watch_it(compiler: webpack.Compiler) {
  if (compiler.options.watch) {
    if (!io) {
      const port = config.port ?? 6621;
      io = new Server(port, { cors: { origin: '*' } });
      console.info(`[Listener] 已启动酒馆监听服务, 正在监听: http://0.0.0.0:${port}`);
      io.on('connect', socket => {
        console.info(`[Listener] 成功连接到酒馆网页 '${socket.id}', 初始化推送...`);
        io.emit('iframe_updated');
        socket.on('disconnect', reason => {
          console.info(`[Listener] 与酒馆网页 '${socket.id}' 断开连接: ${reason}`);
        });
      });
    }

    compiler.hooks.done.tap('updater', () => {
      console.info('\n[Listener] 检测到完成编译, 推送更新事件...');
      io.emit('iframe_updated');
    });
  }
}

<<<<<<< HEAD
function parse_configuration(entry: Entry): (_env: any, argv: any) => webpack.Configuration {
  const should_obfuscate = fs.readFileSync(path.join(__dirname, entry.script), 'utf-8').includes('@obfuscate');
=======
let watcher: FSWatcher;
function dump_schema(compiler: webpack.Compiler) {
  const execute = () => {
    exec('pnpm dump', { cwd: import.meta.dirname });
  };
  const execute_debounced = _.debounce(execute, 500, { leading: true, trailing: false });
  if (!compiler.options.watch) {
    execute();
  } else if (!watcher) {
    watcher = watch('src', {
      awaitWriteFinish: true,
    }).on('all', (_event, path) => {
      if (path.endsWith('schema.ts')) {
        execute_debounced();
      }
    });
  }
}

function parse_configuration(entry: Entry): (_env: any, argv: any) => webpack.Configuration {
  const should_obfuscate = fs
    .readFileSync(path.join(import.meta.dirname, entry.script), 'utf-8')
    .includes('@obfuscate');
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
  const script_filepath = path.parse(entry.script);

  return (_env, argv) => ({
    experiments: {
<<<<<<< HEAD
      outputModule: entry.html === undefined, // 仅在脚本项目中使用模块输出
=======
      outputModule: true,
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
    },
    devtool: argv.mode === 'production' ? 'source-map' : 'eval-source-map',
    watchOptions: {
      ignored: ['**/dist', '**/node_modules'],
    },
<<<<<<< HEAD
    entry: path.join(__dirname, entry.script),
=======
    entry: path.join(import.meta.dirname, entry.script),
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
    target: 'browserslist',
    output: {
      devtoolNamespace: 'tavern_helper_template',
      devtoolModuleFilenameTemplate: info => {
        const resource_path = decodeURIComponent(info.resourcePath.replace(/^\.\//, ''));
        const is_direct = info.allLoaders === '';
        const is_vue_script =
          resource_path.match(/\.vue$/) &&
          info.query.match(/\btype=script\b/) &&
          !info.allLoaders.match(/\bts-loader\b/);

        return `${is_direct === true ? 'src' : 'webpack'}://${info.namespace}/${resource_path}${is_direct || is_vue_script ? '' : '?' + info.hash}`;
      },
      filename: `${script_filepath.name}.js`,
<<<<<<< HEAD
      path: path.join(__dirname, 'dist', path.relative(path.join(__dirname, 'src'), script_filepath.dir)),
=======
      path: path.join(
        import.meta.dirname,
        'dist',
        path.relative(path.join(import.meta.dirname, 'src'), script_filepath.dir),
      ),
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
      chunkFilename: `${script_filepath.name}.[contenthash].chunk.js`,
      asyncChunks: true,
      clean: true,
      publicPath: '',
<<<<<<< HEAD
      library: entry.html === undefined
        ? {
            type: 'module',
          }
        : undefined, // 前端界面使用普通输出格式
=======
      library: {
        type: 'module',
      },
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: 'vue-loader',
          exclude: /node_modules/,
        },
        {
          oneOf: [
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                onlyCompileBundledFiles: true,
                compilerOptions: {
                  noUnusedLocals: false,
                  noUnusedParameters: false,
                },
              },
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.(sa|sc)ss$/,
              use: ['postcss-loader', 'sass-loader'],
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.css$/,
              use: ['postcss-loader'],
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                onlyCompileBundledFiles: true,
                compilerOptions: {
                  noUnusedLocals: false,
                  noUnusedParameters: false,
                },
              },
              resourceQuery: /url/,
              type: 'asset/inline',
              exclude: /node_modules/,
            },
            {
              test: /\.(sa|sc)ss$/,
              use: ['postcss-loader', 'sass-loader'],
              resourceQuery: /url/,
              type: 'asset/inline',
              exclude: /node_modules/,
            },
            {
              test: /\.css$/,
              use: ['postcss-loader'],
              resourceQuery: /url/,
              type: 'asset/inline',
              exclude: /node_modules/,
            },
            {
              resourceQuery: /url/,
              type: 'asset/inline',
              exclude: /node_modules/,
            },
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                onlyCompileBundledFiles: true,
                compilerOptions: {
                  noUnusedLocals: false,
                  noUnusedParameters: false,
                },
              },
              exclude: /node_modules/,
            },
            {
              test: /\.html$/,
              use: 'html-loader',
              exclude: /node_modules/,
            },
            {
              test: /\.md$/,
              use: [
                {
                  loader: 'html-loader',
                },
                {
                  loader: 'remark-loader',
                  options: {
                    remarkOptions: {
                      plugins: [RemarkHTML],
                    },
                  },
                },
              ],
            },
          ].concat(
            entry.html === undefined
<<<<<<< HEAD
              ? <any[]>[
=======
              ? ([
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
                  {
                    test: /\.vue\.s(a|c)ss$/,
                    use: [
                      { loader: 'vue-style-loader', options: { ssrId: true } },
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                      'sass-loader',
                    ],
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.vue\.css$/,
                    use: [
                      { loader: 'vue-style-loader', options: { ssrId: true } },
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                    ],
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.s(a|c)ss$/,
                    use: [
                      'style-loader',
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                      'sass-loader',
                    ],
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.css$/,
                    use: ['style-loader', { loader: 'css-loader', options: { url: false } }, 'postcss-loader'],
                    exclude: /node_modules/,
                  },
<<<<<<< HEAD
                ]
              : <any[]>[
=======
                ] as any[])
              : ([
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
                  {
                    test: /\.s(a|c)ss$/,
                    use: [
                      MiniCssExtractPlugin.loader,
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                      'sass-loader',
                    ],
                    exclude: /node_modules/,
                  },
                  {
                    test: /\.css$/,
                    use: [
                      MiniCssExtractPlugin.loader,
                      { loader: 'css-loader', options: { url: false } },
                      'postcss-loader',
                    ],
                    exclude: /node_modules/,
                  },
<<<<<<< HEAD
                ],
=======
                ] as any[]),
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
          ),
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js', '.tsx', '.jsx', '.css'],
      plugins: [
        new TsconfigPathsPlugin({
          extensions: ['.ts', '.js', '.tsx', '.jsx'],
<<<<<<< HEAD
          configFile: path.join(__dirname, 'tsconfig.json'),
=======
          configFile: path.join(import.meta.dirname, 'tsconfig.json'),
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
        }),
      ],
      alias: {},
    },
    plugins: (entry.html === undefined
      ? [new MiniCssExtractPlugin()]
      : [
          new HtmlWebpackPlugin({
<<<<<<< HEAD
            template: path.join(__dirname, entry.html),
            filename: path.parse(entry.html).base,
            scriptLoading: 'blocking',
            cache: false,
            inject: 'body', // 将脚本注入到 body 底部
            minify: false, // 完全禁用 HTML 压缩，避免 srcdoc 解析问题
=======
            template: path.join(import.meta.dirname, entry.html),
            filename: path.parse(entry.html).base,
            scriptLoading: 'module',
            cache: false,
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
          }),
          new HtmlInlineScriptWebpackPlugin(),
          new MiniCssExtractPlugin(),
          new HTMLInlineCSSWebpackPlugin({
            styleTagFactory({ style }: { style: string }) {
              return `<style>${style}</style>`;
            },
          }),
        ]
    )
      .concat(
        { apply: watch_it },
<<<<<<< HEAD
=======
        { apply: dump_schema },
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
        new VueLoaderPlugin(),
        unpluginAutoImport({
          dts: true,
          dtsMode: 'overwrite',
          imports: [
            'vue',
            'pinia',
            '@vueuse/core',
            { from: 'dedent', imports: [['default', 'dedent']] },
            { from: 'klona', imports: ['klona'] },
            { from: 'vue-final-modal', imports: ['useModal'] },
            { from: 'zod', imports: ['z'] },
          ],
        }),
        unpluginVueComponents({
          dts: true,
          syncMode: 'overwrite',
          // globs: ['src/panel/component/*.vue'],
          resolvers: [VueUseComponentsResolver(), VueUseDirectiveResolver()],
        }),
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
        new webpack.DefinePlugin({
          __VUE_OPTIONS_API__: false,
          __VUE_PROD_DEVTOOLS__: process.env.CI !== 'true',
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
        }),
      )
      .concat(
        should_obfuscate
          ? [
              new WebpackObfuscator({
                controlFlowFlattening: true,
                numbersToExpressions: true,
                selfDefending: true,
                simplify: true,
                splitStrings: true,
<<<<<<< HEAD
=======
                seed: import.meta.dirname.length,
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
              }),
            ]
          : [],
      ),
    optimization: {
      minimize: true,
      minimizer: [
<<<<<<< HEAD
        argv.mode === 'production' && entry.html === undefined // 仅对脚本项目压缩
          ? new TerserPlugin({
              parallel: false, // 禁用并行处理以减少内存占用
              terserOptions: {
                parse: {
                  ecma: 2020,
                },
                format: { 
                  quote_style: 3,
                  ascii_only: false,
                },
                mangle: { 
                  reserved: ['_', 'toastr', 'YAML', '$', 'z', 'Vue', 'PIXI', 'gsap', 'jquery'],
                },
                compress: {
                  ecma: 2020,
                  drop_console: false,
                  drop_debugger: false,
                  passes: 1, // 减少压缩次数
                },
                ecma: 2020,
              },
            })
          : new TerserPlugin({
              parallel: false, // 禁用并行处理以减少内存占用
              extractComments: false,
              terserOptions: {
                parse: {
                  ecma: 2020,
                },
                format: { 
                  beautify: true, 
                  indent_level: 2, 
                  comments: true,
                  quote_style: 3,
                },
                compress: false,
                mangle: false,
                keep_classnames: true,
                keep_fnames: true,
                ecma: 2020,
=======
        argv.mode === 'production'
          ? new TerserPlugin({
              terserOptions: { format: { quote_style: 1 }, mangle: { reserved: ['_', 'toastr', 'YAML', '$', 'z'] } },
            })
          : new TerserPlugin({
              extractComments: false,
              terserOptions: {
                format: { beautify: true, indent_level: 2 },
                compress: false,
                mangle: false,
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
              },
            }),
      ],
      splitChunks: {
        chunks: 'async',
        minSize: 20000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
          },
          default: {
            name: 'default',
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },
    externals: ({ context, request }, callback) => {
      if (!context || !request) {
        return callback();
      }

      if (
        request.startsWith('-') ||
        request.startsWith('.') ||
        request.startsWith('/') ||
        request.startsWith('!') ||
        request.startsWith('http') ||
        path.isAbsolute(request) ||
        fs.existsSync(path.join(context, request)) ||
        fs.existsSync(request)
      ) {
        return callback();
      }

      const builtin = ['vue3-pixi', 'vue-demi'];
      if (builtin.includes(request)) {
        return callback();
      }
      if (argv.mode !== 'production' && ['vue', 'pixi'].some(key => request.includes(key))) {
        return callback();
      }
<<<<<<< HEAD
      
      // 前端界面项目：使用 externals（从酒馆环境或自己的 CDN 加载）
      if (entry.html !== undefined) {
        // 酒馆环境提供的全局变量（这些不需要在 HTML 中引入）
        const tavernGlobals = {
          jquery: '$',
          lodash: '_',
          toastr: 'toastr',
        };
        if (request in tavernGlobals) {
          return callback(null, 'var ' + tavernGlobals[request as keyof typeof tavernGlobals]);
        }
        
        // 需要打包进 bundle 的库（体积小或必须打包的）
        const bundled = ['klona', '@vueuse/core', '@vueuse/shared', 'dexie', 'dedent'];
        if (bundled.some(key => request === key || request.startsWith(key + '/'))) {
          return callback();
        }
        
        // 默认打包进 bundle（包括 Vue、Pinia 等，因为 CDN 在 srcdoc 中不可靠）
        return callback();
      }
      
      // 脚本项目：使用原有的 externals 配置
=======
      if (['react'].some(key => request.includes(key))) {
        return callback();
      }
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
      const global = {
        jquery: '$',
        lodash: '_',
        showdown: 'showdown',
        toastr: 'toastr',
        vue: 'Vue',
        'vue-router': 'VueRouter',
        yaml: 'YAML',
        zod: 'z',
        'pixi.js': 'PIXI',
<<<<<<< HEAD
        pinia: 'Pinia',
        gsap: 'gsap',
=======
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
      };
      if (request in global) {
        return callback(null, 'var ' + global[request as keyof typeof global]);
      }
<<<<<<< HEAD
      
      // 将某些库打包到文件中而不是使用 CDN
      const bundled = ['klona', '@vueuse/core', '@vueuse/shared', 'dexie', 'dedent'];
      if (bundled.some(key => request === key || request.startsWith(key + '/'))) {
        return callback();
      }
=======
>>>>>>> 4d711bd501f9f52d211bfb86391113e9f3d8504e
      const cdn = {
        sass: 'https://jspm.dev/sass',
      };
      return callback(
        null,
        'module-import ' + (cdn[request as keyof typeof cdn] ?? `https://testingcf.jsdelivr.net/npm/${request}/+esm`),
      );
    },
  });
}

export default config.entries.map(parse_configuration);
