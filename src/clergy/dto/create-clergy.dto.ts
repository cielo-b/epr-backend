import { IsString, IsEmail, IsEnum, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClergyRank, ClergyStatus } from '../../entities/clergy.entity';
import { Type } from 'class-transformer';

class PreviousAssignmentDto {
    @ApiProperty()
    @IsString()
    position: string;

    @ApiProperty()
    @IsString()
    location: string;

    @ApiProperty()
    @IsDateString()
    startDate: string;

    @ApiProperty()
    @IsDateString()
    endDate: string;
}

export class CreateClergyDto {
    @ApiProperty()
    @IsString()
    clergyNumber: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    middleName?: string;

    @ApiProperty()
    @IsDateString()
    dateOfBirth: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    nationalId?: string;

    @ApiProperty()
    @IsString()
    phone: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ enum: ClergyRank })
    @IsEnum(ClergyRank)
    rank: ClergyRank;

    @ApiProperty()
    @IsDateString()
    ordinationDate: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    ordinationPlace?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    theologicalEducation?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    graduationDate?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    specialization?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    currentAssignment?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    parishId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    presbyteryId?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    assignmentDate?: string;

    @ApiPropertyOptional({ type: [PreviousAssignmentDto] })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PreviousAssignmentDto)
    previousAssignments?: PreviousAssignmentDto[];

    @ApiPropertyOptional({ enum: ClergyStatus })
    @IsEnum(ClergyStatus)
    @IsOptional()
    status?: ClergyStatus;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    spouseName?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    numberOfChildren?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    photoUrl?: string;
}
