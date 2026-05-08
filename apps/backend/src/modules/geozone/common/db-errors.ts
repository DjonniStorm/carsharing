import { Prisma } from '@prisma/client';

import {
  DatabaseGeozoneErrorException,
  GeozoneAlreadyDeletedException,
  GeozoneCreatedByUserIdRequiredException,
  GeozoneGeometryMissingException,
  GeozoneNotDeletedException,
  GeozoneNotFoundException,
  GeozoneVersionNotFoundException,
} from './errors';

function isDomainGeozoneError(error: unknown): boolean {
  return (
    error instanceof GeozoneNotFoundException ||
    error instanceof GeozoneCreatedByUserIdRequiredException ||
    error instanceof GeozoneGeometryMissingException ||
    error instanceof GeozoneAlreadyDeletedException ||
    error instanceof GeozoneNotDeletedException ||
    error instanceof GeozoneVersionNotFoundException ||
    error instanceof DatabaseGeozoneErrorException
  );
}

export class GeozoneDbErrors {
  public static mapError(error: unknown): never {
    if (isDomainGeozoneError(error)) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          throw new GeozoneNotFoundException('Геозона не найдена');

        default:
          throw new DatabaseGeozoneErrorException('Ошибка базы данных геозоны');
      }
    }

    throw error;
  }
}
