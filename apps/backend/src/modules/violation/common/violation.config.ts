export type ViolationConfig = {
  /** Лимит скорости (км/ч) для SPEEDING. */
  speedLimitKmh: number;
  /** Порог топлива (%) для LOW_FUEL. */
  lowFuelThreshold: number;
  /**
   * Дедуп-интервал нарушений (мс), чтобы не создавать одно и то же нарушение каждую точку.
   */
  dedupWindowMs: number;
};

export function getViolationConfig(): ViolationConfig {
  const speedRaw = process.env.VIOLATION_SPEED_LIMIT_KMH;
  const fuelRaw = process.env.VIOLATION_LOW_FUEL_THRESHOLD;
  const dedupRaw = process.env.VIOLATION_DEDUP_WINDOW_SEC;

  const speedParsed = speedRaw ? Number(speedRaw) : NaN;
  const fuelParsed = fuelRaw ? Number(fuelRaw) : NaN;
  const dedupParsed = dedupRaw ? Number(dedupRaw) : NaN;

  return {
    speedLimitKmh:
      Number.isFinite(speedParsed) && speedParsed > 0 ? speedParsed : 90,
    lowFuelThreshold:
      Number.isFinite(fuelParsed) && fuelParsed >= 0 ? fuelParsed : 15,
    dedupWindowMs:
      Number.isFinite(dedupParsed) && dedupParsed > 0
        ? dedupParsed * 1000
        : 60_000,
  };
}
