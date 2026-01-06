import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServerType } from '../../entities/server.entity';

export class CreateServerDto {
    @ApiProperty({ example: 'Production DB' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '192.168.1.100' })
    @IsString()
    @IsNotEmpty()
    ipAddress: string;

    @ApiPropertyOptional({ example: 22 })
    @IsOptional()
    @IsNumber()
    port?: number;

    @ApiPropertyOptional({ example: 'ubuntu' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({ enum: ServerType, default: ServerType.OTHER })
    @IsOptional()
    @IsEnum(ServerType)
    type?: ServerType;

    @ApiPropertyOptional({ example: 'Primary database server' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: '/home/user/.ssh/id_rsa' })
    @IsOptional()
    @IsString()
    sshKeyPath?: string;

    @ApiPropertyOptional({ example: 'https://monitoring.example.com' })
    @IsOptional()
    @IsString()
    monitoringUrl?: string;

    @ApiPropertyOptional({ example: 8 })
    @IsOptional()
    @IsNumber()
    cpuCores?: number;

    @ApiPropertyOptional({ example: 32 })
    @IsOptional()
    @IsNumber()
    ramGB?: number;

    @ApiPropertyOptional({ example: 500 })
    @IsOptional()
    @IsNumber()
    diskGB?: number;

    @ApiPropertyOptional({ example: 'Additional server configuration notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}
