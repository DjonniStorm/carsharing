import { truncateApplicationTables } from '../shared/testing/database-clear';

type PrismaLike = {
  $executeRawUnsafe: (query: string) => Promise<unknown>;
};

/** @deprecated Используйте {@link truncateApplicationTables} из `src/shared/testing`. */
export async function resetTestDatabase(prisma: PrismaLike): Promise<void> {
  await truncateApplicationTables(prisma);
}
