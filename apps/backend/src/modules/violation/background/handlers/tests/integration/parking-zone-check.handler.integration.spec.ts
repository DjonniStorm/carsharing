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
import { GeozoneType } from '../../../../../geozone/entities/geozone.type';
import { GeozoneRepository } from '../../../../../geozone/repositories/geozone.repository';
import { ViolationCreate } from '../../../../entities/dtos/violation.create';
import { ViolationStatus } from '../../../../entities/violation.status';
import { ViolationRepository } from '../../../../repositories/violation.repository';
import { getViolationConfig } from '../../../../common/violation.config';
import { executeParkingZoneCheck } from '../../parking-zone-check.handler';
import {
  sampleParkingMoscowRing,
  seedTripWithRentalTariff,
} from '../fixtures/violation-job-handlers.integration.seed';

describe('executeParkingZoneCheck (integration, без моков)', () => {
  let prisma: PrismaService;
  let geozoneRepository: GeozoneRepository;
  let violationRepository: ViolationRepository;

  let tripId: string;
  let userId: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    vi.stubEnv('VIOLATION_DEDUP_WINDOW_SEC', '3600');

    await truncateApplicationTable(prisma, 'violation_notification');
    await truncateApplicationTable(prisma, 'notification');
    await truncateApplicationTable(prisma, 'violation');
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff_preset');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');

    const seeded = await seedTripWithRentalTariff(prisma);
    tripId = seeded.tripId;
    userId = seeded.userId;

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
    await truncateApplicationTable(prisma, 'tariff_preset');
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

  async function runParking(input: { lat: number; lon: number }) {
    const cfg = getViolationConfig();
    const throttle = new Throttle();
    await executeParkingZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T18:00:00.000Z',
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

  it('создаёт WRONG_PARKING, если нет PARKING-зоны, покрывающей точку финиша', async () => {
    await runParking({ lat: 55.75, lon: 37.61 });

    const rows = await prisma.violation.findMany({ where: { tripId } });
    expect(rows.some((r) => r.type === ViolationStatus.WRONG_PARKING)).toBe(
      true,
    );
  });

  it('не создаёт WRONG_PARKING, если точка внутри PARKING-полигона', async () => {
    await geozoneRepository.createWithInitialVersion({
      name: 'Integration PARKING zone',
      type: GeozoneType.PARKING,
      color: '#00aa00',
      createdByUserId: userId,
      geometry: sampleParkingMoscowRing(),
      rules: null,
      pricePerMinute: 0,
      pricePerKm: 0,
      pausePricePerMinute: 0,
    });

    await runParking({ lat: 55.75, lon: 37.61 });

    const rows = await prisma.violation.findMany({ where: { tripId } });
    expect(rows.some((r) => r.type === ViolationStatus.WRONG_PARKING)).toBe(
      false,
    );
  });
});
