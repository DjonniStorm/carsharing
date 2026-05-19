import { Module, forwardRef } from '@nestjs/common';

/**
 * Модуль поездок: склеивает три слоя (подробности — в подмодулях/комментариях рядом с кодом).
 *
 * 1) **TripRealtimeModule** — только Socket.IO + `ITripRealtimeOutboxToken` (без Prisma).
 * 2) **Доменная логика поездки** — `TripService`, `TripRepository`, REST `TripController`.
 * 3) Фоновые джобы по нарушениям парковки живут в `ViolationModule`/общей очереди; триггер —
 *    переход поездки в FINISHED в `TripService.update`.
 * 4) **Trip pricing** — пересчёт стоимости + `TripPricingBackgroundWorker`.
 * 5) **CarTripSyncService** — пробег/топливо/позиция при finish, H11, статусы авто.
 *
 * Телеметрия импортирует этот модуль ради `ITripRepositoryToken` и outbox (через re-export ниже),
 * цикла с `TelemetryModule` нет — он не импортируется.
 */
import { CarModule } from '../car/car.module';
import { TripPersistenceModule } from './trip-persistence.module';
import { CarTripSyncService } from '../car/services/car-trip-sync.service';
import { ICarTripSyncServiceToken } from '../car/services/car-trip-sync.service.interface';
import { GeozoneModule } from '../geozone/geozone.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { ViolationModule } from '../violation/violation.module';
import { TripController } from './controllers/trip.controller';
import { TripHistoryController } from './controllers/trip.history.controller';
import { TripPricingBackgroundWorker } from './pricing/trip-pricing-background.worker';
import { TripPricingService } from './pricing/trip-pricing.service';
import { ITripPricingServiceToken } from './pricing/trip-pricing.service.interface';
import { TripRealtimeModule } from './trip-realtime.module';
import { ITripRealtimePublisherToken } from './services/trip-realtime.publisher.interface';
import { TripRealtimePublisher } from './services/trip-realtime.publisher';
import { TripService } from './services/trip.service';

@Module({
  imports: [
    TripRealtimeModule,
    TripPersistenceModule,
    GeozoneModule,
    CarModule,
    forwardRef(() => TelemetryModule),
    forwardRef(() => ViolationModule),
  ],
  controllers: [TripController, TripHistoryController],
  providers: [
    TripService,
    {
      provide: ITripRealtimePublisherToken,
      useClass: TripRealtimePublisher,
    },
    {
      provide: ITripPricingServiceToken,
      useClass: TripPricingService,
    },
    TripPricingBackgroundWorker,
    CarTripSyncService,
    {
      provide: ICarTripSyncServiceToken,
      useClass: CarTripSyncService,
    },
  ],
  exports: [
    TripRealtimeModule,
    TripPersistenceModule,
    TripService,
    ITripPricingServiceToken,
    ICarTripSyncServiceToken,
  ],
})
export class TripModule {}
