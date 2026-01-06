import { PrismaClient, InventoryStatus, Prisma } from '@prisma/client';
import { AppError } from '../../utils/AppError';

const prisma = new PrismaClient();

export class VaccineInventoryAdminService {
  /**
   * Create new vaccine inventory/stock
   */
  async createVaccineInventory(data: {
    vaccineId: string;
    clinicId: string;
    batchNumber: string;
    quantity: number;
    costPerUnit?: number;
    manufacturingDate?: Date;
    expiryDate: Date;
    // supplier?: string;
    supplierId?: string;
    storageLocation?: string;
    temperature?: string;
    status?: InventoryStatus;
    notes?: string;
    dosesInVial?: number;
    totalDoses?: number;
    remainingFullVials?: number;
    remainingDoses?: number;
    openvialDoses?: number;

  }) {
    // Validate vaccine exists
    const vaccine = await prisma.vaccine.findUnique({
      where: { id: data.vaccineId, isActive: true },
    });

    if (!vaccine) {
      throw new AppError('Vaccine not found or inactive', 404);
    }

    // Validate vaccination center exists
    const center = await prisma.vaccinationCenter.findUnique({
      where: { id: data.clinicId, isActive: true },
    });

    if (!center) {
      throw new AppError('Vaccination center not found or inactive', 404);
    }

    // Check if batch number already exists for this vaccine and center
    const existingBatch = await prisma.vaccineInventory.findFirst({
      where: {
        batchNumber: data.batchNumber,
        vaccineId: data.vaccineId,
        clinicId: data.clinicId,
      },
    });

    if (existingBatch) {
      throw new AppError('Batch number already exists for this vaccine at this center', 409);
    }

    // Validate expiry date is in future
    if (new Date(data.expiryDate) < new Date()) {
      throw new AppError('Expiry date must be in the future', 400);
    }

    // Validate manufacturing date is before expiry date
    if (data.manufacturingDate && new Date(data.manufacturingDate) >= new Date(data.expiryDate)) {
      throw new AppError('Manufacturing date must be before expiry date', 400);
    }

    // Auto-set status based on quantity and expiry
    let status = data.status || InventoryStatus.ACTIVE;
    if (data.quantity === 0) {
      status = InventoryStatus.OUT_OF_STOCK;
    } else if (data.quantity < 10) {
      status = InventoryStatus.LOW_STOCK;
    }

    // Check if already expired
    if (new Date(data.expiryDate) < new Date()) {
      status = InventoryStatus.EXPIRED;
    }

    const quantity = data?.quantity
    const dosesInVial = data?.dosesInVial

    if (quantity && dosesInVial) {
      data.totalDoses = quantity * dosesInVial
      data.remainingDoses = data.totalDoses
      data.remainingFullVials = quantity
      data.openvialDoses = 0
    }

    const inventory = await prisma.vaccineInventory.create({
      data: {
        vaccineId: data.vaccineId,
        clinicId: data.clinicId,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        costPerUnit: data.costPerUnit,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
        // supplier: data.supplier,
        supplierId: data.supplierId,
        storageLocation: data.storageLocation,
        temperature: data.temperature,
        status: status,
        notes: data.notes,
        dosesInVial: data?.dosesInVial,
        totalDoses: data?.totalDoses,
      },
      include: {
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
          },
        },
        manufacturer: {
          select: {
            id: true,
            supplierName: true
          }
        }
      },
    });
    return {
      message: 'Vaccine inventory added successfully',
      inventory,
    };
  }

  /**
   * Get all vaccine inventory with pagination, filters and search
   */
  async getAllVaccineInventory(params: {
    page?: number;
    limit?: number;
    search?: string;
    vaccineId?: string;
    clinicId?: string;
    status?: InventoryStatus;
    lowStock?: boolean;
    expired?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by batch number, vaccine name, center name, supplier
    if (params.search) {
      where.OR = [
        { batchNumber: { contains: params.search, mode: 'insensitive' } },
        // { supplier: { contains: params.search, mode: 'insensitive' } },
        { vaccine: { name: { contains: params.search, mode: 'insensitive' } } },
        {
          vaccinationCenter: {
            name: { contains: params.search, mode: 'insensitive' },
          },
        },
        {
          manufacturer: {
            supplierName: { contains: params.search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Filter by vaccine
    if (params.vaccineId) {
      where.vaccineId = params.vaccineId;
    }

    // Filter by vaccination center
    if (params.clinicId) {
      where.clinicId = params.clinicId;
    }

    // Filter by status
    if (params.status) {
      where.status = params.status;
    }

    // Filter by low stock (quantity < 10)
    if (params.lowStock === true) {
      where.quantity = { lt: 10 };
    }

    // Filter by expired
    if (params.expired === true) {
      where.expiryDate = { lt: new Date() };
    }

    const [inventory, total] = await Promise.all([
      prisma.vaccineInventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
            },
          },
          manufacturer: {
            select: { id: true, supplierName: true }
          }
        },
      }),
      prisma.vaccineInventory.count({ where }),
    ]);

    return {
      message: 'Vaccine inventory retrieved successfully',
      data: inventory,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get vaccine inventory by ID
   */
  async getVaccineInventoryById(id: string) {
    const inventory = await prisma.vaccineInventory.findUnique({
      where: { id },
      include: {
        vaccine: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            description: true,
            dosage: true,
          },
        },
        vaccinationCenter: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        manufacturer: {
          select: { id: true, supplierName: true }
        }
      },
    });

    if (!inventory) {
      throw new AppError('Vaccine inventory not found', 404);
    }

    return {
      message: 'Vaccine inventory details retrieved successfully',
      inventory,
    };
  }

  /**
   * Update vaccine inventory
   */
  async updateVaccineInventory(
    id: string,
    data: {
      batchNumber?: string;
      quantity?: number;
      costPerUnit?: number;
      manufacturingDate?: Date;
      expiryDate?: Date;
      // supplier?: string;
      supplierId?: string;
      storageLocation?: string;
      temperature?: string;
      status?: InventoryStatus;
      notes?: string;
      dosageInVial?: number;
      totalDoses?: number;
      remainingFullVials?: number;
      remainingDoses?: number;
      openvialDoses?: number;
    }
  ) {
    // Check if inventory exists
    const existingInventory = await prisma.vaccineInventory.findUnique({
      where: { id },
    });

    if (!existingInventory) {
      throw new AppError('Vaccine inventory not found', 404);
    }

    // If batch number is being updated, check for duplicates
    if (data.batchNumber && data.batchNumber !== existingInventory.batchNumber) {
      const duplicateBatch = await prisma.vaccineInventory.findFirst({
        where: {
          batchNumber: data.batchNumber,
          vaccineId: existingInventory.vaccineId,
          clinicId: existingInventory.clinicId,
          id: { not: id },
        },
      });

      if (duplicateBatch) {
        throw new AppError(
          'Batch number already exists for this vaccine at this center',
          409
        );
      }
    }

    // Validate dates if provided
    if (data.expiryDate && new Date(data.expiryDate) < new Date()) {
      throw new AppError('Expiry date must be in the future', 400);
    }

    if (
      data.manufacturingDate &&
      data.expiryDate &&
      new Date(data.manufacturingDate) >= new Date(data.expiryDate)
    ) {
      throw new AppError('Manufacturing date must be before expiry date', 400);
    }

    // Auto-update status based on quantity
    let status = data.status;
    if (data.quantity !== undefined) {
      if (data.quantity === 0) {
        status = InventoryStatus.OUT_OF_STOCK;
      } else if (data.quantity < 10) {
        status = InventoryStatus.LOW_STOCK;
      } else if (!data.status) {
        status = InventoryStatus.ACTIVE;
      }
    }

    const quantity = data?.quantity
    const dosageInVial = data?.dosageInVial
    if (quantity && dosageInVial) {
      if (!data?.totalDoses) data.totalDoses = quantity * dosageInVial
      if (!data?.remainingDoses) data.remainingDoses = data.totalDoses
      if (!data?.remainingFullVials) data.remainingFullVials = quantity
      if (!data?.openvialDoses) data.openvialDoses = 0
    }
    const updatedInventory = await prisma.vaccineInventory.update({
      where: { id },
      data: {
        ...data,
        ...(status && { status }),
      },
      include: {
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
          },
        },
        manufacturer: { select: { id: true, supplierName: true } }
      },
    });

    return {
      message: 'Vaccine inventory updated successfully',
      inventory: updatedInventory,
    };
  }

  /**
   * Delete vaccine inventory
   */
  async deleteVaccineInventory(id: string) {
    const inventory = await prisma.vaccineInventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      throw new AppError('Vaccine inventory not found', 404);
    }

    await prisma.vaccineInventory.delete({
      where: { id },
    });

    return {
      message: 'Vaccine inventory deleted successfully',
    };
  }

  /**
   * Update inventory quantity (for vaccination usage)
   */
  async updateInventoryQuantity(id: string, quantityUsed: number) {
    const inventory = await prisma.vaccineInventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      throw new AppError('Vaccine inventory not found', 404);
    }

    if (inventory.quantity < quantityUsed) {
      throw new AppError('Insufficient stock', 400);
    }

    const newQuantity = inventory.quantity - quantityUsed;
    let status = inventory.status;

    if (newQuantity === 0) {
      status = InventoryStatus.OUT_OF_STOCK;
    } else if (newQuantity < 10) {
      status = InventoryStatus.LOW_STOCK;
    }

    const updatedInventory = await prisma.vaccineInventory.update({
      where: { id },
      data: {
        quantity: newQuantity,
        status: status,
      },
    });

    return {
      message: 'Inventory quantity updated successfully',
      inventory: updatedInventory,
    };
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStatistics(clinicId?: string) {
    const where = clinicId ? { clinicId } : {};

    const [
      totalItems,
      activeItems,
      lowStockItems,
      expiredItems,
      outOfStockItems,
      totalQuantity,
    ] = await Promise.all([
      prisma.vaccineInventory.count({ where }),
      prisma.vaccineInventory.count({
        where: { ...where, status: InventoryStatus.ACTIVE },
      }),
      prisma.vaccineInventory.count({
        where: { ...where, status: InventoryStatus.LOW_STOCK },
      }),
      prisma.vaccineInventory.count({
        where: { ...where, status: InventoryStatus.EXPIRED },
      }),
      prisma.vaccineInventory.count({
        where: { ...where, status: InventoryStatus.OUT_OF_STOCK },
      }),
      prisma.vaccineInventory.aggregate({
        where,
        _sum: { quantity: true },
      }),
    ]);

    return {
      message: 'Inventory statistics retrieved successfully',
      statistics: {
        totalItems,
        activeItems,
        lowStockItems,
        expiredItems,
        outOfStockItems,
        totalQuantity: totalQuantity._sum.quantity || 0,
      },
    };
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(clinicId?: string) {
    const where: any = {
      OR: [
        { status: InventoryStatus.LOW_STOCK },
        { status: InventoryStatus.OUT_OF_STOCK },
      ],
    };

    if (clinicId) {
      where.clinicId = clinicId;
    }

    const alerts = await prisma.vaccineInventory.findMany({
      where,
      orderBy: { quantity: 'asc' },
      include: {
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
          },
        },
      },
    });

    return {
      message: 'Low stock alerts retrieved successfully',
      count: alerts.length,
      alerts,
    };
  }

  /**
   * Get expired vaccines
   */
  async getExpiredVaccines(clinicId?: string) {
    const where: any = {
      expiryDate: { lt: new Date() },
    };

    if (clinicId) {
      where.clinicId = clinicId;
    }

    const expiredVaccines = await prisma.vaccineInventory.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
      include: {
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
          },
        },
      },
    });

    return {
      message: 'Expired vaccines retrieved successfully',
      count: expiredVaccines.length,
      expiredVaccines,
    };
  }

  /**
   * Get inventory by vaccination center
   */
  async getInventoryByCenter(clinicId: string, params?: { vaccineId?: string }) {
    const where: any = { clinicId };

    if (params?.vaccineId) {
      where.vaccineId = params.vaccineId;
    }

    const inventory = await prisma.vaccineInventory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vaccine: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
          },
        },
      },
    });

    return {
      message: 'Inventory retrieved successfully',
      count: inventory.length,
      inventory,
    };
  }
}
