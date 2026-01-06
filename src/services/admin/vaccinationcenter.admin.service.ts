import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';

export class VaccinationCenterAdminService {
  /**
   * Create a new vaccination center
   */
  async createVaccinationCenter(data: {
    name: string;
    address?: string;
    districtId?: string;
    talukaId?: string;
    villageId?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    licenseNumber: string;
    openingHours?: string;
    facilities?: string;
    status?: string;
    notes?: string;
  }) {
    try {
      // Check if license number already exists
      const existingCenter = await prisma.vaccinationCenter.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });

      if (existingCenter) {
        throw new AppError('Vaccination center with this license number already exists', 400);
      }

      // Verify district exists (if provided)
      if (data.districtId) {
        const district = await prisma.district.findUnique({
          where: { id: data.districtId },
        });
        if (!district) {
          throw new AppError('District not found', 404);
        }
      }

      // Verify taluka exists (if provided)
      if (data.talukaId) {
        const taluka = await prisma.taluka.findUnique({
          where: { id: data.talukaId },
        });
        if (!taluka) {
          throw new AppError('Taluka not found', 404);
        }
      }

      // Verify village exists (if provided)
      if (data.villageId) {
        const village = await prisma.village.findUnique({
          where: { id: data.villageId },
        });
        if (!village) {
          throw new AppError('Village not found', 404);
        }
      }

      // Create vaccination center
      const vaccinationCenter = await prisma.vaccinationCenter.create({
        data: {
          name: data.name,
          address: data.address,
          districtId: data.districtId,
          talukaId: data.talukaId,
          villageId: data.villageId,
          pincode: data.pincode,
          phone: data.phone,
          email: data.email,
          licenseNumber: data.licenseNumber,
          openingHours: data.openingHours,
          facilities: data.facilities,
          isActive: data.status === 'ACTIVE',
        },
        include: {
          district: { select: { id: true, name: true } },
          taluka: { select: { id: true, name: true } },
          village: { select: { id: true, name: true } },
        },
      });

      return {
        message: 'Vaccination center created successfully',
        vaccinationCenter,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Create vaccination center error:', error);
      throw new AppError('Failed to create vaccination center', 500);
    }
  }

  /**
   * Get all vaccination centers with pagination and filters
   */
  async getAllVaccinationCenters(options?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Search filter
      if (options?.search) {
        where.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { address: { contains: options.search, mode: 'insensitive' } },
          { licenseNumber: { contains: options.search, mode: 'insensitive' } },
        ];
      }

      // Active status filter
      if (options?.isActive !== undefined) {
        where.isActive = options.isActive;
      }

      const [vaccinationCenters, total] = await Promise.all([
        prisma.vaccinationCenter.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            // address: true,
            // pincode: true,
            phone: true,
            // email: true,
            // licenseNumber: true,
            // openingHours: true,
            // facilities: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            district: { select: { id: true, name: true } },
            taluka: { select: { id: true, name: true } },
            village: { select: { id: true, name: true } },
            // _count: {
            //   select: {
            //     appointments: true,
            //     medicalStaff: true,
            //     vaccineInventory: true,
            //   },
            // },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.vaccinationCenter.count({ where }),
      ]);

      return {
        message: 'Vaccination centers retrieved successfully',
        vaccinationCenters,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Get vaccination centers error:', error);
      throw new AppError('Failed to retrieve vaccination centers', 500);
    }
  }

  /**
   * Get vaccination center by ID
   */
  async getVaccinationCenterById(id: string) {
    try {
      const vaccinationCenter = await prisma.vaccinationCenter.findUnique({
        where: { id },
        include: {
          district: { select: { id: true, name: true } },
          taluka: { select: { id: true, name: true } },
          village: { select: { id: true, name: true } },
          medicalStaff: {
            where: { isDeleted: false },
            select: {
              id: true,
              fullName: true,
              role: true,
              specialization: true,
              phone: true,
              email: true,
              employmentStatus: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              vaccineInventory: true,
            },
          },
        },
      });

      if (!vaccinationCenter) {
        throw new AppError('Vaccination center not found', 404);
      }

      return {
        message: 'Vaccination center retrieved successfully',
        vaccinationCenter,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Get vaccination center error:', error);
      throw new AppError('Failed to retrieve vaccination center', 500);
    }
  }

  /**
   * Update vaccination center
   */
  async updateVaccinationCenter(
    id: string,
    data: {
      name?: string;
      address?: string;
      districtId?: string;
      talukaId?: string;
      villageId?: string;
      pincode?: string;
      phone?: string;
      email?: string;
      licenseNumber?: string;
      openingHours?: string;
      facilities?: string;
      status?: string;
      notes?: string;
    }
  ) {
    try {
      // Check if vaccination center exists
      const existingCenter = await prisma.vaccinationCenter.findUnique({
        where: { id },
      });

      if (!existingCenter) {
        throw new AppError('Vaccination center not found', 404);
      }

      // Check if license number is being changed and if it already exists
      if (data.licenseNumber && data.licenseNumber !== existingCenter.licenseNumber) {
        const licenseExists = await prisma.vaccinationCenter.findUnique({
          where: { licenseNumber: data.licenseNumber },
        });

        if (licenseExists) {
          throw new AppError('License number already in use', 400);
        }
      }

      // Update vaccination center
      const vaccinationCenter = await prisma.vaccinationCenter.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.districtId !== undefined && { districtId: data.districtId || null }),
          ...(data.talukaId !== undefined && { talukaId: data.talukaId || null }),
          ...(data.villageId !== undefined && { villageId: data.villageId || null }),
          ...(data.pincode !== undefined && { pincode: data.pincode }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.licenseNumber && { licenseNumber: data.licenseNumber }),
          ...(data.openingHours !== undefined && { openingHours: data.openingHours }),
          ...(data.facilities !== undefined && { facilities: data.facilities }),
          ...(data.status && { isActive: data.status === 'ACTIVE' }),
        },
        include: {
          district: { select: { id: true, name: true } },
          taluka: { select: { id: true, name: true } },
          village: { select: { id: true, name: true } },
          _count: {
            select: {
              appointments: true,
              medicalStaff: true,
              vaccineInventory: true,
            },
          },
        },
      });

      return {
        message: 'Vaccination center updated successfully',
        vaccinationCenter,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Update vaccination center error:', error);
      throw new AppError('Failed to update vaccination center', 500);
    }
  }

  /**
   * Delete vaccination center (soft delete)
   */
  async deleteVaccinationCenter(id: string) {
    try {
      // Check if vaccination center exists
      const vaccinationCenter = await prisma.vaccinationCenter.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              appointments: true,
              medicalStaff: true,
              vaccineInventory: true,
            },
          },
        },
      });

      if (!vaccinationCenter) {
        throw new AppError('Vaccination center not found', 404);
      }

      // Check if center has active appointments
      const activeAppointments = await prisma.appointment.count({
        where: {
          clinicId: id,
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
        },
      });

      if (activeAppointments > 0) {
        throw new AppError(
          `Cannot delete vaccination center. It has ${activeAppointments} active appointments. Please cancel or complete them first.`,
          400
        );
      }

      // Soft delete - mark as inactive
      const updatedCenter = await prisma.vaccinationCenter.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        message: 'Vaccination center deleted successfully',
        vaccinationCenter: updatedCenter,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Delete vaccination center error:', error);
      throw new AppError('Failed to delete vaccination center', 500);
    }
  }

  /**
   * Toggle vaccination center active status
   */
  async toggleActiveStatus(id: string) {
    try {
      const vaccinationCenter = await prisma.vaccinationCenter.findUnique({
        where: { id },
      });

      if (!vaccinationCenter) {
        throw new AppError('Vaccination center not found', 404);
      }

      const updated = await prisma.vaccinationCenter.update({
        where: { id },
        data: { isActive: !vaccinationCenter.isActive },
      });

      return {
        message: `Vaccination center ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
        vaccinationCenter: updated,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Toggle status error:', error);
      throw new AppError('Failed to toggle vaccination center status', 500);
    }
  }

  /**
   * Get vaccination center statistics
   */
  async getVaccinationCenterStats(id: string) {
    try {
      const vaccinationCenter = await prisma.vaccinationCenter.findUnique({
        where: { id },
      });

      if (!vaccinationCenter) {
        throw new AppError('Vaccination center not found', 404);
      }

      // Get statistics
      const [
        totalAppointments,
        completedAppointments,
        scheduledAppointments,
        totalMedicalStaff,
        activeMedicalStaff,
        vaccineInventoryCount,
      ] = await Promise.all([
        prisma.appointment.count({
          where: { clinicId: id },
        }),
        prisma.appointment.count({
          where: { clinicId: id, status: 'COMPLETED' },
        }),
        prisma.appointment.count({
          where: { clinicId: id, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
        }),
        prisma.medicalStaff.count({
          where: { clinicId: id, isDeleted: false },
        }),
        prisma.medicalStaff.count({
          where: { clinicId: id, isDeleted: false, employmentStatus: 'ACTIVE' },
        }),
        prisma.vaccineInventory.count({
          where: { clinicId: id },
        }),
      ]);

      return {
        message: 'Vaccination center statistics retrieved successfully',
        stats: {
          appointments: {
            total: totalAppointments,
            completed: completedAppointments,
            scheduled: scheduledAppointments,
          },
          medicalStaff: {
            total: totalMedicalStaff,
            active: activeMedicalStaff,
          },
          vaccineInventory: vaccineInventoryCount,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Get stats error:', error);
      throw new AppError('Failed to retrieve vaccination center statistics', 500);
    }
  }
}
