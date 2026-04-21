import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from 'nestjs-pino';
import { CarModule } from './modules/car/car.module';
import { GeozoneModule } from './modules/geozone/geozone.module';
import { TariffModule } from './modules/tariff/tariff.module';
import { TripModule } from './modules/trip/trip.module';
import { UserModule } from './modules/user/user.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';

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
    LoggerModule.forRoot(),
    GeozoneModule,
    CarModule,
    UserModule,
    TariffModule,
    TripModule,
    TelemetryModule,
  ],
})
export class AppModule {}
