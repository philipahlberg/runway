import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import alias from 'rollup-plugin-alias';

export default {
  input: './src/index.js',
  output: {
    file: './dist/index.js',
    format: 'es'
  },
  plugins: [
    alias({
      'lib': '../dist/index.js'
    }),
    resolve(),
    commonjs({
      include: 'node_modules/**'
    })
  ]
}