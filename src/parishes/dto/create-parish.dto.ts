import { IsString, IsOptional, IsEmail, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateParishDto {
    @ApiProperty({ description: 'Name of the parish' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Unique parish code (auto-generated if not provided)' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ description: 'Description of the parish' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Presbytery ID' })
    @IsString()
    presbyteryId: string;

    @ApiPropertyOptional({ description: 'Location' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'District' })
    @IsOptional()
    @IsString()
    district?: string;

    @ApiPropertyOptional({ description: 'Sector' })
    @IsOptional()
    @IsString()
    sector?: string;

    @ApiPropertyOptional({ description: 'Pastor ID (User)' })
    @IsOptional()
    @IsString()
    pastorId?: string;

    @ApiPropertyOptional({ description: 'Pastor name' })
    @IsOptional()
    @IsString()
    pastorName?: string;

    @ApiPropertyOptional({ description: 'Pastor email' })
    @IsOptional()
    @IsEmail()
    pastorEmail?: string;

    @ApiPropertyOptional({ description: 'Pastor phone' })
    @IsOptional()
    @IsString()
    pastorPhone?: string;

    @ApiPropertyOptional({ description: 'Administrator ID (User)' })
    @IsOptional()
    @IsString()
    administratorId?: string;

    @ApiPropertyOptional({ description: 'Administrator name' })
    @IsOptional()
    @IsString()
    administratorName?: string;

    @ApiPropertyOptional({ description: 'Church address' })
    @IsOptional()
    @IsString()
    churchAddress?: string;

    @ApiPropertyOptional({ description: 'Church phone' })
    @IsOptional()
    @IsString()
    churchPhone?: string;

    @ApiPropertyOptional({ description: 'Church email' })
    @IsOptional()
    @IsEmail()
    churchEmail?: string;

    @ApiPropertyOptional({ description: 'Founded date' })
    @IsOptional()
    @IsDateString()
    foundedDate?: string;

    @ApiPropertyOptional({ description: 'Service schedule', type: 'array' })
    @IsOptional()
    @IsArray()
    serviceSchedule?: { day: string; time: string; type: string }[];

    @ApiPropertyOptional({ description: 'Is active', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
