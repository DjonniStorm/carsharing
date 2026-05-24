import type { NotificationConfig } from '@carsharing/notification';

function parseBool(raw: string | undefined, defaultVal: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return defaultVal;
  const v = raw.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Конфиг уведомлений из окружения бэкенда.
 *
 * **Email (SMTP):** задайте все поля — иначе канал отключён.
 * - `NOTIFICATION_EMAIL_HOST`
 * - `NOTIFICATION_EMAIL_PORT` (число; по умолчанию 587)
 * - `NOTIFICATION_EMAIL_SECURE` (`true`/`false`; для порта 465 по умолчанию `true`)
 * - `NOTIFICATION_EMAIL_USER`, `NOTIFICATION_EMAIL_PASSWORD`
 * - `NOTIFICATION_EMAIL_FROM`
 *
 * **SMS (Firebase Phone Auth + reCAPTCHA):** задайте API key — иначе канал отключён.
 * - `FIREBASE_API_KEY` — Web API Key из Firebase Console
 */
export function getNotificationConfig(): NotificationConfig {
  const host = process.env.NOTIFICATION_EMAIL_HOST?.trim();
  const user = process.env.NOTIFICATION_EMAIL_USER?.trim();
  const pass = process.env.NOTIFICATION_EMAIL_PASSWORD ?? '';
  const from = process.env.NOTIFICATION_EMAIL_FROM?.trim();
  const portRaw = process.env.NOTIFICATION_EMAIL_PORT?.trim();

  const firebaseApiKey = process.env.FIREBASE_API_KEY?.trim();

  const out: NotificationConfig = {};

  if (host && user && from) {
    const portParsed = portRaw ? Number(portRaw) : NaN;
    const port =
      Number.isFinite(portParsed) && portParsed > 0 ? portParsed : 587;
    const secureDefault = port === 465;
    const secure = parseBool(
      process.env.NOTIFICATION_EMAIL_SECURE,
      secureDefault,
    );

    out.email = {
      host,
      port,
      secure,
      auth: { user, pass },
      from,
    };
  }

  if (firebaseApiKey) {
    out.firebasePhone = {
      apiKey: firebaseApiKey,
    };
  }

  return out;
}
