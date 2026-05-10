/**
 * `AUTH_SKIP_VERIFICATION=true` — регистрация как раньше: сразу активный пользователь и JWT,
 * без письма с кодом (удобно для тестов и локальной разработки без SMTP).
 *
 * `false` или не задано — создаётся неактивная запись, на email уходит код подтверждения
 * (нужны NOTIFICATION_EMAIL_* и подтверждение отдельным эндпоинтом — позже).
 */
export function isAuthSkipVerification(): boolean {
  const v = process.env.AUTH_SKIP_VERIFICATION?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}
