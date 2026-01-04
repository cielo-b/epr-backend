import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../permissions/permissions.service';
import { PermissionResource, PermissionAction } from '../../entities/user-permission.entity';
import { UserRole } from '../../entities/user.entity';

export const PERMISSION_KEY = 'permission';
export const Permission = (resource: PermissionResource, action: PermissionAction) =>
    (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata(PERMISSION_KEY, { resource, action }, descriptor.value);
        return descriptor;
    };

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private permissionsService: PermissionsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const permission = this.reflector.get<{ resource: PermissionResource; action: PermissionAction }>(
            PERMISSION_KEY,
            context.getHandler(),
        );

        if (!permission) {
            // No permission decorator, allow access
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Admins bypass permission checks
        if ([UserRole.SUPERADMIN, UserRole.BOSS, UserRole.PROJECT_MANAGER].includes(user.role)) {
            return true;
        }

        // For VISITOR role, check granular permissions
        if (user.role === UserRole.VISITOR) {
            const resourceId = request.params.id || request.params.projectId || request.params.taskId;
            const hasPermission = await this.permissionsService.hasPermission(
                user.id,
                permission.resource,
                permission.action,
                resourceId,
            );

            if (!hasPermission) {
                throw new ForbiddenException('Insufficient permissions');
            }

            // Attach permission constraints to request for further filtering
            const constraints = await this.permissionsService.getPermissionConstraints(
                user.id,
                permission.resource,
                permission.action,
                resourceId,
            );
            request.permissionConstraints = constraints;

            return true;
        }

        // For other roles, use existing role-based logic
        return true;
    }
}
