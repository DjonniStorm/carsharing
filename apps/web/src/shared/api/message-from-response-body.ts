/** Текст `message` из тела ответа Nest (строка или массив validation). */
export function messageFromResponseBody(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("message" in data)) {
    return null;
  }
  const raw = (data as { message: unknown }).message;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map(String).join(", ");
  }
  return null;
}

export function pickMessageFromResponse(
  data: unknown,
  fallback: string,
): string {
  return messageFromResponseBody(data) ?? fallback;
}
