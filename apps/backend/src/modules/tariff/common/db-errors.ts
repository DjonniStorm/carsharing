import { Prisma } from '@prisma/client';

import {
  DatabaseTariffErrorException,
  TariffAlreadyDeletedException,
  TariffNotFoundException,
} from './errors';

function isDomainTariffError(error: unknown): boolean {
  return (
    error instanceof TariffNotFoundException ||
    error instanceof TariffAlreadyDeletedException ||
    error instanceof DatabaseTariffErrorException
  );
}

export class TariffDbErrors {
  public static mapError(error: unknown): never {
    if (isDomainTariffError(error)) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          throw new TariffNotFoundException('Шаблон тарифа не найден');

        default:
          throw new DatabaseTariffErrorException(
            'Ошибка базы при работе с тарифом',
          );
      }
    }

    throw error;
  }
}
