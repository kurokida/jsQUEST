import { nodeResolve } from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
  input: 'src/jsQUEST.js',
  output: {
    dir: 'dist',
    format: 'umd',
    name: 'jsQUEST',
    sourcemap: true
  },
  plugins: [
    nodeResolve(),
    sourcemaps()
  ]
};