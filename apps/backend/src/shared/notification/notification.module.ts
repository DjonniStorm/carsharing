import { Global, Module } from '@nestjs/common';
import { createNotificationClient } from '@carsharing/notification';
import type { NotificationClient } from '@carsharing/notification';

import { getNotificationConfig } from './notification.config';
import { NotificationService } from './notification.service';
import { NOTIFICATION_CLIENT } from './notification.tokens';

@Global()
@Module({
  providers: [
    {
      provide: NOTIFICATION_CLIENT,
      useFactory: (): NotificationClient =>
        createNotificationClient(getNotificationConfig()),
    },
    NotificationService,
  ],
  exports: [NOTIFICATION_CLIENT, NotificationService],
})
export class NotificationModule {}
