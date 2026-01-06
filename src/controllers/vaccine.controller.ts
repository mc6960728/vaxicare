import { Request, Response, NextFunction } from 'express';
import { VaccineService } from '../services/vaccine.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';

export class VaccineController {
  private vaccineService: VaccineService;

  constructor() {
    this.vaccineService = new VaccineService();
  }

  /**
   * Get all vaccines with filters
   * GET /api/v1/vaccines
   */
  getAllVaccines = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        isActive,
        ageGroupLabel,
        search,
        page,
        limit,
      } = req.query;

      const result = await this.vaccineService.getAllVaccines({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        ageGroupLabel: ageGroupLabel as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccines retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get single vaccine by ID
   * GET /api/v1/vaccines/:id
   * GET /api/v1/vaccines/:id?type=details (for mobile app - full details)
   *
   * Query Parameters:
   * - type: 'details' | undefined
   *   - undefined/basic: Returns basic vaccine info (admin panel)
   *   - 'details': Returns full details for mobile app (includes formatted schedule, benefits, risks, etc.)
   */
  getVaccineById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { type } = req.query;

      let result;
      if (type === 'details') {
        // Mobile app - full details with formatted data
        result = await this.vaccineService.getVaccineDetails(id);
      } else {
        // Admin panel - basic info
        result = await this.vaccineService.getVaccineById(id);
      }

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccine retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create new vaccine (Admin only)
   * POST /api/v1/vaccines
   */
  createVaccine = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.vaccineService.createVaccine(req.body);

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccine created successfully',
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update vaccine (Admin only)
   * PUT /api/v1/vaccines/:id
   */
  updateVaccine = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.vaccineService.updateVaccine(id, req.body);

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccine updated successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete vaccine (Admin only)
   * DELETE /api/v1/vaccines/:id
   */
  deleteVaccine = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.vaccineService.deleteVaccine(id);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: { softDelete: result.softDelete },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vaccines by age group
   * GET /api/v1/vaccines/age-group/:ageGroupLabel
   */
  getVaccinesByAgeGroup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { ageGroupLabel } = req.params;
      const result = await this.vaccineService.getVaccinesByAgeGroup(
        ageGroupLabel
      );

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccines retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get available age groups
   * GET /api/v1/vaccines/age-groups
   */
  getAgeGroups = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.vaccineService.getAgeGroups();

      const response: ApiResponse = {
        status: 'success',
        message: 'Age groups retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search vaccines
   * GET /api/v1/vaccines/search?q=bcg
   */
  searchVaccines = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { q, activeOnly } = req.query;

      if (!q) {
        res.status(400).json({
          status: 'error',
          message: 'Search query is required',
          data: null,
        });
        return;
      }

      const result = await this.vaccineService.searchVaccines(
        q as string,
        activeOnly === 'true'
      );

      const response: ApiResponse = {
        status: 'success',
        message: 'Search results retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vaccine statistics (Admin only)
   * GET /api/v1/vaccines/statistics
   */
  getStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.vaccineService.getVaccineStatistics();

      const response: ApiResponse = {
        status: 'success',
        message: 'Statistics retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
