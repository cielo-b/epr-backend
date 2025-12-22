import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignDeveloperDto {
  @ApiProperty({ example: 'uuid-of-developer' })
  @IsString()
  developerId: string;

  @ApiPropertyOptional({ example: 'Assigned to work on payment integration' })
  @IsOptional()
  @IsString()
  notes?: string;
}

