import { IsString, IsOptional, IsEnum, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SacramentType {
    BAPTISM = 'BAPTISM',
    CONFIRMATION = 'CONFIRMATION',
    MARRIAGE = 'MARRIAGE',
    HOLY_COMMUNION = 'HOLY_COMMUNION',
}

export class CreateSacramentDto {
    @ApiProperty({ enum: SacramentType, description: 'Sacrament type' })
    @IsEnum(SacramentType)
    type: SacramentType;

    @ApiProperty({ description: 'Date of sacrament' })
    @IsDateString()
    date: Date;

    @ApiProperty({ description: 'Member ID (recipient)' })
    @IsString()
    memberId: string;

    @ApiPropertyOptional({ description: 'Member name' })
    @IsOptional()
    @IsString()
    memberName?: string;

    @ApiProperty({ description: 'Parish ID where sacrament was performed' })
    @IsString()
    parishId: string;

    @ApiPropertyOptional({ description: 'Location/Church name' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'Officiating clergy ID' })
    @IsOptional()
    @IsString()
    officiantId?: string;

    @ApiPropertyOptional({ description: 'Officiating clergy name' })
    @IsOptional()
    @IsString()
    officiantName?: string;

    @ApiPropertyOptional({ description: 'Certificate number' })
    @IsOptional()
    @IsString()
    certificateNumber?: string;

    // Baptism specific fields
    @ApiPropertyOptional({ description: 'Baptism: Father name' })
    @IsOptional()
    @IsString()
    fatherName?: string;

    @ApiPropertyOptional({ description: 'Baptism: Mother name' })
    @IsOptional()
    @IsString()
    motherName?: string;

    @ApiPropertyOptional({ description: 'Baptism: Godparents', type: 'array' })
    @IsOptional()
    @IsArray()
    godparents?: string[];

    // Confirmation specific fields
    @ApiPropertyOptional({ description: 'Confirmation: Sponsor name' })
    @IsOptional()
    @IsString()
    sponsorName?: string;

    @ApiPropertyOptional({ description: 'Confirmation: Confirmation name' })
    @IsOptional()
    @IsString()
    confirmationName?: string;

    // Marriage specific fields
    @ApiPropertyOptional({ description: 'Marriage: Spouse ID' })
    @IsOptional()
    @IsString()
    spouseId?: string;

    @ApiPropertyOptional({ description: 'Marriage: Spouse name' })
    @IsOptional()
    @IsString()
    spouseName?: string;

    @ApiPropertyOptional({ description: 'Marriage: Witnesses', type: 'array' })
    @IsOptional()
    @IsArray()
    witnesses?: string[];

    @ApiPropertyOptional({ description: 'Marriage: Marriage certificate number' })
    @IsOptional()
    @IsString()
    marriageCertificateNumber?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}
