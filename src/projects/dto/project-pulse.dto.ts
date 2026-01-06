import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PulseStatus {
    ON_TRACK = 'ON_TRACK',
    DELAYED = 'DELAYED',
    COMPLETED = 'COMPLETED',
}

export class ProjectPulseDto {
    @ApiProperty({ enum: PulseStatus })
    @IsEnum(PulseStatus)
    status: PulseStatus;

    @ApiProperty({ example: 'Working on final touches.' })
    @IsOptional()
    @IsString()
    message?: string;
}
