import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['lib/domain/**/__tests__/**/*.test.ts'],
    globals: false,
  },
});
