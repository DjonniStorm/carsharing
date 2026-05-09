export type JobName = string;

export type JobEnvelope<TName extends JobName, TPayload extends object> = {
  name: TName;
  payload: TPayload;
  createdAtMs: number;
};

export interface IJobQueue {
  enqueue<TName extends JobName, TPayload extends object>(
    job: JobEnvelope<TName, TPayload>,
  ): void;

  /**
   * Возвращает следующий job или `null`, если очередь пуста.
   * FIFO.
   */
  dequeue(): JobEnvelope<JobName, object> | null;
}

export const IJobQueueToken = Symbol('IJobQueue');
