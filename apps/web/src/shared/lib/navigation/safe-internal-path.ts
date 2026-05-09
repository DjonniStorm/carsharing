/**
 * Защита от open redirect: только относительный путь внутри приложения.
 */
export const safeInternalPath = (
  raw: string | undefined,
  fallback: string,
): string => {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }
  return raw;
};
