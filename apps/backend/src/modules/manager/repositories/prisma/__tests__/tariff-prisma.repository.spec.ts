import { TariffPrismaRepository } from '../tariff-prisma.repository';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { resetTestDatabase } from '../../../../../test-utils/prisma-test.utils';

describe('TariffPrismaRepository', () => {
  const TEST_DB_URL =
    'postgresql://carsharing:carsharing@localhost:5432/carsharing_test?schema=public';
  let repository: TariffPrismaRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService({
      getOrThrow: () => TEST_DB_URL,
    } as never);
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
    repository = new TariffPrismaRepository(prisma as never);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates tariff', async () => {
    // arrange
    const input = { name: 'Standard', pricePerMinute: 2.5 };

    // act
    const created = await repository.create(input);

    // assert
    expect(created.id).toBeGreaterThan(0);
    expect(created.deletedAt).toBeNull();
  });

  it('findById returns correct entity', async () => {
    // arrange
    const created = await repository.create({
      name: 'City',
      pricePerMinute: 1.8,
    });

    // act
    const found = await repository.findById(created.id);

    // assert
    expect(found?.id).toBe(created.id);
  });

  it('findAll excludes soft-deleted records and restore returns it back', async () => {
    // arrange
    const created = await repository.create({
      name: 'Night',
      pricePerMinute: 1.2,
    });

    // act + assert
    await repository.softDelete(created.id);
    expect((await repository.findAll()).length).toBe(0);

    // act + assert
    await repository.restore(created.id);
    expect((await repository.findAll()).length).toBe(1);
  });
});
