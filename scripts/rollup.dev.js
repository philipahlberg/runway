import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import tsc from 'typescript';

export default {
  input: './test/src/index.js',
  output: {
    file: './test/dist/index.js',
    format: 'es'
  },
  plugins: [
    typescript({
      typescript: tsc
    }),
    resolve()
  ],
  experimentalDynamicImport: true
}