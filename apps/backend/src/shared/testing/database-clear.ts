/**
 * Имена таблиц в БД (`@@map` в Prisma). Только они допускаются в raw SQL.
 */
export const APPLICATION_TABLES = [
  'violation_notification',
  'notification',
  'violation',
  'telemetry',
  'trip',
  'tariff',
  'geo_zone_version',
  'geo_zone',
  'car_session_info',
  'car',
  'car_session',
  'car_status',
  'user',
] as const;

export type ApplicationTable = (typeof APPLICATION_TABLES)[number];

type PrismaExecutor = {
  $executeRawUnsafe: (query: string) => Promise<unknown>;
};

/** Кавычки только для зарезервированных / mixed имён. */
function quoteTable(table: ApplicationTable): string {
  return table === 'user' ? '"user"' : table;
}

/**
 * Полная очистка данных по всем прикладным таблицам (TRUNCATE … CASCADE, сброс sequences).
 * Обязательно `await` — иначе при следующем `$disconnect()` запрос может не выполниться.
 */
export async function truncateApplicationTables(
  prisma: PrismaExecutor,
): Promise<void> {
  const list = APPLICATION_TABLES.map((t) => quoteTable(t)).join(',\n      ');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      ${list}
    RESTART IDENTITY CASCADE;
  `);
}

export type TruncateOneTableOptions = {
  /**
   * `true` (по умолчанию): CASCADE — заодно очищаются строки в таблицах с FK на эту.
   * `false`: RESTRICT — упадёт, если есть зависимые строки.
   */
  cascade?: boolean;
};

/**
 * Очистка одной таблицы (TRUNCATE).
 * Для `"user"` по умолчанию CASCADE также затронет `trip`, `notification` и т.д.
 * Обязательно `await`.
 */
export async function truncateApplicationTable(
  prisma: PrismaExecutor,
  table: ApplicationTable | string,
  options?: TruncateOneTableOptions,
): Promise<void> {
  if (!(APPLICATION_TABLES as readonly string[]).includes(table)) {
    throw new Error(
      `Неизвестная таблица "${table}". Допустимо: ${APPLICATION_TABLES.join(', ')}`,
    );
  }
  const cascade = options?.cascade !== false;
  const sql = `TRUNCATE TABLE ${quoteTable(table as ApplicationTable)} RESTART IDENTITY ${cascade ? 'CASCADE' : 'RESTRICT'};`;
  await prisma.$executeRawUnsafe(sql);
}
