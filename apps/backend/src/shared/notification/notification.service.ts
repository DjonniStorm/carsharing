import { Inject, Injectable } from '@nestjs/common';
import type {
  NotificationClient,
  SendEmailInput,
  SendFirebasePhoneVerificationResult,
  SendVerificationCodeInput,
  VerifyFirebasePhoneCodeResult,
  ViolationNoticeInput,
} from '@carsharing/notification';

import { NOTIFICATION_CLIENT } from './notification.tokens';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_CLIENT)
    private readonly client: NotificationClient,
  ) {}

  sendEmail(input: SendEmailInput): Promise<void> {
    return this.client.sendEmail(input);
  }

  sendVerificationCode(input: SendVerificationCodeInput): Promise<void> {
    return this.client.sendVerificationCode(input);
  }

  sendFirebasePhoneVerification(
    phone: string,
    recaptchaToken: string,
  ): Promise<SendFirebasePhoneVerificationResult> {
    return this.client.sendFirebasePhoneVerification(phone, recaptchaToken);
  }

  getFirebaseRecaptchaParams(): Promise<{ recaptchaSiteKey: string }> {
    return this.client.getFirebaseRecaptchaParams();
  }

  verifyFirebasePhoneCode(
    sessionInfo: string,
    code: string,
  ): Promise<VerifyFirebasePhoneCodeResult> {
    return this.client.verifyFirebasePhoneCode(sessionInfo, code);
  }

  sendViolationNotice(input: ViolationNoticeInput): Promise<void> {
    return this.client.sendViolationNotice(input);
  }
}
