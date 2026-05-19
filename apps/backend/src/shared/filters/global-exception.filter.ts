import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';

import { recordHttpApiError } from './api-error-metrics';
import { toApiErrorResponseBody } from './api-error-response';

function exceptionLabel(exception: unknown): string {
  if (exception instanceof HttpException) {
    return exception.constructor.name;
  }
  if (exception instanceof Error) {
    return exception.constructor.name;
  }
  return 'Unknown';
}

/**
 * Глобальный обработчик: метрика + лог
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: httpStatus,
            message: 'Internal server error',
          };

    const body = toApiErrorResponseBody(httpStatus, rawResponse);

    recordHttpApiError({
      status_code: String(httpStatus),
      exception: exceptionLabel(exception),
    });

    const path = request.originalUrl ?? request.url ?? '';
    if (httpStatus >= 500) {
      this.logger.error(
        `${request.method} ${path} ${httpStatus} [${exceptionLabel(exception)}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (httpStatus >= 400) {
      this.logger.warn(
        `${request.method} ${path} ${httpStatus} — ${JSON.stringify(body.message)}`,
      );
    }

    httpAdapter.reply(response, body, httpStatus);
  }
}
