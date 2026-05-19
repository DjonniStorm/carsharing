import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { TestingModule } from '@nestjs/testing';

import { CarStatus } from 'src/modules/car/entities/car-status';
import { ViolationJobName } from 'src/modules/violation/background/violation-jobs';

import { TripCreate } from '../entities/dtos/trip.create';
import { TripUpdate } from '../entities/dtos/trip.update';
import { TripStatus } from '../entities/trip.status';
import {
  setupConcurrentTripFixture,
  teardownConcurrentTripFixture,
  type ConcurrentTripFixture,
} from './trip.concurrent.fixture';

/**
 * Конкурентный финиш одной поездки.
 * Финальное значение mileage само по себе не доказывает идемпотентность:
 * обе ветки могут прочитать один и тот же car.mileage и записать одно и то же суммарное значение.
 */
describe('Trip concurrent finish (integration)', () => {
  let moduleRef: TestingModule;
  let fx: ConcurrentTripFixture;

  const distanceMeters = 5_000;
  const expectedKmDelta = distanceMeters / 1000;

  beforeAll(async () => {
    const setup = await setupConcurrentTripFixture();
    moduleRef = setup.moduleRef;
    fx = setup.fixture;
  });

  beforeEach(async () => {
    fx.jobQueue.clearEnqueued();
    await fx.prisma.trip.deleteMany({ where: { carId: fx.carId } });
    await fx.prisma.car.update({
      where: { id: fx.carId },
      data: {
        mileage: fx.initialCarMileage,
        isAvailable: false,
        carStatus: CarStatus.IN_USE,
        updatedAt: new Date().toISOString(),
      },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fx.prisma.trip.deleteMany({ where: { carId: fx.carId } });
  });

  afterAll(async () => {
    await teardownConcurrentTripFixture(fx.prisma, moduleRef);
  });

  async function seedActiveTrip(): Promise<string> {
    const dto = new TripCreate();
    dto.userId = fx.userId;
    dto.carId = fx.carId;
    dto.geoZoneVersionId = fx.geoZoneVersionId;
    dto.status = TripStatus.ACTIVE;
    const created = await fx.tripService.create(dto);
    await fx.prisma.trip.update({
      where: { id: created.id },
      data: { distanceMeters },
    });
    return created.id;
  }

  function buildFinishPatch(): TripUpdate {
    const patch = new TripUpdate();
    patch.status = TripStatus.FINISHED;
    patch.finishedAt = new Date();
    patch.finishLat = 55.75;
    patch.finishLng = 37.61;
    return patch;
  }

  function countParkingJobs(): number {
    return fx.jobQueue
      .snapshotEnqueued()
      .filter((job) => job.name === ViolationJobName.ParkingZoneCheck).length;
  }

  it('параллельный finish: onTripFinished вызывается ровно один раз', async () => {
    const tripId = await seedActiveTrip();
    const patch = buildFinishPatch();
    const onTripFinishedSpy = vi.spyOn(fx.carTripSync, 'onTripFinished');

    await Promise.allSettled([
      fx.tripService.update(tripId, patch),
      fx.tripService.update(tripId, patch),
    ]);

    expect(onTripFinishedSpy).toHaveBeenCalledTimes(1);
    expect(onTripFinishedSpy).toHaveBeenCalledWith(tripId);
  });

  it('параллельный finish: ParkingZoneCheck ставится в очередь ровно один раз', async () => {
    const tripId = await seedActiveTrip();
    const patch = buildFinishPatch();

    await Promise.allSettled([
      fx.tripService.update(tripId, patch),
      fx.tripService.update(tripId, patch),
    ]);

    expect(countParkingJobs()).toBe(1);
  });

  it('параллельный finish: mileage совпадает с однократным kmDelta (необходимо, но недостаточно)', async () => {
    const tripId = await seedActiveTrip();
    const patch = buildFinishPatch();

    await Promise.allSettled([
      fx.tripService.update(tripId, patch),
      fx.tripService.update(tripId, patch),
    ]);

    const car = await fx.prisma.car.findUnique({ where: { id: fx.carId } });
    expect(car).not.toBeNull();
    expect(car!.mileage).toBeCloseTo(fx.initialCarMileage + expectedKmDelta, 5);
  });
});
