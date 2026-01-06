import { Response, NextFunction } from 'express';
import { VaccinationPlanService } from '../services/vaccination-plan.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';

export class VaccinationPlanController {
  private vaccinationPlanService: VaccinationPlanService;

  constructor() {
    this.vaccinationPlanService = new VaccinationPlanService();
  }

  /**
   * Get child's complete vaccination plan (for Vaccination Plan Details page)
   * GET /api/v1/children/:id/vaccination-plan
   *
   * Returns complete schedule grouped by age with all statuses
   */
  getChildVaccinationPlan = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const parentId = req.user?.id;

      if (!parentId || req.user?.userType !== 'PARENT') {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized. Only parents can access vaccination plans.',
          data: null,
        });
        return;
      }

      const result = await this.vaccinationPlanService.getChildVaccinationPlan(id, parentId);

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccination plan retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vaccination history with status (for Child Profile page)
   * GET /api/v1/children/:id/vaccination-history?status=pending|upcoming|completed
   * GET /api/v1/admin/children/:id/vaccination-history?status=pending|upcoming|completed
   *
   * Query Parameters:
   * - status: Optional. If not provided, returns all data (pending, upcoming, completed)
   * - status=pending: Returns only pendingVaccines array
   * - status=upcoming: Returns only upcomingVaccines array
   * - status=completed: Returns only completedVaccines array
   *
   * Access: PARENT (verifies ownership) or ADMIN (no ownership check)
   * Returns simple list view (not grouped by age)
   */
  getVaccinationHistory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userType = req.user?.userType;
      const status = req.query.status as string | undefined;

      // Allow PARENT and ADMIN access
      if (!userId || !['PARENT', 'ADMIN'].includes(userType || '')) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized. Only parents and admins can access vaccination history.',
          data: null,
        });
        return;
      }

      // Validate status parameter if provided
      if (status) {
        const validStatus = ['pending', 'upcoming', 'completed'];
        if (!validStatus.includes(status)) {
          res.status(400).json({
            status: 'error',
            message: `Invalid status parameter. Must be one of: ${validStatus.join(', ')} or omit for all data`,
            data: null,
          });
          return;
        }
      }

      // For PARENT: pass parentId to verify ownership
      // For ADMIN: pass null to skip ownership check
      const parentId = userType === 'PARENT' ? userId : null;

      const result = await this.vaccinationPlanService.getVaccinationHistory(
        id,
        parentId,
        status as 'pending' | 'upcoming' | 'completed' | undefined
      );

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccination history retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get knowledge base articles
   * GET /api/v1/vaccination-plan/knowledge-base
   */
  getKnowledgeBaseArticles = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { category, limit } = req.query;
      const limitNumber = limit ? parseInt(limit as string, 10) : 10;

      const result = await this.vaccinationPlanService.getKnowledgeBaseArticles(
        category as string | undefined,
        limitNumber
      );

      const response: ApiResponse = {
        status: 'success',
        message: 'Knowledge base articles retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get single knowledge base article
   * GET /api/v1/vaccination-plan/knowledge-base/:articleId
   */
  getKnowledgeBaseArticle = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { articleId } = req.params;

      const result = await this.vaccinationPlanService.getKnowledgeBaseArticle(
        articleId
      );

      const response: ApiResponse = {
        status: 'success',
        message: 'Article retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
