import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true,
    // Modified banner to avoid conflicts
    banner: `
import { fileURLToPath as _fileURLToPath } from 'url';
import { dirname as _dirname } from 'path';
const __filename = typeof __filename !== 'undefined' ? __filename : _fileURLToPath(import.meta.url);
const __dirname = typeof __dirname !== 'undefined' ? __dirname : _dirname(__filename);
    `.trim(),
  },
  plugins: [
    typescript({
      outDir: 'dist',
      declaration: false,
      declarationMap: false,
    }),
    commonjs({
      transformMixedEsModules: true,
    }),
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node'],
    }),
  ],
};

export default config;
