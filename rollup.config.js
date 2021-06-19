import { nodeResolve } from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default [
  // jsQUEST.js can be imported with a script tag or via require)
  {
    input: 'src/jsQUEST.js',
    output: {
      format: 'umd',
      name: 'jsQUEST',
      file: 'dist/jsQUEST.js',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      sourcemaps()
    ]
  },
  // jsQUEST.module.js can be imported as an ES module
  {
    input: 'src/jsQUEST.js',
    output: {
      format: 'es',
      file: 'dist/jsQUEST.module.js',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      sourcemaps()
    ]
  }
];