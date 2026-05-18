import type { IJobQueue } from './job-queue.interface';

/** Отдельная FIFO-очередь для пересчёта стоимости поездок (не смешивать с violation jobs). */
export type ITripPricingJobQueue = IJobQueue;

export const ITripPricingJobQueueToken = Symbol('ITripPricingJobQueue');
