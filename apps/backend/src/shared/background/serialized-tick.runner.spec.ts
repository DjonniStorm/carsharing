import { describe, expect, it, vi } from 'vitest';

import { SerializedTickRunner } from './serialized-tick.runner';

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

describe('SerializedTickRunner', () => {
  it('serializes concurrent requestTick (maxInFlight === 1)', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    let runs = 0;

    const runner = new SerializedTickRunner(
      async () => {
        runs += 1;
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await delay(50);
        inFlight -= 1;
      },
      () => undefined,
    );

    await Promise.all([runner.requestTick(), runner.requestTick()]);

    expect(runs).toBe(2);
    expect(maxInFlight).toBe(1);
    runner.dispose();
  });

  it('logs errors via onError and rejects requestTick', async () => {
    const onError = vi.fn();
    const runner = new SerializedTickRunner(async () => {
      throw new Error('boom');
    }, onError);

    await expect(runner.requestTick()).rejects.toThrow('boom');
    expect(onError).toHaveBeenCalled();
    runner.dispose();
  });
});
