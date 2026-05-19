/** Тело ошибки API (как у Nest HttpException). Позже — ключи i18n вместо `message`. */
export type ApiErrorResponseBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export function normalizeApiErrorMessage(
  response: string | object,
): string | string[] {
  if (typeof response === 'string') {
    return response;
  }
  if (typeof response === 'object' && response !== null && 'message' in response) {
    const raw = (response as { message: unknown }).message;
    if (typeof raw === 'string' || Array.isArray(raw)) {
      return raw;
    }
  }
  return 'Unknown error';
}

export function toApiErrorResponseBody(
  statusCode: number,
  response: string | object,
): ApiErrorResponseBody {
  if (typeof response === 'string') {
    return { statusCode, message: response };
  }
  const message = normalizeApiErrorMessage(response);
  const error =
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as { error: unknown }).error === 'string'
      ? (response as { error: string }).error
      : undefined;
  return error ? { statusCode, message, error } : { statusCode, message };
}
