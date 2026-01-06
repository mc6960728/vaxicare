import nodemailer, { Transporter } from 'nodemailer';
import { emailConfig, emailTemplates } from '../config/email.config';
import { AppError } from '../utils/AppError';

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
    });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
    userType: 'admin' | 'app'
  ): Promise<void> {
    try {
      // Check if email is configured
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        console.warn('[EMAIL] Credentials not configured. Skipping email send.');
        throw new AppError('Email service not configured', 500);
      }

      // Construct reset link based on user type
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}&type=${userType}`;

      const expiryMinutes = 60; // 1 hour

      const mailOptions = {
        from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
        to,
        subject: emailTemplates.resetPassword.subject,
        text: emailTemplates.resetPassword.getText(name, resetLink, expiryMinutes),
        html: emailTemplates.resetPassword.getHtml(name, resetLink, expiryMinutes),
      };

      console.log(`[EMAIL] Sending password reset email to: ${to}`);
      const info = await this.transporter.sendMail(mailOptions);

      console.log('[EMAIL] Password reset email sent successfully:', info.messageId);
      console.log('[EMAIL] Preview URL:', nodemailer.getTestMessageUrl(info));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EMAIL] Failed to send password reset email:', errorMessage);

      // Log configuration hints for common errors
      if (errorMessage.includes('Greeting never received')) {
        console.error('[HINT] Check EMAIL_PORT and EMAIL_SECURE settings');
        console.error('   - Port 465 requires EMAIL_SECURE=true');
        console.error('   - Port 587 requires EMAIL_SECURE=false');
      } else if (errorMessage.includes('authentication')) {
        console.error('[HINT] Check EMAIL_USER and EMAIL_PASSWORD are correct');
      } else if (errorMessage.includes('ECONNREFUSED')) {
        console.error('[HINT] Check EMAIL_HOST and firewall settings');
      }

      throw new AppError('Failed to send password reset email', 500);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('[EMAIL] Server connection verified');
      return true;
    } catch (error) {
      console.error('[EMAIL] Server connection failed:', error);
      return false;
    }
  }

  async sendTestEmail(to: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
        to,
        subject: 'Test Email - Vaxicare',
        text: 'This is a test email from Vaxicare application.',
        html: '<p>This is a test email from <strong>Vaxicare</strong> application.</p>',
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EMAIL] Test email sent successfully:', info.messageId);
    } catch (error) {
      console.error('[EMAIL] Failed to send test email:', error);
      throw new AppError('Failed to send test email', 500);
    }
  }
}

// Singleton instance
let emailService: EmailService;

export const getEmailService = (): EmailService => {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
};
