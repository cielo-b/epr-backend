import { IsString, IsOptional, IsEmail, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, MaritalStatus, MemberStatus } from '../../entities/member.entity';

export class CreateMemberDto {
    @ApiProperty({ description: 'Membership number (unique)' })
    @IsString()
    membershipNumber: string;

    @ApiProperty({ description: 'First name' })
    @IsString()
    firstName: string;

    @ApiProperty({ description: 'Last name' })
    @IsString()
    lastName: string;

    @ApiPropertyOptional({ description: 'Middle name' })
    @IsOptional()
    @IsString()
    middleName?: string;

    @ApiProperty({ description: 'Date of birth' })
    @IsDateString()
    dateOfBirth: string;

    @ApiProperty({ description: 'Gender', enum: Gender })
    @IsEnum(Gender)
    gender: Gender;

    @ApiPropertyOptional({ description: 'National ID' })
    @IsOptional()
    @IsString()
    nationalId?: string;

    @ApiPropertyOptional({ description: 'Phone number' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: 'Email address' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'Physical address' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Sector' })
    @IsOptional()
    @IsString()
    sector?: string;

    @ApiPropertyOptional({ description: 'Cell' })
    @IsOptional()
    @IsString()
    cell?: string;

    @ApiPropertyOptional({ description: 'Village' })
    @IsOptional()
    @IsString()
    village?: string;

    @ApiProperty({ description: 'Parish ID' })
    @IsString()
    parishId: string;

    @ApiPropertyOptional({ description: 'Community ID' })
    @IsOptional()
    @IsString()
    communityId?: string;

    @ApiPropertyOptional({ description: 'Marital status', enum: MaritalStatus })
    @IsOptional()
    @IsEnum(MaritalStatus)
    maritalStatus?: MaritalStatus;

    @ApiPropertyOptional({ description: 'Spouse name' })
    @IsOptional()
    @IsString()
    spouseName?: string;

    @ApiPropertyOptional({ description: 'Occupation' })
    @IsOptional()
    @IsString()
    occupation?: string;

    @ApiPropertyOptional({ description: 'Employer' })
    @IsOptional()
    @IsString()
    employer?: string;

    @ApiPropertyOptional({ description: 'Baptism date' })
    @IsOptional()
    @IsDateString()
    baptismDate?: string;

    @ApiPropertyOptional({ description: 'Baptism parish' })
    @IsOptional()
    @IsString()
    baptismParish?: string;

    @ApiPropertyOptional({ description: 'Confirmation date' })
    @IsOptional()
    @IsDateString()
    confirmationDate?: string;

    @ApiPropertyOptional({ description: 'Confirmation parish' })
    @IsOptional()
    @IsString()
    confirmationParish?: string;

    @ApiPropertyOptional({ description: 'Marriage date' })
    @IsOptional()
    @IsDateString()
    marriageDate?: string;

    @ApiPropertyOptional({ description: 'Marriage parish' })
    @IsOptional()
    @IsString()
    marriageParish?: string;

    @ApiProperty({ description: 'Membership date (joined this parish)' })
    @IsDateString()
    membershipDate: string;

    @ApiPropertyOptional({ description: 'Member status', enum: MemberStatus })
    @IsOptional()
    @IsEnum(MemberStatus)
    status?: MemberStatus;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Photo URL' })
    @IsOptional()
    @IsString()
    photoUrl?: string;
}
