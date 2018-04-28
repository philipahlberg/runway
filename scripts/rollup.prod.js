import resolve from 'rollup-plugin-node-resolve';
import minify from 'rollup-plugin-uglify';
import typescript from 'rollup-plugin-typescript';
import tsc from 'typescript';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.js',
      format: 'es'
    },
    plugins: [
      typescript({
        typescript: tsc
      }),
      resolve()
    ]
  },
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.min.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({
        typescript: tsc
      }),
      resolve(),
      minify({
        toplevel: true
      })
    ]
  }
]