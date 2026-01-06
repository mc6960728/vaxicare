import { Response, NextFunction } from 'express';
import { SupplierAdminService } from '../../services/admin/supplier.admin.service';
import { ApiResponse } from '../../types/response.types';
import { AuthRequest } from '../../types/request.types';
import { AppError } from '../../utils/AppError';
import { InventoryStatus } from '@prisma/client';

export class SupplierAdminController {
  private supplierService: SupplierAdminService;

  constructor() {
    this.supplierService = new SupplierAdminService();
  }

  /**
   * Create new supplier
   * POST /api/v1/admin/suppliers
   */
  createSupplier = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      // Helper function to parse date
      const parseDate = (dateStr: string): Date | undefined => {
        if (!dateStr) return undefined;

        // Handle DD/MM/YYYY format
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(date.getTime())) return date;
          }
        }

        // Handle ISO format
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
      };

      const data = {
        ...req.body,
        ...(req.body.licenseExpiryDate && {
          licenseExpiryDate: parseDate(req.body.licenseExpiryDate),
        }),
      };

      const result = await this.supplierService.createSupplier(data);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.supplier,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all suppliers with pagination and filters
   * GET /api/v1/admin/suppliers
   */
  getAllSuppliers = async (
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
        status: req.query.status as InventoryStatus,
        city: req.query.city as string,
        state: req.query.state as string,
      };

      const result = await this.supplierService.getAllSuppliers(params);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          suppliers: result.data,
          pagination: result.pagination,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get supplier by ID
   * GET /api/v1/admin/suppliers/:id
   */
  getSupplierById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const { id } = req.params;
      const result = await this.supplierService.getSupplierById(id);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.supplier,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update supplier
   * PUT /api/v1/admin/suppliers/:id
   */
  updateSupplier = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      // Helper function to parse date
      const parseDate = (dateStr: string): Date | undefined => {
        if (!dateStr) return undefined;

        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(date.getTime())) return date;
          }
        }

        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
      };

      const { id } = req.params;
      const data = {
        ...req.body,
        ...(req.body.licenseExpiryDate && {
          licenseExpiryDate: parseDate(req.body.licenseExpiryDate),
        }),
      };

      const result = await this.supplierService.updateSupplier(id, data);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.supplier,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete supplier
   * DELETE /api/v1/admin/suppliers/:id
   */
  deleteSupplier = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const { id } = req.params;
      const result = await this.supplierService.deleteSupplier(id);

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
   * Toggle supplier status
   * PATCH /api/v1/admin/suppliers/:id/toggle-status
   */
  toggleSupplierStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const { id } = req.params;
      const result = await this.supplierService.toggleSupplierStatus(id);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.supplier,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get supplier statistics
   * GET /api/v1/admin/suppliers/statistics
   */
  getSupplierStatistics = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const result = await this.supplierService.getSupplierStatistics();

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
   * Get suppliers for dropdown
   * GET /api/v1/admin/suppliers/dropdown
   */
  getSuppliersDropdown = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id || req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
      }

      const result = await this.supplierService.getSuppliersDropdown();

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.suppliers,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
