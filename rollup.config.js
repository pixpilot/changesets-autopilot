// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true,
    banner: `import { dirname } from 'path';\nimport { fileURLToPath } from 'url';`,
  },
  plugins: [
    typescript({
      outDir: 'dist',
      declaration: false,
      declarationMap: false,
    }),
    commonjs(),
    nodeResolve({ preferBuiltins: true }),
    replace({
      preventAssignment: true,
      values: {
        __dirname: 'dirname(fileURLToPath(import.meta.url))',
        __filename: 'fileURLToPath(import.meta.url)',
      },
    }),
  ],
};

export default config;
