import { Global, Module } from '@nestjs/common';

import { IJobQueueToken } from './job-queue.interface';
import { InMemoryJobQueue } from './in-memory-job-queue';

@Global()
@Module({
  providers: [
    {
      provide: IJobQueueToken,
      useValue: new InMemoryJobQueue(),
    },
  ],
  exports: [IJobQueueToken],
})
export class BackgroundModule {}
