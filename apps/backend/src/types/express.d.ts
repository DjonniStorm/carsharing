import type { AuthenticatedUser } from 'src/modules/auth/types/authenticated-user';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthenticatedUser {}
  }
}

export {};
