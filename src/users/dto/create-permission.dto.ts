import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PermissionAction, PermissionResource } from '../../entities/user-permission.entity';

export class CreatePermissionDto {
    @ApiProperty({ enum: PermissionResource })
    @IsEnum(PermissionResource)
    resource: PermissionResource;

    @ApiProperty({ enum: PermissionAction })
    @IsEnum(PermissionAction)
    action: PermissionAction;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    resourceId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    constraints?: Record<string, any>;
}
