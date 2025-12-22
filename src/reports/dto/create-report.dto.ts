import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ example: 'Monthly Progress Report' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'This month we completed...' })
  @IsString()
  @MinLength(10)
  content: string;

  @ApiProperty({ example: 'PROJECT_REPORT', description: 'Report type (PROJECT_REPORT, USER_REPORT, SYSTEM_REPORT, etc.)' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: 'uuid-of-project' })
  @IsOptional()
  @IsString()
  projectId?: string;
}

