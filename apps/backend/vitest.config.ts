import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** Каталог `apps/backend`, где лежит этот файл (не полагаться на `__dirname` при загрузке конфига). */
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      src: path.resolve(rootDir, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    root: rootDir,
    setupFiles: [path.join(rootDir, 'vitest.setup.ts')],
    include: ['src/**/*.spec.ts'],
    fileParallelism: false,
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reportsDirectory: path.join(rootDir, 'coverage'),
      include: ['src/**/*.{ts,js}'],
    },
  },
});
