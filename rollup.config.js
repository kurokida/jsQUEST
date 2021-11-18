import { nodeResolve } from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default [
  // jsQuestPlus.js can be imported with a script tag or via require
  {
    input: 'src/jsQuestPlus.js',
    output: {
      format: 'umd',
      name: 'jsQuestPlus',
      globals: {
        numeric$1: 'numeric'
      },
      file: 'dist/jsQuestPlus.js',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      sourcemaps()
    ]
  },
  // jsQuestPlus.module.js can be imported as an ES module
  {
    input: 'src/jsQuestPlus.js',
    output: {
      format: 'es',
      file: 'dist/jsQuestPlus.module.js',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      sourcemaps()
    ]
  }

];