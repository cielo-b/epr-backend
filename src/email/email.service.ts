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

        // Wrap content in branded template if no specific HTML is provided
        // If HTML is provided, we assume it's just the body content and we wrap it too, 
        // unless we want full control. For consistency, let's wrap everything.
        const content = html || `<p>${text.replace(/\n/g, '<br>')}</p>`;
        const brandedHtml = this.generateEmailTemplate(subject, content);

        try {
            await this.transporter.sendMail({
                from: `"RMSoft MIS" <${from}>`,
                to,
                subject,
                text, // Fallback text
                html: brandedHtml,
            });
            this.logger.log(`Email sent to ${to} from ${from}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to} from ${from}`, error.stack);
        }
    }

    async sendInvitation(email: string, token: string) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4001';
        const link = `${frontendUrl}/auth/set-password?token=${token}`;
        const subject = 'Welcome to RMSoft MIS - Set your Password';

        const content = `
            <h2 style="color: #1f7a59; margin-top: 0;">Welcome to RMSoft MIS</h2>
            <p style="font-size: 16px; color: #374151;">Your account has been created successfully. To get started, please set your password by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" style="background-color: #1f7a59; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Set Your Password</a>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">Or copy this link to your browser:</p>
            <p style="font-size: 14px; color: #6b7280; word-break: break-all;">${link}</p>
        `;

        await this.sendEmail(email, subject, `Welcome! Set your password here: ${link}`, content);
    }

    private generateEmailTemplate(title: string, content: string): string {
        const year = new Date().getFullYear();
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-top: 40px; margin-bottom: 40px; }
        .header { background-color: #1f7a59; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
        .content { padding: 40px 30px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        a { color: #1f7a59; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RMSoft MIS</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${year} RMSoft Ltd. All rights reserved.</p>
            <p>This is an automated message, please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
        `;
    }
}
