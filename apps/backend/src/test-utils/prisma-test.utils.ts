type PrismaLike = {
  $executeRawUnsafe: (query: string) => Promise<unknown>;
};

export async function resetTestDatabase(prisma: PrismaLike): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      violation_notification,
      notification,
      violation,
      telemetry,
      trip,
      tariff,
      geo_zone,
      car_session_info,
      car,
      car_status,
      "user",
      role
    RESTART IDENTITY CASCADE;
  `);
}
