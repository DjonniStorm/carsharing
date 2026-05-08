import { CarRepository } from './repositories/car.repository';
import { CarService } from './services/car.service';
import { ICarRepositoryToken } from './repositories/car.repository.interface';
import { Module } from '@nestjs/common';
import { CarController } from './controllers/car.controller';

@Module({
  providers: [
    CarService,
    { provide: ICarRepositoryToken, useClass: CarRepository },
  ],
  exports: [CarService],
  controllers: [CarController],
})
export class CarModule {}
