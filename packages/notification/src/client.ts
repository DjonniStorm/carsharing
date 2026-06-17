import nodemailer from 'nodemailer';

import {
  getFirebaseRecaptchaParams as getFirebaseRecaptchaParamsApi,
  sendFirebasePhoneVerification as sendFirebasePhoneVerificationApi,
  verifyFirebasePhoneCode as verifyFirebasePhoneCodeApi,
} from './firebase-phone.js';
import { buildVerificationEmail } from './templates/verification-templates.js';
import { buildViolationNoticeEmail } from './templates/violation-templates.js';
import type {
  NotificationClient,
  NotificationConfig,
  SendEmailInput,
  SendVerificationCodeInput,
  ViolationNoticeInput,
} from './types.js';

/**
 * Создаёт клиент уведомлений по конфигурации, переданной приложением (ключи — с бэкенда).
 */
export function createNotificationClient(config: NotificationConfig): NotificationClient {
  const emailCfg = config.email;
  const firebasePhoneCfg = config.firebasePhone;

  const transport = emailCfg
    ? nodemailer.createTransport({
        host: emailCfg.host,
        port: emailCfg.port,
        secure: emailCfg.secure,
        auth: emailCfg.auth,
      })
    : null;

  const api: NotificationClient = {
    async sendEmail(input: SendEmailInput): Promise<void> {
      if (!emailCfg || !transport) {
        throw new Error('Канал email не сконфигурирован');
      }
      await transport.sendMail({
        from: emailCfg.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
    },

    async sendVerificationCode(input: SendVerificationCodeInput): Promise<void> {
      const mailTo = input.email?.trim();
      if (emailCfg && transport && mailTo) {
        const { subject, text, html } = buildVerificationEmail(input.code);
        await api.sendEmail({
          to: mailTo,
          subject,
          text,
          html,
        });
        return;
      }

      throw new Error(
        'Код подтверждения: задайте email при настроенном SMTP (NOTIFICATION_EMAIL_*)',
      );
    },

    async getFirebaseRecaptchaParams() {
      if (!firebasePhoneCfg) {
        throw new Error(
          'Канал Firebase Phone Auth не сконфигурирован (FIREBASE_API_KEY)',
        );
      }
      return getFirebaseRecaptchaParamsApi(firebasePhoneCfg);
    },

    async sendFirebasePhoneVerification(phone: string, recaptchaToken: string) {
      if (!firebasePhoneCfg) {
        throw new Error(
          'Канал Firebase Phone Auth не сконфигурирован (FIREBASE_API_KEY)',
        );
      }
      return sendFirebasePhoneVerificationApi(firebasePhoneCfg, phone, recaptchaToken);
    },

    async verifyFirebasePhoneCode(sessionInfo: string, code: string) {
      if (!firebasePhoneCfg) {
        throw new Error(
          'Канал Firebase Phone Auth не сконфигурирован (FIREBASE_API_KEY, FIREBASE_ANDROID_*)',
        );
      }
      return verifyFirebasePhoneCodeApi(firebasePhoneCfg, sessionInfo, code);
    },

    async sendViolationNotice(input: ViolationNoticeInput): Promise<void> {
      if (!emailCfg || !transport) {
        throw new Error('Уведомление о нарушении: канал email не сконфигурирован');
      }
      const { to, ...fields } = input;
      const { subject, text, html } = buildViolationNoticeEmail(fields);
      await api.sendEmail({ to, subject, text, html });
    },
  };

  return api;
}
