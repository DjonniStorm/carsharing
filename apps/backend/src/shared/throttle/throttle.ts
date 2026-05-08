type LastSeen = {
  tsMs: number;
};

/**
 * Простой in-memory throttle: разрешает событие не чаще, чем раз в `periodMs`.
 * Никаких внешних зависимостей (без брокеров/кэшей) — достаточно для dev/MVP.
 */
export class Throttle {
  private readonly lastSeenByKey = new Map<string, LastSeen>();

  allow(key: string, periodMs: number, nowMs: number = Date.now()): boolean {
    const last = this.lastSeenByKey.get(key);
    if (!last) {
      this.lastSeenByKey.set(key, { tsMs: nowMs });
      return true;
    }
    if (nowMs - last.tsMs >= periodMs) {
      last.tsMs = nowMs;
      return true;
    }
    return false;
  }

  reset(key?: string): void {
    if (key) {
      this.lastSeenByKey.delete(key);
      return;
    }
    this.lastSeenByKey.clear();
  }
}

