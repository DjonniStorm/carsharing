import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

let cachedRoot: string | undefined;

/**
 * Корень пакета `apps/backend`. Ожидается `process.cwd() === apps/backend`
 * при запуске `pnpm test`, `nest start` и т.д.
 */
export function getBackendPackageRoot(): string {
  if (cachedRoot) {
    return cachedRoot;
  }
  const cwd = process.cwd();
  if (
    existsSync(join(cwd, 'package.json')) &&
    existsSync(join(cwd, 'prisma', 'schema.prisma'))
  ) {
    cachedRoot = cwd;
    return cachedRoot;
  }
  throw new Error(
    'Запускайте команды из каталога apps/backend (рядом должны быть package.json и prisma/schema.prisma).',
  );
}

export type LoadTestEnvironmentOptions = {
  /**
   * Если `true` (по умолчанию): после `.env` подмешивается `.env.test` с перезаписью —
   * удобно для отдельной тестовой БД в `.env.test`.
   */
  preferEnvTest?: boolean;
};

/**
 * Загружает переменные для Vitest из `.env` и `.env.test` в корне пакета.
 * Вызывается из `vitest.setup.ts`.
 */
export function loadTestEnvironment(
  options?: LoadTestEnvironmentOptions,
): void {
  const root = getBackendPackageRoot();
  const preferEnvTest = options?.preferEnvTest !== false;
  const envPath = join(root, '.env');
  const envTestPath = join(root, '.env.test');

  if (preferEnvTest) {
    config({ path: envPath });
    config({ path: envTestPath, override: true });
  } else {
    config({ path: envTestPath });
    config({ path: envPath, override: false });
  }
}

/**
 * Перезаписать переменные из девовского `.env` (например, чтобы бить в локальную БД из интеграционного теста).
 */
export function loadBackendDevEnv(): void {
  config({
    path: join(getBackendPackageRoot(), '.env'),
    override: true,
  });
}
