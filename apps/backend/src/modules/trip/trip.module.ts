import { Module } from '@nestjs/common';

import { TripController } from './controllers/trip.controller';
import { TripGateway } from './gateways/trip.gateway';
import { ITripRealtimeOutboxToken } from './realtime/trip-realtime.outbox.interface';
import { LoggerTripRealtimeOutbox } from './realtime/trip-realtime.outbox.logger';
import { TripRepository } from './repositories/trip.repository';
import { ITripRepositoryToken } from './repositories/trip.repository.interface';
import { ITripRealtimePublisherToken } from './services/trip-realtime.publisher.interface';
import { TripRealtimePublisher } from './services/trip-realtime.publisher';
import { TripService } from './services/trip.service';

@Module({
  imports: [],
  controllers: [TripController],
  providers: [
    TripService,
    TripGateway,
    {
      provide: ITripRealtimeOutboxToken,
      useClass: LoggerTripRealtimeOutbox,
    },
    {
      provide: ITripRealtimePublisherToken,
      useClass: TripRealtimePublisher,
    },
    { provide: ITripRepositoryToken, useClass: TripRepository },
  ],
  exports: [{ provide: ITripRepositoryToken, useClass: TripRepository }],
})
export class TripModule {}
