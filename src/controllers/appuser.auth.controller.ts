import { Request, Response, NextFunction } from 'express';
import { AppUserAuthService } from '../services/appuser.auth.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';

export class AppUserAuthController {
  private appUserAuthService: AppUserAuthService;

  constructor() {
    this.appUserAuthService = new AppUserAuthService();
  }

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await this.appUserAuthService.forgotPassword(email);
      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.resetToken ? { resetToken: result.resetToken } : null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.appUserAuthService.resetPassword(token, newPassword);
      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || '';
      const userId = req.user?.id;
      const userType = req.user?.userType as 'PARENT' | 'MEDICAL_STAFF';

      if (!userId || !userType) {
        res.status(401).json({ status: 'error', message: 'Unauthorized', data: null });
        return;
      }

      const result = await this.appUserAuthService.logout(token, userId, userType);
      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ========== NEW OTP-BASED AUTHENTICATION ENDPOINTS ==========

  /**
   * Send OTP to phone number (first time - for login)
   * POST /api/v1/auth/app/send-otp
   */
  sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dialCode, phone, appType } = req.body;
      const result = await this.appUserAuthService.sendOtp(dialCode, phone, appType);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          phone: result.phone,
          expiresIn: result.expiresIn,
        },
        // ...(result.debug && { debug: result.debug }),
      };

      res.status(200).json(response);
    } catch (error: any) {
      // Handle user not found error with 200 status code
      if (error.message?.includes('not found')) {
        const response: ApiResponse = {
          status: 'error',
          message: error.message || 'User not found with this phone number. Please register first.',
          data: null,
        };
        res.status(200).json(response);
        return;
      }
      next(error);
    }
  };

  /**
   * Resend OTP to phone number
   * POST /api/v1/auth/app/resend-otp
   * Rate limited: 1 minute cooldown, max 5 resends per hour
   */
  resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dialCode, phone, appType } = req.body;
      const result = await this.appUserAuthService.resendOtp(dialCode, phone, appType);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          phone: result.phone,
          expiresIn: result.expiresIn,
          remainingAttempts: result.remainingAttempts,
        },
        // ...(result.debug && { debug: result.debug }),
      };

      res.status(200).json(response);
    } catch (error: any) {
      // Handle user not found error with 200 status code
      if (error.message?.includes('not found')) {
        const response: ApiResponse = {
          status: 'error',
          message: error.message || 'User not found with this phone number. Please register first.',
          data: null,
        };
        res.status(200).json(response);
        return;
      }
      next(error);
    }
  };

  /**
   * Login with phone and OTP
   */
  loginWithPhone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.appUserAuthService.loginWithPhone(req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'Login successful',
        data: result,
      };
      res.status(200).json(response);
    } catch (error: any) {
      // Handle user not found error with 200 status code
      if (error.message?.includes('not found')) {
        const response: ApiResponse = {
          status: 'error',
          message: error.message || 'User not found. Please register first.',
          data: null,
        };
        res.status(200).json(response);
        return;
      }
      next(error);
    }
  };

  /**
   * Register Parent user - Create user and send OTP
   */
  registerParent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.appUserAuthService.registerParent(req.body);
      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          phone: result.phone,
          expiresIn: result.expiresIn,
          userId: result.userId,
        },
        // ...(result.debug && { debug: result.debug }),
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };



  /**
   * Register Medical Staff user - Create user and send OTP
   */
  registerMedicalStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.appUserAuthService.registerMedicalStaff(req.body);
      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          phone: result.phone,
          expiresIn: result.expiresIn,
          userId: result.userId,
        },
        ...(result.debug && { debug: result.debug }),
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Profile (unified for both Parent and Medical Staff)
   * Automatically detects user type and returns appropriate profile
   */
  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id || !req.user?.userType) {
        res.status(401).json({ status: 'error', message: 'Unauthorized', data: null });
        return;
      }

      let result;
      if (req.user.userType === 'PARENT') {
        result = await this.appUserAuthService.getParentProfile(req.user.id);
      } else if (req.user.userType === 'MEDICAL_STAFF') {
        result = await this.appUserAuthService.getMedicalStaffProfile(req.user.id);
      } else {
        res.status(400).json({ status: 'error', message: 'Invalid user type', data: null });
        return;
      }

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.user,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update Profile (unified for both Parent and Medical Staff)
   * Automatically detects user type and updates appropriate profile
   */
  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id || !req.user?.userType) {
        res.status(401).json({ status: 'error', message: 'Unauthorized', data: null });
        return;
      }

      let result;
      if (req.user.userType === 'PARENT') {
        result = await this.appUserAuthService.updateParentProfile(req.user.id, req.body);
      } else if (req.user.userType === 'MEDICAL_STAFF') {
        result = await this.appUserAuthService.updateMedicalStaffProfile(req.user.id, req.body);
      } else {
        res.status(400).json({ status: 'error', message: 'Invalid user type', data: null });
        return;
      }

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.user,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
