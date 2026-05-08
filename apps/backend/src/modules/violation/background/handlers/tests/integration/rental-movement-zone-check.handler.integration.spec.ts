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

import { PrismaService } from 'src/prisma/prisma.service';
import { Throttle } from 'src/shared/throttle/throttle';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { GeozoneRepository } from '../../../../../geozone/repositories/geozone.repository';
import { ViolationCreate } from '../../../../entities/dtos/violation.create';
import { ViolationStatus } from '../../../../entities/violation.status';
import { ViolationRepository } from '../../../../repositories/violation.repository';
import { getViolationConfig } from '../../../../common/violation.config';
import { executeRentalMovementZoneCheck } from '../../rental-movement-zone-check.handler';
import { seedTripWithRentalTariff } from '../fixtures/violation-job-handlers.integration.seed';

/**
 * Интеграция без моков на домене: PostGIS + реальный `ViolationRepository.create`,
 * реальный `Throttle` (как во воркере). WS здесь не затрагиваем — только правила и БД.
 */
describe('executeRentalMovementZoneCheck (integration, без моков)', () => {
  let prisma: PrismaService;
  let geozoneRepository: GeozoneRepository;
  let violationRepository: ViolationRepository;

  let tripId: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    vi.stubEnv('VIOLATION_SPEED_LIMIT_KMH', '90');
    vi.stubEnv('VIOLATION_LOW_FUEL_THRESHOLD', '15');
    vi.stubEnv('VIOLATION_DEDUP_WINDOW_SEC', '3600');

    await truncateApplicationTable(prisma, 'violation_notification');
    await truncateApplicationTable(prisma, 'notification');
    await truncateApplicationTable(prisma, 'violation');
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');

    const seeded = await seedTripWithRentalTariff(prisma);
    tripId = seeded.tripId;

    geozoneRepository = new GeozoneRepository(prisma);
    violationRepository = new ViolationRepository(prisma);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await truncateApplicationTable(prisma, 'violation_notification');
    await truncateApplicationTable(prisma, 'notification');
    await truncateApplicationTable(prisma, 'violation');
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function persistViolation(input: {
    tripId: string;
    type: ViolationStatus;
    description: string;
  }) {
    const dto = new ViolationCreate();
    dto.tripId = input.tripId;
    dto.type = input.type;
    dto.description = input.description;
    return violationRepository.create(dto);
  }

  async function runJob(input: {
    lat: number;
    lon: number;
    speed: number;
    fuelLevel: number;
  }) {
    const cfg = getViolationConfig();
    const throttle = new Throttle();
    await executeRentalMovementZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T12:00:00.000Z',
        ...input,
      },
      {
        config: cfg,
        dedupeAllow: (scope) => throttle.allow(scope, cfg.dedupWindowMs),
        geozoneRepository,
        createViolation: persistViolation,
      },
    );
  }

  async function countByType(type: ViolationStatus): Promise<number> {
    return prisma.violation.count({
      where: { tripId, type },
    });
  }

  it('пишет SPEEDING в БД при скорости выше лимита (точка внутри RENTAL, без выезда)', async () => {
    await runJob({
      lat: 55.75,
      lon: 35.08,
      speed: 120,
      fuelLevel: 50,
    });

    expect(await countByType(ViolationStatus.SPEEDING)).toBe(1);
  });

  it('пишет LOW_FUEL при низком топливе', async () => {
    await runJob({
      lat: 55.75,
      lon: 35.08,
      speed: 40,
      fuelLevel: 5,
    });

    expect(await countByType(ViolationStatus.LOW_FUEL)).toBe(1);
  });

  it('пишет OUT_OF_GEOZONE, если точка вне RENTAL-полигона (Москва vs полигон у lon≈35)', async () => {
    await runJob({
      lat: 55.75,
      lon: 37.61,
      speed: 40,
      fuelLevel: 50,
    });

    expect(await countByType(ViolationStatus.OUT_OF_GEOZONE)).toBe(1);
  });

  it('не создаёт OUT_OF_GEOZONE для точки внутри RENTAL', async () => {
    await runJob({
      lat: 55.75,
      lon: 35.08,
      speed: 40,
      fuelLevel: 50,
    });

    expect(await countByType(ViolationStatus.OUT_OF_GEOZONE)).toBe(0);
  });

  it('два вызова подряд с превышением скорости дают одно SPEEDING (тот же Throttle)', async () => {
    const cfg = getViolationConfig();
    const throttle = new Throttle();

    const payload = {
      tripId,
      recordedAt: '2026-05-09T12:00:00.000Z',
      lat: 55.75,
      lon: 35.08,
      speed: 120,
      fuelLevel: 50,
    };

    await executeRentalMovementZoneCheck(payload, {
      config: cfg,
      dedupeAllow: (scope) => throttle.allow(scope, cfg.dedupWindowMs),
      geozoneRepository,
      createViolation: persistViolation,
    });
    await executeRentalMovementZoneCheck(payload, {
      config: cfg,
      dedupeAllow: (scope) => throttle.allow(scope, cfg.dedupWindowMs),
      geozoneRepository,
      createViolation: persistViolation,
    });

    expect(await countByType(ViolationStatus.SPEEDING)).toBe(1);
  });
});
