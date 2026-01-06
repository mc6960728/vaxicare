import { Request, Response, NextFunction } from 'express';
import { VillageService } from '../services/village.service';
import { ApiResponse } from '../types/response.types';

export class VillageController {
  private villageService: VillageService;

  constructor() {
    this.villageService = new VillageService();
  }

  createVillage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const village = await this.villageService.createVillage(req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'Village created successfully',
        data: village,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAllVillages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, search, status, talukaId, districtId } = req.query;

      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: status as string,
        talukaId: talukaId as string,
        districtId: districtId as string,
      };

      const result = await this.villageService.getAllVillages(options);
      const response: ApiResponse = {
        status: 'success',
        message: 'Villages retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getVillageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const village = await this.villageService.getVillageById(id);
      const response: ApiResponse = {
        status: 'success',
        message: 'Village retrieved successfully',
        data: village,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateVillage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const village = await this.villageService.updateVillage(id, req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'Village updated successfully',
        data: village,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteVillage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.villageService.deleteVillage(id);
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
