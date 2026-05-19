import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from 'nestjs-pino';
import { CarModule } from './modules/car/car.module';
import { GeozoneModule } from './modules/geozone/geozone.module';
import { TariffModule } from './modules/tariff/tariff.module';
import { TripModule } from './modules/trip/trip.module';
import { UserModule } from './modules/user/user.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { ViolationModule } from './modules/violation/violation.module';
import { BackgroundModule } from './shared/background/background.module';
import { NotificationModule } from './shared/notification/notification.module';
import { ManagerViolationNoticeModule } from './modules/manager-violation-notice/manager-violation-notice.module';
import { HttpMetricsInterceptor } from './modules/metrics/http-metrics.interceptor';
import { MetricsModule } from './modules/metrics/metrics.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

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
    MetricsModule,
    AuthModule,
    PrismaModule,
    NotificationModule,
    BackgroundModule,
    LoggerModule.forRoot(),
    GeozoneModule,
    CarModule,
    UserModule,
    TariffModule,
    TripModule,
    TelemetryModule,
    ViolationModule,
    ManagerViolationNoticeModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
