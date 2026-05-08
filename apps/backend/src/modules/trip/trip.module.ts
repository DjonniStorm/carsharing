import { Module } from '@nestjs/common';

/**
 * Модуль поездок: склеивает три слоя (подробности — в подмодулях/комментариях рядом с кодом).
 *
 * 1) **TripRealtimeModule** — только Socket.IO + `ITripRealtimeOutboxToken` (без Prisma).
 * 2) **Доменная логика поездки** — `TripService`, `TripRepository`, REST `TripController`.
 * 3) Фоновые джобы по нарушениям парковки живут в `ViolationModule`/общей очереди; триггер —
 *    переход поездки в FINISHED в `TripService.update`.
 *
 * Телеметрия импортирует этот модуль ради `ITripRepositoryToken` и outbox (через re-export ниже),
 * цикла с `TelemetryModule` здесь нет — он не импортируется.
 */
import { TripController } from './controllers/trip.controller';
import { TripRealtimeModule } from './trip-realtime.module';
import { TripRepository } from './repositories/trip.repository';
import { ITripRepositoryToken } from './repositories/trip.repository.interface';
import { ITripRealtimePublisherToken } from './services/trip-realtime.publisher.interface';
import { TripRealtimePublisher } from './services/trip-realtime.publisher';
import { TripService } from './services/trip.service';

@Module({
  imports: [TripRealtimeModule],
  controllers: [TripController],
  providers: [
    TripService,
    {
      provide: ITripRealtimePublisherToken,
      useClass: TripRealtimePublisher,
    },
    { provide: ITripRepositoryToken, useClass: TripRepository },
  ],
  exports: [TripRealtimeModule, ITripRepositoryToken, TripService],
})
export class TripModule {}
