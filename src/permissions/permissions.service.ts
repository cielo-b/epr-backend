import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermission, PermissionResource, PermissionAction } from '../entities/user-permission.entity';
import { CreatePermissionDto, UpdatePermissionDto, BulkCreatePermissionsDto } from './dto/permission.dto';

@Injectable()
export class PermissionsService {
    constructor(
        @InjectRepository(UserPermission)
        private readonly permissionsRepository: Repository<UserPermission>,
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
        const query = this.permissionsRepository
            .createQueryBuilder('permission')
            .where('permission.userId = :userId', { userId })
            .andWhere('permission.resource = :resource', { resource })
            .andWhere('permission.action = :action', { action })
            .andWhere('(permission.expiresAt IS NULL OR permission.expiresAt > :now)', { now: new Date() });

        if (resourceId) {
            // Check for specific resource permission OR general permission (resourceId is null)
            query.andWhere('(permission.resourceId = :resourceId OR permission.resourceId IS NULL)', { resourceId });
        } else {
            // Only check general permissions
            query.andWhere('permission.resourceId IS NULL');
        }

        const permission = await query.getOne();
        return !!permission;
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
}
