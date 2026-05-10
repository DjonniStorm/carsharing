import type { ViolationNoticeFields } from '../types.js';

import { wrapNotificationEmail } from './email-layout.js';

export type ViolationNoticeEmailContent = {
  subject: string;
  text: string;
  html: string;
};

/** Email об уведомлении о нарушении правил поездки. */
export function buildViolationNoticeEmail(
  input: ViolationNoticeFields,
): ViolationNoticeEmailContent {
  const subject = `Нарушение: ${input.title}`;
  const when = formatRuDate(input.occurredAt ?? new Date());
  const tripLine = input.tripId
    ? `Поездка: ${input.tripId}`
    : null;

  const textParts = [
    'Здравствуйте!',
    '',
    `Тип: ${input.title}`,
    `Когда: ${when}`,
    ...(tripLine ? [tripLine] : []),
    '',
    'Описание:',
    input.description,
    '',
    'Пожалуйста, соблюдайте правила сервиса.',
  ];
  const text = textParts.join('\n');

  const metaRows = [
    `<tr><td style="padding:4px 0;color:#71717a;width:88px;">Когда</td><td style="padding:4px 0;color:#18181b;font-weight:500;">${escapeHtml(when)}</td></tr>`,
    ...(input.tripId
      ? [
          `<tr><td style="padding:4px 0;color:#71717a;">Поездка</td><td style="padding:4px 0;color:#18181b;font-family:ui-monospace,Menlo,monospace;font-size:13px;">${escapeHtml(input.tripId)}</td></tr>`,
        ]
      : []),
  ].join('');

  const inner = `
    <p style="margin:0 0 12px;font-size:17px;color:#18181b;">Здравствуйте!</p>
    <p style="margin:0 0 20px;color:#52525b;font-size:15px;">Зафиксировано нарушение при использовании сервиса.</p>
    <div style="margin:0 0 20px;padding:14px 18px;background:#fef2f2;border-radius:10px;border-left:4px solid #ef4444;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:.06em;color:#b91c1c;text-transform:uppercase;">Тип нарушения</p>
      <p style="margin:0;font-size:18px;font-weight:600;color:#991b1b;">${escapeHtml(input.title)}</p>
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:18px;font-size:14px;">${metaRows}</table>
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.04em;">Описание</p>
    <div style="margin:0;padding:14px 16px;background:#fafafa;border-radius:8px;border:1px solid #e4e4e7;color:#3f3f46;font-size:14px;white-space:pre-wrap;">${escapeHtml(input.description)}</div>
  `;

  return {
    subject,
    text,
    html: wrapNotificationEmail(inner),
  };
}

function formatRuDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
