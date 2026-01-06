import { Response, NextFunction } from 'express';
import { VaccineInventoryAdminService } from '../../services/admin/vaccineinventory.admin.service';
import { ApiResponse } from '../../types/response.types';
import { AuthRequest } from '../../types/request.types';
import { AppError } from '../../utils/AppError';
import { InventoryStatus } from '@prisma/client';

export class VaccineInventoryAdminController {
  private inventoryService: VaccineInventoryAdminService;

  constructor() {
    this.inventoryService = new VaccineInventoryAdminService();
  }

  /**
   * Create new vaccine inventory/stock
   * POST /api/v1/admin/vaccine-inventory
   */
  createVaccineInventory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      // Helper function to parse date in DD/MM/YYYY or ISO format
      const parseDate = (dateStr: string): Date => {
        if (!dateStr) {
          throw new AppError('Date is required', 400);
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
      };

      const data = {
        ...req.body,
        ...(req.body.manufacturingDate && {
          manufacturingDate: parseDate(req.body.manufacturingDate),
        }),
        ...(req.body.expiryDate && { expiryDate: parseDate(req.body.expiryDate) }),
      };

      const result = await this.inventoryService.createVaccineInventory(data);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.inventory,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all vaccine inventory with pagination and filters
   * GET /api/v1/admin/vaccine-inventory
   */
  getAllVaccineInventory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string,
        vaccineId: req.query.vaccineId as string,
        clinicId: req.query.clinicId as string,
        status: req.query.status as InventoryStatus,
        lowStock: req.query.lowStock === 'true',
        expired: req.query.expired === 'true',
      };

      const result = await this.inventoryService.getAllVaccineInventory(params);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          inventory: result.data,
          pagination: result.pagination,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vaccine inventory by ID
   * GET /api/v1/admin/vaccine-inventory/:id
   */
  getVaccineInventoryById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const { id } = req.params;
      const result = await this.inventoryService.getVaccineInventoryById(id);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.inventory,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update vaccine inventory
   * PUT /api/v1/admin/vaccine-inventory/:id
   */
  updateVaccineInventory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      // Helper function to parse date
      const parseDate = (dateStr: string): Date => {
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

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new AppError('Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD', 400);
        }
        return date;
      };

      const { id } = req.params;
      const data = {
        ...req.body,
        ...(req.body.manufacturingDate && {
          manufacturingDate: parseDate(req.body.manufacturingDate),
        }),
        ...(req.body.expiryDate && { expiryDate: parseDate(req.body.expiryDate) }),
      };

      const result = await this.inventoryService.updateVaccineInventory(id, data);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.inventory,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete vaccine inventory
   * DELETE /api/v1/admin/vaccine-inventory/:id
   */
  deleteVaccineInventory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const { id } = req.params;
      const result = await this.inventoryService.deleteVaccineInventory(id);

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

  /**
   * Get inventory statistics
   * GET /api/v1/admin/vaccine-inventory/statistics
   */
  getInventoryStatistics = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const clinicId = req.query.clinicId as string;
      const result = await this.inventoryService.getInventoryStatistics(clinicId);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.statistics,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get low stock alerts
   * GET /api/v1/admin/vaccine-inventory/alerts/low-stock
   */
  getLowStockAlerts = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const clinicId = req.query.clinicId as string;
      const result = await this.inventoryService.getLowStockAlerts(clinicId);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          count: result.count,
          alerts: result.alerts,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get expired vaccines
   * GET /api/v1/admin/vaccine-inventory/alerts/expired
   */
  getExpiredVaccines = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const clinicId = req.query.clinicId as string;
      const result = await this.inventoryService.getExpiredVaccines(clinicId);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          count: result.count,
          expiredVaccines: result.expiredVaccines,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get inventory by vaccination center
   * GET /api/v1/admin/vaccine-inventory/center/:clinicId
   */
  getInventoryByCenter = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const { clinicId } = req.params;
      const vaccineId = req.query.vaccineId as string;

      const result = await this.inventoryService.getInventoryByCenter(clinicId, {
        vaccineId,
      });

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          count: result.count,
          inventory: result.inventory,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update inventory quantity (for vaccination usage)
   * PATCH /api/v1/admin/vaccine-inventory/:id/quantity
   */
  updateInventoryQuantity = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const { id } = req.params;
      const { quantityUsed } = req.body;

      if (!quantityUsed || quantityUsed <= 0) {
        throw new AppError('Valid quantity used is required', 400);
      }

      const result = await this.inventoryService.updateInventoryQuantity(id, quantityUsed);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.inventory,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
