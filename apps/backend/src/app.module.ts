import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/services/auth.service';
import {
  DriverController,
  DriverTripController,
  DriverVehicleController,
} from './modules/driver/driver.controller';
import { TripService } from './modules/driver/services/trip.service';
import {
  ManagerTripController,
  ManagerVehicleController,
  TariffController,
  ViolationController,
  ZoneController,
} from './modules/manager/manager.controller';
import { TariffService } from './modules/manager/services/tariff.service';
import { VehicleService } from './modules/manager/services/vehicle.service';
import { ViolationService } from './modules/manager/services/violation.service';
import { ZoneService } from './modules/manager/services/zone.service';
import { PrismaModule } from './prisma/prisma.module';
import { repositoryProviders } from './shared/providers/repository.providers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? ['.env.test', '.env']
          : ['.env', '.env.local'],
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
  ],
  controllers: [
    AuthController,
    DriverVehicleController,
    DriverTripController,
    DriverController,
    ManagerVehicleController,
    TariffController,
    ZoneController,
    ManagerTripController,
    ViolationController,
  ],
  providers: [
    AuthService,
    VehicleService,
    TripService,
    TariffService,
    ZoneService,
    ViolationService,
    ...repositoryProviders,
  ],
})
export class AppModule {}
