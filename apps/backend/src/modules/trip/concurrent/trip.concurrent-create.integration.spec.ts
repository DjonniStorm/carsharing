import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { TestingModule } from '@nestjs/testing';

import { CarStatus } from 'src/modules/car/entities/car-status';

import { TripCarAlreadyInUseException } from '../common/errors';
import { TripCreate } from '../entities/dtos/trip.create';
import { TripStatus } from '../entities/trip.status';
import {
  countOngoingTripsForCar,
  setupConcurrentTripFixture,
  teardownConcurrentTripFixture,
  type ConcurrentTripFixture,
} from './trip.concurrent.fixture';

/**
 * Конкурентный старт поездки на одну машину.
 * Целевой инвариант (после фикса P0): ровно один успех и один ongoing trip.
 * Сейчас тесты могут падать — это фиксирует реальное поведение до правок.
 */
describe('Trip concurrent create (integration)', () => {
  let moduleRef: TestingModule;
  let fx: ConcurrentTripFixture;

  beforeAll(async () => {
    const setup = await setupConcurrentTripFixture();
    moduleRef = setup.moduleRef;
    fx = setup.fixture;
  });

  beforeEach(async () => {
    await fx.prisma.trip.deleteMany({ where: { carId: fx.carId } });
    await fx.prisma.car.update({
      where: { id: fx.carId },
      data: {
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        updatedAt: new Date().toISOString(),
      },
    });
  });

  afterEach(async () => {
    await fx.prisma.trip.deleteMany({ where: { carId: fx.carId } });
  });

  afterAll(async () => {
    await teardownConcurrentTripFixture(fx.prisma, moduleRef);
  });

  function buildCreateDto(): TripCreate {
    const dto = new TripCreate();
    dto.userId = fx.userId;
    dto.carId = fx.carId;
    dto.geoZoneVersionId = fx.geoZoneVersionId;
    dto.status = TripStatus.ACTIVE;
    return dto;
  }

  it('параллельный create: один успех, второй H11 (409-эквивалент)', async () => {
    const dto = buildCreateDto();

    const [first, second] = await Promise.allSettled([
      fx.tripService.create(dto),
      fx.tripService.create(dto),
    ]);

    const fulfilled = [first, second].filter((r) => r.status === 'fulfilled');
    const rejected = [first, second].filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.status).toBe('rejected');
    if (rejected[0]?.status === 'rejected') {
      expect(rejected[0].reason).toBeInstanceOf(TripCarAlreadyInUseException);
    }

    const ongoing = await countOngoingTripsForCar(fx.prisma, fx.carId);
    expect(ongoing).toBe(1);
  });

  it('параллельный create: в БД не больше одной ongoing поездки на car', async () => {
    const dto = buildCreateDto();

    await Promise.allSettled([
      fx.tripService.create(dto),
      fx.tripService.create(dto),
    ]);

    const ongoing = await countOngoingTripsForCar(fx.prisma, fx.carId);
    expect(ongoing).toBeLessThanOrEqual(1);
  });
});
