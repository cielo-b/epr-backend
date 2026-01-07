import { Controller, Get, Post, Patch, Param, UseGuards, Request, Body, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PushNotificationService } from './push-notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly pushNotificationService: PushNotificationService,
    ) { }

    @Get()
    getMyNotifications(@Request() req) {
        return this.notificationsService.findAllForUser(req.user.id);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @Request() req) {
        return this.notificationsService.markAsRead(id, req.user.id);
    }

    @Patch('read-all')
    markAllAsRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }

    @Post('push/subscribe')
    subscribeToPush(@Request() req, @Body() subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
        return this.pushNotificationService.subscribe(req.user.id, subscription);
    }

    @Delete('push/unsubscribe')
    unsubscribeFromPush(@Request() req, @Body() body: { endpoint: string }) {
        return this.pushNotificationService.unsubscribe(req.user.id, body.endpoint);
    }

    @Get('push/subscriptions')
    getMyPushSubscriptions(@Request() req) {
        return this.pushNotificationService.getUserSubscriptions(req.user.id);
    }

    @Post('push/test')
    async testPush(@Request() req) {
        await this.notificationsService.notifyUser(
            req.user.id,
            'Test Notification',
            'If you see this, push notifications are working!',
            'SUCCESS'
        );
        return { message: 'Test notification sent' };
    }
}
