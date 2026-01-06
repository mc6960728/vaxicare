import { Response, NextFunction } from 'express';
import { InsightsService } from '../services/insights.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';
import { AppError } from '../utils/AppError';

const insightsService = new InsightsService();

export class InsightsController {
  /**
   * Get vaccination insights/analytics
   * GET /api/v1/insights
   */
  async getVaccinationInsights(
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const insights = await insightsService.getVaccinationInsights();

      const response: ApiResponse = {
        status: 'success',
        message: insights.message,
        data: insights,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get insights for a specific vaccination center
   * GET /api/v1/insights/clinic/:clinicId
   */
  async getClinicInsights(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { clinicId } = req.params;

      if (!clinicId) {
        throw new AppError('Clinic ID is required', 400);
      }

      const insights = await insightsService.getClinicInsights(clinicId);

      const response: ApiResponse = {
        status: 'success',
        message: insights.message,
        data: insights,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
