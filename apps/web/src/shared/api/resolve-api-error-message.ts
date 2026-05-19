import { HttpApiError } from "@/shared/api/http-api-error";
import { messageFromResponseBody } from "@/shared/api/message-from-response-body";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

export type ResolveApiErrorOptions = {
  fallbackKey?: LangKey;
};

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) {
    const m = error.message.toLowerCase();
    return m.includes("failed to fetch") || m.includes("network");
  }
  if (error instanceof Error && error.name === "NetworkError") {
    return true;
  }
  return false;
}

function httpStatusFallbackMessage(status: number): string {
  if (status === 401) {
    return translate(LANG_KEYS.api.unauthorized);
  }
  if (status === 403) {
    return translate(LANG_KEYS.api.forbidden);
  }
  if (status === 409) {
    return translate(LANG_KEYS.api.conflict);
  }
  if (status >= 500) {
    return translate(LANG_KEYS.errors.server);
  }
  return translate(LANG_KEYS.api.requestFailedWithStatus, { status });
}

export function resolveApiErrorMessage(
  error: unknown,
  options: ResolveApiErrorOptions = {},
): string {
  const fallbackKey = options.fallbackKey ?? LANG_KEYS.errors.generic;

  if (error instanceof HttpApiError) {
    const msg = error.message.trim();
    if (msg.length > 0) {
      return msg;
    }
    return httpStatusFallbackMessage(error.status);
  }

  if (error instanceof Error && error.name === "AbortError") {
    return translate(LANG_KEYS.errors.timeout);
  }

  if (isNetworkFailure(error)) {
    return translate(LANG_KEYS.errors.network);
  }

  const fromBody = messageFromResponseBody(
    typeof error === "object" && error !== null && "responseBody" in error
      ? (error as { responseBody: unknown }).responseBody
      : null,
  );
  if (fromBody) {
    return fromBody;
  }

  if (error instanceof Error) {
    const raw = error.message.trim();
    if (raw.length > 0 && !raw.toLowerCase().includes("http status error")) {
      return raw;
    }
  }

  return translate(fallbackKey);
}
