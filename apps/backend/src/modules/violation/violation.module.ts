import { Module, forwardRef } from '@nestjs/common';

import { GeozoneModule } from '../geozone/geozone.module';
import { TripModule } from '../trip/trip.module';
import { ViolationRepository } from './repositories/violation.repository';
import { IViolationRepositoryToken } from './repositories/violation.repository.interface';
import { ViolationService } from './services/violation.service';
import { IViolationServiceToken } from './services/violation.service.interface';
import { ViolationController } from './controllers/violation.controller';
import { IViolationRealtimePublisherToken } from './realtime/violation-realtime.publisher.interface';
import { ViolationTripRealtimePublisher } from './realtime/violation-realtime.publisher.trip-outbox';
import { ViolationBackgroundWorker } from './background/violation-background.worker';

/**
 * Домен нарушений + фоновый воркер очереди.
 *
 * `ViolationTripRealtimePublisher` тянет `TripModule`, чтобы получить `ITripRepositoryToken`
 * (carId для envelope) и `ITripRealtimeOutboxToken` (через экспорт `TripRealtimeModule`).
 */
@Module({
  imports: [GeozoneModule, forwardRef(() => TripModule)],
  controllers: [ViolationController],
  providers: [
    {
      provide: IViolationRepositoryToken,
      useClass: ViolationRepository,
    },
    {
      provide: IViolationServiceToken,
      useClass: ViolationService,
    },
    {
      provide: IViolationRealtimePublisherToken,
      useClass: ViolationTripRealtimePublisher,
    },
    ViolationBackgroundWorker,
  ],
  exports: [IViolationRepositoryToken, IViolationServiceToken],
})
export class ViolationModule {}
