import { Request, Response, NextFunction } from 'express';
import { TalukaService } from '../services/taluka.service';
import { ApiResponse } from '../types/response.types';

export class TalukaController {
  private talukaService: TalukaService;

  constructor() {
    this.talukaService = new TalukaService();
  }

  createTaluka = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taluka = await this.talukaService.createTaluka(req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'Taluka created successfully',
        data: taluka,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAllTalukas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, search, status, districtId } = req.query;

      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: status as string,
        districtId: districtId as string,
      };

      const result = await this.talukaService.getAllTalukas(options);
      const response: ApiResponse = {
        status: 'success',
        message: 'Talukas retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getTalukaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const taluka = await this.talukaService.getTalukaById(id);
      const response: ApiResponse = {
        status: 'success',
        message: 'Taluka retrieved successfully',
        data: taluka,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateTaluka = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const taluka = await this.talukaService.updateTaluka(id, req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'Taluka updated successfully',
        data: taluka,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteTaluka = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.talukaService.deleteTaluka(id);
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
