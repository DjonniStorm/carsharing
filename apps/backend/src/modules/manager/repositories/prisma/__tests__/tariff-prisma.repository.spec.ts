import { TariffPrismaRepository } from '../tariff-prisma.repository';

describe('TariffPrismaRepository', () => {
  let repository: TariffPrismaRepository;

  beforeEach(() => {
    repository = new TariffPrismaRepository();
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
    const created = await repository.create({ name: 'City', pricePerMinute: 1.8 });

    // act
    const found = await repository.findById(created.id);

    // assert
    expect(found?.id).toBe(created.id);
  });

  it('findAll excludes soft-deleted records and restore returns it back', async () => {
    // arrange
    const created = await repository.create({ name: 'Night', pricePerMinute: 1.2 });

    // act + assert
    await repository.softDelete(created.id);
    expect((await repository.findAll()).length).toBe(0);

    // act + assert
    await repository.restore(created.id);
    expect((await repository.findAll()).length).toBe(1);
  });
});
