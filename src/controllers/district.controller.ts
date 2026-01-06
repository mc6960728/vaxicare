import { Request, Response, NextFunction } from 'express';
import { DistrictService } from '../services/district.service';
import { ApiResponse } from '../types/response.types';

export class DistrictController {
  private districtService: DistrictService;

  constructor() {
    this.districtService = new DistrictService();
  }

  createDistrict = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const district = await this.districtService.createDistrict(req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'District created successfully',
        data: district,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAllDistricts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, search, status } = req.query;

      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: status as string,
      };

      const result = await this.districtService.getAllDistricts(options);
      const response: ApiResponse = {
        status: 'success',
        message: 'Districts retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getDistrictById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const district = await this.districtService.getDistrictById(id);
      const response: ApiResponse = {
        status: 'success',
        message: 'District retrieved successfully',
        data: district,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateDistrict = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const district = await this.districtService.updateDistrict(id, req.body);
      const response: ApiResponse = {
        status: 'success',
        message: 'District updated successfully',
        data: district,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteDistrict = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.districtService.deleteDistrict(id);
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
