import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/__tests__/**/*.test.ts',
      'src/app/api/__tests__/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/route.ts'],
      exclude: ['src/lib/__tests__/**', 'src/app/api/__tests__/**'],
      thresholds: {
        lines: 70,
        functions: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
