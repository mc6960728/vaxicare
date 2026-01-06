import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { config } from '../config/config';

export class OtpService {
  // OTP Configuration from environment
  private readonly OTP_EXPIRY_MINUTES = config.otp.expiryMinutes;
  private readonly FIXED_DEV_OTP = config.otp.devCode;
  private readonly RESEND_COOLDOWN_SECONDS = config.otp.resendCooldownSeconds;
  private readonly MAX_RESEND_ATTEMPTS = config.otp.maxResendAttempts;

  /**
   * Send OTP for the first time (Login flow)
   * Validates: No existing unexpired OTP should exist
   */
  async sendOtp(dialCode: string, phone: string): Promise<{
    otp?: string;
    message: string;
  }> {
    this.validateInputs(dialCode, phone);

    // Check if there's already an unexpired OTP
    const existingOtp = await prisma.otp.findFirst({
      where: {
        dialCode,
        phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingOtp) {
      throw new AppError(
        'OTP already sent. Please use resend-otp if you need a new code.',
        400
      );
    }

    // Delete any old expired OTPs
    await prisma.otp.deleteMany({
      where: {
        dialCode,
        phone,
        verified: false,
      },
    });

    // Generate and save new OTP
    const otp = await this.createOtp(dialCode, phone);

    if (config.env === 'development') {
      console.log(`[OTP] Sent for ${dialCode}${phone}: ${otp}`);
      return {
        otp,
        message: `OTP sent successfully to ${dialCode}${phone}`,
      };
    }

    // In production, send SMS here
    // await this.sendSMS(dialCode + phone, otp);

    return {
      message: `OTP sent successfully to ${dialCode}${phone}`,
    };
  }

  /**
   * Resend OTP (when user didn't receive or OTP expired)
   * Validates:
   * - Must have requested OTP before (existing record)
   * - 1 minute cooldown between resends
   * - Max 5 resend attempts per hour
   */
  async resendOtp(dialCode: string, phone: string): Promise<{
    otp?: string;
    message: string;
    remainingAttempts: number;
    retryAfterSeconds?: number;
  }> {
    this.validateInputs(dialCode, phone);

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Get all OTP records for this phone in the last hour
    const recentOtps = await prisma.otp.findMany({
      where: {
        dialCode,
        phone,
        createdAt: { gte: oneHourAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Must have at least one OTP record (initial send-otp must be called first)
    if (recentOtps.length === 0) {
      throw new AppError(
        'No OTP found. Please use send-otp first.',
        400
      );
    }

    const lastOtp = recentOtps[0];

    // Check cooldown (1 minute between resends)
    const secondsSinceLastOtp = Math.floor(
      (new Date().getTime() - lastOtp.createdAt.getTime()) / 1000
    );

    if (secondsSinceLastOtp < this.RESEND_COOLDOWN_SECONDS) {
      const retryAfterSeconds = this.RESEND_COOLDOWN_SECONDS - secondsSinceLastOtp;
      throw new AppError(
        `Please wait ${retryAfterSeconds} seconds before requesting another OTP`,
        429
      );
    }

    // Check max resend attempts (5 per hour)
    if (recentOtps.length >= this.MAX_RESEND_ATTEMPTS) {
      throw new AppError(
        'Maximum OTP requests exceeded. Please try again after 1 hour.',
        429
      );
    }

    // Delete existing unverified OTPs
    await prisma.otp.deleteMany({
      where: {
        dialCode,
        phone,
        verified: false,
      },
    });

    // Generate and save new OTP
    const otp = await this.createOtp(dialCode, phone);
    const remainingAttempts = this.MAX_RESEND_ATTEMPTS - recentOtps.length - 1;

    if (config.env === 'development') {
      console.log(`[OTP] Resent for ${dialCode}${phone}: ${otp} (${remainingAttempts} attempts left)`);
      return {
        otp,
        message: `OTP resent successfully to ${dialCode}${phone}`,
        remainingAttempts,
      };
    }

    // In production, send SMS here
    // await this.sendSMS(dialCode + phone, otp);

    return {
      message: `OTP resent successfully to ${dialCode}${phone}`,
      remainingAttempts,
    };
  }

  /**
   * Validate dial code and phone inputs
   */
  private validateInputs(dialCode: string, phone: string): void {
    if (!dialCode || dialCode.trim() === '') {
      throw new AppError('Dial code is required', 400);
    }

    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone)) {
      throw new AppError('Invalid phone number format', 400);
    }
  }

  /**
   * Create and save OTP to database
   */
  private async createOtp(dialCode: string, phone: string): Promise<string> {
    //uncomment const otp = config.env === 'development'
    //   ? this.FIXED_DEV_OTP
    //   : this.generateRandomOtp();
    const otp = this.FIXED_DEV_OTP

    // console.log({ otp, env: config.env })
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    await prisma.otp.create({
      data: {
        dialCode,
        phone,
        otp,
        expiresAt,
        verified: false,
      },
    });

    return otp;
  }

  /**
   * Verify OTP for phone number
   */
  async verifyOtp(dialCode: string, phone: string, otp: string): Promise<boolean> {
    // Validate dialCode
    if (!dialCode || dialCode.trim() === '') {
      throw new AppError('Dial code is required', 400);
    }

    const otpRecord = await prisma.otp.findFirst({
      where: {
        dialCode,
        phone,
        otp,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      throw new AppError('Invalid OTP', 400);
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    // Mark OTP as verified
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    return true;
  }

  /**
   * Generate random 6-digit OTP
   */
  private generateRandomOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Clean up expired OTPs (can be called via cron job)
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await prisma.otp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
