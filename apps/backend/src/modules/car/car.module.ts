import { CarRepository } from './repositories/car.repository';
import { CarService } from './services/car.service';
import { ICarRepositoryToken } from './repositories/car.repository.interface';
import { Module, forwardRef } from '@nestjs/common';
import { CarController } from './controllers/car.controller';
import { TripModule } from '../trip/trip.module';

@Module({
  imports: [forwardRef(() => TripModule)],
  providers: [
    CarService,
    { provide: ICarRepositoryToken, useClass: CarRepository },
  ],
  exports: [CarService, ICarRepositoryToken],
  controllers: [CarController],
})
export class CarModule {}
