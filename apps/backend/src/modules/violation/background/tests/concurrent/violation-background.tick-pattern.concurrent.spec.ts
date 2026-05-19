import { describe, expect, it } from 'vitest';

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Не тестирует ViolationBackgroundWorker — только анти-паттерн
 * «setInterval без await + без processing guard».
 */
describe('tick pattern without processing guard (illustration only)', () => {
  it('два параллельных tick могут обрабатывать jobs одновременно', async () => {
    const jobs = [{ id: 1 }, { id: 2 }];
    let inFlight = 0;
    let maxInFlight = 0;

    async function tick(): Promise<void> {
      const job = jobs.shift();
      if (!job) {
        return;
      }
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await delay(40);
      inFlight -= 1;
    }

    await Promise.all([tick(), tick()]);

    expect(maxInFlight).toBe(2);
  });
});
