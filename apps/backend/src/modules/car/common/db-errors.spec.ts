import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { DbErrors } from './db-errors';
import { LicensePlateAlreadyExistsException } from './errors';

describe('DbErrors', () => {
  it('maps P2002 on license_plate to user-facing message', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`license_plate`)',
      { code: 'P2002', clientVersion: '0.0.0', meta: { target: ['license_plate'] } },
    );

    expect(() => DbErrors.mapError(prismaError)).toThrow(
      LicensePlateAlreadyExistsException,
    );
    expect(() => DbErrors.mapError(prismaError)).toThrow(
      'Автомобиль с таким госномером уже существует',
    );
    expect(() => DbErrors.mapError(prismaError)).not.toThrow(/prisma/i);
  });
});
