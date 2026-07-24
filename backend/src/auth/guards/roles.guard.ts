import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserApprovalStatus } from '../../common/enums/user-approval-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    if (user.approvalStatus !== UserApprovalStatus.APPROVED) {
      throw new ForbiddenException('User account is not approved');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        message: 'You do not have permission to access this resource',
        requiredRoles,
        currentRole: user.role,
      });
    }

    return true;
  }
}
