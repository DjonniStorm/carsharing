import { TripPrismaRepository } from '../trip-prisma.repository';

describe('TripPrismaRepository', () => {
  let repository: TripPrismaRepository;

  beforeEach(() => {
    repository = new TripPrismaRepository();
  });

  it('creates a trip', async () => {
    // arrange
    const input = {
      driverId: 10,
      vehicleId: 20,
      status: 'ACTIVE' as const,
      startTime: new Date('2026-04-17T10:00:00Z'),
      startLocation: { lat: 50.45, lon: 30.52 },
    };

    // act
    const created = await repository.create(input);

    // assert
    expect(created.id).toBeGreaterThan(0);
    expect(created.driverId).toBe(10);
    expect(created.endTime).toBeNull();
  });

  it('findById returns trip', async () => {
    // arrange
    const created = await repository.create({
      driverId: 11,
      vehicleId: 21,
      status: 'ACTIVE',
      startTime: new Date('2026-04-17T10:00:00Z'),
      startLocation: { lat: 50.45, lon: 30.52 },
    });

    // act
    const found = await repository.findById(created.id);

    // assert
    expect(found?.id).toBe(created.id);
  });

  it('findByDriverId returns only driver trips', async () => {
    // arrange
    await repository.create({
      driverId: 99,
      vehicleId: 1,
      status: 'ACTIVE',
      startTime: new Date('2026-04-17T10:00:00Z'),
      startLocation: { lat: 50.45, lon: 30.52 },
    });
    await repository.create({
      driverId: 100,
      vehicleId: 2,
      status: 'ACTIVE',
      startTime: new Date('2026-04-17T10:05:00Z'),
      startLocation: { lat: 50.45, lon: 30.52 },
    });

    // act
    const found = await repository.findByDriverId(99);

    // assert
    expect(found).toHaveLength(1);
    expect(found[0].driverId).toBe(99);
  });
});
