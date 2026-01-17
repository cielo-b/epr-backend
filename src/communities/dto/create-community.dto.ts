import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommunityDto {
    @ApiProperty({ description: 'Community name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Unique community code' })
    @IsString()
    code: string;

    @ApiPropertyOptional({ description: 'Description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Parish ID' })
    @IsString()
    parishId: string;

    @ApiPropertyOptional({ description: 'Location/Area' })
    @IsOptional()
    @IsString()
    location?: string;

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

    @ApiPropertyOptional({ description: 'Leader ID (User)' })
    @IsOptional()
    @IsString()
    leaderId?: string;

    @ApiPropertyOptional({ description: 'Leader name' })
    @IsOptional()
    @IsString()
    leaderName?: string;

    @ApiPropertyOptional({ description: 'Leader phone' })
    @IsOptional()
    @IsString()
    leaderPhone?: string;

    @ApiPropertyOptional({ description: 'Leader email' })
    @IsOptional()
    @IsString()
    leaderEmail?: string;

    @ApiPropertyOptional({ description: 'Assistant leader ID' })
    @IsOptional()
    @IsString()
    assistantLeaderId?: string;

    @ApiPropertyOptional({ description: 'Assistant leader name' })
    @IsOptional()
    @IsString()
    assistantLeaderName?: string;

    @ApiPropertyOptional({ description: 'Meeting schedule', type: 'array' })
    @IsOptional()
    @IsArray()
    meetingSchedule?: { day: string; time: string; location: string }[];

    @ApiPropertyOptional({ description: 'Is active', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
