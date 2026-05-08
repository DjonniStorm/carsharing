import { Prisma } from '@prisma/client';

import {
  DatabaseViolationErrorException,
  ViolationNotFoundException,
  ViolationRelationNotFoundException,
} from './errors';

function isDomainViolationError(error: unknown): boolean {
  return (
    error instanceof ViolationNotFoundException ||
    error instanceof ViolationRelationNotFoundException ||
    error instanceof DatabaseViolationErrorException
  );
}

export class ViolationDbErrors {
  public static mapError(error: unknown): never {
    if (isDomainViolationError(error)) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2003':
          throw new ViolationRelationNotFoundException(
            'Связанная сущность нарушения не найдена',
          );

        case 'P2025':
          throw new ViolationNotFoundException('Нарушение не найдено');

        default:
          throw new DatabaseViolationErrorException(
            'Ошибка базы данных нарушений',
          );
      }
    }

    throw error;
  }
}

