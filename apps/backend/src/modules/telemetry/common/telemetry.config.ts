export type TelemetryConfig = {
  /**
   * Ожидаемый период прихода телеметрии (сек).
   * Используется как «ручка» для разработки: можно поставить 10–20, чтобы снизить нагрузку.
   */
  periodSec: number;
};

export function getTelemetryConfig(): TelemetryConfig {
  const raw = process.env.TELEMETRY_PERIOD_SEC;
  const parsed = raw ? Number(raw) : NaN;
  const periodSec = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  return { periodSec };
}
