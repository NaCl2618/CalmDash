import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    exclude: ['tests/**/*.spec.js', 'node_modules/**'],
    environment: 'happy-dom',
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.config.js',
        '**/main.js' // UI initialization logic, tested via E2E
      ]
    },
    setupFiles: ['./tests/setup.js']
  }
});
