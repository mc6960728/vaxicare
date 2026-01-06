import { Request, Response, NextFunction } from 'express';
import { VaccineScheduleService } from '../services/vaccine-schedule.service';
import { ApiResponse } from '../types/response.types';

export class VaccineScheduleController {
  private vaccineScheduleService: VaccineScheduleService;

  constructor() {
    this.vaccineScheduleService = new VaccineScheduleService();
  }

  /**
   * Get all vaccine schedules
   * GET /api/v1/vaccine-schedules
   */
  getAllSchedules = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.vaccineScheduleService.getAllSchedules();

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccine schedules retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get schedules by vaccine ID
   * GET /api/v1/vaccine-schedules/vaccine/:vaccineId
   */
  getSchedulesByVaccine = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { vaccineId } = req.params;
      const result = await this.vaccineScheduleService.getSchedulesByVaccine(
        vaccineId
      );

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccine schedules retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get schedule by ID
   * GET /api/v1/vaccine-schedules/:id
   */
  getScheduleById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.vaccineScheduleService.getScheduleById(id);

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccine schedule retrieved successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create vaccine schedule (Admin only)
   * POST /api/v1/vaccine-schedules
   */
  createSchedule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.vaccineScheduleService.createSchedule(req.body);

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccine schedule created successfully',
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update vaccine schedule (Admin only)
   * PUT /api/v1/vaccine-schedules/:id
   */
  updateSchedule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.vaccineScheduleService.updateSchedule(
        id,
        req.body
      );

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccine schedule updated successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete vaccine schedule (Admin only)
   * DELETE /api/v1/vaccine-schedules/:id
   */
  deleteSchedule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.vaccineScheduleService.deleteSchedule(id);

      const response: ApiResponse = {
        status: 'success',
        message: 'Vaccine schedule deleted successfully',
        data: null,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
