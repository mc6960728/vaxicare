import { Response, NextFunction } from 'express';
import { UserAdminService } from '../../services/admin/user.admin.service';
import { AuthRequest } from '../../types/request.types';

const userAdminService = new UserAdminService();

export class UserAdminController {
  /**
   * Create a new admin user
   * POST /api/v1/admin/users
   */
  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userAdminService.createUser(req.body);

      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all admin users
   * GET /api/v1/admin/users
   */
  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status, role } = req.query;

      const result = await userAdminService.getAllUsers({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        status: status as string,
        role: role as string,
      });

      res.status(200).json({
        status: 'success',
        message: 'Users retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get admin user by ID
   * GET /api/v1/admin/users/:id
   */
  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userAdminService.getUserById(id);

      res.status(200).json({
        status: 'success',
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update admin user
   * PUT /api/v1/admin/users/:id
   */
  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userAdminService.updateUser(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete admin user
   * DELETE /api/v1/admin/users/:id
   */
  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id as string;

      const result = await userAdminService.deleteUser(id, currentUserId);

      res.status(200).json({
        status: 'success',
        message: result.message,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   * GET /api/v1/admin/users/stats
   */
  // async getUserStats(req: AuthRequest, res: Response, next: NextFunction) {
  //   try {
  //     const stats = await userAdminService.getUserStats();

  //     res.status(200).json({
  //       status: 'success',
  //       message: 'User statistics retrieved successfully',
  //       data: stats,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }
}
