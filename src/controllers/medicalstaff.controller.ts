import { Response, NextFunction } from 'express';
import { MedicalStaffService } from '../services/medicalstaff.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';
import { AppError } from '../utils/AppError';
import { AppointmentStatus } from '@prisma/client';

export class MedicalStaffController {
  private medicalStaffService: MedicalStaffService;

  constructor() {
    this.medicalStaffService = new MedicalStaffService(); 
  }

  /**
   * Get dashboard data for medical staff
   * GET /api/v1/medical-staff/dashboard
   */
  getDashboard = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can access this.', 403);
      }

      const result = await this.medicalStaffService.getDashboard(medicalStaffId);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          staff: result.staff,
          vaccinationCenter: result.vaccinationCenter,
          todayOverview: result.todayOverview,
          upcomingAppointments: result.upcomingAppointments,
          // quickActions: result.quickActions,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get today's visits/appointments for logged-in medical staff
   * GET /api/v1/medical-staff/today-visits
   */
  getTodayVisits = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can access this.', 403);
      }

      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : undefined;
      const status = req.query.status as AppointmentStatus;

      const result = await this.medicalStaffService.getTodayVisits(
        medicalStaffId,
        targetDate,
        status
      );

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          dateRange: result.dateRange,
          vaccinationCenter: result.vaccinationCenter,
          statistics: result.statistics,
          appointments: result.appointments,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get appointment details by ID
   * GET /api/v1/medical-staff/appointments/:id
   */
  getAppointmentDetails = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;
      const { id } = req.params;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can access this.', 403);
      }

      const result = await this.medicalStaffService.getAppointmentDetails(
        id,
        medicalStaffId
      );

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.appointment,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
  /**
   * Update appointment status (unified endpoint)
   * POST /api/v1/medical-staff/appointments/:id/update-status
   */
  updateAppointmentStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;
      const { id } = req.params;
      const { status, verificationCode, reactions, notes, batchNumber = '' } = req.body;

      // Authorization check
      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can update appointment status.', 403);
      }

      let result;

      // Route to appropriate service method based on status
      switch (status) {
        case 'start_visit':
          result = await this.medicalStaffService.startVisit(id, medicalStaffId);
          break;

        case 'check_in':
          result = await this.medicalStaffService.checkInAppointment(id, medicalStaffId, batchNumber);
          break;

        case 'check_out':
          // For check_out, pass verification code and vaccination data
          result = await this.medicalStaffService.completeVaccination(
            id,
            medicalStaffId,
            { verificationCode, reactions, notes, batchNumber }
          );
          break;

        default:
          throw new AppError('Invalid status provided', 400);
      }

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.vaccinationRecord
          ? {
            appointment: result.appointment,
            vaccinationRecord: result.vaccinationRecord,
          }
          : result.appointment,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
  /**
   * Start visit - marks appointment as CONFIRMED and assigns medical staff
   * POST /api/v1/medical-staff/appointments/:id/start-visit
   */
  startVisit = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;
      const { id } = req.params;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can start visit.', 403);
      }

      const result = await this.medicalStaffService.startVisit(id, medicalStaffId);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.appointment,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check-in appointment (deprecated - use startVisit instead)
   * POST /api/v1/medical-staff/appointments/:id/check-in
   */
  checkInAppointment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;
      const { id } = req.params;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can check-in.', 403);
      }

      const result = await this.medicalStaffService.checkInAppointment(id, medicalStaffId);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.appointment,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Complete vaccination and create vaccination record
   * POST /api/v1/medical-staff/appointments/:id/complete
   */
  completeVaccination = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;
      const { id } = req.params;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can complete vaccination.', 403);
      }

      const result = await this.medicalStaffService.completeVaccination(
        id,
        medicalStaffId,
        req.body
      );

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          appointment: result.appointment,
          vaccinationRecord: result.vaccinationRecord,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel appointment
   * POST /api/v1/medical-staff/appointments/:id/cancel
   */
  cancelAppointment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;
      const { id } = req.params;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can cancel appointments.', 403);
      }

      const result = await this.medicalStaffService.cancelAppointment(
        id,
        medicalStaffId,
        req.body
      );

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.appointment,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vaccination records (completed visits history)
   * GET /api/v1/medical-staff/records
   */
  getRecords = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can access this.', 403);
      }

      const { search } = req.query;

      const result = await this.medicalStaffService.getRecords(
        medicalStaffId,
        search as string | undefined
      );

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          totalRecords: result.totalRecords,
          records: result.records,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get inventory for medical staff's vaccination center
   * GET /api/v1/medical-staff/inventory
   */
  getInventory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can access this.', 403);
      }

      const { search } = req.query;

      const result = await this.medicalStaffService.getInventory(
        medicalStaffId,
        search as string | undefined
      );

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          vaccinationCenter: result.vaccinationCenter,
          statistics: result.statistics,
          inventory: result.inventory,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Request new stock
   * POST /api/v1/medical-staff/inventory/request
   */
  requestStock = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can request stock.', 403);
      }

      const result = await this.medicalStaffService.requestStock(
        medicalStaffId,
        req.body
      );

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.stockRequest,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get stock requests history
   * GET /api/v1/medical-staff/inventory/requests
   */
  getStockRequests = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const medicalStaffId = req.user?.id;

      if (!medicalStaffId || req.user?.userType !== 'MEDICAL_STAFF') {
        throw new AppError('Unauthorized. Only medical staff can access this.', 403);
      }

      const result = await this.medicalStaffService.getStockRequests(medicalStaffId);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          totalRequests: result.totalRequests,
          requests: result.requests,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
