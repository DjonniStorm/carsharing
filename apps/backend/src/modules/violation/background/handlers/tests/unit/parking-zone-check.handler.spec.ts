import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ViolationConfig } from '../../../../common/violation.config';
import { ViolationStatus } from '../../../../entities/violation.status';
import { ViolationJobName } from '../../../violation-jobs';
import { executeParkingZoneCheck } from '../../parking-zone-check.handler';

describe(`executeParkingZoneCheck (${ViolationJobName.ParkingZoneCheck})`, () => {
  const tripId = '22222222-2222-2222-2222-222222222222';

  const baseCfg: ViolationConfig = {
    speedLimitKmh: 90,
    lowFuelThreshold: 15,
    dedupWindowMs: 60_000,
  };

  let createViolation: ReturnType<typeof vi.fn>;
  let findIdsContainingPoint: ReturnType<typeof vi.fn>;
  let dedupeAllow: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createViolation = vi.fn().mockResolvedValue(undefined);
    findIdsContainingPoint = vi.fn().mockResolvedValue([]);
    dedupeAllow = vi.fn().mockReturnValue(true);
  });

  function deps() {
    return {
      config: baseCfg,
      dedupeAllow,
      geozoneRepository: { findIdsContainingPoint },
      createViolation,
    };
  }

  it('ничего не создаёт, если дедуп отклонил wrong_parking', async () => {
    dedupeAllow.mockReturnValue(false);

    await executeParkingZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T14:00:00.000Z',
        lat: 55.75,
        lon: 37.61,
      },
      deps(),
    );

    expect(dedupeAllow).toHaveBeenCalledWith(`wrong_parking:${tripId}`);
    expect(findIdsContainingPoint).not.toHaveBeenCalled();
    expect(createViolation).not.toHaveBeenCalled();
  });

  it('не создаёт нарушение, если точка внутри PARKING-зоны', async () => {
    findIdsContainingPoint.mockResolvedValue(['parking-zone-a']);

    await executeParkingZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T14:00:00.000Z',
        lat: 55.76,
        lon: 37.62,
      },
      deps(),
    );

    expect(findIdsContainingPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        lat: 55.76,
        lon: 37.62,
        types: expect.any(Array),
      }),
    );
    expect(createViolation).not.toHaveBeenCalled();
  });

  it('создаёт WRONG_PARKING, если дедуп разрешил и нет PARKING-зоны с точкой', async () => {
    await executeParkingZoneCheck(
      {
        tripId,
        recordedAt: '2026-05-09T14:00:00.000Z',
        lat: 55.77,
        lon: 37.63,
      },
      deps(),
    );

    expect(createViolation).toHaveBeenCalledTimes(1);
    expect(createViolation).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId,
        type: ViolationStatus.WRONG_PARKING,
        description: expect.stringContaining('вне PARKING-зоны'),
      }),
    );
  });
});
