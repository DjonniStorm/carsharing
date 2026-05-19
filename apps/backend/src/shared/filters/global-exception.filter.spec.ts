import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as apiErrorMetrics from './api-error-metrics';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let reply: ReturnType<typeof vi.fn>;
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    reply = vi.fn();
    const httpAdapter = { reply };
    filter = new GlobalExceptionFilter({
      httpAdapter,
    } as HttpAdapterHost);
    vi.spyOn(apiErrorMetrics, 'recordHttpApiError').mockImplementation(() => undefined);
  });

  const hostForHttp = (): ArgumentsHost =>
    ({
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/cars/1',
          originalUrl: '/cars/1',
        }),
        getResponse: () => ({}),
      }),
    }) as ArgumentsHost;

  it('returns Nest-compatible body for HttpException', () => {
    filter.catch(new NotFoundException('Автомобиль не найден'), hostForHttp());

    expect(reply).toHaveBeenCalledWith(
      {},
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Автомобиль не найден',
        error: 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  });

  it('returns 500 body for unknown errors', () => {
    filter.catch(new Error('boom'), hostForHttp());

    expect(reply).toHaveBeenCalledWith(
      {},
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('records Prometheus labels for HttpException', () => {
    filter.catch(
      new HttpException('conflict', HttpStatus.CONFLICT),
      hostForHttp(),
    );

    expect(apiErrorMetrics.recordHttpApiError).toHaveBeenCalledWith({
      status_code: '409',
      exception: 'HttpException',
    });
  });

  it('rethrows for non-http context', () => {
    const host = { getType: () => 'ws' } as ArgumentsHost;
    expect(() => filter.catch(new Error('x'), host)).toThrow('x');
  });
});
