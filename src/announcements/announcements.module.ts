import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { Announcement } from '../entities/announcement.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Announcement, User]),
        NotificationsModule
    ],
    controllers: [AnnouncementsController],
    providers: [AnnouncementsService],
    exports: [AnnouncementsService],
})
export class AnnouncementsModule { }
