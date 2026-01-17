import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT'),
            secure: this.configService.get('SMTP_SECURE') === 'true',
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }

    async sendEmail(to: string, subject: string, text: string, html?: string) {
        try {
            const info = await this.transporter.sendMail({
                from: `"EPR System" <${this.configService.get('SMTP_USER')}>`,
                to,
                subject,
                text,
                html,
            });
            return info;
        } catch (error) {
            console.error('Email send failed:', error);
            // Don't throw if email fails, just log it for now
        }
    }

    async sendWelcomeEmail(user: any) {
        const subject = 'Welcome to EPR Church Management System';
        const html = `
            <h1>Welcome, ${user.firstName}!</h1>
            <p>Your account has been created on the EPR Church Management System.</p>
            <p>You can now log in using your email: <b>${user.email}</b></p>
            <p>Login URL: <a href="${this.configService.get('FRONTEND_URL')}/login">Click here to login</a></p>
        `;
        return this.sendEmail(user.email, subject, `Welcome to EPR, ${user.firstName}!`, html);
    }
}
