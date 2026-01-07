import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComponentType } from '../../entities/project-component.entity';

export class CreateProjectComponentDto {
    @ApiProperty({ example: 'Admin Dashboard' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ enum: ComponentType, default: ComponentType.OTHER })
    @IsEnum(ComponentType)
    @IsNotEmpty()
    type: ComponentType;

    @ApiPropertyOptional({ example: 'Main administration interface' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'https://github.com/org/repo' })
    @IsOptional()
    @IsString()
    repositoryUrl?: string;

    @ApiPropertyOptional({ example: 'https://admin.example.com' })
    @IsOptional()
    @IsString()
    productionUrl?: string;

    @ApiPropertyOptional({ example: 'https://staging-admin.example.com' })
    @IsOptional()
    @IsString()
    stagingUrl?: string;

    @ApiPropertyOptional({ example: 3001 })
    @IsOptional()
    @IsNumber()
    serverPort?: number;

    @ApiPropertyOptional({ example: '/health' })
    @IsOptional()
    @IsString()
    healthCheckEndpoint?: string;

    @ApiPropertyOptional({ example: ['React', 'TypeScript'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    techStack?: string[];

    @ApiPropertyOptional({ example: 'UP' })
    @IsOptional()
    @IsString()
    status?: string;
}
