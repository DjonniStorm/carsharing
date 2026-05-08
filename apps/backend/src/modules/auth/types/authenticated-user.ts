import type { UserRole } from 'src/modules/user/entities/user.role';

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
  email?: string;
};
