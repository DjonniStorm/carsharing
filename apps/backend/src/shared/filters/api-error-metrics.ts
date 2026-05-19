import { Counter, register } from 'prom-client';

export type ApiErrorMetricLabels = {
  status_code: string;
  exception: string;
};

/** Счётчик ошибок, обработанных GlobalExceptionFilter (для алертов / дашбордов). */
export function getHttpApiErrorsCounter(): Counter<keyof ApiErrorMetricLabels> {
  const existing = register.getSingleMetric('http_api_errors_total') as
    | Counter<keyof ApiErrorMetricLabels>
    | undefined;
  if (existing) {
    return existing;
  }
  return new Counter({
    name: 'http_api_errors_total',
    help: 'HTTP API errors handled by GlobalExceptionFilter',
    labelNames: ['status_code', 'exception'],
    registers: [register],
  });
}

export function recordHttpApiError(
  labels: ApiErrorMetricLabels,
): void {
  getHttpApiErrorsCounter().inc(labels);
}
