import { IsString, IsEnum, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';
import { AnnouncementPriority } from '../../entities/announcement.entity';

export class CreateAnnouncementDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsEnum(AnnouncementPriority)
    priority: AnnouncementPriority;

    @IsUUID()
    @IsOptional()
    projectId?: string;
}
