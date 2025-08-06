import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    mockReset: true,
    include: ['tests/**/*.test.ts'],
    // Vitest will use __mocks__ at the project root automatically for manual mocks
    coverage: {
      enabled: true,
      reportOnFailure: true,
      reporter: ['text-summary', 'html', 'json'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', 'tests/**', '__mocks__/**'],
    },
  },
});
