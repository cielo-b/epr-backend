import { IsString, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { AnnouncementPriority } from '../../entities/announcement.entity';

export class CreateAnnouncementDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsEnum(AnnouncementPriority)
    priority: AnnouncementPriority;

    @IsUUID()
    projectId: string;
}
