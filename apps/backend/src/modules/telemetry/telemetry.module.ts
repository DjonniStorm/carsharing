import { Module } from '@nestjs/common';

import { TelemetryRepository } from './repositories/telemetry.repository';
import { ITelemetryRepositoryToken } from './repositories/telemetry.repository.interface';

@Module({
  providers: [
    {
      provide: ITelemetryRepositoryToken,
      useClass: TelemetryRepository,
    },
  ],
  exports: [ITelemetryRepositoryToken],
})
export class TelemetryModule {}

