import { Prisma } from '@prisma/client';

import {
  CarAlreadyExistsException,
  DatabaseCarErrorException,
  LicensePlateAlreadyExistsException,
  CarNotFoundException,
} from './errors';

export class DbErrors {
  /** Fields from Prisma P2002 message when `meta.target` is missing (e.g. Prisma 7). */
  private static p2002FieldsFromMessage(message: string): string[] {
    const m = message.match(
      /Unique constraint failed on the fields?:\s*\(([^)]*)\)/i,
    );
    if (!m) {
      return [];
    }
    return m[1]
      .split(',')
      .map((s) => s.replace(/`/g, '').trim())
      .filter(Boolean);
  }

  private static p2002TargetString(
    error: Prisma.PrismaClientKnownRequestError,
  ): string {
    const raw = error.meta?.target;
    if (Array.isArray(raw)) {
      return raw.join(', ');
    }
    if (typeof raw === 'string') {
      return raw;
    }
    return this.p2002FieldsFromMessage(error.message).join(', ');
  }

  public static mapError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw this.handleP2002Error(error);

        case 'P2025':
          throw new CarNotFoundException('Автомобиль не найден');

        default:
          throw new DatabaseCarErrorException('Ошибка базы данных автомобиля');
      }
    }

    throw error;
  }

  private static handleP2002Error(
    error: Prisma.PrismaClientKnownRequestError,
  ): never {
    const fromMeta = this.p2002TargetString(error);
    const cause = error.meta?.cause as { originalMessage?: string } | undefined;
    const detail = cause?.originalMessage ?? error.message;
    const hint = `${fromMeta} ${error.message}`.toLowerCase();

    if (
      hint.includes('license_plate') ||
      hint.includes('licenseplate') ||
      hint.includes('car_license_plate')
    ) {
      throw new LicensePlateAlreadyExistsException(detail);
    }

    if (hint.includes('id') || hint.includes('(id)')) {
      throw new CarAlreadyExistsException(detail);
    }

    throw new DatabaseCarErrorException(error.message);
  }
}
