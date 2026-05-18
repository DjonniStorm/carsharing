import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import {
  ITripPricingJobQueueToken,
  type ITripPricingJobQueue,
} from 'src/shared/background/trip-pricing-job-queue.interface';

import {
  TripPricingJobName,
  type TripPricingRecalcJob,
} from './trip-pricing-jobs';
import { executeTripPricingRecalc } from './handlers/trip-pricing-recalc.handler';
import {
  ITripPricingServiceToken,
  type ITripPricingService,
} from './trip-pricing.service.interface';

@Injectable()
export class TripPricingBackgroundWorker implements OnModuleInit {
  private readonly logger = new Logger(TripPricingBackgroundWorker.name);

  private timer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(ITripPricingJobQueueToken)
    private readonly queue: ITripPricingJobQueue,
    @Inject(ITripPricingServiceToken)
    private readonly pricingService: ITripPricingService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.tick(), 250);
    this.timer.unref?.();
  }

  private async tick(): Promise<void> {
    const job = this.queue.dequeue();
    if (!job) {
      return;
    }

    try {
      if (job.name === TripPricingJobName.Recalc) {
        await executeTripPricingRecalc(
          job.payload as TripPricingRecalcJob,
          { pricingService: this.pricingService },
        );
        return;
      }
      this.logger.debug(`skip unknown pricing job=${job.name}`);
    } catch (error) {
      this.logger.error(`pricing job failed name=${job.name}`, error);
    }
  }
}
