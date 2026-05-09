import { Prisma } from '@prisma/client';

import {
  DatabaseTariffErrorException,
  TariffAlreadyDeletedException,
  TariffGeoZoneNotFoundException,
  TariffNotDeletedException,
  TariffNotFoundException,
} from './errors';

function isDomainTariffError(error: unknown): boolean {
  return (
    error instanceof TariffNotFoundException ||
    error instanceof TariffGeoZoneNotFoundException ||
    error instanceof TariffAlreadyDeletedException ||
    error instanceof TariffNotDeletedException ||
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
        case 'P2003':
          throw new TariffGeoZoneNotFoundException(
            '������� ��� ������ �� �������',
          );

        case 'P2025':
          throw new TariffNotFoundException('����� �� ������');

        default:
          throw new DatabaseTariffErrorException('������ ���� ������ ������');
      }
    }

    throw error;
  }
}
