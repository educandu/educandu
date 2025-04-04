import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    loader: 'jsx',
    include: ['src/**/*.js'],
    exclude: []
  },
  test: {
    include: ['src/**/*.spec.js', 'migrations/**/*.spec.js'],
    exclude: ['migrations/archived/**/*.spec.js'],
    setupFiles: ['src/test-setup.js'],
    hookTimeout: 25000,
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: [
        'src/api-clients/**',
        'src/components/**',
        'src/plugins/**',
        'src/stores/collection-specs/**',
        'src/test-helper.js',
        'src/test-setup.js'
      ]
    }
  }
});
