// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import inject from '@rollup/plugin-inject';

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true,
  },
  plugins: [
    typescript({
      outDir: 'dist',
      declaration: false,
      declarationMap: false,
    }),
    commonjs(),
    nodeResolve({ preferBuiltins: true }),
    inject({
      __dirname: [
        'path',
        'dirname',
        // This will inject: const __dirname = dirname(fileURLToPath(import.meta.url));
      ],
      __filename: [
        'url',
        'fileURLToPath',
        // This will inject: const __filename = fileURLToPath(import.meta.url);
      ],
    }),
  ],
};

export default config;
