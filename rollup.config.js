import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
  input: './src/index.js',
  output: {
    file: './dist/index.min.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    resolve(),
    uglify()
  ]
}