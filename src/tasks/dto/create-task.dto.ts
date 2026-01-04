import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskTag } from '../../entities/task.entity';

export class CreateTaskDto {
    @ApiProperty({ example: 'Implement login page' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ example: 'Create a responsive login page using Material UI' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.OPEN })
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @ApiPropertyOptional({ enum: TaskTag, isArray: true })
    @IsOptional()
    @IsArray()
    @IsEnum(TaskTag, { each: true })
    tags?: TaskTag[];

    @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
    @IsOptional()
    @IsDateString()
    dueDate?: Date;

    @ApiProperty({ example: 'uuid-string' })
    @IsUUID()
    @IsNotEmpty()
    projectId: string;

    @ApiPropertyOptional({ type: [String], example: ['uuid-string-1', 'uuid-string-2'] })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    assigneeIds?: string[];
}
