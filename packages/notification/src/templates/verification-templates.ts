import { wrapNotificationEmail } from './email-layout.js';

export type VerificationEmailContent = {
  subject: string;
  text: string;
  html: string;
};

/** Красивое письмо с кодом подтверждения. */
export function buildVerificationEmail(code: string): VerificationEmailContent {
  const subject = 'Код подтверждения';
  const text = [
    'Здравствуйте!',
    '',
    `Ваш код подтверждения: ${code}`,
    '',
    'Если вы не запрашивали код, просто игнорируйте это письмо.',
  ].join('\n');

  const inner = `
    <p style="margin:0 0 16px;font-size:17px;color:#18181b;">Здравствуйте!</p>
    <p style="margin:0 0 20px;color:#52525b;font-size:15px;">Используйте код ниже для подтверждения:</p>
    <div style="margin:0 0 20px;padding:16px 20px;background:linear-gradient(135deg,#fafafa 0%,#f4f4f5 100%);border-radius:10px;border:1px solid #e4e4e7;text-align:center;">
      <span style="font-size:28px;font-weight:700;letter-spacing:.35em;font-variant-numeric:tabular-nums;color:#18181b;">${escapeHtml(code)}</span>
    </div>
    <p style="margin:0;color:#71717a;font-size:13px;">Срок действия кода ограничен. Никому его не сообщайте.</p>
  `;

  return {
    subject,
    text,
    html: wrapNotificationEmail(inner),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
