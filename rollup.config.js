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

// 開発時のプラグイン
if (!isProduction) {
  plugins.push(
    copy({
      targets: [
        { src: 'public/*', dest: 'dist' }
      ]
    })
  );

  if (isServe) {
    plugins.push(
      serve({
        open: true,
        contentBase: 'dist',
        port: 3000
      }),
      livereload('dist')
    );
  }
}

// 本番時の圧縮
if (isProduction) {
  plugins.push(terser());
}

export default [
  // UMD build for browsers
  {
    input: 'src/index.js',
    output: {
      file: 'dist/scrolltering.js',
      format: 'umd',
      name: 'ScrollySystem',
      sourcemap: !isProduction
    },
    plugins
  },
  // ES module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/scrolltering.es.js',
      format: 'es',
      sourcemap: !isProduction
    },
    plugins: plugins.filter(p => 
      // serveとlivereloadはES module buildでは除外
      p.name !== 'serve' && p.name !== 'livereload'
    )
  }
];