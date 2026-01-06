import { Response, NextFunction } from 'express';
import { ChildService } from '../services/child.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';
import { AppError } from '../utils/AppError';

export class ChildController {
  private childService: ChildService;

  constructor() {
    this.childService = new ChildService();
  }

  /**
   * Add a new child
   */
  addChild = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      // Helper function to parse date in DD/MM/YYYY or ISO format
      const parseDate = (dateStr: string): Date => {
        if (!dateStr) {
          throw new AppError('Date of birth is required', 400);
        }

        // Handle DD/MM/YYYY format
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (isNaN(date.getTime())) {
              throw new AppError('Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD', 400);
            }
            return date;
          }
        }

        // Handle ISO format (YYYY-MM-DD)
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new AppError('Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD', 400);
        }
        return date;
      };

      // Convert dateOfBirth string to Date object
      const childData = {
        ...req.body,
        dateOfBirth: req.body.dateOfBirth ? parseDate(req.body.dateOfBirth) : undefined,
      };

      const result = await this.childService.addChild(req.user.id, childData);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.child,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all children for logged-in parent
   */
  getChildren = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const result = await this.childService.getChildrenByParent(req.user.id);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          count: result.count,
          children: result.children,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get child by ID
   */
  getChildById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const result = await this.childService.getChildById(id, req.user.id);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.child,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update child information
   */
  updateChild = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      // Convert dateOfBirth string to Date object if present
      const childData = {
        ...req.body,
        ...(req.body.dateOfBirth && { dateOfBirth: new Date(req.body.dateOfBirth) }),
      };

      const { id } = req.params;
      const result = await this.childService.updateChild(id, req.user.id, childData);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.child,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete child (soft delete)
   */
  deleteChild = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const result = await this.childService.deleteChild(id, req.user.id);

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

  /**
   * Mark multiple vaccinations as complete
   * POST /api/v1/children/vaccinations/mark-complete
   *
   * Request Body:
   * {
   *   "childId": "uuid",
   *   "scheduleIds": ["uuid1", "uuid2", "uuid3"]
   * }
   */
  markMultipleVaccinationsComplete = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const parentId = req.user?.id;

      if (!parentId || req.user?.userType !== 'PARENT') {
        throw new AppError('Unauthorized. Only parents can mark vaccinations as complete.', 403);
      }

      const { childId, scheduleIds } = req.body;

      if (!childId) {
        throw new AppError('childId is required', 400);
      }

      if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
        throw new AppError('scheduleIds array is required and must not be empty', 400);
      }

      const result = await this.childService.markMultipleVaccinationsComplete(
        parentId,
        childId,
        scheduleIds
      );

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.data,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
