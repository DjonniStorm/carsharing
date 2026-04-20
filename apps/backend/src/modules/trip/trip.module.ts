import { Module } from '@nestjs/common';

import { TripRepository } from './repositories/trip.repository';
import { ITripRepositoryToken } from './repositories/trip.repository.interface';

@Module({
  imports: [],
  controllers: [],
  providers: [
    { provide: ITripRepositoryToken, useClass: TripRepository },
  ],
  exports: [{ provide: ITripRepositoryToken, useClass: TripRepository }],
})
export class TripModule {}
