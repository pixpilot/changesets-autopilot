import config from '@pixpilot/dev-config/eslint';
import jestConfig from '@pixpilot/dev-config/eslint-jest';

export default [
  ...config,
  ...jestConfig,
  {
    files: ['**/*.test.ts', '**/*.test.js'],
    rules: {
      'import/no-duplicates': 'off',
      'import/order': 'off',
    },
  },
];
