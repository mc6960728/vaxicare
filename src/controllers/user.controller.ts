import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../types/request.types';
import { ApiResponse } from '../types/response.types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.register(req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'User registered successfully',
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };


  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const user = await this.userService.getUserById(userId);
      const response: ApiResponse = {
        status: 'success',
        data: user,
        message: ''
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const user = await this.userService.updateUser(userId, req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'Profile updated successfully',
        data: user,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, role, status, search, includeDeleted } = req.query;

      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        role: role as string,
        status: status as string,
        search: search as string,
        includeDeleted: includeDeleted === 'true',
      };

      const result = await this.userService.getAllUsers(options);
      const response: ApiResponse = {
        status: 'success',
        data: result.data,
        pagination: result.pagination,
        message: 'Users fetched successfully'
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      const response: ApiResponse = {
        status: 'success',
        data: user,
        message: 'Users fetched successfully'
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);
      const response: ApiResponse = {
        status: 'success',
        message: 'User deleted successfully',
        data :{}
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
