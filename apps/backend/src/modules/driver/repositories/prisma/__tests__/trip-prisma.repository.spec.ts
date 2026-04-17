import { TripPrismaRepository } from '../trip-prisma.repository';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { resetTestDatabase } from '../../../../../test-utils/prisma-test.utils';

describe('TripPrismaRepository', () => {
  const TEST_DB_URL =
    'postgresql://carsharing:carsharing@localhost:5432/carsharing_test?schema=public';
  let repository: TripPrismaRepository;
  let prisma: PrismaService;
  let userId: number;
  let carId: number;

  beforeAll(async () => {
    prisma = new PrismaService({
      getOrThrow: () => TEST_DB_URL,
    } as never);
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
    repository = new TripPrismaRepository(prisma as never);
    const role = await prisma.role.create({ data: { name: 'driver' } });
    const user = await prisma.user.create({
      data: {
        name: 'Driver',
        phone: '100000000',
        email: 'driver@test.local',
        passwordHash: 'hash',
        roleId: role.id,
        isActive: true,
        isDeleted: false,
      },
    });
    await prisma.user.create({
      data: {
        name: 'Driver 2',
        phone: '100000001',
        email: 'driver2@test.local',
        passwordHash: 'hash',
        roleId: role.id,
        isActive: true,
        isDeleted: false,
      },
    });
    const status = await prisma.carStatus.create({ data: { name: 'ACTIVE' } });
    const car = await prisma.car.create({
      data: {
        mileage: 0,
        fuelLevel: 100,
        isAvailable: true,
        carStatusId: status.id,
        isDeleted: false,
        sessionInfo: {
          create: {
            brand: 'Test',
            model: 'Car',
            licensePlate: 'AA0000AA',
            color: 'black',
            currentLat: 50.45,
            currentLon: 30.52,
          },
        },
      },
    });
    userId = user.id;
    carId = car.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates a trip', async () => {
    // arrange
    const input = {
      driverId: userId,
      vehicleId: carId,
      status: 'ACTIVE' as const,
      startTime: new Date('2026-04-17T10:00:00Z'),
      startLocation: { lat: 50.45, lon: 30.52 },
    };

    // act
    const created = await repository.create(input);

    // assert
    expect(created.id).toBeGreaterThan(0);
    expect(created.driverId).toBe(userId);
    expect(created.endTime).toBeNull();
  });

  it('findById returns trip', async () => {
    // arrange
    const created = await repository.create({
      driverId: userId,
      vehicleId: carId,
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
      driverId: userId,
      vehicleId: carId,
      status: 'ACTIVE',
      startTime: new Date('2026-04-17T10:00:00Z'),
      startLocation: { lat: 50.45, lon: 30.52 },
    });
    await repository.create({
      driverId: userId + 1,
      vehicleId: carId,
      status: 'ACTIVE',
      startTime: new Date('2026-04-17T10:05:00Z'),
      startLocation: { lat: 50.45, lon: 30.52 },
    });

    // act
    const found = await repository.findByDriverId(userId);

    // assert
    expect(found).toHaveLength(1);
    expect(found[0].driverId).toBe(userId);
  });
});
