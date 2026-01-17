import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermission, PermissionResource, PermissionAction } from '../entities/user-permission.entity';
import { CreatePermissionDto, UpdatePermissionDto, BulkCreatePermissionsDto } from './dto/permission.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class PermissionsService {
    constructor(
        @InjectRepository(UserPermission)
        private readonly permissionsRepository: Repository<UserPermission>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    /**
     * Check if user has permission for a specific action on a resource
     */
    async hasPermission(
        userId: string,
        resource: PermissionResource,
        action: PermissionAction,
        resourceId?: string,
    ): Promise<boolean> {
        // 1. Check direct permissions
        const query = this.permissionsRepository
            .createQueryBuilder('permission')
            .where('permission.userId = :userId', { userId })
            .andWhere('permission.resource = :resource', { resource })
            .andWhere('permission.action = :action', { action })
            .andWhere('(permission.expiresAt IS NULL OR permission.expiresAt > :now)', { now: new Date() });

        if (resourceId) {
            query.andWhere('(permission.resourceId = :resourceId OR permission.resourceId IS NULL)', { resourceId });
        } else {
            query.andWhere('permission.resourceId IS NULL');
        }

        const directPermission = await query.getOne();
        if (directPermission) return true;

        // 2. Check Custom Role permissions
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['customRole'],
        });

        if (user?.customRole) {
            const rolePermissions = user.customRole.permissions as any[];
            const modulePermission = rolePermissions.find(p => p.resource === resource);
            if (modulePermission && (modulePermission.actions.includes(action) || modulePermission.actions.includes('ALL'))) {
                // Scope Enforcement
                if (user.customRole.level === 'SYNOD') return true;

                // Check if the user's role scope matches their own assigned unit
                // (e.g., if role is for PRESBYTERY, ensure user belongs to that presbytery)
                if (user.customRole.level === 'PRESBYTERY' && user.presbyteryId !== user.customRole.targetId) return false;
                if (user.customRole.level === 'PARISH' && user.parishId !== user.customRole.targetId) return false;
                if (user.customRole.level === 'COMMUNITY' && user.communityId !== user.customRole.targetId) return false;

                return true;
            }
        }

        return false;
    }

    /**
     * Get all permissions for a user
     */
    async getUserPermissions(userId: string): Promise<UserPermission[]> {
        return this.permissionsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Get permission constraints for a specific resource
     */
    async getPermissionConstraints(
        userId: string,
        resource: PermissionResource,
        action: PermissionAction,
        resourceId?: string,
    ): Promise<Record<string, any> | null> {
        const query = this.permissionsRepository
            .createQueryBuilder('permission')
            .where('permission.userId = :userId', { userId })
            .andWhere('permission.resource = :resource', { resource })
            .andWhere('permission.action = :action', { action })
            .andWhere('(permission.expiresAt IS NULL OR permission.expiresAt > :now)', { now: new Date() });

        if (resourceId) {
            query.andWhere('(permission.resourceId = :resourceId OR permission.resourceId IS NULL)', { resourceId });
        }

        const permission = await query.getOne();
        return permission?.constraints || null;
    }

    /**
     * Get all resource IDs a user has access to for a specific resource type
     */
    async getAccessibleResourceIds(
        userId: string,
        resource: PermissionResource,
        action: PermissionAction,
    ): Promise<string[]> {
        const permissions = await this.permissionsRepository.find({
            where: { userId, resource, action },
        });

        // If any permission has null resourceId, user has access to all
        if (permissions.some(p => p.resourceId === null)) {
            return ['*']; // Special marker for "all resources"
        }

        return permissions
            .filter(p => p.resourceId !== null)
            .map(p => p.resourceId as string);
    }

    /**
     * Create a new permission
     */
    async create(createPermissionDto: CreatePermissionDto, grantedBy: string): Promise<UserPermission> {
        const permission = this.permissionsRepository.create({
            ...createPermissionDto,
            grantedBy,
            expiresAt: createPermissionDto.expiresAt ? new Date(createPermissionDto.expiresAt) : null,
        });
        return this.permissionsRepository.save(permission);
    }

    /**
     * Bulk create permissions for a user
     */
    async bulkCreate(bulkDto: BulkCreatePermissionsDto, grantedBy: string): Promise<UserPermission[]> {
        const permissions = bulkDto.permissions.map(p =>
            this.permissionsRepository.create({
                userId: bulkDto.userId,
                ...p,
                grantedBy,
            }),
        );
        return this.permissionsRepository.save(permissions);
    }

    /**
     * Update permission constraints
     */
    async update(id: string, updateDto: UpdatePermissionDto): Promise<UserPermission> {
        await this.permissionsRepository.update(id, {
            constraints: updateDto.constraints,
            expiresAt: updateDto.expiresAt ? new Date(updateDto.expiresAt) : undefined,
        });
        return this.permissionsRepository.findOneOrFail({ where: { id } });
    }

    /**
     * Delete a permission
     */
    async delete(id: string): Promise<void> {
        await this.permissionsRepository.delete(id);
    }

    /**
     * Delete all permissions for a user
     */
    async deleteAllUserPermissions(userId: string): Promise<void> {
        await this.permissionsRepository.delete({ userId });
    }

    /**
     * Delete specific permission by criteria
     */
    async deleteByCriteria(
        userId: string,
        resource: PermissionResource,
        action: PermissionAction,
        resourceId?: string,
    ): Promise<void> {
        const query: any = { userId, resource, action };
        if (resourceId) {
            query.resourceId = resourceId;
        }
        await this.permissionsRepository.delete(query);
    }

    /**
     * Get scope constraints for a user to filter database queries
     */
    async getScopeConstraints(userId: string): Promise<{
        level: 'SYNOD' | 'PRESBYTERY' | 'PARISH' | 'COMMUNITY' | 'NONE';
        targetId?: string;
    }> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['customRole'],
        });

        if (!user?.customRole) {
            return { level: 'NONE' };
        }

        return {
            level: user.customRole.level as any,
            targetId: user.customRole.targetId,
        };
    }
}
