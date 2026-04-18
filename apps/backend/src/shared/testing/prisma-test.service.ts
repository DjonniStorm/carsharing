import type { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * `DATABASE_URL` после {@link loadTestEnvironment} / {@link loadBackendDevEnv}.
 */
export function getTestDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Проверьте `.env.test` и/или `.env` в корне apps/backend (см. .env.example).',
    );
  }
  return url;
}

type StubConfig = Pick<ConfigService, 'getOrThrow'>;

function stubConfigForDatabaseUrl(databaseUrl: string): StubConfig {
  return {
    getOrThrow: <T = string>(key: string): T => {
      if (key === 'DATABASE_URL') {
        return databaseUrl as T;
      }
      throw new Error(
        `createTestPrismaService: ConfigService.getOrThrow("${key}") не заглушён.`,
      );
    },
  };
}

/**
 * Тот же {@link PrismaService}, что в приложении (`PrismaPg`), без Nest DI.
 */
export function createTestPrismaService(
  databaseUrl: string = getTestDatabaseUrl(),
): PrismaService {
  return new PrismaService(
    stubConfigForDatabaseUrl(databaseUrl) as ConfigService,
  );
}
