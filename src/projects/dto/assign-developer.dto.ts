import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignDeveloperDto {
  @ApiProperty({ example: 'uuid-of-developer', required: false })
  @IsOptional()
  @IsString()
  developerId?: string;

  @ApiPropertyOptional({ example: ['uuid-1', 'uuid-2'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  developerIds?: string[];

  @ApiPropertyOptional({ example: 'Assigned to work on payment integration' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Backend' })
  @IsOptional()
  @IsString()
  role?: string;
}

