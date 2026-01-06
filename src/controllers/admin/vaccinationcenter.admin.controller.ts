import { Response, NextFunction } from 'express';
import { VaccinationCenterAdminService } from '../../services/admin/vaccinationcenter.admin.service';
import { ApiResponse } from '../../types/response.types';
import { AuthRequest } from '../../types/request.types';

export class VaccinationCenterAdminController {
  private vaccinationCenterService: VaccinationCenterAdminService;

  constructor() {
    this.vaccinationCenterService = new VaccinationCenterAdminService();
  }

  /**
   * Create a new vaccination center
   * POST /api/v1/admin/vaccination-centers
   */
  createVaccinationCenter = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.vaccinationCenterService.createVaccinationCenter(req.body);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.vaccinationCenter,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all vaccination centers
   * GET /api/v1/admin/vaccination-centers
   */
  getAllVaccinationCenters = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { page, limit, search, isActive } = req.query;

      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };

      const result = await this.vaccinationCenterService.getAllVaccinationCenters(options);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          vaccinationCenters: result.vaccinationCenters,
          pagination: result.pagination,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vaccination center by ID
   * GET /api/v1/admin/vaccination-centers/:id
   */
  getVaccinationCenterById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.vaccinationCenterService.getVaccinationCenterById(id);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.vaccinationCenter,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update vaccination center
   * PUT /api/v1/admin/vaccination-centers/:id
   */
  updateVaccinationCenter = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.vaccinationCenterService.updateVaccinationCenter(id, req.body);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.vaccinationCenter,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete vaccination center
   * DELETE /api/v1/admin/vaccination-centers/:id
   */
  deleteVaccinationCenter = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.vaccinationCenterService.deleteVaccinationCenter(id);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.vaccinationCenter,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggle vaccination center active status
   * PATCH /api/v1/admin/vaccination-centers/:id/toggle-status
   */
  toggleActiveStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.vaccinationCenterService.toggleActiveStatus(id);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.vaccinationCenter,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vaccination center statistics
   * GET /api/v1/admin/vaccination-centers/:id/stats
   */
  getVaccinationCenterStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.vaccinationCenterService.getVaccinationCenterStats(id);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.stats,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
