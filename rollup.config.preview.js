import serve from 'rollup-plugin-serve';

export default {
  input: 'dist/scrolltering.js',
  output: {
    file: 'dist/preview.js',
    format: 'es'
  },
  plugins: [
    serve({
      open: true,
      contentBase: 'dist',
      port: 3001,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    })
  ]
};