import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/jsQUEST.js',
  output: {
    dir: 'dist',
    format: 'umd',
    name: 'jsQUEST'
  },
  plugins: [nodeResolve()],
};