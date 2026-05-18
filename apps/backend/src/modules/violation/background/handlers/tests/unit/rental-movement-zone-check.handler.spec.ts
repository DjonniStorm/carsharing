import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ViolationConfig } from '../../../../common/violation.config';
import { ViolationStatus } from '../../../../entities/violation.status';
import { ViolationJobName } from '../../../violation-jobs';
import { executeRentalMovementZoneCheck } from '../../rental-movement-zone-check.handler';

describe(`executeRentalMovementZoneCheck (${ViolationJobName.RentalMovementZoneCheck})`, () => {
  const tripId = '11111111-1111-1111-1111-111111111111';
  const geoZoneVersionId = '22222222-2222-2222-2222-222222222222';

  const baseCfg: ViolationConfig = {
    speedLimitKmh: 90,
    lowFuelThreshold: 15,
    dedupWindowMs: 60_000,
  };

  let createViolation: ReturnType<typeof vi.fn>;
  let isPointInsideVersion: ReturnType<typeof vi.fn>;
  let findTripGeoZoneVersion: ReturnType<typeof vi.fn>;
  let dedupeAllow: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createViolation = vi.fn().mockResolvedValue(undefined);
    isPointInsideVersion = vi.fn().mockResolvedValue(false);
    findTripGeoZoneVersion = vi.fn().mockResolvedValue({ geoZoneVersionId });
    dedupeAllow = vi.fn().mockReturnValue(true);
  });

  function deps() {
    return {
      config: baseCfg,
      dedupeAllow,
      geozoneRepository: { isPointInsideVersion },
      findTripGeoZoneVersion,
      createViolation,
    };
  }

  it('создаёт SPEEDING, если скорость выше лимита и дедуп разрешил ключ speeding', async () => {
    await executeRentalMovementZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T12:00:00.000Z',
        lat: 55.75,
        lon: 37.61,
        speed: 100,
        fuelLevel: 50,
      },
      deps(),
    );

    expect(dedupeAllow).toHaveBeenCalledWith(`speeding:${tripId}`);
    expect(createViolation).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId,
        type: ViolationStatus.SPEEDING,
      }),
    );
  });

  it('не создаёт SPEEDING при скорости не выше лимита', async () => {
    isPointInsideVersion.mockResolvedValue(true);

    await executeRentalMovementZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T12:00:00.000Z',
        lat: 55.75,
        lon: 37.61,
        speed: 60,
        fuelLevel: 50,
      },
      deps(),
    );

    expect(createViolation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: ViolationStatus.SPEEDING }),
    );
  });

  it('создаёт LOW_FUEL, если уровень топлива ниже порога и дедуп разрешил low_fuel', async () => {
    await executeRentalMovementZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T12:00:00.000Z',
        lat: 55.75,
        lon: 37.61,
        speed: 40,
        fuelLevel: 10,
      },
      deps(),
    );

    expect(dedupeAllow).toHaveBeenCalledWith(`low_fuel:${tripId}`);
    expect(createViolation).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId,
        type: ViolationStatus.LOW_FUEL,
      }),
    );
  });

  it('не вызывает геозону, если дедуп запретил out_of_geozone', async () => {
    dedupeAllow.mockImplementation((scope: string) => {
      if (scope === `out_of_geozone:${tripId}`) {
        return false;
      }
      return true;
    });

    await executeRentalMovementZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T12:00:00.000Z',
        lat: 55.75,
        lon: 37.61,
        speed: 40,
        fuelLevel: 50,
      },
      deps(),
    );

    expect(isPointInsideVersion).not.toHaveBeenCalled();
    expect(createViolation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: ViolationStatus.OUT_OF_GEOZONE }),
    );
  });

  it('не создаёт OUT_OF_GEOZONE, если точка внутри версии геозоны поездки', async () => {
    isPointInsideVersion.mockResolvedValue(true);

    await executeRentalMovementZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T12:00:00.000Z',
        lat: 55.75,
        lon: 37.61,
        speed: 40,
        fuelLevel: 50,
      },
      deps(),
    );

    expect(findTripGeoZoneVersion).toHaveBeenCalledWith(tripId);
    expect(isPointInsideVersion).toHaveBeenCalledWith(
      geoZoneVersionId,
      37.61,
      55.75,
    );
    expect(createViolation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: ViolationStatus.OUT_OF_GEOZONE }),
    );
  });

  it('создаёт OUT_OF_GEOZONE, если точка вне версии геозоны поездки', async () => {
    await executeRentalMovementZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T12:00:00.000Z',
        lat: 55.75,
        lon: 37.61,
        speed: 40,
        fuelLevel: 50,
      },
      deps(),
    );

    expect(createViolation).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId,
        type: ViolationStatus.OUT_OF_GEOZONE,
      }),
    );
  });

  it('не создаёт OUT_OF_GEOZONE, если поездка не найдена', async () => {
    findTripGeoZoneVersion.mockResolvedValue(null);

    await executeRentalMovementZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T12:00:00.000Z',
        lat: 55.75,
        lon: 37.61,
        speed: 40,
        fuelLevel: 50,
      },
      deps(),
    );

    expect(isPointInsideVersion).not.toHaveBeenCalled();
    expect(createViolation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: ViolationStatus.OUT_OF_GEOZONE }),
    );
  });

  it('не создаёт SPEEDING, если дедуп отклонил ключ speeding (повторная точка)', async () => {
    dedupeAllow.mockImplementation((scope: string) => {
      if (scope === `speeding:${tripId}`) {
        return false;
      }
      if (scope === `out_of_geozone:${tripId}`) {
        return false;
      }
      return true;
    });

    await executeRentalMovementZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T12:00:00.000Z',
        lat: 55.75,
        lon: 37.61,
        speed: 120,
        fuelLevel: 50,
      },
      deps(),
    );

    expect(createViolation).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: ViolationStatus.SPEEDING }),
    );
    expect(isPointInsideVersion).not.toHaveBeenCalled();
  });
});
