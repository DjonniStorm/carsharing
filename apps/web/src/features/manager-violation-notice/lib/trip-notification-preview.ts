const MANAGER_NOTICE_KIND = "manager_violation_notice" as const;

function parseManagerNotice(
  trimmed: string,
): { subject: string; body: string } | null {
  try {
    const o = JSON.parse(trimmed) as unknown;
    if (
      typeof o !== "object" ||
      o === null ||
      (o as { kind?: unknown }).kind !== MANAGER_NOTICE_KIND
    ) {
      return null;
    }
    const subject =
      typeof (o as { subject?: unknown }).subject === "string"
        ? (o as { subject: string }).subject.trim()
        : "";
    const body =
      typeof (o as { message?: unknown }).message === "string"
        ? (o as { message: string }).message.trim()
        : "";
    return { subject, body };
  } catch {
    return null;
  }
}

/** Текст для развёрнутой карточки: тема + сообщение менеджера или сырое тело. */
export function tripNotificationDetailsText(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return "";
  }
  const parsed = parseManagerNotice(trimmed);
  if (parsed) {
    const parts = [parsed.subject, parsed.body].filter(Boolean);
    return parts.join("\n\n");
  }
  return trimmed;
}

/** Короткая строка для заголовка аккордеона: subject из JSON или обрезка текста. */
export function tripNotificationMessagePreview(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return "";
  }
  const parsed = parseManagerNotice(trimmed);
  if (parsed?.subject) {
    return parsed.subject;
  }
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}…` : trimmed;
}