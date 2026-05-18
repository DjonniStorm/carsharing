import { Global, Module } from '@nestjs/common';

import { IJobQueueToken } from './job-queue.interface';
import { InMemoryJobQueue } from './in-memory-job-queue';
import { ITripPricingJobQueueToken } from './trip-pricing-job-queue.interface';

@Global()
@Module({
  providers: [
    {
      provide: IJobQueueToken,
      useValue: new InMemoryJobQueue(),
    },
    {
      provide: ITripPricingJobQueueToken,
      useValue: new InMemoryJobQueue(),
    },
  ],
  exports: [IJobQueueToken, ITripPricingJobQueueToken],
})
export class BackgroundModule {}
