import { Module } from '@nestjs/common';

import { TripModule } from '../trip/trip.module';
import { TelemetryController } from './controllers/telemetry.controller';
import { TelemetryRepository } from './repositories/telemetry.repository';
import { ITelemetryRepositoryToken } from './repositories/telemetry.repository.interface';
import { TelemetryService } from './services/telemetry.service';
import { ITelemetryServiceToken } from './services/telemetry.service.interface';

@Module({
  imports: [TripModule],
  controllers: [TelemetryController],
  providers: [
    {
      provide: ITelemetryServiceToken,
      useClass: TelemetryService,
    },
    {
      provide: ITelemetryRepositoryToken,
      useClass: TelemetryRepository,
    },
  ],
  exports: [ITelemetryRepositoryToken, ITelemetryServiceToken],
})
export class TelemetryModule {}

