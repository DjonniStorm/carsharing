import { EMPTY, Subject, Subscription, concatMap, from, interval } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

type TickCompletion = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

/**
 * Один job за раз: interval и ручные tick идут в одну очередь (concatMap).
 * Замена setInterval без await предыдущего handler.
 */
export class SerializedTickRunner {
  private readonly triggers$ = new Subject<TickCompletion | null>();

  private readonly subscriptions = new Subscription();

  private pipelineStarted = false;

  constructor(
    private readonly run: () => Promise<void>,
    private readonly onError: (error: unknown) => void,
  ) {}

  startInterval(intervalMs: number): void {
    this.ensurePipeline();
    this.subscriptions.add(
      interval(intervalMs).subscribe(() => {
        this.triggers$.next(null);
      }),
    );
  }

  /** Для unit-тестов и ручного drain очереди. */
  requestTick(): Promise<void> {
    this.ensurePipeline();
    return new Promise<void>((resolve, reject) => {
      this.triggers$.next({ resolve, reject });
    });
  }

  dispose(): void {
    this.subscriptions.unsubscribe();
    this.triggers$.complete();
    this.pipelineStarted = false;
  }

  private ensurePipeline(): void {
    if (this.pipelineStarted) {
      return;
    }
    this.pipelineStarted = true;

    this.subscriptions.add(
      this.triggers$
        .pipe(
          concatMap((completion) =>
            from(this.run()).pipe(
              catchError((error) => {
                this.onError(error);
                completion?.reject(error);
                return EMPTY;
              }),
              finalize(() => {
                completion?.resolve();
              }),
            ),
          ),
        )
        .subscribe(),
    );
  }
}
