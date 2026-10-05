import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    // Keep jsdom forks below the machine's logical-core count to avoid import-time contention.
    maxWorkers: 8,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
