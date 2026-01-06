import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }


  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
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

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      const response: ApiResponse = {
        status: 'success',
        message: 'Token refreshed successfully',
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
      const result = await this.authService.forgotPassword(email);
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
      const result = await this.authService.resetPassword(token, newPassword);
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

      const result = await this.authService.logout(token, userId);
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
