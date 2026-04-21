import { Prisma } from '@prisma/client';

import {
  DatabaseTripErrorException,
  TripNotFoundException,
  TripPublishFailedException,
  TripRelationNotFoundException,
} from './errors';

function isDomainTripError(error: unknown): boolean {
  return (
    error instanceof TripNotFoundException ||
    error instanceof TripRelationNotFoundException ||
    error instanceof TripPublishFailedException ||
    error instanceof DatabaseTripErrorException
  );
}

export class TripDbErrors {
  public static mapError(error: unknown): never {
    if (isDomainTripError(error)) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2003':
          throw new TripRelationNotFoundException(
            'Связанная сущность поездки не найдена',
          );

        case 'P2025':
          throw new TripNotFoundException('Поездка не найдена');

        default:
          throw new DatabaseTripErrorException('Ошибка базы данных поездки');
      }
    }

    throw error;
  }
}
