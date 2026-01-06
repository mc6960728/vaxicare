import { Request, Response, NextFunction } from 'express';
import { AdminAuthService } from '../services/admin.auth.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';

export class AdminAuthController {
  private adminAuthService: AdminAuthService;

  constructor() {
    this.adminAuthService = new AdminAuthService();
  }

  /**
   * Admin Signup
   * POST /api/v1/auth/admin/signup
   */
  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminAuthService.signup(req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'Account created successfully',
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminAuthService.login(req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'Login successful',
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await this.adminAuthService.forgotPassword(email);
      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result?.resetToken ? { resetToken: result.resetToken } : null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.adminAuthService.resetPassword(token, newPassword);
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

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const result = await this.adminAuthService.logout(token, userId);
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
}
