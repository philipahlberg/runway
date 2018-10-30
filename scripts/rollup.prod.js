import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.js',
      format: 'es'
    },
    plugins: [
      typescript(),
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
      typescript(),
      resolve(),
      terser({
        ecma: 8,
        module: true
      })
    ]
  }
]