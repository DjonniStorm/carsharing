import type { IJobQueue, JobEnvelope, JobName } from './job-queue.interface';

export class InMemoryJobQueue implements IJobQueue {
  private readonly items: JobEnvelope<JobName, object>[] = [];

  enqueue<TName extends JobName, TPayload extends object>(
    job: JobEnvelope<TName, TPayload>,
  ): void {
    this.items.push(job as JobEnvelope<JobName, object>);
  }

  dequeue(): JobEnvelope<JobName, object> | null {
    return this.items.shift() ?? null;
  }

  /** Для тестов: снимок очереди без изъятия элементов. */
  snapshotEnqueued(): readonly JobEnvelope<JobName, object>[] {
    return [...this.items];
  }

  /** Для тестов: сброс очереди между кейсами. */
  clearEnqueued(): void {
    this.items.length = 0;
  }
}
