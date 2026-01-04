import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from '../entities/notification.entity';
import { EmailModule } from '../email/email.module';
import { User } from '../entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, User]),
        EmailModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsGateway],
    exports: [NotificationsService],
})
export class NotificationsModule { }
