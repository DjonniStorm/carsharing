import nodemailer from 'nodemailer';

import { substitutePlaceholders } from './placeholders.js';
import {
  buildVerificationEmail,
  buildVerificationSmsBody,
} from './templates/verification-templates.js';
import { buildViolationNoticeEmail } from './templates/violation-templates.js';
import type {
  NotificationClient,
  NotificationConfig,
  SendEmailInput,
  SendSmsInput,
  SendVerificationCodeInput,
  ViolationNoticeInput,
} from './types.js';

/**
 * Создаёт клиент уведомлений по конфигурации, переданной приложением (ключи и URL — с бэкенда).
 */
export function createNotificationClient(config: NotificationConfig): NotificationClient {
  const emailCfg = config.email;
  const smsCfg = config.sms;

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

    async sendSms(input: SendSmsInput): Promise<void> {
      if (!smsCfg) {
        throw new Error('Канал SMS не сконфигурирован');
      }

      const vars = { to: input.to, body: input.body };
      const url = new URL(smsCfg.url);

      if (smsCfg.searchParams) {
        const subbed = substitutePlaceholders(smsCfg.searchParams, vars);
        for (const [key, val] of Object.entries(subbed)) {
          url.searchParams.set(key, val);
        }
      }

      const headers: Record<string, string> = smsCfg.headers
        ? substitutePlaceholders(smsCfg.headers, vars)
        : {};

      let body: string | undefined;
      if (smsCfg.method === 'POST' && smsCfg.jsonBody !== undefined) {
        const payload = substitutePlaceholders(smsCfg.jsonBody, vars);
        body = JSON.stringify(payload);
        const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
        if (!hasContentType) {
          headers['Content-Type'] = 'application/json';
        }
      }

      const res = await fetch(url.toString(), {
        method: smsCfg.method,
        headers,
        body: smsCfg.method === 'POST' ? body : undefined,
      });

      if (!res.ok) {
        const snippet = await res.text().catch(() => '');
        throw new Error(`Ошибка HTTP при отправке SMS (${res.status}): ${snippet.slice(0, 500)}`);
      }
    },

    async sendVerificationCode(input: SendVerificationCodeInput): Promise<void> {
      const preferSms = smsCfg && input.phone && String(input.phone).trim() !== '';
      if (preferSms) {
        await api.sendSms({
          to: String(input.phone).trim(),
          body: buildVerificationSmsBody(input.code),
        });
        return;
      }

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
        'Код подтверждения: задайте phone при настроенном SMS или email при настроенном SMTP',
      );
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
