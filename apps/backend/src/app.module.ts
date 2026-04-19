import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from 'nestjs-pino';
import { UserController } from './modules/user/controllers/user.controller';
import { UserService } from './modules/user/services/user.service';
import { IUserRepositoryToken } from './modules/user/repositories/user.repository.interface';
import { UserRepository } from './modules/user/repositories/user.repository';
import { CarController } from './modules/car/controllers/car.controller';
import { CarService } from './modules/car/services/car.service';
import { ICarRepositoryToken } from './modules/car/repositories/car.repository.interface';
import { CarRepository } from './modules/car/repositories/car.repository';

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
  ],
  controllers: [UserController, CarController],
  providers: [
    UserService,
    { provide: IUserRepositoryToken, useClass: UserRepository },
    CarService,
    { provide: ICarRepositoryToken, useClass: CarRepository },
  ],
})
export class AppModule {}
