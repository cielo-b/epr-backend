import { IsString, IsNotEmpty, IsDateString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateMilestoneDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    dueDate: string;

    @IsUUID()
    projectId: string;
}

export class UpdateMilestoneDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @IsBoolean()
    @IsOptional()
    isCompleted?: boolean;
}
