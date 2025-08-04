import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import copy from 'rollup-plugin-copy';

const isProduction = process.env.NODE_ENV === 'production';
const isServe = process.env.SERVE === 'true';

const plugins = [
  resolve(),
];

// publicファイルのコピー（開発・本番両方）
plugins.push(
  copy({
    targets: [
      { src: 'public/*', dest: 'dist' }
    ]
  })
);

// 開発時のプラグイン
if (!isProduction && isServe) {
  plugins.push(
    serve({
      open: true,
      contentBase: 'dist',
      port: 3000
    }),
    livereload('dist')
  );
}

// 本番時の圧縮
if (isProduction) {
  plugins.push(terser());
}

// 基本プラグイン（serve/livereload除外）
const basePlugins = plugins.filter(p => 
  p.name !== 'serve' && p.name !== 'livereload'
);

const builds = [
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/scrolltering.cjs.js',
      format: 'cjs',
      sourcemap: !isProduction
    },
    plugins: basePlugins
  },
  // ES module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/scrolltering.esm.js',
      format: 'es',
      sourcemap: !isProduction
    },
    plugins: basePlugins
  },
  // UMD build for browsers
  {
    input: 'src/index.js',
    output: {
      file: 'dist/scrolltering.umd.js',
      format: 'umd',
      name: 'ScrollySystem',
      sourcemap: !isProduction,
      exports: 'default'
    },
    plugins: isProduction ? 
      [resolve(), copy({ targets: [{ src: 'public/*', dest: 'dist' }] }), terser()] :
      basePlugins
  }
];

// 開発サーバー用ビルド（serve時のみ）
if (isServe) {
  builds.push({
    input: 'src/index.js',
    output: {
      file: 'dist/scrolltering.dev.js',
      format: 'umd',
      name: 'ScrollySystem',
      sourcemap: true,
      exports: 'default'
    },
    plugins: plugins // serve/livereload含む
  });
}

export default builds;