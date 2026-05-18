import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Counter, Gauge, Histogram, register } from 'prom-client';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

const PATH_LABEL_MAX = 256;

function resolveHttpStatus(err: unknown): number {
  if (err instanceof HttpException) {
    return err.getStatus();
  }
  return 500;
}

function pathLabel(req: Request): string {
  const routePath = (req.route as { path?: string } | undefined)?.path;
  let raw: string;
  if (routePath) {
    raw = routePath;
  } else {
    const url = req.originalUrl ?? req.url ?? '/';
    const q = url.indexOf('?');
    raw = q === -1 ? url : url.slice(0, q);
  }
  if (raw.length > PATH_LABEL_MAX) {
    return `${raw.slice(0, PATH_LABEL_MAX)}…`;
  }
  return raw;
}

function shouldSkipMetrics(req: Request, labelPath: string): boolean {
  if (labelPath === '/metrics') {
    return true;
  }
  const pathname = req.path ?? labelPath;
  return pathname === '/metrics' || pathname.startsWith('/metrics/');
}

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly requests: Counter<'method' | 'path' | 'status_code'>;
  private readonly duration: Histogram<'method' | 'path' | 'status_code'>;
  private readonly inFlight: Gauge;

  constructor() {
    this.requests =
      (register.getSingleMetric('http_requests_total') as Counter<
        'method' | 'path' | 'status_code'
      >) ??
      new Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'path', 'status_code'],
        registers: [register],
      });
    this.duration =
      (register.getSingleMetric('http_request_duration_seconds') as Histogram<
        'method' | 'path' | 'status_code'
      >) ??
      new Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'path', 'status_code'],
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        registers: [register],
      });
    this.inFlight =
      (register.getSingleMetric('http_requests_in_progress') as Gauge) ??
      new Gauge({
        name: 'http_requests_in_progress',
        help: 'Number of HTTP requests currently being handled',
        registers: [register],
      });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const path = pathLabel(req);

    if (shouldSkipMetrics(req, path)) {
      return next.handle();
    }

    const method = req.method;
    const started = process.hrtime.bigint();
    this.inFlight.inc();

    let failureStatus: number | undefined;

    const observe = (statusCode: number) => {
      const status = String(statusCode);
      const labels = { method, path, status_code: status };
      const seconds = Number(process.hrtime.bigint() - started) / 1e9;
      this.duration.observe(labels, seconds);
      this.requests.inc(labels);
    };

    return next.handle().pipe(
      catchError((err: unknown) => {
        failureStatus = resolveHttpStatus(err);
        return throwError(() => err);
      }),
      finalize(() => {
        this.inFlight.dec();
        const statusCode = failureStatus ?? (res.statusCode || 200);
        observe(statusCode);
      }),
    );
  }
}
