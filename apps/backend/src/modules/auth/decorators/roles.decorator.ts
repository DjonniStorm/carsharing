import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../auth.constants';
import type { UserRole } from 'src/modules/user/entities/user.role';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
