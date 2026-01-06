import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';
import { getEmailService } from './email.service';
import { OtpService } from './otp.service';

interface PhoneLoginInput {
  phone: string;
  fcmToken?: string;
  deviceType?: string;
}

interface RegisterParentInput {
  fullName: string;
  dialCode: string;
  phone: string;
  email: string;
  relationWithChild: 'Father' | 'Mother' | 'Guardian';
}

interface RegisterMedicalStaffInput {
  fullName: string;
  dialCode: string;
  phone: string;
  email: string;
  licenseNumber: string;
  specialization?: string;
  experienceYears?: number;
}

interface UpdateParentProfileInput {
  fullName?: string;
  dialCode?: string;
  phone?: string;
  email?: string;
  relationWithChild?: 'Father' | 'Mother' | 'Guardian';
  profilePhoto?: string;
}

interface UpdateMedicalStaffProfileInput {
  fullName?: string;
  dialCode?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  specialization?: string;
  experienceYears?: number;
  profilePhoto?: string;
}

export class AppUserAuthService {
  private otpService = new OtpService();

  /**
   * Helper: Find user by phone from either Parent or MedicalStaff table
   */
  private async findUserByPhone(phone: string) {
    const parent = await prisma.parent.findFirst({
      where: { phone },
    });

    if (parent) {
      return { user: parent, userType: 'PARENT' as const };
    }

    const medicalStaff = await prisma.medicalStaff.findFirst({
      where: { phone },
    });

    if (medicalStaff) {
      return { user: medicalStaff, userType: 'MEDICAL_STAFF' as const };
    }

    return null;
  }

  /**
   * Helper: Find user by email from either Parent or MedicalStaff table
   */
  private async findUserByEmail(email: string) {
    const parent = await prisma.parent.findFirst({
      where: { email },
    });

    if (parent) {
      return { user: parent, userType: 'PARENT' as const };
    }

    const medicalStaff = await prisma.medicalStaff.findFirst({
      where: { email },
    });

    if (medicalStaff) {
      return { user: medicalStaff, userType: 'MEDICAL_STAFF' as const };
    }

    return null;
  }

  async forgotPassword(email: string) {
    const result = await this.findUserByEmail(email);

    if (!result) {
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    const { user, userType } = result;

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save hashed token and expiration to database
    if (userType === 'PARENT') {
      await prisma.parent.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpiresAt: expiresAt,
        },
      });
    } else {
      await prisma.medicalStaff.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpiresAt: expiresAt,
        },
      });
    }

    // Send password reset email (if enabled)
    const emailEnabled = process.env.ENABLE_EMAIL !== 'false';
    if (emailEnabled) {
      try {
        const emailService = getEmailService();
        await emailService.sendPasswordResetEmail(user.email, user.fullName || user.email, resetToken, 'app');
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Don't throw error, just log it - we don't want to expose email sending failures
      }
    } else {
      console.log('[EMAIL] Email sending is disabled. Reset token generated but email not sent.');
    }

    return {
      message: 'If the email exists, a password reset link has been sent.',
      resetToken
      // Return resetToken only in development for testing
      // ...(process.env.NODE_ENV === 'development' && { resetToken }),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Try to find in Parent table
    let user = await prisma.parent.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    let userType: 'PARENT' | 'MEDICAL_STAFF' = 'PARENT';

    // If not found in Parent, try MedicalStaff
    if (!user) {
      const medicalStaff = await prisma.medicalStaff.findFirst({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!medicalStaff) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      user = medicalStaff as any;
      userType = 'MEDICAL_STAFF';
    }

    const saltRounds = config.bcrypt.saltRounds || 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    if (userType === 'PARENT') {
      await prisma.parent.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      });
    } else {
      await prisma.medicalStaff.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      });
    }

    return {
      message: 'Password has been reset successfully',
    };
  }

  async logout(token: string, userId: string, userType: 'PARENT' | 'MEDICAL_STAFF') {
    const decoded = jwt.decode(token) as { exp: number } | null;

    if (!decoded || !decoded.exp) {
      throw new AppError('Invalid token', 400);
    }

    await prisma.tokenBlacklist.create({
      data: {
        token,
        userType,
        expiresAt: new Date(decoded.exp * 1000),
        ...(userType === 'PARENT' ? { parentId: userId } : { medicalStaffId: userId }),
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

  private generateToken(userId: string, userType: string, loginType: string, role?: string): string {
    return jwt.sign(
      {
        userId,
        userType,
        loginType,
        ...(role && { role }), // Include role only for Medical Staff
      },
      config.jwt.secret,
      // { for testing purpose temporary commented
      //   expiresIn: config.jwt.expiresIn,
      // }
    );
  }

  // ========== NEW OTP-BASED AUTHENTICATION METHODS ==========

  /**
   * Send OTP to phone number (first time - for login flow)
   * Validates that user exists before sending OTP
   */
  async sendOtp(dialCode: string, phone: string, appType: 'parent' | 'staff') {
    // Validate user exists
    const user = await this.validateUserExists(phone, appType);

    // Check if user is deleted or inactive
    if (user.isDeleted || user.status !== 'ACTIVE') {
      throw new AppError('Account is inactive or deleted', 403);
    }

    // Send OTP (first time)
    const otpResult = await this.otpService.sendOtp(dialCode, phone);

    return {
      message: otpResult.message,
      phone,
      expiresIn: 300, // 5 minutes
      ...(otpResult.otp && { debug: { otp: otpResult.otp } }),
    };
  }

  /**
   * Resend OTP to phone number
   * Validates: user exists, 1 min cooldown, max 5 resends per hour
   */
  async resendOtp(dialCode: string, phone: string, appType: 'parent' | 'staff') {
    // Validate user exists
    const user = await this.validateUserExists(phone, appType);

    // Check if user is deleted or inactive
    if (user.isDeleted || user.status !== 'ACTIVE') {
      throw new AppError('Account is inactive or deleted', 403);
    }

    // Resend OTP (with rate limiting)
    const otpResult = await this.otpService.resendOtp(dialCode, phone);

    return {
      message: otpResult.message,
      phone,
      expiresIn: 300, // 5 minutes
      remainingAttempts: otpResult.remainingAttempts,
      ...(otpResult.otp && { debug: { otp: otpResult.otp } }),
    };
  }

  /**
   * Helper: Validate user exists for the specified app type
   */
  private async validateUserExists(phone: string, appType: 'parent' | 'staff') {
    if (appType === 'parent') {
      const parent = await prisma.parent.findFirst({
        where: { phone },
      });

      if (!parent) {
        throw new AppError('Parent account not found with this phone number. Please register first.', 400);
      }
      return parent;
    } else if (appType === 'staff') {
      const medicalStaff = await prisma.medicalStaff.findFirst({
        where: { phone },
      });

      if (!medicalStaff) {
        throw new AppError('Medical staff account not found with this phone number. Please register first.', 400);
      }
      return medicalStaff;
    }

    throw new AppError('Invalid app type', 400);
  }

  /**
   * Login with phone and OTP
   * Works for both regular login and post-registration login
   */
  async loginWithPhone(data: PhoneLoginInput & { dialCode: string; otp: string; appType: 'parent' | 'staff' }) {
    const { dialCode, phone, otp, appType, fcmToken, deviceType } = data;

    // Verify OTP
    await this.otpService.verifyOtp(dialCode, phone, otp);

    // Find user based on appType
    let user = null;
    let userType: 'PARENT' | 'MEDICAL_STAFF' | null = null;

    if (appType === 'parent') {
      const parent = await prisma.parent.findFirst({
        where: { phone },
      });

      if (parent) {
        user = parent;
        userType = 'PARENT';
      } else {
        throw new AppError('Parent account not found with this phone number. Please register first.', 400);
      }
    } else if (appType === 'staff') {
      const medicalStaff = await prisma.medicalStaff.findFirst({
        where: { phone },
      });

      if (medicalStaff) {
        user = medicalStaff;
        userType = 'MEDICAL_STAFF';
      } else {
        throw new AppError('Medical staff account not found with this phone number. Please register first.', 400);
      }
    }

    if (!user || !userType) {
      throw new AppError('User not found. Please register first.', 400);
    }

    // Check if user is deleted or inactive
    if (user.isDeleted || user.status !== 'ACTIVE') {
      throw new AppError('Account is inactive or deleted', 403);
    }

    // Update last login, mark phone as verified, and update FCM token and device type
    if (userType === 'PARENT') {
      await prisma.parent.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          phoneVerified: true,
          ...(fcmToken && { fcmToken }),
          ...(deviceType && { deviceType }),
        },
      });
    } else {
      await prisma.medicalStaff.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          phoneVerified: true,
          ...(fcmToken && { fcmToken }),
          ...(deviceType && { deviceType }),
        },
      });
    }

    // Generate token (include role for Medical Staff)
    const token = this.generateToken(
      user.id,
      userType,
      'appuser',
      userType === 'MEDICAL_STAFF' ? (user as any).role : undefined
    );

    // Customize response based on user type
    if (userType === 'PARENT') {
      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          userType,
          dialCode: user.dialCode,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
          relationWithChild: user.relationWithChild,
          profilePhoto: user.profilePhoto,
          status: user.status,
        },
        token,
      };
    } else {
      // Medical Staff
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          userType,
          dialCode: user.dialCode,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
          profilePhoto: user.profilePhoto,
          role: user.role,
          specialization: user.specialization,
          licenseNumber: user.licenseNumber,
          experienceYears: user.experienceYears,
          status: user.status,
        },
        token,
      };
    }
  }

  /**
   * Register new Parent user - Create user and send OTP
   * User is created immediately when they click "Get Code"
   */
  async registerParent(data: RegisterParentInput) {
    const { fullName, dialCode, phone, email, relationWithChild } = data;

    // Check if user already exists
    const existingParent = await prisma.parent.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingParent) {
      throw new AppError('User with this email or phone already exists', 409);
    }

    // Check in MedicalStaff table too
    const existingStaff = await prisma.medicalStaff.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingStaff) {
      throw new AppError('User with this email or phone already exists', 409);
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const saltRounds = config.bcrypt.saltRounds || 10;
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    // Create Parent user immediately
    const parent = await prisma.parent.create({
      data: {
        fullName,
        dialCode,
        phone,
        email,
        relationWithChild,
        password: hashedPassword,
        profilePhoto: '', // Empty string - user can upload later
        phoneVerified: false, // Will be verified after OTP
        status: 'ACTIVE',
      },
    });

    // Send OTP to phone
    const otpResult = await this.otpService.sendOtp(dialCode, phone);

    return {
      message: 'User registered successfully. OTP sent to your phone.',
      phone,
      expiresIn: 300, // 5 minutes
      userId: parent.id,
      ...(otpResult.otp && { debug: { otp: otpResult.otp } }),
    };
  }

  /**
   * Register new Medical Staff user - Create user and send OTP
   * User is created immediately when they click "Get Code"
   */
  async registerMedicalStaff(data: RegisterMedicalStaffInput) {
    const { fullName, dialCode, phone, email, licenseNumber, specialization, experienceYears } = data;

    // Check if user already exists
    const existingStaff = await prisma.medicalStaff.findFirst({
      where: {
        OR: [{ email }, { phone }, { licenseNumber }],
      },
    });

    if (existingStaff) {
      if (existingStaff.licenseNumber === licenseNumber) {
        throw new AppError('License number already registered', 409);
      }
      throw new AppError('User with this email or phone already exists', 409);
    }

    // Check in Parent table too
    const existingParent = await prisma.parent.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingParent) {
      throw new AppError('User with this email or phone already exists', 409);
    }

    // Split fullName into firstName and lastName
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const saltRounds = config.bcrypt.saltRounds || 10;
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    // Create MedicalStaff user immediately
    const medicalStaff = await prisma.medicalStaff.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        fullName,
        dialCode,
        phone,
        profilePhoto: '', // Empty string - user can upload later
        phoneVerified: false, // Will be verified after OTP
        status: 'ACTIVE',
        licenseNumber,
        specialization,
        experienceYears,
        role: 'DOCTOR', // Default role, can be updated later
      },
    });

    // Send OTP to phone
    const otpResult = await this.otpService.sendOtp(dialCode, phone);

    return {
      message: 'User registered successfully. OTP sent to your phone.',
      phone,
      expiresIn: 300, // 5 minutes
      userId: medicalStaff.id,
      ...(otpResult.otp && { debug: { otp: otpResult.otp } }),
    };
  }

  /**
   * Update Parent Profile
   */
  async updateParentProfile(userId: string, data: UpdateParentProfileInput) {
    // Check if parent exists
    const existingParent = await prisma.parent.findUnique({
      where: { id: userId },
    });

    if (!existingParent) {
      throw new AppError('Parent not found', 404);
    }

    // Check if phone or email already exists (if being updated)
    if (data.phone && data.phone !== existingParent.phone) {
      const phoneExists = await prisma.parent.findFirst({
        where: {
          phone: data.phone,
          NOT: { id: userId },
        },
      });

      if (phoneExists) {
        throw new AppError('Phone number already in use', 409);
      }

      // Also check in MedicalStaff table
      const phoneExistsInStaff = await prisma.medicalStaff.findFirst({
        where: { phone: data.phone },
      });

      if (phoneExistsInStaff) {
        throw new AppError('Phone number already in use', 409);
      }
    }

    if (data.email && data.email !== existingParent.email) {
      const emailExists = await prisma.parent.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId },
        },
      });

      if (emailExists) {
        throw new AppError('Email already in use', 409);
      }

      // Also check in MedicalStaff table
      const emailExistsInStaff = await prisma.medicalStaff.findFirst({
        where: { email: data.email },
      });

      if (emailExistsInStaff) {
        throw new AppError('Email already in use', 409);
      }
    }

    // Update parent profile
    const updatedParent = await prisma.parent.update({
      where: { id: userId },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.phone && { phone: data.phone, phoneVerified: false }), // Reset verification if phone changed
        ...(data.email && { email: data.email, emailVerified: false }), // Reset verification if email changed
        ...(data.relationWithChild && { relationWithChild: data.relationWithChild }),
        ...(data.profilePhoto !== undefined && { profilePhoto: data.profilePhoto }),
        ...(data.dialCode && { dialCode: data.dialCode }),
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        relationWithChild: true,
        profilePhoto: true,
        phoneVerified: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: updatedParent,
    };
  }

  /**
   * Update Medical Staff Profile
   */
  async updateMedicalStaffProfile(userId: string, data: UpdateMedicalStaffProfileInput) {
    // Check if medical staff exists
    const existingStaff = await prisma.medicalStaff.findUnique({
      where: { id: userId },
    });

    if (!existingStaff) {
      throw new AppError('Medical staff not found', 404);
    }

    // Check if phone or email already exists (if being updated)
    if (data.phone && data.phone !== existingStaff.phone) {
      const phoneExists = await prisma.medicalStaff.findFirst({
        where: {
          phone: data.phone,
          NOT: { id: userId },
        },
      });

      if (phoneExists) {
        throw new AppError('Phone number already in use', 409);
      }

      // Also check in Parent table
      const phoneExistsInParent = await prisma.parent.findFirst({
        where: { phone: data.phone },
      });

      if (phoneExistsInParent) {
        throw new AppError('Phone number already in use', 409);
      }
    }

    if (data.email && data.email !== existingStaff.email) {
      const emailExists = await prisma.medicalStaff.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId },
        },
      });

      if (emailExists) {
        throw new AppError('Email already in use', 409);
      }

      // Also check in Parent table
      const emailExistsInParent = await prisma.parent.findFirst({
        where: { email: data.email },
      });

      if (emailExistsInParent) {
        throw new AppError('Email already in use', 409);
      }
    }

    if (data.licenseNumber && data.licenseNumber !== existingStaff.licenseNumber) {
      const licenseExists = await prisma.medicalStaff.findFirst({
        where: {
          licenseNumber: data.licenseNumber,
          NOT: { id: userId },
        },
      });

      if (licenseExists) {
        throw new AppError('License number already in use', 409);
      }
    }

    // Split fullName if provided
    let firstName = existingStaff.firstName;
    let lastName = existingStaff.lastName;
    if (data.fullName) {
      const nameParts = data.fullName.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }

    // Update medical staff profile
    const updatedStaff = await prisma.medicalStaff.update({
      where: { id: userId },
      data: {
        ...(data.fullName && { fullName: data.fullName, firstName, lastName }),
        ...(data.phone && { phone: data.phone, phoneVerified: false }), // Reset verification if phone changed
        ...(data.email && { email: data.email, emailVerified: false }), // Reset verification if email changed
        ...(data.licenseNumber && { licenseNumber: data.licenseNumber }),
        ...(data.specialization !== undefined && { specialization: data.specialization }),
        ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
        ...(data.profilePhoto !== undefined && { profilePhoto: data.profilePhoto }),
        ...(data.dialCode && { dialCode: data.dialCode }),
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        licenseNumber: true,
        specialization: true,
        experienceYears: true,
        profilePhoto: true,
        phoneVerified: true,
        emailVerified: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: updatedStaff,
    };
  }

  /**
   * Get Parent Profile
   */
  async getParentProfile(userId: string) {
    const parent = await prisma.parent.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        relationWithChild: true,
        profilePhoto: true,
        phoneVerified: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    return {
      message: 'Profile retrieved successfully',
      user: parent,
    };
  }

  /**
   * Get Medical Staff Profile
   */
  async getMedicalStaffProfile(userId: string) {
    const medicalStaff = await prisma.medicalStaff.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        licenseNumber: true,
        specialization: true,
        experienceYears: true,
        profilePhoto: true,
        phoneVerified: true,
        emailVerified: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!medicalStaff) {
      throw new AppError('Medical staff not found', 404);
    }

    return {
      message: 'Profile retrieved successfully',
      user: medicalStaff,
    };
  }

}
