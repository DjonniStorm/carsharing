import { Module, forwardRef } from '@nestjs/common';

/**
 * Модуль поездок: склеивает три слоя (подробности — в подмодулях/комментариях рядом с кодом).
 *
 * 1) **TripRealtimeModule** — только Socket.IO + `ITripRealtimeOutboxToken` (без Prisma).
 * 2) **Доменная логика поездки** — `TripService`, `TripRepository`, REST `TripController`.
 * 3) Фоновые джобы по нарушениям парковки живут в `ViolationModule`/общей очереди; триггер —
 *    переход поездки в FINISHED в `TripService.update`.
 * 4) **Trip pricing** — пересчёт стоимости + `TripPricingBackgroundWorker`.
 *
 * Телеметрия импортирует этот модуль ради `ITripRepositoryToken` и outbox (через re-export ниже),
 * цикла с `TelemetryModule` нет — он не импортируется.
 */
import { GeozoneModule } from '../geozone/geozone.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { TripController } from './controllers/trip.controller';
import { TripHistoryController } from './controllers/trip.history.controller';
import { TripPricingBackgroundWorker } from './pricing/trip-pricing-background.worker';
import { TripPricingService } from './pricing/trip-pricing.service';
import { ITripPricingServiceToken } from './pricing/trip-pricing.service.interface';
import { TripRealtimeModule } from './trip-realtime.module';
import { TripRepository } from './repositories/trip.repository';
import { ITripRepositoryToken } from './repositories/trip.repository.interface';
import { ITripRealtimePublisherToken } from './services/trip-realtime.publisher.interface';
import { TripRealtimePublisher } from './services/trip-realtime.publisher';
import { TripService } from './services/trip.service';

@Module({
  imports: [
    TripRealtimeModule,
    GeozoneModule,
    forwardRef(() => TelemetryModule),
  ],
  controllers: [TripController, TripHistoryController],
  providers: [
    TripService,
    {
      provide: ITripRealtimePublisherToken,
      useClass: TripRealtimePublisher,
    },
    { provide: ITripRepositoryToken, useClass: TripRepository },
    {
      provide: ITripPricingServiceToken,
      useClass: TripPricingService,
    },
    TripPricingBackgroundWorker,
  ],
  exports: [
    TripRealtimeModule,
    ITripRepositoryToken,
    TripService,
    ITripPricingServiceToken,
  ],
})
export class TripModule {}
