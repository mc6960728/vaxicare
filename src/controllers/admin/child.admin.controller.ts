import { Response, NextFunction } from 'express';
import { ChildService } from '../../services/child.service';
import { ApiResponse } from '../../types/response.types';
import { AuthRequest } from '../../types/request.types';
import { AppError } from '../../utils/AppError';

export class ChildAdminController {
  private childService: ChildService;

  constructor() {
    this.childService = new ChildService();
  }

  /**
   * Helper function to parse date in DD/MM/YYYY or ISO format
   */
  private parseDate(dateStr: string): Date {
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
  }

  /**
   * Admin: Add a new child for a parent
   * POST /api/v1/admin/children
   *
   * Required: parentId in request body
   */
  addChild = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { parentId, ...childData } = req.body;

      if (!parentId) {
        throw new AppError('parentId is required', 400);
      }

      // Convert dateOfBirth string to Date object
      const parsedChildData = {
        ...childData,
        dateOfBirth: childData.dateOfBirth ? this.parseDate(childData.dateOfBirth) : undefined,
      };

      const result = await this.childService.addChildByAdmin(parentId, parsedChildData);

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
   * Admin: Get all children (with optional filters)
   * GET /api/v1/admin/children?parentId=xxx&search=xxx&page=1&limit=10
   */
  getAllChildren = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const filters = {
        parentId: req.query.parentId as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      const result = await this.childService.getAllChildrenForAdmin(filters);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Admin: Get child by ID
   * GET /api/v1/admin/children/:id
   */
  getChildById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const result = await this.childService.getChildByIdForAdmin(id);

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
   * Admin: Update child information
   * PUT /api/v1/admin/children/:id
   */
  updateChild = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;

      // Convert dateOfBirth string to Date object if present
      const childData = {
        ...req.body,
        ...(req.body.dateOfBirth && { dateOfBirth: this.parseDate(req.body.dateOfBirth) }),
      };

      const result = await this.childService.updateChildByAdmin(id, childData);

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
   * Admin: Delete child (soft delete)
   * DELETE /api/v1/admin/children/:id
   */
  deleteChild = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const result = await this.childService.deleteChildByAdmin(id);

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
