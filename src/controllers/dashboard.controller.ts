import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';

const dashboardService = new DashboardService();

export class DashboardController {
  /**
   * Get parent dashboard data
   * GET /api/v1/parent/dashboard
   * Query params:
   *   - childId (optional): Select specific child
   */
  async getParentDashboard(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parentId = req.user?.id;

      if (!parentId) {
        const response: ApiResponse = {
          status: 'error',
          message: 'User ID not found in token',
          data: null,
        };
        return res.status(401).json(response);
      }

      const { childId } = req.query;

      const dashboard = await dashboardService.getParentDashboard(
        parentId,
        childId as string | undefined
      );

      const response: ApiResponse = {
        status: 'success',
        message: dashboard.message,
        data: dashboard,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
