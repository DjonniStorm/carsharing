/** Совпадает с `@db.Uuid()` в Prisma для id поездки и связанных сущностей. */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidString(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}
