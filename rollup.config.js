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
    // Add this banner to define __dirname
    banner: `
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
    `.trim(),
  },
  plugins: [
    typescript({
      outDir: 'dist',
      declaration: false,
      declarationMap: false,
    }),
    commonjs({
      // This helps with CommonJS compatibility
      transformMixedEsModules: true,
    }),
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node'], // Prefer Node.js versions of packages
    }),
  ],
};

export default config;
