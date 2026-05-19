import { describe, expect, it, vi } from 'vitest';

import type { ITripPricingJobQueue } from 'src/shared/background/trip-pricing-job-queue.interface';

import { TripPricingBackgroundWorker } from '../../trip-pricing-background.worker';
import { TripPricingJobName } from '../../trip-pricing-jobs';
import type { ITripPricingService } from '../../trip-pricing.service.interface';

describe('TripPricingBackgroundWorker', () => {
  it('processes Recalc job from queue', async () => {
    const job = {
      name: TripPricingJobName.Recalc,
      payload: { tripId: 't1', trigger: 'status' as const },
      createdAtMs: Date.now(),
    };
    const queue: ITripPricingJobQueue = {
      enqueue: vi.fn(),
      dequeue: vi.fn().mockReturnValueOnce(job).mockReturnValue(null),
    };
    const pricingService: ITripPricingService = {
      recalcAndPersist: vi.fn().mockResolvedValue(null),
      enqueueRecalc: vi.fn(),
    };

    const worker = new TripPricingBackgroundWorker(queue, pricingService);
    await (worker as unknown as { tick(): Promise<void> }).tick();

    expect(pricingService.recalcAndPersist).toHaveBeenCalledWith('t1', {
      trigger: 'status',
      publishMetrics: true,
    });
  });
});
