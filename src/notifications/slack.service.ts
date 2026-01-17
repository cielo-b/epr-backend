import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackService {
    private readonly logger = new Logger(SlackService.name);
    private readonly webhookUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.webhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
        if (!this.webhookUrl) {
            this.logger.warn('SLACK_WEBHOOK_URL is not defined. Slack notifications will be disabled.');
        }
    }

    async sendNotification(title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') {
        if (!this.webhookUrl) return;

        const colorMap = {
            INFO: '#36a64f',    // Green-ish
            SUCCESS: '#2EB67D', // Success Green
            WARNING: '#ECB22E', // Warning Yellow
            ERROR: '#E01E5A',   // Error Red
        };

        const payload = {
            attachments: [
                {
                    color: colorMap[type] || '#36a64f',
                    title: title,
                    text: message,
                    footer: 'EPR System Notification',
                    ts: Math.floor(Date.now() / 1000),
                },
            ],
        };

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                this.logger.error(`Failed to send Slack notification: ${response.statusText}`);
            }
        } catch (error) {
            this.logger.error('Error sending Slack notification', error);
        }
    }
}
