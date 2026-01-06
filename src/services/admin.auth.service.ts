import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';
import { getEmailService } from './email.service';
import { connect } from 'http2';

interface LoginInput {
  email: string;
  password: string;
  fcmToken?: string;
  deviceType?: string;
}

interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  password: string;
}

export class AdminAuthService {
  /**
   * Register a new admin user
   */
  async signup(data: SignupInput) {
    const { firstName, lastName, email, organization, password } = data;

    // Check if email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const saltRounds = config.bcrypt.saltRounds || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Generate token with uppercase ADMIN userType
    const token = this.generateToken(admin.id, admin.role, 'ADMIN');

    return {
      user: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        // organization: admin.organization,
        role: admin.role,
        userType: 'ADMIN',
      },
      token,
    };
  }

  async login(data: LoginInput) {
    const { email, password, fcmToken, deviceType } = data;

    // Find admin user
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if admin is deleted or inactive
    if (admin.isDeleted || admin.status !== 'ACTIVE') {
      throw new AppError('Account is inactive or deleted', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login, FCM token, and device type
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
        ...(fcmToken && { fcmToken }),
        ...(deviceType && { deviceType }),
      },
    });

    // Generate token with uppercase ADMIN userType
    const token = this.generateToken(admin.id, admin.role, 'ADMIN');

    return {
      user: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        userType: 'ADMIN',
      },
      token,
    };
  }

  async forgotPassword(email: string) {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save hashed token and expiration to database
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: expiresAt,
      },
    });

    // Send password reset email (if enabled)
    const emailEnabled = process.env.ENABLE_EMAIL !== 'false';
    if (emailEnabled) {
      try {
        const emailService = getEmailService();
        const fullName = `${admin.firstName} ${admin.lastName}`;
        await emailService.sendPasswordResetEmail(admin.email, fullName, resetToken, 'admin');
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Don't throw error, just log it - we don't want to expose email sending failures
      }
    } else {
      console.log('[EMAIL] Email sending is disabled. Reset token generated but email not sent.');
    }

    return {
      message: 'If the email exists, a password reset link has been sent.',
      // Return resetToken only in development for testing
      // ...(process.env.NODE_ENV === 'development' && { resetToken }),
      resetToken
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const admin = await prisma.admin.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!admin) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const saltRounds = config.bcrypt.saltRounds || 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return {
      message: 'Password has been reset successfully',
    };
  }

  async logout(token: string, adminId: string) {
    const decoded = jwt.decode(token) as { exp: number } | null;

    if (!decoded || !decoded.exp) {
      throw new AppError('Invalid token', 400);
    }

    const expiresAt = new Date(decoded.exp * 1000)

    await prisma.tokenBlacklist.create({
      data: {
        token,
        expiresAt,
        userType: 'ADMIN'
      },
    });

    return {
      message: 'Logged out successfully',
    };
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    return blacklistedToken !== null;
  }

  private generateToken(userId: string, role: string, userType: string): string {
    return jwt.sign({ userId, role, userType }, process.env.JWT_SECRET, {
      expiresIn: '24h',
      algorithm: 'none'
    });
  }
}
