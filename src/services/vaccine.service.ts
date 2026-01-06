import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { VaccineType, VialType, VaccineRouteType } from '@prisma/client';

export interface CreateVaccineInput {
  name: string;

  vaccineType?: VaccineType;
  vialType?: VialType;

  supplierId?: string;
  vaccineCode?: string;

  dosageUnits?: string;
  dosagePerVial?: number;
  dosagePerChild?: number;
  childrenPerVial?: number;

  description?: string;
  dosage?: string;
  ageGroupLabel?: string;

  storageLocation?: string;
  storageCondition?: string;
  lastTemperatureCheck?: string;
  temperature?: string;

  dosageCount?: number;
  intervalBetweenDoses?: number;

  sideEffects?: string;
  notes?: string;

  isActive?: boolean;
  administrationRoute?: VaccineRouteType;
}


interface UpdateVaccineInput {
  name?: string;
  // manufacturer?: string;
  supplierId?: string;
  batchNumber?: string;
  description?: string;
  dosage?: string;
  ageGroupLabel?: string;
  dosageCount?: number;
  intervalBetweenDoses?: number;
  price?: number;
  sideEffects?: string;
  notes?: string;
  isActive?: boolean;

  vaccineType?: VaccineType;
  vialType?: VialType;
  vaccineCode?: string;

  dosageUnits?: string;
  dosagePerVial?: number;
  dosagePerChild?: number;
  childrenPerVial?: number;

  storageLocation?: string;
  storageCondition?: string;
  lastTemperatureCheck?: string;
  temperature?: string;

  administrationRoute?: VaccineRouteType;
}

export class VaccineService {
  /**
   * Get all vaccines (for both admin and mobile app)
   * Admin sees all, Mobile app sees only active
   */
  async getAllVaccines(filters?: {
    isActive?: boolean;
    ageGroupLabel?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      ageGroupLabel,
      search,
      page = 1,
      limit = 10,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {
      isActive:true
    };

    // Filter by active status
    // if (isActive !== undefined) {
    //   where.isActive = isActive;
    // }

    // Filter by age group
    if (ageGroupLabel) {
      where.ageGroupLabel = ageGroupLabel;
    }

    // Search by name or manufacturer (supplier name)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { manufacturer: { supplierName: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [vaccines, total] = await Promise.all([
      prisma.vaccine.findMany({
        where,
        include: {
          inventory: {
            select: {
              id: true,
              batchNumber: true,
              quantity: true,
              expiryDate: true,
              clinicId: true,
              vaccinationCenter: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            where: {
              expiryDate: {
                gte: new Date(), // Only non-expired
              },
            },
          },
          schedules: {
            select: {
              id: true,
              ageGroupLabel: true,
              doseNumber: true,
            },
          },
          manufacturer: {
            select: {
              id: true,
              supplierName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.vaccine.count({ where }),
    ]);

    // Calculate total stock across all batches
    const vaccinesWithStock = vaccines.map(vaccine => {
      const totalStock = vaccine.inventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );

      return {
        ...vaccine,
        totalStock,
      };
    });

    return {
      vaccines: vaccinesWithStock,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single vaccine by ID (Basic - for Admin Panel)
   */
  async getVaccineById(vaccineId: string) {
    const vaccine = await prisma.vaccine.findUnique({
      where: { id: vaccineId },
      include: {
        manufacturer: {
          select: {
            id: true,
            supplierName: true,
            // supplierCode: true,
            // email: true,
            // phone: true,
          },
        },
        inventory: {
          select: {
            id: true,
            batchNumber: true,
            quantity: true,
            costPerUnit: true,
            manufacturingDate: true,
            expiryDate: true,
            storageLocation: true,
            temperature: true,
            status: true,
            notes: true,
            vaccinationCenter: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
              },
            },
          },
          orderBy: {
            expiryDate: 'asc',
          },
        },
        schedules: {
          orderBy: {
            ageInDays: 'asc',
          },
        },
        _count: {
          select: {
            appointments: true,
            vaccinationRecords: true,
          },
        },
      },
    });

    if (!vaccine) {
      throw new AppError('Vaccine not found', 404);
    }

    // Calculate total stock quantity
    const totalStockQuantity = vaccine.inventory.reduce(
      (sum, inv) => sum + inv.quantity,
      0
    );

    // Calculate total price (sum of costPerUnit * quantity)
    const totalPrice = vaccine.inventory.reduce(
      (sum, inv) => sum + (Number(inv.costPerUnit || 0) * inv.quantity),
      0
    );

    // Get earliest manufacturing date and latest expiry date
    const manufacturingDates = vaccine.inventory
      .filter(inv => inv.manufacturingDate)
      .map(inv => inv.manufacturingDate);
    const expiryDates = vaccine.inventory
      .filter(inv => inv.expiryDate)
      .map(inv => inv.expiryDate);

    const earliestManufacturingDate = manufacturingDates.length > 0
      ? new Date(Math.min(...manufacturingDates.map(d => d!.getTime())))
      : null;
    const earliestExpiryDate = expiryDates.length > 0
      ? new Date(Math.min(...expiryDates.map(d => d.getTime())))
      : null;

    return {
      ...vaccine,
      // Inventory summary (calculated fields)
      stockQuantity: totalStockQuantity,
      totalPrice: totalPrice,
      manufacturingDate: earliestManufacturingDate,
      expiryDate: earliestExpiryDate,
      // Stats
      stats: {
        totalAppointments: vaccine._count.appointments,
        totalAdministered: vaccine._count.vaccinationRecords,
      },
    };
  }

  /**
   * Get vaccine details (Full - for Mobile App)
   * Returns formatted data matching the mobile app UI requirements
   */
  async getVaccineDetails(vaccineId: string) {
    const vaccine = await prisma.vaccine.findUnique({
      where: { id: vaccineId },
      include: {
        schedules: {
          orderBy: {
            ageInDays: 'asc',
          },

        },
        manufacturer: {
          select: { supplierName: true, id: true }
        },
        _count: {
          select: {
            vaccinationRecords: true,
          },
        },
      },
    });

    if (!vaccine) {
      throw new AppError('Vaccine not found', 404);
    }

    // Get global vaccination statistics for this vaccine
    const [totalChildren, vaccinatedChildren, partiallyVaccinated] = await Promise.all([
      // Total children in system
      prisma.child.count({ where: { isActive: true } }),
      // Children who completed all doses
      prisma.vaccinationRecord.groupBy({
        by: ['childId'],
        where: { vaccineId },
        _count: { id: true },
        having: {
          id: { _count: { gte: vaccine.dosageCount || 1 } },
        },
      }),
      // Children with at least one dose
      prisma.vaccinationRecord.groupBy({
        by: ['childId'],
        where: { vaccineId },
      }),
    ]);

    const fullyVaccinatedCount = vaccinatedChildren.length;
    const partiallyVaccinatedCount = partiallyVaccinated.length - fullyVaccinatedCount;
    const unvaccinatedCount = totalChildren - partiallyVaccinated.length;

    // Calculate percentages
    const totalForPercentage = totalChildren || 1; // Avoid division by zero
    const coverageReceived = Math.round((partiallyVaccinated.length / totalForPercentage) * 100);
    const coverageNotReceived = 100 - coverageReceived;

    const fullyVaccinatedPercent = Math.round((fullyVaccinatedCount / totalForPercentage) * 100);
    const partiallyVaccinatedPercent = Math.round((partiallyVaccinatedCount / totalForPercentage) * 100);
    const unvaccinatedPercent = 100 - fullyVaccinatedPercent - partiallyVaccinatedPercent;

    // Format recommended schedule from schedules table
    const recommendedSchedule = vaccine.schedules.map(schedule => ({
      doseNumber: schedule.doseNumber,
      ageLabel: schedule.ageGroupLabel,
      ageInDays: schedule.ageInDays,
      ageInMonths: schedule.ageInMonths,
      description: schedule.description,
      isRequired: schedule.isRequired,
    }));

    // If no schedules in table, create from vaccine data
    const formattedSchedule = recommendedSchedule.length > 0
      ? recommendedSchedule
      : this.generateScheduleFromVaccine(vaccine);

    // Format response for mobile app
    return {
      id: vaccine.id,
      name: vaccine.name,
      manufacturer: vaccine.manufacturer,

      // Header section
      vaccineInfo: {
        name: vaccine.name,
        dosage: vaccine.dosage,
        ageGroup: vaccine.ageGroupLabel,
      },

      // Description section
      description: vaccine.description,

      // Why this vaccine section (Benefits)
      whyThisVaccine: {
        title: 'Why this Vaccine?',
        benefits: [
          { id: 1, text: `Protects against ${vaccine.name} related diseases` },
          { id: 2, text: 'Protects children from life-threatening complications' },
          { id: 3, text: 'Contributes to herd immunity, reducing community spread' },
          { id: 4, text: 'Required for global eradication efforts' },
        ],
      },

      // Risks if not taken section
      risksIfNotTaken: {
        title: 'Risks if Not Taken',
        risks: [
          { id: 1, text: `Risk of ${vaccine.name} related disease` },
          { id: 2, text: 'Risk of severe complications' },
          { id: 3, text: 'Contributes to community spread' },
        ],
      },

      // Global Coverage section
      globalCoverage: {
        title: 'Global Coverage',
        received: {
          percentage: coverageReceived,
          label: 'Received',
        },
        notReceived: {
          percentage: coverageNotReceived,
          label: 'Not received',
        },
        chartData: {
          received: coverageReceived,
          notReceived: coverageNotReceived,
        },
      },

      // Good Health Ratio section
      goodHealthRatio: {
        title: 'Good Health Ratio',
        fullyVaccinated: {
          percentage: fullyVaccinatedPercent,
          label: 'Fully Vaccinated',
          color: '#4CAF50',
        },
        partiallyVaccinated: {
          percentage: partiallyVaccinatedPercent,
          label: 'Partially Vaccinated',
          color: '#FF9800',
        },
        unvaccinated: {
          percentage: unvaccinatedPercent,
          label: 'Unvaccinated',
          color: '#F44336',
        },
        note: `${fullyVaccinatedPercent}% children fully protected due to completed ${vaccine.name} doses`,
      },

      // Recommended Schedule section
      recommendedSchedule: {
        title: 'Recommended Schedule',
        schedules: formattedSchedule,
        totalDoses: vaccine.dosageCount || 1,
        intervalBetweenDoses: vaccine.intervalBetweenDoses,
      },

      // Additional Info
      additionalInfo: {
        sideEffects: vaccine.sideEffects,
        notes: vaccine.notes,
      },

      // Stats
      stats: {
        totalAdministered: vaccine._count.vaccinationRecords,
        fullyVaccinatedChildren: fullyVaccinatedCount,
        partiallyVaccinatedChildren: partiallyVaccinatedCount,
      },

      // Meta
      isActive: vaccine.isActive,
      price: vaccine.price,
    };
  }

  /**
   * Generate schedule from vaccine data if schedules table is empty
   */
  private generateScheduleFromVaccine(vaccine: any) {
    const schedules = [];
    const dosageCount = vaccine.dosageCount || 1;

    for (let i = 1; i <= dosageCount; i++) {
      let ageLabel = vaccine.ageGroupLabel || 'As recommended';
      let ageInDays = 0;

      if (i > 1 && vaccine.intervalBetweenDoses) {
        ageInDays = vaccine.intervalBetweenDoses * (i - 1);
        ageLabel = this.formatAgeLabel(ageInDays);
      }

      schedules.push({
        doseNumber: i,
        ageLabel: i === 1 ? vaccine.ageGroupLabel || 'At birth' : ageLabel,
        ageInDays,
        ageInMonths: Math.round(ageInDays / 30),
        description: `Dose ${i} of ${dosageCount}`,
        isRequired: true,
      });
    }

    return schedules;
  }

  /**
   * Format age in days to readable label
   */
  private formatAgeLabel(days: number): string {
    if (days === 0) return 'At birth';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.round(days / 7)} weeks`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  }

  /**
   * Create new vaccine (Admin only)
   */
  async createVaccine(data: CreateVaccineInput) {
    // Check if vaccine already exists

    const query = {
      name: {
        equals: data.name,
        mode: 'insensitive',
      },
      // manufacturer: {
      //   equals: data.manufacturer,
      //   mode: 'insensitive',
      // },};
    }

    if (data.supplierId) {
      Object.assign(query, { supplierId: { equals: data.supplierId } })
    }
    const existing = await prisma.vaccine.findFirst({
      where: { ...query },
    });

    if (existing) {
      throw new AppError(
        'Vaccine with this name and manufacturer already exists',
        409
      );
    }

    const vaccine = await prisma.vaccine.create({
      data: {

        name: data.name,

        vaccineCode: data.vaccineCode ?? data.name,

        vaccineType: data.vaccineType ?? 'INJECTABLE',
        administrationRoute: data.administrationRoute ?? 'ORAL',
        vialType: data.vialType ?? 'SINGLE_DOSE',

        supplierId: data.supplierId ?? null,

        dosage: data.dosage,
        dosageUnits: data.dosageUnits,
        dosagePerChild: data?.dosagePerChild,

        dosagePerVial: data?.dosagePerVial,
        childrenPerVial: data?.childrenPerVial,


        ageGroupLabel: data.ageGroupLabel ?? '',

        dosageCount: data.dosageCount ?? 1,
        intervalBetweenDoses: data.intervalBetweenDoses ?? 0,
        sideEffects: data.sideEffects ?? '',

        notes: data.notes ?? '',

        isActive: data.isActive ?? true,

        // manufacturer: data.manufacturer,
        description: data.description ?? '',

      },
    });

    return vaccine;
  }

  /**
   * Update vaccine (Admin only)
   */
  async updateVaccine(vaccineId: string, data: UpdateVaccineInput) {
    // Check if vaccine exists
    const existing = await prisma.vaccine.findUnique({
      where: { id: vaccineId },
    });

    if (!existing) {
      throw new AppError('Vaccine not found', 404);
    }
    const query = {
      name: {
        equals: data.name,
        mode: 'insensitive',
      },
      // manufacturer: {
      //   equals: data.manufacturer,
      //   mode: 'insensitive',
      // },};
    }

    if (data.supplierId) {
      Object.assign(query, { supplierId: { equals: data.supplierId } })
    }
    // If updating name/manufacturer, check for duplicates
    if (data.name || data.supplierId) {
      const duplicate = await prisma.vaccine.findFirst({
        where: {
          AND: [
            { id: { not: vaccineId } },
            { ...query },
            // {
            //   manufacturer: {
            //     equals: data.manufacturer || existing.manufacturer,
            //     mode: 'insensitive',
            //   },
            // },
          ],
        },
      });

      if (duplicate) {
        throw new AppError(
          'Vaccine with this name and manufacturer already exists',
          409
        );
      }
    }

    const vaccine = await prisma.vaccine.update({
      where: { id: vaccineId },
      data: {
        ...(data.name && { name: data.name }),
        // ...(data.manufacturer && { manufacturer: data.manufacturer }),
        // ...(data.batchNumber !== undefined && { batchNumber: data.batchNumber }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.dosage !== undefined && { dosage: data.dosage }),
        ...(data.ageGroupLabel !== undefined && {
          ageGroupLabel: data.ageGroupLabel,
        }),
        ...(data.dosageCount !== undefined && {
          dosageCount: data.dosageCount,
        }),
        ...(data.intervalBetweenDoses !== undefined && {
          intervalBetweenDoses: data.intervalBetweenDoses,
        }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.sideEffects !== undefined && {
          sideEffects: data.sideEffects,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        inventory: true,
        schedules: true,
        manufacturer: {
          select: { supplierName: true, id: true }
        }
      },
    });

    return vaccine;
  }

  /**
   * Delete vaccine (Admin only - soft delete)
   */
  async deleteVaccine(vaccineId: string) {
    // Check if vaccine exists
    const existing = await prisma.vaccine.findUnique({
      where: { id: vaccineId },
      include: {
        _count: {
          select: {
            appointments: true,
            vaccinationRecords: true,
          },
        },
      },
    });

    if (!existing) {
      throw new AppError('Vaccine not found', 404);
    }

    // Check if vaccine has been used
    if (
      existing._count.appointments > 0 ||
      existing._count.vaccinationRecords > 0
    ) {
      // Soft delete - just mark as inactive
      await prisma.vaccine.update({
        where: { id: vaccineId },
        data: {
          isActive: false,
        },
      });

      return {
        message:
          'Vaccine has existing records. Marked as inactive instead of deleting.',
        softDelete: true,
      };
    }

    // Hard delete if no records exist
    await prisma.vaccine.delete({
      where: { id: vaccineId },
    });

    return {
      message: 'Vaccine deleted successfully',
      softDelete: false,
    };
  }

  /**
   * Get vaccines by age group (for mobile app)
   */
  async getVaccinesByAgeGroup(ageGroupLabel: string) {
    const vaccines = await prisma.vaccine.findMany({
      where: {
        ageGroupLabel,
        isActive: true,
      },
      include: {
        schedules: {
          where: {
            ageGroupLabel,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return vaccines;
  }

  /**
   * Get available age groups (for dropdown)
   */
  async getAgeGroups() {
    const schedules = await prisma.vaccineSchedule.findMany({
      select: {
        ageGroupLabel: true,
        ageInDays: true,
        ageInMonths: true,
      },
      distinct: ['ageGroupLabel'],
      orderBy: {
        ageInDays: 'asc',
      },
    });

    return schedules.map(s => ({
      label: s.ageGroupLabel,
      ageInDays: s.ageInDays,
      ageInMonths: s.ageInMonths,
    }));
  }

  /**
   * Search vaccines (for both admin and mobile)
   */
  async searchVaccines(query: string, activeOnly: boolean = false) {
    const vaccines = await prisma.vaccine.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              // { manufacturer: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          ...(activeOnly ? [{ isActive: true }] : []),
        ],
      },
      include: {
        inventory: {
          select: {
            batchNumber: true,
            quantity: true,
          },
          where: {
            expiryDate: {
              gte: new Date(),
            },
          },
        },
        manufacturer: {
          select: { supplierName: true, id: true }
        }
      },
      take: 20,
      orderBy: {
        name: 'asc',
      },
    });

    return vaccines.map(vaccine => ({
      ...vaccine,
      totalStock: vaccine.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
    }));
  }

  /**
   * Get vaccine statistics (for admin dashboard)
   */
  async getVaccineStatistics() {
    const [
      totalVaccines,
      activeVaccines,
      inactiveVaccines,
      totalInventory,
      expiringSoon,
    ] = await Promise.all([
      prisma.vaccine.count(),
      prisma.vaccine.count({ where: { isActive: true } }),
      prisma.vaccine.count({ where: { isActive: false } }),
      prisma.vaccineInventory.aggregate({
        _sum: {
          quantity: true,
        },
        where: {
          expiryDate: {
            gte: new Date(),
          },
        },
      }),
      prisma.vaccineInventory.count({
        where: {
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
      }),
    ]);

    return {
      totalVaccines,
      activeVaccines,
      inactiveVaccines,
      totalStock: totalInventory._sum.quantity || 0,
      expiringSoon,
    };
  }
}
