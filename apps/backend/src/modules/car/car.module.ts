import { Module } from '@nestjs/common';
import { CarRepository } from './repositories/car.repository';
import { CarService } from './services/car.service';
import { ICarRepositoryToken } from './repositories/car.repository.interface';
import { CarController } from './controllers/car.controller';
import { TripPersistenceModule } from '../trip/trip-persistence.module';

@Module({
  imports: [TripPersistenceModule],
  providers: [
    CarService,
    { provide: ICarRepositoryToken, useClass: CarRepository },
  ],
  exports: [CarService, ICarRepositoryToken],
  controllers: [CarController],
})
export class CarModule {}
