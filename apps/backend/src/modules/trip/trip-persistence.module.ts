import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { TripRepository } from './repositories/trip.repository';
import { ITripRepositoryToken } from './repositories/trip.repository.interface';

/** Только TripRepository — без цикла Car ↔ Trip ↔ Telemetry. */
@Module({
  imports: [PrismaModule],
  providers: [{ provide: ITripRepositoryToken, useClass: TripRepository }],
  exports: [ITripRepositoryToken],
})
export class TripPersistenceModule {}
