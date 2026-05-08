import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../auth.constants';
import type { AuthenticatedUser } from '../types/authenticated-user';
import type { UserRole } from 'src/modules/user/entities/user.role';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Forbidden');
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Forbidden');
    }
    return true;
  }
}
