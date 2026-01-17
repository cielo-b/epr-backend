import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from '../entities/push-subscription.entity';

@Injectable()
export class PushNotificationService {
    private readonly logger = new Logger(PushNotificationService.name);

    constructor(
        @InjectRepository(PushSubscription)
        private readonly subscriptionRepository: Repository<PushSubscription>,
        private readonly configService: ConfigService,
    ) {
        const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
        const vapidSubject = this.configService.get<string>('VAPID_SUBJECT') || 'mailto:admin@epr.rw';

        if (vapidPublicKey && vapidPrivateKey) {
            webpush.setVapidDetails(
                vapidSubject,
                vapidPublicKey,
                vapidPrivateKey
            );
            this.logger.log('Web Push configured successfully');
        } else {
            this.logger.warn('VAPID keys not configured. Push notifications will be disabled.');
        }
    }

    async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
        try {
            // Check if subscription already exists
            const existing = await this.subscriptionRepository.findOne({
                where: { endpoint: subscription.endpoint }
            });

            if (existing) {
                this.logger.log(`Subscription already exists for user ${userId}`);
                return existing;
            }

            // Create new subscription
            const newSubscription = this.subscriptionRepository.create({
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            });

            const saved = await this.subscriptionRepository.save(newSubscription);
            this.logger.log(`New push subscription created for user ${userId}`);
            return saved;
        } catch (error) {
            this.logger.error('Error saving push subscription', error);
            throw error;
        }
    }

    async unsubscribe(userId: string, endpoint: string) {
        try {
            await this.subscriptionRepository.delete({ userId, endpoint });
            this.logger.log(`Push subscription removed for user ${userId}`);
            return { message: 'Unsubscribed successfully' };
        } catch (error) {
            this.logger.error('Error removing push subscription', error);
            throw error;
        }
    }

    async sendPushNotification(userId: string, payload: { title: string; body: string; icon?: string; data?: any }) {
        try {
            const subscriptions = await this.subscriptionRepository.find({ where: { userId } });

            if (subscriptions.length === 0) {
                this.logger.debug(`No push subscriptions found for user ${userId}`);
                return;
            }

            const notificationPayload = JSON.stringify({
                title: payload.title,
                body: payload.body,
                icon: payload.icon || '/logo.png',
                badge: '/logo.png',
                data: payload.data || {},
                timestamp: Date.now(),
            });

            const promises = subscriptions.map(async (subscription) => {
                try {
                    const pushSubscription = {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.p256dh,
                            auth: subscription.auth,
                        },
                    };

                    await webpush.sendNotification(pushSubscription, notificationPayload);
                    this.logger.debug(`Push notification sent to ${subscription.endpoint}`);
                } catch (error: any) {
                    // If subscription is no longer valid, remove it
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        this.logger.warn(`Removing invalid subscription: ${subscription.endpoint}`);
                        await this.subscriptionRepository.delete(subscription.id);
                    } else {
                        this.logger.error(`Error sending push notification: ${error.message}`);
                    }
                }
            });

            await Promise.all(promises);
            this.logger.log(`Push notifications sent to ${subscriptions.length} device(s) for user ${userId}`);
        } catch (error) {
            this.logger.error('Error in sendPushNotification', error);
        }
    }

    async getUserSubscriptions(userId: string) {
        return this.subscriptionRepository.find({ where: { userId } });
    }
}
