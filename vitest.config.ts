import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/packages/**',   // VS Code extension uses Mocha, not Vitest
    ],
  },
});
