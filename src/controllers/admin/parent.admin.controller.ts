import { Request, Response, NextFunction } from 'express';
import { ParentAdminService } from '../../services/admin/parent.admin.service';

export class ParentAdminController {
  private parentAdminService: ParentAdminService;

  constructor() {
    this.parentAdminService = new ParentAdminService();
  }

  createParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parent = await this.parentAdminService.createParent(req.body);
      res.status(201).json({
        status: 'success',
        data: parent,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllParents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const options = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string,
        status: req.query.status as string,
      };

      const result = await this.parentAdminService.getAllParents(options);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getParentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parent = await this.parentAdminService.getParentById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: parent,
      });
    } catch (error) {
      next(error);
    }
  };

  updateParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parent = await this.parentAdminService.updateParent(
        req.params.id,
        req.body
      );
      res.status(200).json({
        status: 'success',
        data: parent,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.parentAdminService.deleteParent(req.params.id);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getParentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.parentAdminService.getParentStats();
      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggle parent status (activate/deactivate)
   * PATCH /api/v1/admin/parents/:id/status
   */
  toggleParentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      // Validate action
      if (!action || !['activate', 'deactivate'].includes(action)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid action. Must be "activate" or "deactivate"',
          data: null,
        });
        return;
      }

      const result = await this.parentAdminService.toggleParentStatus(id, action);
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
