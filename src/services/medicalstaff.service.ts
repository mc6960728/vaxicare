import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { AppointmentStatus } from '@prisma/client';

export class MedicalStaffService {
  /**
   * Validate that appointment is scheduled for today
   * Throws error if appointment is not for today's date
   */
  private validateAppointmentDate(scheduledDate: Date): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentDate = new Date(scheduledDate);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate.getTime() !== today.getTime()) {
      const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      throw new AppError(`This appointment is scheduled for ${formattedDate}. You can only start visits on the scheduled date.`, 400);
    }
  }
  /**
   * Get appointments for medical staff with date filter
   * Used for: Appointments list screen with calendar
   * OPTIMIZED: Added optional pagination and database-level statistics
   * Note: If page/limit not provided, returns all results for backward compatibility
   */
  async getAppointments(
    medicalStaffId: string,
    date?: Date,
    status?: string,
    page?: number,
    limit?: number
  ) {
    try {
      // Get medical staff details with vaccination center
      const medicalStaff = await prisma.medicalStaff.findUnique({
        where: { id: medicalStaffId },
        include: {
          vaccinationCenter: true,
        },
      });

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      // if (!medicalStaff.clinicId) {
      //   throw new AppError('No vaccination center assigned to this medical staff', 400);
      // }

      // Date range: If date provided, use that single day. Otherwise, use next 30 days from today.
      // Exception: "completed" status should show all history without date restriction
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      // Check if status is "completed" - no default date filter for completed
      const isCompletedStatus = status?.toLowerCase() === 'completed';

      if (date) {
        // Specific date provided - use that single day
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
      } else if (!isCompletedStatus) {
        // No date provided and not completed - return next 30 days (today to today + 30 days)
        startDate = today;
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        endDate.setHours(23, 59, 59, 999);
      }
      // For completed status without specific date: no date filter (show all history)

      // Build where clause - filter by clinicId (show all clinic appointments, not just assigned to this staff)
      const whereClause: any = {};

      // Staff should see ALL appointments of their assigned clinic
      // (Parent selects clinic when booking, not specific staff)
      if (medicalStaff.clinicId) {
        whereClause.clinicId = medicalStaff.clinicId;
      }

      // Only add date filter if dates are set
      if (startDate && endDate) {
        whereClause.scheduledDate = {
          gte: startDate,
          lte: endDate,
        };
      }

      // Handle status filter - support user-friendly values
      if (status) {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
          case 'pending':
            // Pending = SCHEDULED, CONFIRMED (not yet started)
            whereClause.status = {
              in: ['SCHEDULED', 'CONFIRMED'],
            };
            break;
          case 'upcoming':
            // Upcoming = SCHEDULED only
            whereClause.status = 'SCHEDULED';
            break;
          case 'start_visit':
            // Start Visit = START_VISIT
            whereClause.status = 'START_VISIT';
            break;
          case 'check_in':
            // Check In = CHECK_IN
            whereClause.status = 'CHECK_IN';
            break;
          case 'completed':
            // Completed = COMPLETED
            whereClause.status = 'COMPLETED';
            break;
          case 'cancelled':
            // Cancelled = CANCELLED
            whereClause.status = 'CANCELLED';
            break;
          case 'in_progress':
            // In Progress = CHECK_IN, START_VISIT (visit has started)
            whereClause.status = {
              in: ['CHECK_IN', 'START_VISIT'],
            };
            break;
          default:
            // Direct status value (e.g., SCHEDULED, CONFIRMED, etc.)
            whereClause.status = status.toUpperCase() as AppointmentStatus;
        }
      }

      // Build base where clause for statistics (without status filter)
      // Stats should also be for entire clinic, not just this staff
      const statsWhereClause: any = {
        ...(medicalStaff.clinicId && { clinicId: medicalStaff.clinicId }),
        ...(startDate && endDate && { scheduledDate: { gte: startDate, lte: endDate } })
      };

      // Check if pagination is requested
      const isPaginated = page !== undefined && limit !== undefined;
      const skip = isPaginated ? (page - 1) * limit : undefined;
      const take = isPaginated ? limit : undefined;

      // OPTIMIZED: Run queries in parallel - appointments, total count (if paginated), and statistics
      const [appointments, total, statusStats] = await Promise.all([
        // Get appointments (paginated if requested, all otherwise)
        prisma.appointment.findMany({
          where: whereClause,
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
                specialNotes: true,
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
                dialCode: true,
                phone: true,
                email: true,
                relationWithChild: true,
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
            medicalStaff: {
              select: {
                id: true,
                fullName: true,
                role: true,
                specialization: true,
              },
            },
          },
          orderBy: [
            { scheduledDate: 'asc' },
            { scheduledTime: 'asc' },
          ],
          ...(skip !== undefined && { skip }),
          ...(take !== undefined && { take }),
        }),
        // Get total count only if paginated
        isPaginated ? prisma.appointment.count({ where: whereClause }) : Promise.resolve(0),
        // Get statistics using groupBy (database-level aggregation)
        prisma.appointment.groupBy({
          by: ['status'],
          where: statsWhereClause,
          _count: { id: true }
        })
      ]);

      // Process statistics from groupBy result
      const statsMap = new Map(statusStats.map(s => [s.status, s._count.id]));
      const completedCount = statsMap.get('COMPLETED') || 0;
      const pendingCount = (statsMap.get('SCHEDULED') || 0) + (statsMap.get('CONFIRMED') || 0);
      const totalStats = statusStats.reduce((sum, s) => sum + s._count.id, 0);

      // Map appointments to response format
      const mappedAppointments = appointments.map(apt => ({
        id: apt.id,
        scheduledDate: apt.scheduledDate,
        scheduledTime: apt.scheduledTime,
        status: apt.status,
        verificationCode: apt.verificationCode,
        notes: apt.notes,
        child: apt.child ? {
          id: apt.child.id,
          name: apt.child.name || 'Unnamed Child',
          dateOfBirth: apt.child.dateOfBirth,
          age: this.calculateAge(apt.child.dateOfBirth),
          ageLabel: this.getAgeLabel(apt.child.dateOfBirth),
          gender: apt.child.gender,
          profilePhoto: apt.child.profilePhoto,
          weightKg: apt.child.weightKg,
          heightCm: apt.child.heightCm,
          bloodGroup: apt.child.bloodGroup,
          allergies: apt.child.allergies,
          pediatrician: apt.child.pediatrician,
          medicalConditions: apt.child.medicalConditions,
          specialNotes: apt.child.specialNotes,
        } : null,
        vaccine: apt.vaccine ? {
          id: apt.vaccine.id,
          name: apt.vaccine.name,
          manufacturer: apt.vaccine.manufacturer,
          description: apt.vaccine.description,
          dosage: apt.vaccine.dosage,
          ageGroupLabel: apt.vaccine.ageGroupLabel,
          dosageCount: apt.vaccine.dosageCount,
          sideEffects: apt.vaccine.sideEffects,
        } : null,
        vaccinationCenter: apt.vaccinationCenter ? {
          id: apt.vaccinationCenter.id,
          name: apt.vaccinationCenter.name,
          address: apt.vaccinationCenter.address,
          phone: apt.vaccinationCenter.phone,
        } : null,
        parent: apt.parent ? {
          id: apt.parent.id,
          fullName: apt.parent.fullName,
          phone: `${apt.parent.dialCode || ''}${apt.parent.phone}`,
          email: apt.parent.email,
          relationWithChild: apt.parent.relationWithChild,
          profilePhoto: apt.parent.profilePhoto,
        } : null,
        medicalStaff: apt.medicalStaff,
      }));

      // Build response - same format as before, pagination only added if requested
      const response: any = {
        message: 'Appointments retrieved successfully',
        dateRange: startDate && endDate ? {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
        } : null,
        vaccinationCenter: {
          id: medicalStaff.vaccinationCenter?.id,
          name: medicalStaff.vaccinationCenter?.name,
          address: medicalStaff.vaccinationCenter?.address,
        },
        statistics: {
          total: totalStats,
          completed: completedCount,
          pending: pendingCount,
        },
        appointments: mappedAppointments,
      };

      // Add pagination info only if pagination was requested
      if (isPaginated) {
        response.pagination = {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        };
      }

      return response;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Get appointments error:', error);
      throw new AppError('Failed to retrieve appointments', 500);
    }
  }

  /**
   * Get today's appointments/visits for logged-in medical staff
   * @deprecated Use getAppointments instead
   */
  async getTodayVisits(medicalStaffId: string, date?: Date, status?: string) {
    console.log('indise')
    return this.getAppointments(medicalStaffId, date, status);
  }

  /**
   * Get appointment details by ID
   * Used for: Appointment Details screen
   */
  async getAppointmentDetails(appointmentId: string, medicalStaffId: string) {
    try {
      // Get medical staff to verify vaccination center
      const medicalStaff = await prisma.medicalStaff.findUnique({
        where: { id: medicalStaffId },
        select: {
          id: true,
          clinicId: true,
          fullName: true,
          role: true,
          specialization: true,
        },
      });

      console.log({ medicalStaff })

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
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
              specialNotes: true,
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
              dialCode: true,
              phone: true,
              email: true,
              relationWithChild: true,
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
          medicalStaff: {
            select: {
              id: true,
              fullName: true,
              role: true,
              specialization: true,
            },
          },
          vaccineInventory: {
            select: { id: true, batchNumber: true }
          }
        },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }


      // Verify appointment is at staff's vaccination center
      // if (appointment.clinicId !== medicalStaff.clinicId) {
      //   throw new AppError('This appointment is not at your vaccination center', 403);
      // }

      // Format time slot (e.g., "09:00 - 10:00 AM")
      const timeSlot = this.formatTimeSlot(appointment.scheduledTime);

      return {
        message: 'Appointment details retrieved successfully',
        appointment: {
          id: appointment.id,
          // Child info
          child: appointment.child ? {
            id: appointment.child.id,
            name: appointment.child.name || 'Unnamed Child',
            dateOfBirth: appointment.child.dateOfBirth,
            age: this.calculateAge(appointment.child.dateOfBirth),
            ageLabel: this.getAgeLabel(appointment.child.dateOfBirth),
            gender: appointment.child.gender,
            profilePhoto: appointment.child.profilePhoto,
            weightKg: appointment.child.weightKg,
            heightCm: appointment.child.heightCm,
            bloodGroup: appointment.child.bloodGroup,
            allergies: appointment.child.allergies,
            pediatrician: appointment.child.pediatrician,
            medicalConditions: appointment.child.medicalConditions,
            specialNotes: appointment.child.specialNotes,
          } : null,
          // Vaccine info
          vaccine: appointment.vaccine ? {
            id: appointment.vaccine.id,
            name: appointment.vaccine.name,
            manufacturer: appointment.vaccine.manufacturer,
            description: appointment.vaccine.description,
            dosage: appointment.vaccine.dosage,
            ageGroupLabel: appointment.vaccine.ageGroupLabel,
            dosageCount: appointment.vaccine.dosageCount,
            sideEffects: appointment.vaccine.sideEffects,
          } : null,
          // Doctor/Pediatric info (assigned medical staff or current logged in)
          doctor: appointment.medicalStaff ? {
            id: appointment.medicalStaff.id,
            name: appointment.medicalStaff.fullName,
            role: appointment.medicalStaff.role,
            specialization: appointment.medicalStaff.specialization || 'Pediatric',
          } : {
            id: medicalStaff.id,
            name: medicalStaff.fullName,
            role: medicalStaff.role,
            specialization: medicalStaff.specialization || 'Pediatric',
          },
          // Date & Time
          date: this.formatDate(appointment.scheduledDate),
          scheduledDate: appointment.scheduledDate,
          time: timeSlot,
          scheduledTime: appointment.scheduledTime,
          // Vaccination Center
          vaccinationCenter: appointment.vaccinationCenter ? {
            id: appointment.vaccinationCenter.id,
            name: appointment.vaccinationCenter.name,
            address: appointment.vaccinationCenter.address,
            phone: appointment.vaccinationCenter.phone,
          } : null,
          // Parent contact
          parent: appointment.parent ? {
            id: appointment.parent.id,
            fullName: appointment.parent.fullName,
            phone: `${appointment.parent.dialCode || ''}${appointment.parent.phone}`,
            email: appointment.parent.email,
            relationWithChild: appointment.parent.relationWithChild,
            profilePhoto: appointment.parent.profilePhoto,
          } : null,
          // Status
          status: appointment.status,
          verificationCode: appointment.verificationCode,
          notes: appointment.notes,
          // Medical Staff
          medicalStaff: appointment.medicalStaff,
          vaccineInventory: appointment.vaccineInventory

        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Get appointment details error:', error);
      throw new AppError('Failed to retrieve appointment details', 500);
    }
  }

  /**
   * Start visit - marks appointment as IN_PROGRESS and assigns medical staff
   * Used for: "Start Visit" button on appointment details
   */
  async startVisit(appointmentId: string, medicalStaffId: string) {
    try {
      // Get medical staff
      const medicalStaff = await prisma.medicalStaff.findUnique({
        where: { id: medicalStaffId },
      });

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      // Get appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
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
        },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      // Verify appointment is at staff's vaccination center
      // Temporarily commented for testing
      // if (appointment.clinicId !== medicalStaff.clinicId) {
      //   throw new AppError('This appointment is not at your vaccination center', 403);
      // }

      // Validate appointment is scheduled for today
      this.validateAppointmentDate(appointment.scheduledDate);

      // Check if already started or completed
      if (appointment.status === 'CONFIRMED') {
        throw new AppError('Visit already started', 400);
      }
      if (appointment.status === 'COMPLETED') {
        throw new AppError('Appointment already completed', 400);
      }
      if (appointment.status === 'CANCELLED') {
        throw new AppError('Cannot start a cancelled appointment', 400);
      }


      // Update appointment - assign medical staff and mark as START_VISIT (visit started)
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'START_VISIT',
          medicalStaffId: medicalStaffId,
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              dateOfBirth: true,
              gender: true,
              profilePhoto: true,
              bloodGroup: true,
              allergies: true,
              medicalConditions: true,
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
              sideEffects: true,
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
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              dialCode: true,
              email: true,
              relationWithChild: true,
            },
          },
          medicalStaff: {
            select: {
              id: true,
              fullName: true,
              role: true,
              specialization: true,
            },
          }
        },
      });

      return {
        message: 'Visit started successfully',
        appointment: {
          id: updatedAppointment.id,
          status: updatedAppointment.status,
          scheduledDate: updatedAppointment.scheduledDate,
          scheduledTime: updatedAppointment.scheduledTime,
          notes: updatedAppointment.notes,
          child: updatedAppointment.child ? {
            id: updatedAppointment.child.id,
            name: updatedAppointment.child.name || 'Unnamed Child',
            age: this.calculateAge(updatedAppointment.child.dateOfBirth),
            ageLabel: this.getAgeLabel(updatedAppointment.child.dateOfBirth),
            gender: updatedAppointment.child.gender,
            profilePhoto: updatedAppointment.child.profilePhoto,
            bloodGroup: updatedAppointment.child.bloodGroup,
            allergies: updatedAppointment.child.allergies,
            medicalConditions: updatedAppointment.child.medicalConditions,
          } : null,
          vaccine: updatedAppointment.vaccine,
          vaccinationCenter: updatedAppointment.vaccinationCenter,
          parent: updatedAppointment.parent ? {
            id: updatedAppointment.parent.id,
            fullName: updatedAppointment.parent.fullName,
            phone: `${updatedAppointment.parent.dialCode || ''}${updatedAppointment.parent.phone}`,
            email: updatedAppointment.parent.email,
            relationWithChild: updatedAppointment.parent.relationWithChild,
          } : null,
          medicalStaff: updatedAppointment.medicalStaff
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Start visit error:', error);
      throw new AppError('Failed to start visit', 500);
    }
  }

  /**
   * Check-in appointment (mark as confirmed/in-progress)
   */
  async checkInAppointment(appointmentId: string, medicalStaffId: string, batchNumber?: string) {
    try {
      // OPTIMIZED: Run initial queries in parallel
      const [medicalStaff, appointment] = await Promise.all([
        prisma.medicalStaff.findUnique({
          where: { id: medicalStaffId },
          select: { id: true, clinicId: true }
        }),
        prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: {
            vaccine: { select: { id: true, dosageCount: true, isActive: true } }
          }
        })
      ]);

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      // Verify appointment is at staff's vaccination center
      // Temporarily commented for testing
      // if (appointment.clinicId !== medicalStaff.clinicId) {
      //   throw new AppError('This appointment is not at your vaccination center', 403);
      // }

      // Validate appointment is scheduled for today
      this.validateAppointmentDate(appointment.scheduledDate);

      // Check if already checked in or beyond
      // if (appointment.status === 'CHECK_IN') {
      //   throw new AppError('Appointment already checked in', 400);
      // }
      // if (appointment.status === 'START_VISIT') {
      //   throw new AppError('Visit already started for this appointment', 400);
      // }
      if (appointment.status === 'COMPLETED') {
        throw new AppError('Appointment already completed', 400);
      }
      if (appointment.status === 'CANCELLED') {
        throw new AppError('Cannot check in a cancelled appointment', 400);
      }

      // Check vaccine is active
      if (!appointment.vaccine?.isActive) {
        throw new AppError('Vaccine is not active', 400);
      }

      // Find inventory record
      const inventoryRecord = await prisma.vaccineInventory.findFirst({
        where: {
          clinicId: appointment.clinicId,
          vaccineId: appointment.vaccineId,
          remainingDoses: { gte: appointment.vaccine.dosageCount },
          expiryDate: { gt: appointment.scheduledDate },
          batchNumber
        },
        select: { id: true, expiryDate: true, remainingFullVials: true, remainingDoses: true }
      });

      console.log(inventoryRecord, appointment)
      if (!inventoryRecord) {
        throw new AppError('Insufficient vaccine inventory for the selected vaccine at this center. Please contact center or find other center', 400);
      }
      const orParams: any = {}

      if (inventoryRecord?.remainingFullVials) orParams.remainingFullVials = { lt: inventoryRecord.remainingFullVials }

      if (inventoryRecord?.remainingDoses) orParams.remainingDoses = { lt: inventoryRecord.remainingDoses }
      // const OR = [
      //   { expiryDate: { lte: inventoryRecord.expiryDate } }]

      const OR = []

      if (Object.keys(orParams)?.length > 0) OR.push(orParams)

      const openVialInventory = await prisma.vaccineInventory.findFirst({
        where: {
          clinicId: appointment.clinicId,
          vaccineId: appointment.vaccineId,
          quantity: { gte: appointment.vaccine.dosageCount },
          expiryDate: { gt: appointment.scheduledDate },
          batchNumber: { not: batchNumber },
          OR
        },

        select: { id: true, batchNumber: true, expiryDate: true }
      })
      console.log(openVialInventory, { OR })
      if (openVialInventory) {
        throw new AppError(`Please use ${openVialInventory.batchNumber} as it already has open vial/expiry in near future, then use other batches. Please contact admin to report any problems!`, 400);
      }


      // Update appointment - assign medical staff and mark as check in started
      const updatedAppointment = await prisma.appointment.update({
        where: {
          id: appointmentId
        },
        data: {
          status: 'CHECK_IN',
          medicalStaffId: medicalStaffId,
          vaccineInventoryId: inventoryRecord.id
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              dateOfBirth: true,
              gender: true,
              profilePhoto: true,
              bloodGroup: true,
              allergies: true,
              medicalConditions: true,
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
              sideEffects: true,
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
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              dialCode: true,
              email: true,
              relationWithChild: true,
            },
          },
          medicalStaff: {
            select: {
              id: true,
              fullName: true,
              role: true,
              specialization: true,
            },
          },
          vaccineInventory: {
            select: { batchNumber: true, id: true }
          }
        },
      });

      return {
        message: 'Check-in successful',
        appointment: {
          id: updatedAppointment.id,
          status: updatedAppointment.status,
          scheduledDate: updatedAppointment.scheduledDate,
          scheduledTime: updatedAppointment.scheduledTime,
          notes: updatedAppointment.notes,
          child: updatedAppointment.child ? {
            id: updatedAppointment.child.id,
            name: updatedAppointment.child.name || 'Unnamed Child',
            age: this.calculateAge(updatedAppointment.child.dateOfBirth),
            ageLabel: this.getAgeLabel(updatedAppointment.child.dateOfBirth),
            gender: updatedAppointment.child.gender,
            profilePhoto: updatedAppointment.child.profilePhoto,
            bloodGroup: updatedAppointment.child.bloodGroup,
            allergies: updatedAppointment.child.allergies,
            medicalConditions: updatedAppointment.child.medicalConditions,
          } : null,
          vaccine: updatedAppointment.vaccine,
          vaccinationCenter: updatedAppointment.vaccinationCenter,
          parent: updatedAppointment.parent ? {
            id: updatedAppointment.parent.id,
            fullName: updatedAppointment.parent.fullName,
            phone: `${updatedAppointment.parent.dialCode || ''}${updatedAppointment.parent.phone}`,
            email: updatedAppointment.parent.email,
            relationWithChild: updatedAppointment.parent.relationWithChild,
          } : null,
          medicalStaff: updatedAppointment.medicalStaff,
          vaccineInventory: updatedAppointment.vaccineInventory,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Check-in error:', error);
      throw new AppError('Failed to check-in appointment', 500);
    }
  }

  /**
   * Cancel appointment by medical staff
   * Used for: Cancel button on appointment details
   */
  async cancelAppointment(
    appointmentId: string,
    medicalStaffId: string,
    data: {
      reason: string;
      notes?: string;
    }
  ) {
    try {
      // Get medical staff
      const medicalStaff = await prisma.medicalStaff.findUnique({
        where: { id: medicalStaffId },
      });

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      // Get appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
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
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              dialCode: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      // Verify appointment is at staff's vaccination center
      // Temporarily commented for testing
      // if (appointment.clinicId !== medicalStaff.clinicId) {
      //   throw new AppError('This appointment is not at your vaccination center', 403);
      // }

      // Check if already cancelled
      if (appointment.status === 'CANCELLED') {
        throw new AppError('Appointment is already cancelled', 400);
      }

      // Check if already completed
      if (appointment.status === 'COMPLETED') {
        throw new AppError('Cannot cancel a completed appointment', 400);
      }

      // Validate reason is provided
      if (!data.reason || data.reason.trim() === '') {
        throw new AppError('Cancellation reason is required', 400);
      }

      // Update appointment status to CANCELLED
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          medicalStaffId: medicalStaffId,
          cancellationReason: data.reason,
          notes: data.notes || `Cancelled by medical staff: ${medicalStaff.fullName}`,
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
        appointment: {
          id: updatedAppointment.id,
          status: updatedAppointment.status,
          cancellationReason: updatedAppointment.cancellationReason,
          child: updatedAppointment.child,
          vaccine: updatedAppointment.vaccine,
          vaccinationCenter: updatedAppointment.vaccinationCenter,
          scheduledDate: updatedAppointment.scheduledDate,
          scheduledTime: updatedAppointment.scheduledTime,
          cancelledBy: {
            id: medicalStaff.id,
            name: medicalStaff.fullName,
            role: medicalStaff.role,
          },
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Cancel appointment error:', error);
      throw new AppError('Failed to cancel appointment', 500);
    }
  }

  /**
   * Complete vaccination (mark appointment as completed and create vaccination record)
   */
  async completeVaccination(
    appointmentId: string,
    medicalStaffId: string,
    data: {
      verificationCode: string; // Required: 4-digit code from parent
      reactions?: string;
      notes?: string;
      batchNumber?: string;
      doseNumber?: number; // Optional: can be passed from frontend
    }
  ) {
    try {
      // Get medical staff
      const medicalStaff = await prisma.medicalStaff.findUnique({
        where: { id: medicalStaffId },
      });

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      // Get appointment with vaccine schedule
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          vaccine: true,
          child: true,
        },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }


      const batchNumber = data.batchNumber || '';
      if (batchNumber) {
        const inventoryRecord = await prisma.vaccineInventory.findUnique({ where: { id: appointment?.vaccineInventoryId, batchNumber: data.batchNumber } });
        if (!inventoryRecord) { throw new AppError('Invalid batch number for this appointment', 400); }
      
      }

      // Verify appointment is at staff's vaccination center
      // Temporarily commented for testing
      // if (appointment.clinicId !== medicalStaff.clinicId) {
      //   throw new AppError('This appointment is not at your vaccination center', 403);
      // }

      // Validate appointment is scheduled for today
      this.validateAppointmentDate(appointment.scheduledDate);

      // Validate verification code
      if (!data.verificationCode) {
        throw new AppError('Verification code is required', 400);
      }

      if (appointment.verificationCode !== data.verificationCode) {
        throw new AppError('Invalid verification code', 400);
      }
      0
      // Check if already completed or cancelled
      if (appointment.status === 'COMPLETED') {
        throw new AppError('Appointment already completed', 400);
      }
      if (appointment.status === 'CANCELLED') {
        throw new AppError('Cannot complete a cancelled appointment', 400);
      }
      // Must be START_VISIT to complete
      if (!['START_VISIT', 'CHECK_IN'].includes(appointment.status)) {
        throw new AppError('Visit must be started before completing vaccination', 400);
      }

      // Calculate dose number if not provided
      let doseNumber = data.doseNumber;
      if (!doseNumber) {
        // Count existing completed doses for this child and vaccine
        const existingDoses = await prisma.vaccinationRecord.count({
          where: {
            childId: appointment.childId,
            vaccineId: appointment.vaccineId,
          },
        });
        doseNumber = existingDoses + 1;
      }

      const appointmentInventoryId = appointment.vaccineInventoryId
      // Create vaccination record and update appointment in transaction
      const result = await prisma.$transaction(async (tx) => {

        // Create vaccination record with clinicId
        const inventory = await tx.vaccineInventory.findFirst({ where: { id: appointmentInventoryId, remainingDoses: { gte: appointment.vaccine.dosageCount } }, select: { vaccine: true, quantity: true, dosesInVial: true } })
        if (!inventory) throw new AppError('Inventory does not have sufficient doses')
        const { remainingDoses, openVialDoses, remainingVialsPhysical: remainingFullVials } = await calculateVaccineInventory({
          quantity: inventory.quantity,
          dosageCount: inventory.vaccine.dosageCount,
          dosesInVial: inventory.dosesInVial
        })

        const inventoryUpdate = { totalDoses: { decrement: appointment.vaccine.dosageCount }, remainingDoses, remainingFullVials, openVialDoses }

        await tx.vaccineInventory.update({
          where: { id: appointmentInventoryId },
          data: inventoryUpdate
        });

        const vaccinationRecord = await tx.vaccinationRecord.create({
          data: {
            childId: appointment.childId,
            vaccineId: appointment.vaccineId,
            appointmentId: appointment.id,
            clinicId: appointment.clinicId, // Save vaccination center directly
            administeredBy: medicalStaffId,
            administeredDate: new Date(),
            doseNumber: doseNumber!,
            reactions: data.reactions,
            notes: data.notes,
            batchNumber: batchNumber
          },
        });

        // Update appointment status
        const updatedAppointment = await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            status: 'COMPLETED',
            medicalStaffId: medicalStaffId,
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
                address: true,
              },
            },
          },
        });


        return { vaccinationRecord, updatedAppointment };
      });

      return {
        message: 'Vaccination completed successfully',
        appointment: result.updatedAppointment,
        vaccinationRecord: {
          ...result.vaccinationRecord,
          doseLabel: this.getDoseLabel(result.vaccinationRecord.doseNumber),
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Complete vaccination error:', error);
      throw new AppError('Failed to complete vaccination', 500);
    }
  }

  /**
   * Helper: Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): string {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
    } else {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Helper: Calculate age in weeks
   */
  private calculateAgeInWeeks(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const diffTime = Math.abs(today.getTime() - birthDate.getTime());
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  }

  /**
   * Helper: Get age label (e.g., "6 month old", "At 6 weeks")
   */
  private getAgeLabel(dateOfBirth: Date): string {
    const weeks = this.calculateAgeInWeeks(dateOfBirth);

    if (weeks < 1) {
      return 'Newborn';
    } else if (weeks < 8) {
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} old`;
    } else {
      const months = Math.floor(weeks / 4);
      if (months < 12) {
        return `${months} ${months === 1 ? 'month' : 'months'} old`;
      } else {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths === 0) {
          return `${years} ${years === 1 ? 'year' : 'years'} old`;
        }
        return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'} old`;
      }
    }
  }

  /**
   * Helper: Format date (e.g., "July 15, 2025")
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(date).toLocaleDateString('en-US', options);
  }

  /**
   * Helper: Format time slot (e.g., "09:00 - 10:00 AM")
   */
  private formatTimeSlot(time: string): string {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const startHour = hours;
      const endHour = hours + 1;

      const formatHour = (h: number): string => {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      };

      const startFormatted = `${startHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const endFormatted = formatHour(endHour);

      return `${startFormatted} - ${endFormatted}`;
    } catch {
      return time;
    }
  }

  /**
   * Get vaccination records for medical staff
   * Used for: Records screen - History of completed vaccinations
   */
  async getRecords(medicalStaffId: string, search?: string) {
    try {
      // Get medical staff details with vaccination center
      const medicalStaff = await prisma.medicalStaff.findUnique({
        where: { id: medicalStaffId },
        include: {
          vaccinationCenter: true,
        },
      });

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      if (!medicalStaff.clinicId) {
        throw new AppError('No vaccination center assigned to this medical staff', 400);
      }

      // Build search filter
      const searchFilter = search ? {
        OR: [
          { child: { name: { contains: search, mode: 'insensitive' as const } } },
          { vaccine: { name: { contains: search, mode: 'insensitive' as const } } },
        ],
      } : {};

      // Get completed appointments with vaccination records
      const completedVisits = await prisma.appointment.findMany({
        where: {
          clinicId: medicalStaff.clinicId,
          status: 'COMPLETED',
          ...searchFilter,
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              dateOfBirth: true,
              profilePhoto: true,
            },
          },
          vaccine: {
            select: {
              id: true,
              name: true,
              ageGroupLabel: true,
            },
          },
          vaccinationRecord: {
            select: {
              id: true,
              doseNumber: true,
              administeredDate: true,
              reactions: true,
              notes: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return {
        message: 'Records retrieved successfully',
        totalRecords: completedVisits.length,
        records: completedVisits.map(apt => ({
          id: apt.id,
          child: apt.child ? {
            id: apt.child.id,
            name: apt.child.name || 'Unnamed Child',
            age: this.calculateAge(apt.child.dateOfBirth),
            ageLabel: this.getAgeLabel(apt.child.dateOfBirth),
            profilePhoto: apt.child.profilePhoto,
          } : null,
          vaccine: apt.vaccine ? {
            id: apt.vaccine.id,
            name: apt.vaccine.name,
            doseLabel: `${apt.vaccine.name} (${apt.vaccinationRecord ? this.getDoseLabel(apt.vaccinationRecord.doseNumber) : 'First'})`,
            ageGroupLabel: apt.vaccine.ageGroupLabel || (apt.child ? this.getAgeLabel(apt.child.dateOfBirth) : ''),
          } : null,
          dueDateTime: `Due: ${this.formatDateTime(apt.scheduledDate, apt.scheduledTime)}`,
          scheduledDate: apt.scheduledDate,
          scheduledTime: apt.scheduledTime,
          location: 'Clinic Visit',
          status: apt.status,
          completedAt: apt.updatedAt,
          vaccinationRecord: apt.vaccinationRecord ? {
            id: apt.vaccinationRecord.id,
            doseNumber: apt.vaccinationRecord.doseNumber,
            administeredDate: apt.vaccinationRecord.administeredDate,
            batchNumber: null,
            reactions: apt.vaccinationRecord.reactions,
            notes: apt.vaccinationRecord.notes,
          } : null,
        })),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Get records error:', error);
      throw new AppError('Failed to retrieve records', 500);
    }
  }

  /**
   * Helper: Get dose label from dose number
   */
  private getDoseLabel(doseNumber: number): string {
    const labels: { [key: number]: string } = {
      1: 'First',
      2: 'Second',
      3: 'Third',
      4: 'Fourth',
      5: 'Fifth',
    };
    return labels[doseNumber] || `Dose ${doseNumber}`;
  }

  /**
   * Helper: Format date and time together
   */
  private formatDateTime(date: Date, time: string): string {
    const formattedDate = this.formatDate(date);
    return `${formattedDate}, ${time}`;
  }

  /**
   * Get inventory for medical staff's vaccination center
   * Used for: Inventory screen
   */
  async getInventory(medicalStaffId: string, search?: string) {
    try {
      // Get medical staff with vaccination center
      const medicalStaff = await prisma.medicalStaff.findUnique({
        where: { id: medicalStaffId },
        include: {
          vaccinationCenter: true,
        },
      });

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      if (!medicalStaff.clinicId) {
        throw new AppError('No vaccination center assigned to this medical staff', 400);
      }

      // Build search filter
      const searchFilter = search ? {
        OR: [
          { batchNumber: { contains: search, mode: 'insensitive' as const } },
          { vaccine: { name: { contains: search, mode: 'insensitive' as const } } },
        ],
      } : {};

      // Get inventory for the clinic
      const inventory = await prisma.vaccineInventory.findMany({
        where: {
          clinicId: medicalStaff.clinicId,
          ...searchFilter,
        },
        include: {
          vaccine: {
            select: {
              id: true,
              name: true,
              manufacturer: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { expiryDate: 'asc' },
        ],
      });

      // Get statistics
      const stats = {
        totalItems: inventory.length,
        inStock: inventory.filter(i => i.status === 'ACTIVE').length,
        lowStock: inventory.filter(i => i.status === 'LOW_STOCK').length,
        outOfStock: inventory.filter(i => i.status === 'OUT_OF_STOCK').length,
        expired: inventory.filter(i => i.status === 'EXPIRED').length,
      };

      return {
        message: 'Inventory retrieved successfully',
        vaccinationCenter: {
          id: medicalStaff.vaccinationCenter?.id,
          name: medicalStaff.vaccinationCenter?.name,
        },
        statistics: stats,
        inventory: inventory.map(item => ({
          id: item.id,
          vaccine: {
            id: item.vaccine.id,
            name: item.vaccine.name,
            manufacturer: item.vaccine.manufacturer,
          },
          currentStock: item.quantity,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          expiresOn: this.formatDate(item.expiryDate),
          status: item.status,
          statusLabel: this.getInventoryStatusLabel(item.status, item.quantity),
        })),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Get inventory error:', error);
      throw new AppError('Failed to retrieve inventory', 500);
    }
  }

  /**
   * Request new stock
   * Used for: Request New Stock screen
   */
  async requestStock(
    medicalStaffId: string,
    data: {
      vaccineName: string;
      vaccineType?: string;
      quantity: number;
      preferredDeliveryDate?: Date;
    }
  ) {
    try {
      // Get medical staff with vaccination center
      const medicalStaff = await prisma.medicalStaff.findUnique({
        where: { id: medicalStaffId },
        include: {
          vaccinationCenter: true,
        },
      });

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      if (!medicalStaff.clinicId) {
        throw new AppError('No vaccination center assigned to this medical staff', 400);
      }

      // Create stock request
      const stockRequest = await prisma.stockRequest.create({
        data: {
          requestedBy: medicalStaffId,
          clinicId: medicalStaff.clinicId,
          vaccineName: data.vaccineName,
          vaccineType: data.vaccineType,
          quantity: data.quantity,
          preferredDeliveryDate: data.preferredDeliveryDate,
          status: 'PENDING',
        },
        include: {
          vaccinationCenter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        message: 'Stock request submitted successfully',
        stockRequest: {
          id: stockRequest.id,
          vaccineName: stockRequest.vaccineName,
          vaccineType: stockRequest.vaccineType,
          quantity: stockRequest.quantity,
          preferredDeliveryDate: stockRequest.preferredDeliveryDate,
          status: stockRequest.status,
          vaccinationCenter: stockRequest.vaccinationCenter,
          createdAt: stockRequest.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Request stock error:', error);
      throw new AppError('Failed to submit stock request', 500);
    }
  }

  /**
   * Get stock requests history for medical staff
   * Used for: View submitted stock requests
   */
  async getStockRequests(medicalStaffId: string) {
    try {
      // Get medical staff
      const medicalStaff = await prisma.medicalStaff.findUnique({
        where: { id: medicalStaffId },
      });

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      if (!medicalStaff.clinicId) {
        throw new AppError('No vaccination center assigned to this medical staff', 400);
      }

      // Get stock requests for this clinic
      const requests = await prisma.stockRequest.findMany({
        where: {
          clinicId: medicalStaff.clinicId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'Stock requests retrieved successfully',
        totalRequests: requests.length,
        requests: requests.map(req => ({
          id: req.id,
          vaccineName: req.vaccineName,
          vaccineType: req.vaccineType,
          quantity: req.quantity,
          preferredDeliveryDate: req.preferredDeliveryDate,
          status: req.status,
          adminNotes: req.adminNotes,
          rejectionReason: req.rejectionReason,
          createdAt: req.createdAt,
          approvedAt: req.approvedAt,
          rejectedAt: req.rejectedAt,
          fulfilledAt: req.fulfilledAt,
        })),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Get stock requests error:', error);
      throw new AppError('Failed to retrieve stock requests', 500);
    }
  }

  /**
   * Helper: Get inventory status label
   */
  private getInventoryStatusLabel(status: string, quantity: number): string {
    switch (status) {
      case 'ACTIVE':
        return 'In Stock';
      case 'LOW_STOCK':
        return 'Low Stock';
      case 'OUT_OF_STOCK':
        return 'Out of Stock';
      case 'EXPIRED':
        return 'Expired';
      case 'QUARANTINE':
        return 'Quarantine';
      default:
        return status;
    }
  }

  /**
   * Get dashboard data for medical staff app
   * Returns: staff profile, today's statistics, upcoming appointments
   * Used for: Home/Dashboard screen
   * OPTIMIZED: Uses groupBy for statistics and limits appointment fetch
   */
  async getDashboard(medicalStaffId: string) {
    try {
      // Get medical staff details with vaccination center
      const medicalStaff = await prisma.medicalStaff.findUnique({
        where: { id: medicalStaffId },
        include: {
          vaccinationCenter: true,
        },
      });

      if (!medicalStaff) {
        throw new AppError('Medical staff not found', 404);
      }

      // if (!medicalStaff.clinicId) {
      //   throw new AppError('No vaccination center assigned to this medical staff', 400);
      // }

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Build where clause for today's appointments
      const todayWhereClause: any = {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED'],
        },
      };

      // OPTIMIZED: Run queries in parallel - statistics and upcoming appointments
      const [statusStats, upcomingAppointmentsData] = await Promise.all([
        // Get statistics using groupBy (database-level aggregation)
        prisma.appointment.groupBy({
          by: ['status'],
          where: todayWhereClause,
          _count: { id: true }
        }),
        // Get only upcoming (pending) appointments with limit of 5
        prisma.appointment.findMany({
          where: {
            scheduledDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: {
              in: ['SCHEDULED', 'CONFIRMED'],
            },
          },
          include: {
            child: {
              select: {
                id: true,
                name: true,
                dateOfBirth: true,
                gender: true,
                profilePhoto: true,
              },
            },
            vaccine: {
              select: {
                id: true,
                name: true,
                ageGroupLabel: true,
              },
            },
            vaccinationCenter: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
            parent: {
              select: {
                id: true,
                fullName: true,
                dialCode: true,
                phone: true,
              },
            },
          },
          orderBy: [
            { scheduledDate: 'asc' },
            { scheduledTime: 'asc' },
          ],
          take: 5, // Limit to 5 for dashboard
        })
      ]);

      // Process statistics from groupBy result
      const statsMap = new Map(statusStats.map(s => [s.status, s._count.id]));
      const completedCount = statsMap.get('COMPLETED') || 0;
      const pendingCount = (statsMap.get('SCHEDULED') || 0) + (statsMap.get('CONFIRMED') || 0);
      const totalAppointments = statusStats.reduce((sum, s) => sum + s._count.id, 0);

      // Map upcoming appointments
      const upcomingAppointments = upcomingAppointmentsData.map(apt => {
        // Build location string
        const location = apt.vaccinationCenter?.address || '';

        // Get child's age-based schedule label (e.g., "At 6 weeks", "At 6 months")
        const ageScheduleLabel = apt.child ? this.getAgeScheduleLabel(apt.child.dateOfBirth) : 'Unknown';

        return {
          id: apt.id,
          child: apt.child ? {
            id: apt.child.id,
            name: apt.child.name || 'Unnamed Child',
            ageLabel: this.getAgeLabel(apt.child.dateOfBirth),
            profilePhoto: apt.child.profilePhoto,
          } : null,
          ageScheduleLabel, // e.g., "At 6 weeks"
          scheduledDate: apt.scheduledDate,
          scheduledTime: apt.scheduledTime,
          dateTimeFormatted: this.formatDateTimeForDashboard(apt.scheduledDate, apt.scheduledTime),
          location: location,
          locationType: 'Clinic Visit', // Can be "Home Visit" or "Clinic Visit"
          vaccine: apt.vaccine ? {
            id: apt.vaccine.id,
            name: apt.vaccine.name,
            doseLabel: `${apt.vaccine.name} (First)`, // TODO: Get actual dose number
          } : null,
          status: apt.status,
        };
      });

      return {
        message: 'Dashboard data retrieved successfully',
        staff: {
          id: medicalStaff.id,
          fullName: medicalStaff.fullName || `${medicalStaff.firstName} ${medicalStaff.lastName}`,
          firstName: medicalStaff.firstName,
          profilePhoto: medicalStaff.profilePhoto,
          role: medicalStaff.role,
          specialization: medicalStaff.specialization,
        },
        vaccinationCenter: {
          id: medicalStaff.vaccinationCenter?.id,
          name: medicalStaff.vaccinationCenter?.name,
        },
        todayOverview: {
          totalAppointments,
          vaccinesGiven: completedCount,
          remaining: pendingCount,
        },
        upcomingAppointments,
        quickActions: [
          { id: 'appointments', label: 'View Appointments', icon: 'calendar' },
          { id: 'navigation', label: 'Start Navigation', icon: 'location' },
          { id: 'records', label: 'View Records', icon: 'document' },
          { id: 'inventory', label: 'Inventory', icon: 'inventory' },
        ],
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Get dashboard error:', error);
      throw new AppError('Failed to retrieve dashboard data', 500);
    }
  }

  /**
   * Helper: Get age schedule label (e.g., "At 6 weeks", "At 6 months")
   */
  private getAgeScheduleLabel(dateOfBirth: Date): string {
    const weeks = this.calculateAgeInWeeks(dateOfBirth);

    if (weeks < 1) {
      return 'At birth';
    } else if (weeks <= 6) {
      return `At ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    } else if (weeks <= 10) {
      return 'At 6 weeks';
    } else if (weeks <= 14) {
      return 'At 10 weeks';
    } else if (weeks <= 18) {
      return 'At 14 weeks';
    } else {
      const months = Math.floor(weeks / 4);
      if (months < 12) {
        return `At ${months} ${months === 1 ? 'month' : 'months'}`;
      } else {
        const years = Math.floor(months / 12);
        return `At ${years} ${years === 1 ? 'year' : 'years'}`;
      }
    }
  }

  /**
   * Helper: Format date and time for dashboard display
   */
  private formatDateTimeForDashboard(date: Date, time: string): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    const formattedDate = new Date(date).toLocaleDateString('en-US', options);

    // Convert time to 12-hour format
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;

    return `${formattedDate}, ${formattedTime}`;
  }
}


interface InventoryInput {
  quantity: number;      // total vials
  dosesInVial: number;   // doses per vial
  dosageCount: number;   // doses administered
}

interface InventoryResult {
  remainingDoses?: number;
  remainingFullVials?: number;
  openVialDoses?: number;
  remainingVialsPhysical?: number;
  quantity?: number;
}

export function calculateVaccineInventory(
  input: InventoryInput
): InventoryResult {
  const { quantity, dosesInVial, dosageCount } = input;

  const totalAvailableDoses = quantity * dosesInVial;

  if (dosageCount > totalAvailableDoses) {
    throw new Error('Dosage exceeds available inventory');
  }

  const remainingDoses = totalAvailableDoses - dosageCount;
  const remainingFullVials = Math.floor(remainingDoses / dosesInVial);
  const openVialDoses = remainingDoses % dosesInVial;

  const remainingVialsPhysical =
    remainingFullVials + (openVialDoses > 0 ? 1 : 0);

  return {
    remainingDoses,
    remainingFullVials,
    openVialDoses,
    remainingVialsPhysical,
  };
}
