import { Prisma } from '@prisma/client';
import {
  DatabaseUserErrorException,
  EmailAlreadyExistsException,
  PhoneAlreadyExistsException,
  UserAlreadyExistsException,
  UserNotFoundException,
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
          throw new UserNotFoundException('Пользователь не найден');

        default:
          throw new DatabaseUserErrorException(
            'Ошибка базы данных пользователя',
          );
      }
    }

    throw error;
  }

  private static handleP2002Error(
    error: Prisma.PrismaClientKnownRequestError,
  ): never {
    const target = this.p2002TargetString(error).toLowerCase();
    const cause = error.meta?.cause as { originalMessage?: string } | undefined;
    const detail = cause?.originalMessage ?? error.message;

    if (target.includes('email')) {
      throw new EmailAlreadyExistsException(detail);
    }

    if (target.includes('phone')) {
      throw new PhoneAlreadyExistsException(detail);
    }

    if (target.includes('id')) {
      throw new UserAlreadyExistsException(detail);
    }

    throw new DatabaseUserErrorException(error.message);
  }
}
