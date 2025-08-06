import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    mockReset: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      enabled: true,
      reportOnFailure: true,
      reporter: ['text-summary', 'html', 'json', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', 'tests/**', '__mocks__/**'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
