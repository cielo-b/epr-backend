import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({ example: 'E-Commerce Platform' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A comprehensive e-commerce solution' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.PLANNING })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'https://github.com/org/repo' })
  @IsOptional()
  @IsString()
  githubUrl?: string;

  @ApiPropertyOptional({ example: 'https://myapp.com' })
  @IsOptional()
  @IsString()
  deployUrl?: string;

  @ApiPropertyOptional({ example: 'Server: 192.168.1.1, User: root' })
  @IsOptional()
  @IsString()
  serverDetails?: string;

  @ApiPropertyOptional({ description: 'Project Manager ID (defaults to creator if not provided)' })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  devServerPort?: number;

  @ApiPropertyOptional({ example: 'https://prod.myapp.com' })
  @IsOptional()
  @IsString()
  productionUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDeployed?: boolean;

  @ApiPropertyOptional({ example: '/health' })
  @IsOptional()
  @IsString()
  healthCheckEndpoint?: string;

  @ApiPropertyOptional({ description: 'Development server ID' })
  @IsOptional()
  @IsString()
  devServerId?: string;

  @ApiPropertyOptional({ description: 'Production server ID' })
  @IsOptional()
  @IsString()
  productionServerId?: string;

  @ApiPropertyOptional({ example: 'DATABASE_URL=postgres://...\nPORT=3000' })
  @IsOptional()
  @IsString()
  envTemplate?: string;
}

