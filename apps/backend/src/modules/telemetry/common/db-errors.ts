import { Prisma } from '@prisma/client';

import {
  DatabaseTelemetryErrorException,
  TelemetryNotFoundException,
  TelemetryRelationNotFoundException,
} from './errors';

function isDomainTelemetryError(error: unknown): boolean {
  return (
    error instanceof TelemetryNotFoundException ||
    error instanceof TelemetryRelationNotFoundException ||
    error instanceof DatabaseTelemetryErrorException
  );
}

export class TelemetryDbErrors {
  public static mapError(error: unknown): never {
    if (isDomainTelemetryError(error)) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2003':
          throw new TelemetryRelationNotFoundException(
            'Связанная сущность телеметрии не найдена',
          );

        case 'P2025':
          throw new TelemetryNotFoundException('Запись телеметрии не найдена');

        default:
          throw new DatabaseTelemetryErrorException(
            'Ошибка базы данных телеметрии',
          );
      }
    }

    throw error;
  }
}

