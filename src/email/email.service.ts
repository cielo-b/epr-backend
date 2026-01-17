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
        if (!this.configService.get<string>('SMTP_HOST')) {
            this.logger.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
            return;
        }

        const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
        const content = html || `<p>${text.replace(/\n/g, '<br>')}</p>`;
        const brandedHtml = this.generateEmailTemplate(subject, content);

        try {
            await this.transporter.sendMail({
                from: `"EPR Church Management" <${from}>`,
                to,
                subject,
                text,
                html: brandedHtml,
            });
            this.logger.log(`Email sent to ${to} from ${from}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to} from ${from}`, error.stack);
        }
    }

    async sendInvitation(email: string, token: string) {
        const resetLink = `${this.configService.get('FRONTEND_URL')}/auth/set-password?token=${token}`;
        const subject = 'Invitation to EPR System';
        const content = `
            <h2 style="color: #008751; margin-top: 0;">You have been invited to the EPR System</h2>
            <p style="font-size: 16px; color: #374151;">An account has been created for you. Please click the button below to set your password and access the system.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #008751; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Set Password</a>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #4b5563; word-break: break-all;">${resetLink}</p>
        `;
        await this.sendEmail(email, subject, `Invitation to EPR System`, content);
    }

    async sendPasswordResetEmail(email: string, token: string, firstName: string) {
        const resetLink = `${this.configService.get('FRONTEND_URL')}/auth/set-password?token=${token}`;
        const subject = 'Password Reset Request';
        const content = `
            <h2 style="color: #008751; margin-top: 0;">Password Reset Request</h2>
            <p style="font-size: 16px; color: #374151;">Hello ${firstName},</p>
            <p style="font-size: 16px; color: #374151;">We received a request to reset your password for the EPR Church Management System. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #008751; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you did not request this, you can safely ignore this email.</p>
            <p style="font-size: 12px; color: #4b5563; word-break: break-all;">${resetLink}</p>
        `;
        await this.sendEmail(email, subject, `Password Reset Request`, content);
    }

    async sendWelcomeEmail(user: any) {
        const subject = 'Welcome to EPR Church Management System';
        const content = `
            <h2 style="color: #008751; margin-top: 0;">Welcome to the Ministry, ${user.firstName}!</h2>
            <p style="font-size: 16px; color: #374151;">Your account as a <b>${user.role}</b> has been successfully provisioned on the central church administration portal.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${this.configService.get('FRONTEND_URL')}/login" style="background-color: #008751; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Access Your Portal</a>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">Email: ${user.email}</p>
        `;
        await this.sendEmail(user.email, subject, `Welcome to EPR, ${user.firstName}!`, content);
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
        body { font-family: 'Inter', sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); margin-top: 40px; margin-bottom: 40px; border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #008751 0%, #005f39 100%); padding: 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
        .content { padding: 40px; }
        .footer { background-color: #f1f5f9; padding: 25px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .copyright { font-weight: bold; color: #475569; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Eglise Presbyterienne au Rwanda</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p class="copyright">&copy; ${year} Eglise Presbyterienne au Rwanda (EPR)</p>
            <p>Adminstrative Headquarters: Kigali, Rwanda</p>
            <p>This is a secure automated notification from the EPR MIS Central Server.</p>
        </div>
    </div>
</body>
</html>
        `;
    }
}
