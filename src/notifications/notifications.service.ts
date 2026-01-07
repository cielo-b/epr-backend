import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { SlackService } from './slack.service';
import { User } from '../entities/user.entity';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationsRepository: Repository<Notification>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly notificationsGateway: NotificationsGateway,
        private readonly emailService: EmailService,
        private readonly slackService: SlackService,
    ) { }

    async notifyUser(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') {
        // 1. Save to DB
        const notification = this.notificationsRepository.create({
            userId,
            title,
            message,
            type,
        });
        const saved = await this.notificationsRepository.save(notification);

        // 2. Emit via WebSocket
        this.notificationsGateway.sendToUser(userId, saved);

        // 3. Send Email
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (user && user.email) {
            await this.emailService.sendEmail(
                user.email,
                `Notification: ${title}`,
                message,
            );
        }

        // 4. Send to Slack (Global or User-specific if configured)
        // For now, mirroring important notifications or all notifications to a central channel
        let slackMessage = message;
        if (user) {
            slackMessage = `*Recipient: ${user.firstName} ${user.lastName}*\n${message}`;
        }
        await this.slackService.sendNotification(title, slackMessage, type);

        return saved;
    }

    async findAllForUser(userId: string) {
        return this.notificationsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async markAsRead(id: string, userId: string) {
        await this.notificationsRepository.update({ id, userId }, { isRead: true });
        return { message: 'Marked as read' };
    }

    async markAllAsRead(userId: string) {
        await this.notificationsRepository.update({ userId, isRead: false }, { isRead: true });
        return { message: 'All marked as read' };
    }
}
