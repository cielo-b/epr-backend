import { IsEnum, IsOptional, IsString, IsObject, IsDateString } from 'class-validator';
import { PermissionResource, PermissionAction } from '../../entities/user-permission.entity';

export class CreatePermissionDto {
    @IsString()
    userId: string;

    @IsEnum(PermissionResource)
    resource: PermissionResource;

    @IsEnum(PermissionAction)
    action: PermissionAction;

    @IsOptional()
    @IsString()
    resourceId?: string;

    @IsOptional()
    @IsObject()
    constraints?: Record<string, any>;

    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

export class UpdatePermissionDto {
    @IsOptional()
    @IsObject()
    constraints?: Record<string, any>;

    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

export class BulkCreatePermissionsDto {
    @IsString()
    userId: string;

    permissions: Array<{
        resource: PermissionResource;
        action: PermissionAction;
        resourceId?: string;
        constraints?: Record<string, any>;
    }>;
}
