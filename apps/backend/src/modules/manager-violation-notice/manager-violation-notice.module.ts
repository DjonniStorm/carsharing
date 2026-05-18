import { Module } from '@nestjs/common';

import { NotificationModule } from 'src/shared/notification/notification.module';
import { TripModule } from '../trip/trip.module';
import { UserModule } from '../user/user.module';
import { ViolationModule } from '../violation/violation.module';
import { ManagerViolationNoticeController } from './controllers/manager-violation-notice.controller';
import { TripNotificationRepository } from './repositories/trip-notification.repository';
import { ITripNotificationRepositoryToken } from './repositories/trip-notification.repository.interface';
import { ManagerViolationNoticeService } from './services/manager-violation-notice.service';

@Module({
  imports: [TripModule, UserModule, ViolationModule, NotificationModule],
  controllers: [ManagerViolationNoticeController],
  providers: [
    ManagerViolationNoticeService,
    {
      provide: ITripNotificationRepositoryToken,
      useClass: TripNotificationRepository,
    },
  ],
})
export class ManagerViolationNoticeModule {}
