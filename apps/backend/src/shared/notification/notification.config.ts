import type { JsonWithPlaceholders, NotificationConfig } from '@carsharing/notification';

function parseBool(raw: string | undefined, defaultVal: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return defaultVal;
  const v = raw.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function parseJson<T>(raw: string | undefined): T | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
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
 * **SMS (HTTP):** достаточно `NOTIFICATION_SMS_URL`; остальное опционально.
 * - `NOTIFICATION_SMS_METHOD` — `GET` или `POST` (по умолчанию POST)
 * - `NOTIFICATION_SMS_HEADERS_JSON` — JSON-объект заголовков
 * - `NOTIFICATION_SMS_JSON_BODY` — JSON тела с плейсхолдерами `{{to}}`, `{{body}}`
 * - `NOTIFICATION_SMS_SEARCH_PARAMS_JSON` — JSON query-параметров (те же плейсхолдеры)
 */
export function getNotificationConfig(): NotificationConfig {
  const host = process.env.NOTIFICATION_EMAIL_HOST?.trim();
  const user = process.env.NOTIFICATION_EMAIL_USER?.trim();
  const pass = process.env.NOTIFICATION_EMAIL_PASSWORD ?? '';
  const from = process.env.NOTIFICATION_EMAIL_FROM?.trim();
  const portRaw = process.env.NOTIFICATION_EMAIL_PORT?.trim();

  const smsUrl = process.env.NOTIFICATION_SMS_URL?.trim();

  const out: NotificationConfig = {};

  if (host && user && from) {
    const portParsed = portRaw ? Number(portRaw) : NaN;
    const port =
      Number.isFinite(portParsed) && portParsed > 0 ? portParsed : 587;
    const secureDefault = port === 465;
    const secure = parseBool(process.env.NOTIFICATION_EMAIL_SECURE, secureDefault);

    out.email = {
      host,
      port,
      secure,
      auth: { user, pass },
      from,
    };
  }

  if (smsUrl) {
    const methodRaw = process.env.NOTIFICATION_SMS_METHOD?.trim().toUpperCase();
    const method = methodRaw === 'GET' ? 'GET' : 'POST';

    const headers = parseJson<Record<string, string>>(
      process.env.NOTIFICATION_SMS_HEADERS_JSON,
    );
    const jsonBody = parseJson<JsonWithPlaceholders>(
      process.env.NOTIFICATION_SMS_JSON_BODY,
    );
    const searchParams = parseJson<Record<string, string>>(
      process.env.NOTIFICATION_SMS_SEARCH_PARAMS_JSON,
    );

    out.sms = {
      url: smsUrl,
      method,
      ...(headers ? { headers } : {}),
      ...(jsonBody !== undefined ? { jsonBody } : {}),
      ...(searchParams ? { searchParams } : {}),
    };
  }

  return out;
}
