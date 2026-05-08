import { BadRequestException } from '@nestjs/common';

export function parseDateQuery(
  raw: string | undefined,
  field: string,
): Date | undefined {
  if (!raw || raw.trim() === '') {
    return undefined;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} must be a valid date`);
  }
  return parsed;
}

export function parseIntQuery(
  raw: string | undefined,
  field: string,
): number | undefined {
  if (!raw || raw.trim() === '') {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new BadRequestException(`${field} must be a non-negative integer`);
  }
  return value;
}
