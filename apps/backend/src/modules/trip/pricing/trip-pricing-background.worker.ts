import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { SerializedTickRunner } from 'src/shared/background/serialized-tick.runner';
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

const TICK_INTERVAL_MS = 250;

@Injectable()
export class TripPricingBackgroundWorker
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(TripPricingBackgroundWorker.name);

  private readonly tickRunner: SerializedTickRunner;

  constructor(
    @Inject(ITripPricingJobQueueToken)
    private readonly queue: ITripPricingJobQueue,
    @Inject(ITripPricingServiceToken)
    private readonly pricingService: ITripPricingService,
  ) {
    this.tickRunner = new SerializedTickRunner(
      () => this.runOneJob(),
      (error) => this.logger.error('pricing tick failed', error),
    );
  }

  onModuleInit(): void {
    this.tickRunner.startInterval(TICK_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    this.tickRunner.dispose();
  }

  private async runOneJob(): Promise<void> {
    const job = this.queue.dequeue();
    if (!job) {
      return;
    }

    if (job.name === TripPricingJobName.Recalc) {
      await executeTripPricingRecalc(job.payload as TripPricingRecalcJob, {
        pricingService: this.pricingService,
      });
      return;
    }

    this.logger.debug(`skip unknown pricing job=${job.name}`);
  }
}
