import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';


interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {

  async login(data: LoginInput) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.fullName,
        lastName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
        userId: string;
        role: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const token = this.generateToken(user.id, user.role);

      return { token };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async forgotPassword(email: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist (security best practice)
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
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: expiresAt,
      },
    });

    // In production, send email with resetToken here
    // For now, return the token (remove this in production!)
    return {
      message: 'If the email exists, a password reset link has been sent.',
      resetToken, // TODO: Remove this in production and send via email instead
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash the new password
    const saltRounds = config.bcrypt.saltRounds || 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
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

  async logout(token: string, userId: string) {
    // Decode token to get expiration
    const decoded = jwt.decode(token) as { exp: number } | null;

    if (!decoded || !decoded.exp) {
      throw new AppError('Invalid token', 400);
    }

    // Add token to blacklist
    await prisma.tokenBlacklist.create({
      data: {
        token,
        userType: "MEDICAL_STAFF",
        expiresAt: new Date(decoded.exp * 1000), // Convert exp to milliseconds
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

  private generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });
  }
}
