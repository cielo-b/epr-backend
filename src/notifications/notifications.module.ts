import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from '../entities/notification.entity';
import { EmailModule } from '../email/email.module';
import { User } from '../entities/user.entity';
import { PushSubscription } from '../entities/push-subscription.entity';
import { SlackService } from './slack.service';
import { PushNotificationService } from './push-notification.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, User, PushSubscription]),
        EmailModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsGateway, SlackService, PushNotificationService],
    exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule { }
