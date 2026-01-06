import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentService {
  /**
   * Get available time slots for 3 months from current date
   */
  async getAvailableTimeSlots(
    clinicId: string,
    vaccineId?: string
  ) {
    try {
      // Verify vaccination center exists
      const vaccinationCenter = await prisma.vaccinationCenter.findUnique({
        where: { id: clinicId },
      });

      if (!vaccinationCenter) {
        throw new AppError('Vaccination center not found', 404);
      }

      // Get clinic working hours (assuming 9 AM to 6 PM, 30-min slots)
      const workingHours = {
        start: 9,
        end: 18,
        slotDuration: 30, // minutes
      };

      // Generate time slots template
      const timeSlotTemplate: string[] = [];
      for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        for (let minute = 0; minute < 60; minute += workingHours.slotDuration) {
          const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          timeSlotTemplate.push(time);
        }
      }

      // Calculate date range: today to 30 days ahead
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      thirtyDaysLater.setHours(23, 59, 59, 999);

      // Get all booked appointments for the 30-day period
      const bookedAppointments = await prisma.appointment.findMany({
        where: {
          clinicId,
          scheduledDate: {
            gte: today,
            lte: thirtyDaysLater,
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
        },
        select: {
          scheduledDate: true,
          scheduledTime: true,
        },
      });

      // Create a map of booked times by date
      const bookedTimesMap: Record<string, string[]> = {};
      bookedAppointments.forEach(apt => {
        const dateKey = apt.scheduledDate.toISOString().split('T')[0];
        if (!bookedTimesMap[dateKey]) {
          bookedTimesMap[dateKey] = [];
        }
        bookedTimesMap[dateKey].push(apt.scheduledTime);
      });

      // Generate slots for each day in the 3-month range
      const allSlots: Array<{
        date: string;
        dayName: string;
        slots: Array<{ time: string; isAvailable: boolean }>;
        availableCount: number;
        totalCount: number;
      }> = [];

      const currentDate = new Date(today);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      while (currentDate <= thirtyDaysLater) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const bookedTimes = bookedTimesMap[dateKey] || [];
        const dayName = dayNames[currentDate.getDay()];

        // Generate slots with availability for this date
        const slotsForDay = timeSlotTemplate.map(time => ({
          time,
          isAvailable: !bookedTimes.includes(time),
        }));

        const availableCount = slotsForDay.filter(s => s.isAvailable).length;

        allSlots.push({
          date: dateKey,
          dayName,
          slots: slotsForDay,
          availableCount,
          totalCount: timeSlotTemplate.length,
        });

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        message: 'Time slots retrieved successfully',
        vaccinationCenter: {
          id: vaccinationCenter.id,
          name: vaccinationCenter.name,
        },
        dateRange: {
          from: today.toISOString().split('T')[0],
          to: thirtyDaysLater.toISOString().split('T')[0],
          totalDays: allSlots.length,
        },
        slotInfo: {
          startTime: `${String(workingHours.start).padStart(2, '0')}:00`,
          endTime: `${String(workingHours.end).padStart(2, '0')}:00`,
          slotDuration: workingHours.slotDuration,
          slotsPerDay: timeSlotTemplate.length,
        },
        dates: allSlots,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve time slots', 500);
    }
  }

  /**
   * Book an appointment
   * For ADMIN: parentId is passed in data, no ownership validation
   * For PARENT: parentId is from auth, validates ownership
   */
  async bookAppointment(
    userId: string,
    userType: string,
    data: {
      childId?: string;
      parentId?: string; // Required for ADMIN
      clinicId: string;
      vaccineId: string;
      scheduledDate: Date;
      scheduledTime: string;
      medicalStaffId?: string;
      notes?: string;
      status?: string;
    }
  ) {
    try {
      let parentId: string;

      if (userType === 'ADMIN') {
        // Admin must provide parentId in data
        if (!data.parentId) {
          throw new AppError('Parent ID is required for admin', 400);
        }
        parentId = data.parentId;

        // Just verify child exists (no ownership check)
        if (data?.childId) {
          const child = await prisma.child.findFirst({
            where: {
              id: data.childId,
              isActive: true,
            },
          });


          if (!child) {
            throw new AppError('Child not found', 404);
          }
        }
      } else {
        // For PARENT - verify child belongs to parent
        parentId = userId;
        if (data?.childId) {
          const child = await prisma.child.findFirst({
            where: {
              id: data.childId,
              parentId: parentId,
              isActive: true,
            },
          });


          if (!child) {
            throw new AppError('Child not found or does not belong to you', 404);
          }
        }
      }

      // 2. Run independent validation queries in parallel for better performance
      const [vaccinationCenter, vaccine, existingAppointment] = await Promise.all([
        // Verify vaccination center exists and is active
        prisma.vaccinationCenter.findUnique({
          where: { id: data.clinicId, isActive: true },
        }),
        // Verify vaccine exists
        prisma.vaccine.findUnique({
          where: { id: data.vaccineId, isActive: true },
        }),
        // Check if slot is already booked
        prisma.appointment.findFirst({
          where: {
            clinicId: data.clinicId,
            scheduledDate: data.scheduledDate,
            scheduledTime: data.scheduledTime,
            status: {
              in: ['SCHEDULED', 'CONFIRMED'],
            },
          },
        }),
      ]);

      if (!vaccinationCenter) {
        throw new AppError('Vaccination center not found or inactive', 404);
      }

      if (!vaccine) {
        throw new AppError('Vaccine not found or inactive', 404);
      }

      if (existingAppointment) {
        throw new AppError('This time slot is already booked. Please select another time.', 409);
      }

      // 3. Check inventory (depends on vaccine.dosageCount from above)
      const inventoryRecord = await prisma.vaccineInventory.findFirst({
        where: {
          clinicId: data.clinicId,
          vaccineId: data.vaccineId,
          quantity: { gte: vaccine.dosageCount },
          expiryDate: { gt: data.scheduledDate },
        },
        select: { id: true }
      });

      if (!inventoryRecord) {
        throw new AppError('Insufficient vaccine inventory for the selected vaccine at this center. Please contact center or find other center', 400);
      }

      // 5. Generate 4-digit verification code
      const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      const dataObject = {
        child: {},
        // parentId: parentId,
        // clinicId: data.clinicId,
        // vaccineId: data.vaccineId,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        status: (data.status as any) || 'SCHEDULED',
        verificationCode: verificationCode,
        notes: data.notes,
        // medicalStaffId: data.medicalStaffId,
        // child: { connect: { id: data?.childId ?? null } },
        parent: { connect: { id: parentId } },
        vaccinationCenter: { connect: { id: data.clinicId } },
        vaccine: { connect: { id: data.vaccineId } },
        medicalStaff: data.medicalStaffId ? { connect: { id: data.medicalStaffId } } : undefined,
      }
      if (data?.childId) dataObject.child = { connect: { id: data.childId } }
      // 6. Create appointment
      const appointment = await prisma.appointment.create({
        data: { ...dataObject },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              dateOfBirth: true,
              gender: true,
              weightKg: true,
              heightCm: true,
              bloodGroup: true,
              allergies: true,
              pediatrician: true,
              medicalConditions: true,
              specialNotes: true,
              profilePhoto: true,
            },
          },
          vaccinationCenter: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
          vaccine: {
            select: {
              id: true,
              name: true,
              manufacturer: true,
              ageGroupLabel: true,
              description: true,
              notes: true,
              sideEffects: true
            },
          },
        },
      });

      return {
        message: 'Appointment booked successfully',
        appointment,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Book appointment error:', error);
      throw new AppError('Failed to book appointment', 500);
    }
  }

  /**
   * Get appointment by ID
   * For ADMIN: No ownership validation
   * For PARENT: Validates ownership
   */
  async getAppointmentById(appointmentId: string, userId: string, userType: string) {
    try {
      const where: any = { id: appointmentId };

      // Only filter by parentId for PARENT users
      if (userType === 'PARENT') {
        where.parentId = userId;
      }

      const appointment = await prisma.appointment.findFirst({
        where,
        include: {
          child: {
            select: {
              id: true,
              name: true,
              dateOfBirth: true,
              gender: true,
              profilePhoto: true,
              weightKg: true,
              heightCm: true,
              bloodGroup: true,
              allergies: true,
              pediatrician: true,
              medicalConditions: true,
              specialNotes: true
            },
          },
          vaccinationCenter: {
            select: {
              id: true,
              name: true,
              address: true,
              pincode: true,
              phone: true,
              email: true,
            },
          },
          vaccine: {
            select: {
              id: true,
              name: true,
              manufacturer: true,
              description: true,
              dosage: true,
              ageGroupLabel: true,
              dosageCount: true,
              sideEffects: true,
            },
          },
          medicalStaff: {
            select: {
              id: true,
              fullName: true,
              specialization: true,
              phone: true,
              dialCode: true,
              email: true,
              gender: true,
              profilePhoto: true,
              address: true,
              department: true,
              employmentStatus: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      return {
        message: 'Appointment retrieved successfully',
        appointment,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve appointment', 500);
    }
  }

  /**
   * Get all appointments for a parent (kept for backward compatibility)
   */
  async getParentAppointments(
    parentId: string,
    filters?: {
      status?: AppointmentStatus;
      childId?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ) {
    return this.getAppointments(parentId, 'PARENT', filters);
  }

  /**
   * Get all appointments for PARENT, MEDICAL_STAFF, and ADMIN
   * - PARENT: Returns appointments for their children
   * - MEDICAL_STAFF: Returns appointments at their vaccination center
   * - ADMIN: Returns all appointments with optional filters
   */
  async getAppointments(
    userId: string,
    userType: string,
    filters?: {
      status?: string; // Supports: pending, completed, upcoming, or direct AppointmentStatus
      childId?: string;
      parentId?: string;
      clinicId?: string;
      medicalStaffId?: string;
      fromDate?: Date;
      toDate?: Date;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const where: any = {};

      // Filter based on user type
      if (userType === 'PARENT') {
        where.parentId = userId;
      } else if (userType === 'MEDICAL_STAFF') {
        // Get the medical staff's clinic ID
        const medicalStaff = await prisma.medicalStaff.findUnique({
          where: { id: userId },
          select: { clinicId: true },
        });

        if (medicalStaff?.clinicId) {
          where.clinicId = medicalStaff.clinicId;
        }
      } else if (userType === 'ADMIN') {
        // ADMIN can filter by clinicId, parentId, and medicalStaffId
        if (filters?.clinicId) {
          where.clinicId = filters.clinicId;
        }
        if (filters?.parentId) {
          where.parentId = filters.parentId;
        }
        if (filters?.medicalStaffId) {
          where.medicalStaffId = filters.medicalStaffId;
        }
      }

      // Handle status filter - support user-friendly values (pending, completed, upcoming)
      if (filters?.status) {
        const statusLower = filters.status.toLowerCase();
        if (statusLower === 'pending') {
          // Pending = SCHEDULED, CONFIRMED, CHECK_IN, START_VISIT
          where.status = {
            in: ['SCHEDULED', 'CONFIRMED', 'CHECK_IN', 'START_VISIT'],
          };
        } else if (statusLower === 'completed') {
          // Completed = COMPLETED
          where.status = 'COMPLETED';
        } else if (statusLower === 'upcoming') {
          // Upcoming = SCHEDULED only (not yet started)
          where.status = 'SCHEDULED';
        } else {
          // Direct status value (e.g., SCHEDULED, CONFIRMED, etc.)
          where.status = filters.status.toUpperCase() as AppointmentStatus;
        }
      }

      if (filters?.childId) {
        where.childId = filters.childId;
      }

      // Search functionality for ADMIN
      if (filters?.search && userType === 'ADMIN') {
        where.OR = [
          { child: { name: { contains: filters.search, mode: 'insensitive' } } },
          { parent: { fullName: { contains: filters.search, mode: 'insensitive' } } },
          { vaccine: { name: { contains: filters.search, mode: 'insensitive' } } },
          { verificationCode: { contains: filters.search } },
        ];
      }

      // Date range handling
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      // Check if status is "completed" - no default date filter for completed
      const isCompletedStatus = filters?.status?.toLowerCase() === 'completed';

      if (filters?.fromDate || filters?.toDate) {
        // Use provided dates
        if (filters.fromDate) {
          startDate = new Date(filters.fromDate);
          startDate.setHours(0, 0, 0, 0);
        }

        if (filters.toDate) {
          endDate = new Date(filters.toDate);
          endDate.setHours(23, 59, 59, 999);
        }

        if (startDate || endDate) {
          where.scheduledDate = {};
          if (startDate) where.scheduledDate.gte = startDate;
          if (endDate) where.scheduledDate.lte = endDate;
        }
      } else if (userType !== 'ADMIN' && !isCompletedStatus) {
        // Default: next 30 days from today (only for non-admin and non-completed status)
        // Completed appointments should show all history without date restriction
        startDate = today;
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        endDate.setHours(23, 59, 59, 999);

        where.scheduledDate = {
          gte: startDate,
          lte: endDate,
        };
      }

      // Pagination for ADMIN
      const page = filters?.page || 1;
      const limit = filters?.limit || (userType === 'ADMIN' ? 10 : 100);
      const skip = (page - 1) * limit;

      const includeFields = {
        child: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            gender: true,
            profilePhoto: true,
            weightKg: true,
            heightCm: true,
            bloodGroup: true,
            allergies: true,
            pediatrician: true,
            medicalConditions: true,
            specialNotes: true,
          },
        },
        vaccinationCenter: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        vaccine: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            description: true,
            dosage: true,
            ageGroupLabel: true,
            dosageCount: true,
            sideEffects: true,
          },
        },
        parent: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            relationWithChild: true,
            profilePhoto: true,
            dialCode: true,
          },
        },
        medicalStaff: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
            role: true,
          },
        },
      };
      // For ADMIN, use pagination; for others, fetch all
      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: includeFields,
          orderBy: userType === 'ADMIN'
            ? [{ scheduledDate: 'desc' }, { scheduledTime: 'desc' }]
            : [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
          ...(userType === 'ADMIN' ? { skip, take: limit } : {}),
        }),
        userType === 'ADMIN' ? prisma.appointment.count({ where }) : Promise.resolve(0),
      ]);

      // Calculate statistics
      const completed = appointments.filter(apt => apt.status === 'COMPLETED');
      const pending = appointments.filter(apt =>
        ['SCHEDULED', 'CONFIRMED', 'CHECK_IN', 'START_VISIT'].includes(apt.status)
      );

      const result: any = {
        message: 'Appointments retrieved successfully',
        statistics: {
          total: userType === 'ADMIN' ? total : appointments.length,
          completed: completed.length,
          pending: pending.length,
        },
        appointments,
      };

      // Add date range for non-admin users
      if (startDate && endDate) {
        result.dateRange = {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
        };
      }

      // Add pagination info for ADMIN
      if (userType === 'ADMIN') {
        result.pagination = {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        };
      }

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve appointments', 500);
    }
  }

  /**
   * Cancel an appointment
   * For ADMIN: No ownership validation
   * For PARENT: Validates ownership
   * For MEDICAL_STAFF: Validates appointment is at their vaccination center
   */
  async cancelAppointment(
    appointmentId: string,
    userId: string,
    userType: string,
    data?: {
      cancellationReason?: string;
      notes?: string;
    }
  ) {
    try {
      const where: any = { id: appointmentId };

      // Only filter by parentId for PARENT users
      if (userType === 'PARENT') {
        where.parentId = userId;
      }

      const appointment = await prisma.appointment.findFirst({ where });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      // For MEDICAL_STAFF, verify appointment is at their vaccination center
      if (userType === 'MEDICAL_STAFF') {
        const medicalStaff = await prisma.medicalStaff.findUnique({
          where: { id: userId },
          select: { clinicId: true, fullName: true },
        });

        if (!medicalStaff) {
          throw new AppError('Medical staff not found', 404);
        }

        if (medicalStaff.clinicId && appointment.clinicId !== medicalStaff.clinicId) {
          throw new AppError('This appointment is not at your vaccination center', 403);
        }
      }

      if (appointment.status === 'CANCELLED') {
        throw new AppError('Appointment is already cancelled', 400);
      }

      if (appointment.status === 'COMPLETED') {
        throw new AppError('Cannot cancel a completed appointment', 400);
      }

      // Update appointment status with cancellation reason
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          cancellationReason: data?.cancellationReason || null,
          notes: data?.notes || appointment.notes,
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
            },
          },
          vaccine: {
            select: {
              id: true,
              name: true,
            },
          },
          vaccinationCenter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        message: 'Appointment cancelled successfully',
        appointment: updatedAppointment,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to cancel appointment', 500);
    }
  }

  /**
   * Reschedule an appointment
   * For ADMIN: No ownership validation
   * For PARENT: Validates ownership
   */
  async rescheduleAppointment(
    appointmentId: string,
    userId: string,
    userType: string,
    data: {
      scheduledDate: Date;
      scheduledTime: string;
    }
  ) {
    try {
      const where: any = { id: appointmentId };

      // Only filter by parentId for PARENT users
      if (userType === 'PARENT') {
        where.parentId = userId;
      }

      const appointment = await prisma.appointment.findFirst({ where });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      if (appointment.status === 'CANCELLED') {
        throw new AppError('Cannot reschedule a cancelled appointment', 400);
      }

      if (appointment.status === 'COMPLETED') {
        throw new AppError('Cannot reschedule a completed appointment', 400);
      }

      // Check if new slot is available
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          clinicId: appointment.clinicId,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
          id: {
            not: appointmentId, // Exclude current appointment
          },
        },
      });

      if (existingAppointment) {
        throw new AppError('This time slot is already booked. Please select another time.', 409);
      }

      // Update appointment
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          status: 'SCHEDULED', // Reset to scheduled if it was confirmed
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
            },
          },
          vaccinationCenter: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          vaccine: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        message: 'Appointment rescheduled successfully',
        appointment: updatedAppointment,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to reschedule appointment', 500);
    }
  }

  /**
   * Parent acknowledges/marks appointment as complete
   * Only allowed if medical staff has already completed the appointment
   */
  async markAsComplete(appointmentId: string, parentId: string) {
    try {
      // Verify appointment belongs to parent
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          parentId: parentId,
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
            },
          },
          vaccine: {
            select: {
              id: true,
              name: true,
            },
          },
          vaccinationCenter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      // Check if medical staff has completed the appointment
      if (appointment.status !== 'COMPLETED') {
        throw new AppError(
          'Cannot mark as complete. Medical staff has not completed this appointment yet.',
          400
        );
      }

      // Check if already acknowledged by parent
      if (appointment.isParentAcknowledged) {
        throw new AppError('Appointment already marked as complete by you', 400);
      }

      // Update appointment with parent acknowledgment
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          isParentAcknowledged: true,
          parentAcknowledgedAt: new Date(),
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
          vaccine: {
            select: {
              id: true,
              name: true,
              manufacturer: true,
            },
          },
          vaccinationCenter: {
            select: {
              id: true,
              name: true,
              address: true,
              // city: true,
            },
          },
          vaccinationRecord: {
            select: {
              id: true,
              administeredDate: true,
              doseNumber: true,
              nextDueDate: true,
            },
          },
        },
      });

      return {
        message: 'Appointment marked as complete successfully',
        appointment: updatedAppointment,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to mark appointment as complete', 500);
    }
  }

  /**
   * Update appointment (Admin only)
   */
  async updateAppointment(
    appointmentId: string,
    data: {
      childId?: string;
      parentId?: string;
      clinicId?: string;
      vaccineId?: string;
      scheduledDate?: Date;
      scheduledTime?: string;
      medicalStaffId?: string;
      status?: string;
      notes?: string;
    }
  ) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          ...(data.childId && { childId: data.childId }),
          ...(data.parentId && { parentId: data.parentId }),
          ...(data.clinicId && { clinicId: data.clinicId }),
          ...(data.vaccineId && { vaccineId: data.vaccineId }),
          ...(data.scheduledDate && { scheduledDate: data.scheduledDate }),
          ...(data.scheduledTime && { scheduledTime: data.scheduledTime }),
          ...(data.medicalStaffId !== undefined && { medicalStaffId: data.medicalStaffId || null }),
          ...(data.status && { status: data.status as any }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              dateOfBirth: true,
            },
          },
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
          vaccinationCenter: {
            select: {
              id: true,
              name: true,
            },
          },
          vaccine: {
            select: {
              id: true,
              name: true,
            },
          },
          medicalStaff: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      return {
        message: 'Appointment updated successfully',
        appointment: updatedAppointment,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update appointment', 500);
    }
  }

  /**
   * Delete appointment (Admin only)
   */
  async deleteAppointment(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      // Check if appointment has vaccination record
      const hasRecord = await prisma.vaccinationRecord.findFirst({
        where: { appointmentId: appointmentId },
      });

      if (hasRecord) {
        throw new AppError('Cannot delete appointment with vaccination record. Cancel it instead.', 400);
      }

      await prisma.appointment.delete({
        where: { id: appointmentId },
      });

      return { message: 'Appointment deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete appointment', 500);
    }
  }

  /**
   * Get appointment statistics (Admin only)
   */
  async getAppointmentStats(clinicId?: string) {
    try {
      const where: any = clinicId ? { clinicId } : {};

      const [
        total,
        scheduled,
        confirmed,
        completed,
        cancelled,
        noShow,
        todayAppointments,
      ] = await Promise.all([
        prisma.appointment.count({ where }),
        prisma.appointment.count({ where: { ...where, status: 'SCHEDULED' } }),
        prisma.appointment.count({ where: { ...where, status: 'CONFIRMED' } }),
        prisma.appointment.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.appointment.count({ where: { ...where, status: 'CANCELLED' } }),
        prisma.appointment.count({ where: { ...where, status: 'NO_SHOW' } }),
        prisma.appointment.count({
          where: {
            ...where,
            scheduledDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
      ]);

      return {
        total,
        scheduled,
        confirmed,
        completed,
        cancelled,
        noShow,
        todayAppointments,
        pending: scheduled + confirmed,
      };
    } catch (error) {
      throw new AppError('Failed to retrieve appointment stats', 500);
    }
  }
}
