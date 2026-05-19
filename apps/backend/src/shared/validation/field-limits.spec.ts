import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FIELD_LIMITS } from '@carsharing/validation';
import { v4 as uuidv4 } from 'uuid';
import { describe, expect, it } from 'vitest';

import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { GeozoneVersionCreate } from 'src/modules/geozone/entities/dtos/geozone-version.create';
import { ViolationCreate } from 'src/modules/violation/entities/dtos/violation.create';
import { ViolationStatus } from 'src/modules/violation/entities/violation.status';

describe('FIELD_LIMITS on DTOs', () => {
  it('rejects register name shorter than USER_DISPLAY_NAME_MIN', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'ab',
      email: 'u@example.com',
      phone: '+79991234567',
      password: 'password1',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects register name longer than USER_DISPLAY_NAME_MAX', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'a'.repeat(FIELD_LIMITS.USER_DISPLAY_NAME_MAX + 1),
      email: 'u@example.com',
      phone: '+79991234567',
      password: 'password1',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects violation description longer than VIOLATION_DESCRIPTION_MAX', async () => {
    const dto = plainToInstance(ViolationCreate, {
      tripId: uuidv4(),
      type: ViolationStatus.SPEEDING,
      description: 'x'.repeat(FIELD_LIMITS.VIOLATION_DESCRIPTION_MAX + 1),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });

  it('rejects geozone version rules JSON over GEOZONE_RULES_JSON_MAX', async () => {
    const huge = { note: 'x'.repeat(FIELD_LIMITS.GEOZONE_RULES_JSON_MAX) };
    const dto = plainToInstance(GeozoneVersionCreate, {
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      },
      rules: huge,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'rules')).toBe(true);
  });
});
