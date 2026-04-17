import { ViolationPrismaRepository } from '../violation-prisma.repository';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { resetTestDatabase } from '../../../../../test-utils/prisma-test.utils';

describe('ViolationPrismaRepository', () => {
  const TEST_DB_URL =
    'postgresql://carsharing:carsharing@localhost:5432/carsharing_test?schema=public';
  let repository: ViolationPrismaRepository;
  let prisma: PrismaService;
  let tripId: number;

  beforeAll(async () => {
    prisma = new PrismaService({
      getOrThrow: () => TEST_DB_URL,
    } as never);
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
    repository = new ViolationPrismaRepository(prisma as never);
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
    const status = await prisma.carStatus.create({ data: { name: 'ACTIVE' } });
    const [zone] = await prisma.$queryRaw<Array<{ id: number }>>`
      INSERT INTO geo_zone (name, type, polygon)
      VALUES ('Zone', 'ALLOWED', ST_GeomFromText('POLYGON((0 0, 1 0, 1 1, 0 0))', 4326))
      RETURNING id
    `;
    const tariff = await prisma.tariff.create({
      data: {
        name: 'Base',
        pricePerMinute: 1,
        pricePerKm: 1,
        geoZoneId: zone.id,
        isDeleted: false,
      },
    });
    const car = await prisma.car.create({
      data: {
        mileage: 0,
        fuelLevel: 100,
        isAvailable: true,
        carStatusId: status.id,
        isDeleted: false,
      },
    });
    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        carId: car.id,
        tariffId: tariff.id,
        startTime: new Date(),
        status: 'ACTIVE',
        distance: 0,
        duration: 0,
      },
    });
    tripId = trip.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates violation', async () => {
    // arrange
    const input = { tripId, type: 'OTHER' as const };

    // act
    const created = await repository.create(input);

    // assert
    expect(created.id).toBeGreaterThan(0);
    expect(created.tripId).toBe(tripId);
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it('findAll returns violations', async () => {
    // arrange
    await repository.create({ tripId, type: 'SPEEDING' });
    await repository.create({ tripId, type: 'OUT_OF_ZONE' });

    // act
    const all = await repository.findAll();

    // assert
    expect(all).toHaveLength(2);
  });
});
