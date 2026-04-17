import { ViolationPrismaRepository } from '../violation-prisma.repository';

describe('ViolationPrismaRepository', () => {
  let repository: ViolationPrismaRepository;

  beforeEach(() => {
    repository = new ViolationPrismaRepository();
  });

  it('creates violation', async () => {
    // arrange
    const input = { tripId: 15, type: 'OTHER' as const };

    // act
    const created = await repository.create(input);

    // assert
    expect(created.id).toBeGreaterThan(0);
    expect(created.tripId).toBe(15);
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it('findAll returns violations', async () => {
    // arrange
    await repository.create({ tripId: 1, type: 'SPEEDING' });
    await repository.create({ tripId: 2, type: 'OUT_OF_ZONE' });

    // act
    const all = await repository.findAll();

    // assert
    expect(all).toHaveLength(2);
  });
});
