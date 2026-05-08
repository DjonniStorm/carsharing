import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TripGateway } from './gateways/trip.gateway';
import { ITripGatewayToken } from './gateways/trip.gateway.interface';
import { LoggerTripRealtimeOutbox } from './realtime/trip-realtime.outbox.logger';
import { ITripRealtimeOutboxToken } from './realtime/trip-realtime.outbox.interface';

/**
 * Транспортный слой realtime для домена поездок: Socket.IO gateway и outbox к нему.
 *
 * Зачем отдельный модуль:
 * - CRUD (`TripService`, репозиторий) не должен тянуть за собой импорт телеметрии/нарушений.
 * - Любой домен (telemetry, violation, billing) может импортировать только этот модуль
 *   и публиковать события через `ITripRealtimeOutboxToken`, не зная про Nest WS-декораторы.
 *
 * Пример потока «воркер → WS»:
 * ```
 * ViolationService.create(...)
 *   → ViolationTripRealtimePublisher
 *   → ITripRealtimeOutboxToken.publish(envelope)
 *   → LoggerTripRealtimeOutbox
 *   → TripGateway.publish → room trip:{uuid}
 * ```
 */
@Module({
  imports: [AuthModule],
  providers: [
    TripGateway,
    {
      provide: ITripGatewayToken,
      useExisting: TripGateway,
    },
    {
      provide: ITripRealtimeOutboxToken,
      useClass: LoggerTripRealtimeOutbox,
    },
  ],
  exports: [ITripGatewayToken, ITripRealtimeOutboxToken, TripGateway],
})
export class TripRealtimeModule {}
