import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT');
        const secureEnv = this.configService.get<string>('SMTP_SECURE');

        let secure = false;
        if (secureEnv !== undefined && secureEnv !== '') {
            secure = secureEnv === 'true';
        } else {
            secure = port === 465;
        }

        this.logger.log(`Configuring EmailService: Host=${host}, Port=${port}, Secure=${secure}`);

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendEmail(to: string, subject: string, text: string, html?: string) {
        // If no credentials, just log (for dev/demo purposes if env vars missing)
        if (!this.configService.get<string>('SMTP_HOST')) {
            this.logger.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
            return;
        }

        const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');

        try {
            await this.transporter.sendMail({
                from: `"MIS System" <${from}>`,
                to,
                subject,
                text,
                html,
            });
            this.logger.log(`Email sent to ${to} from ${from}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to} from ${from}`, error.stack);
        }
    }
}
