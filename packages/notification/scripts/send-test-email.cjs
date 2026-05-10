/**
 * Ручная проверка SMTP (после `pnpm -F @carsharing/notification run build`).
 *
 * Переменные: TEST_SMTP_HOST, TEST_SMTP_PORT (465 по умолчанию),
 * TEST_SMTP_SECURE, TEST_SMTP_USER, TEST_SMTP_PASSWORD,
 * TEST_MAIL_FROM (= USER), TEST_MAIL_TO.
 *
 * Файл `packages/notification/.env` подхватывается автоматически (рядом с package.json
 * пакета), даже если запускаете из корня монорепы.
 */

const fs = require('fs');
const path = require('path');

/** Простой парсер .env; уже заданные в process.env не перезаписываются. */
function loadDotenv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/);
  for (const line of lines) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const eq = s.indexOf('=');
    if (eq <= 0) continue;
    const key = s.slice(0, eq).trim();
    let val = s.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotenv(path.join(__dirname, '../.env'));

const { createNotificationClient } = require('../dist/index.js');

function env(name, fallback = undefined) {
  const v = process.env[name];
  if (v === undefined || String(v).trim() === '') return fallback;
  return String(v).trim();
}

function parseBool(raw, defaultVal) {
  if (raw === undefined) return defaultVal;
  const v = raw.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

async function main() {
  const host = env('TEST_SMTP_HOST');
  const user = env('TEST_SMTP_USER');
  const pass = env('TEST_SMTP_PASSWORD');
  const to = env('TEST_MAIL_TO');

  if (!host || !user || !pass || !to) {
    console.error(
      'Задайте TEST_SMTP_HOST, TEST_SMTP_USER, TEST_SMTP_PASSWORD, TEST_MAIL_TO',
    );
    process.exitCode = 1;
    return;
  }

  const portRaw = env('TEST_SMTP_PORT', '465');
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    console.error('TEST_SMTP_PORT должен быть числом');
    process.exitCode = 1;
    return;
  }

  const secureDefault = port === 465;
  const secure = parseBool(env('TEST_SMTP_SECURE'), secureDefault);

  const from = env('TEST_MAIL_FROM', user);

  const client = createNotificationClient({
    email: {
      host,
      port,
      secure,
      auth: { user, pass },
      from,
    },
  });

  const subject = `[carsharing notification] тест ${new Date().toISOString()}`;
  const text =
    'Если вы это читаете — SMTP из пакета @carsharing/notification работает.';

  await client.sendEmail({ to, subject, text });

  console.log(`Отправлено на ${to} (from: ${from})`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
