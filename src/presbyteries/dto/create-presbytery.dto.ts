import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePresbyteryDto {
    @ApiProperty({ description: 'Name of the presbytery' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Description of the presbytery' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Location/Region' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'Region' })
    @IsOptional()
    @IsString()
    region?: string;

    @ApiPropertyOptional({ description: 'Leader ID (User)' })
    @IsOptional()
    @IsString()
    leaderId?: string;

    @ApiPropertyOptional({ description: 'Leader name' })
    @IsOptional()
    @IsString()
    leaderName?: string;

    @ApiPropertyOptional({ description: 'Leader email' })
    @IsOptional()
    @IsEmail()
    leaderEmail?: string;

    @ApiPropertyOptional({ description: 'Leader phone' })
    @IsOptional()
    @IsString()
    leaderPhone?: string;

    @ApiPropertyOptional({ description: 'Office address' })
    @IsOptional()
    @IsString()
    officeAddress?: string;

    @ApiPropertyOptional({ description: 'Office phone' })
    @IsOptional()
    @IsString()
    officePhone?: string;

    @ApiPropertyOptional({ description: 'Office email' })
    @IsOptional()
    @IsEmail()
    officeEmail?: string;

    @ApiPropertyOptional({ description: 'Is active', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
