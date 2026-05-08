import { UserRole } from 'src/modules/user/entities/user.role';

/** Матрица: CRUD автомобилей/тарифов/геозон, списки всех поездок и нарушений. */
export const ADMIN_ROLES: UserRole[] = [
  UserRole.MANAGER,
  UserRole.SYSTEM_ADMIN,
];

export const ALL_APP_ROLES: UserRole[] = [
  UserRole.MANAGER,
  UserRole.DRIVER,
  UserRole.SYSTEM_ADMIN,
];
