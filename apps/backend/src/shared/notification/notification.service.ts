import { Inject, Injectable } from '@nestjs/common';
import type {
  NotificationClient,
  SendEmailInput,
  SendSmsInput,
  SendVerificationCodeInput,
  ViolationNoticeInput,
} from '@carsharing/notification';

import { NOTIFICATION_CLIENT } from './notification.tokens';

/**
 * Фасад над {@link NotificationClient} для доменных модулей (auth, violation и т.д.).
 * Дальше: флаги окружения для «режима разработки» без реальной отправки — в этом сервисе или рядом.
 */
@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_CLIENT)
    private readonly client: NotificationClient,
  ) {}

  sendEmail(input: SendEmailInput): Promise<void> {
    return this.client.sendEmail(input);
  }

  sendSms(input: SendSmsInput): Promise<void> {
    return this.client.sendSms(input);
  }

  sendVerificationCode(input: SendVerificationCodeInput): Promise<void> {
    return this.client.sendVerificationCode(input);
  }

  sendViolationNotice(input: ViolationNoticeInput): Promise<void> {
    return this.client.sendViolationNotice(input);
  }
}
