import { Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';
import { AppError } from '../utils/AppError';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService();
  }

  /**
   * Get available time slots for 3 months
   * GET /api/v1/appointments/time-slots?clinicId=xxx
   */
  getAvailableTimeSlots = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { clinicId, vaccineId } = req.query;

      if (!clinicId) {
        throw new AppError('Clinic ID is required', 400);
      }

      const result = await this.appointmentService.getAvailableTimeSlots(
        clinicId as string,
        vaccineId as string
      );

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: {
          vaccinationCenter: result.vaccinationCenter,
          dateRange: result.dateRange,
          slotInfo: result.slotInfo,
          dates: result.dates,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Book an appointment
   * POST /api/v1/appointments
   * For ADMIN: Can book for any parent/child
   * For PARENT: Can only book for their children
   */
  bookAppointment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userType = req.user?.userType;

      if (!userId || !['PARENT', 'ADMIN'].includes(userType || '')) {
        throw new AppError('Unauthorized. Only parents and admins can book appointments.', 403);
      }

      // Parse date
      const appointmentData = {
        ...req.body,
        scheduledDate: new Date(req.body.scheduledDate),
      };

      const result = await this.appointmentService.bookAppointment(userId, userType as string, appointmentData);

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: result.appointment,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get appointment by ID
   * GET /api/v1/appointments/:id
   * For ADMIN: Can access any appointment
   * For PARENT: Can only access their appointments
   */
  getAppointmentById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userType = req.user?.userType;
      const { id } = req.params;

      if (!userId || !['PARENT', 'ADMIN', 'MEDICAL_STAFF'].includes(userType || '')) {
        throw new AppError('Unauthorized.', 403);
      }

      const result = await this.appointmentService.getAppointmentById(id, userId, userType as string);

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
   * Get all appointments
   * GET /api/v1/appointments?status=SCHEDULED&childId=xxx
   *
   * For PARENT: Returns appointments for their children
   * For MEDICAL_STAFF: Returns appointments at their vaccination center
   * For ADMIN: Returns all appointments with optional filters
   */
  getParentAppointments = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userType = req.user?.userType;

      if (!userId || !['PARENT', 'MEDICAL_STAFF', 'ADMIN'].includes(userType || '')) {
        throw new AppError('Unauthorized.', 403);
      }

      const filters: any = {};

      if (req.query.status) {
        filters.status = req.query.status as AppointmentStatus;
      }

      if (req.query.childId) {
        filters.childId = req.query.childId as string;
      }

      if (req.query.fromDate) {
        filters.fromDate = new Date(req.query.fromDate as string);
      }

      if (req.query.toDate) {
        filters.toDate = new Date(req.query.toDate as string);
      }

      // ADMIN specific filters
      if (userType === 'ADMIN') {
        if (req.query.clinicId) {
          filters.clinicId = req.query.clinicId as string;
        }
        if (req.query.parentId) {
          filters.parentId = req.query.parentId as string;
        }
        if (req.query.medicalStaffId) {
          filters.medicalStaffId = req.query.medicalStaffId as string;
        }
        if (req.query.search) {
          filters.search = req.query.search as string;
        }
        if (req.query.page) {
          filters.page = parseInt(req.query.page as string);
        }
        if (req.query.limit) {
          filters.limit = parseInt(req.query.limit as string);
        }
      }

      const result = await this.appointmentService.getAppointments(userId, userType as string, filters);

      // Different response format based on user type
      let responseData: any;

      if (userType === 'PARENT') {
        // Original parent response format - DO NOT CHANGE
        responseData = {
          count: result.appointments.length,
          appointments: result.appointments,
        };
      } else if (userType === 'ADMIN') {
        // Admin response format - with pagination
        responseData = {
          ...result,
        };
        delete responseData.message;
      } else {
        // Medical staff response format - with dateRange and statistics
        responseData = {
          dateRange: result.dateRange,
          statistics: result.statistics,
          appointments: result.appointments,
        };
      }

      const response: ApiResponse = {
        status: 'success',
        message: result.message,
        data: responseData,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel an appointment
   * DELETE /api/v1/appointments/:id
   * For ADMIN: Can cancel any appointment
   * For PARENT: Can only cancel their appointments
   * For MEDICAL_STAFF: Can cancel appointments at their vaccination center
   */
  cancelAppointment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userType = req.user?.userType;
      const { id } = req.params;
      const { cancellationReason, notes } = req.body;

      if (!userId || !['PARENT', 'ADMIN', 'MEDICAL_STAFF'].includes(userType || '')) {
        throw new AppError('Unauthorized.', 403);
      }

      const result = await this.appointmentService.cancelAppointment(
        id,
        userId,
        userType as string,
        { cancellationReason, notes }
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
   * Reschedule an appointment
   * PUT /api/v1/appointments/:id/reschedule
   * For ADMIN: Can reschedule any appointment
   * For PARENT: Can only reschedule their appointments
   */
  rescheduleAppointment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userType = req.user?.userType;
      const { id } = req.params;

      if (!userId || !['PARENT', 'ADMIN'].includes(userType || '')) {
        throw new AppError('Unauthorized.', 403);
      }

      const rescheduleData = {
        scheduledDate: new Date(req.body.scheduledDate),
        scheduledTime: req.body.scheduledTime,
      };

      const result = await this.appointmentService.rescheduleAppointment(
        id,
        userId,
        userType as string,
        rescheduleData
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
   * Parent marks appointment as complete (acknowledges completion)
   * POST /api/v1/appointments/:id/mark-complete
   */
  markAsComplete = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const parentId = req.user?.id;
      const { id } = req.params;

      if (!parentId || req.user?.userType !== 'PARENT') {
        throw new AppError('Unauthorized. Only parents can mark appointments as complete.', 403);
      }

      const result = await this.appointmentService.markAsComplete(id, parentId);

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
   * Update appointment (Admin only)
   * PUT /api/v1/appointments/:id
   */
  updateAppointment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Only admins can update appointments.', 403);
      }

      const { id } = req.params;
      const data = {
        ...req.body,
        ...(req.body.scheduledDate && { scheduledDate: new Date(req.body.scheduledDate) }),
      };

      const result = await this.appointmentService.updateAppointment(id, data);

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
   * Delete appointment (Admin only)
   * DELETE /api/v1/appointments/:id/delete
   */
  deleteAppointment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Only admins can delete appointments.', 403);
      }

      const { id } = req.params;
      const result = await this.appointmentService.deleteAppointment(id);

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get appointment statistics (Admin only)
   * GET /api/v1/appointments/stats
   */
  getAppointmentStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (req.user?.userType !== 'ADMIN') {
        throw new AppError('Unauthorized. Only admins can view appointment stats.', 403);
      }

      const clinicId = req.query.clinicId as string;
      const stats = await this.appointmentService.getAppointmentStats(clinicId);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
