import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export class VillageService {
  async createVillage(data: {
    name: string;
    talukaId: string;
    districtId: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    officeAddress?: string;
    status?: string;
    notes?: string;
  }) {

    // Verify taluka exists
    const taluka = await prisma.taluka.findUnique({
      where: { id: data.talukaId },
    });

    if (!taluka) {
      throw new AppError('Taluka not found', 404);
    }

    // Verify district exists
    const district = await prisma.district.findUnique({
      where: { id: data.districtId },
    });

    if (!district) {
      throw new AppError('District not found', 404);
    }

    // Verify taluka belongs to district
    if (taluka.districtId !== data.districtId) {
      throw new AppError('Taluka does not belong to the specified district', 400);
    }

    const village = await prisma.village.create({
      data: {
        name: data.name,
        talukaId: data.talukaId,
        districtId: data.districtId,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        officeAddress: data.officeAddress,
        status: (data.status as any) || 'ACTIVE',
        notes: data.notes,
      },
      include: {
        taluka: {
          select: {
            id: true,
            name: true,
            talukaCode: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
            districtCode: true,
          },
        },
      },
    });

    return village;
  }

  async getAllVillages(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    talukaId?: string;
    districtId?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by taluka
    if (options?.talukaId) {
      where.talukaId = options.talukaId;
    }

    // Filter by district
    if (options?.districtId) {
      where.districtId = options.districtId;
    }

    // Filter by status
    if (options?.status) {
      where.status = options.status;
    }

    // Search by name
    if (options?.search) {
      where.name = { contains: options.search, mode: 'insensitive' };
    }

    const [villages, total] = await Promise.all([
      prisma.village.findMany({
        where,
        include: {
          taluka: {
            select: {
              id: true,
              name: true,
              talukaCode: true,
            },
          },
          district: {
            select: {
              id: true,
              name: true,
              districtCode: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.village.count({ where }),
    ]);

    return {
      data: villages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVillageById(id: string) {
    const village = await prisma.village.findUnique({
      where: { id },
      include: {
        taluka: {
          select: {
            id: true,
            name: true,
            talukaCode: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
            districtCode: true,
            state: true,
          },
        },
      },
    });

    if (!village) {
      throw new AppError('Village not found', 404);
    }

    return village;
  }

  async updateVillage(
    id: string,
    data: {
      name?: string;
      talukaId?: string;
      districtId?: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      officeAddress?: string;
      status?: string;
      notes?: string;
    }
  ) {
    const village = await prisma.village.findUnique({
      where: { id },
    });

    if (!village) {
      throw new AppError('Village not found', 404);
    }

    // Verify new taluka exists if changing
    if (data.talukaId && data.talukaId !== village.talukaId) {
      const taluka = await prisma.taluka.findUnique({
        where: { id: data.talukaId },
      });

      if (!taluka) {
        throw new AppError('Taluka not found', 404);
      }

      // If taluka is changing and district is not provided, update district automatically
      if (!data.districtId) {
        data.districtId = taluka.districtId;
      }
    }

    // Verify new district exists if changing
    if (data.districtId && data.districtId !== village.districtId) {
      const district = await prisma.district.findUnique({
        where: { id: data.districtId },
      });

      if (!district) {
        throw new AppError('District not found', 404);
      }
    }

    const updatedVillage = await prisma.village.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.talukaId && { talukaId: data.talukaId }),
        ...(data.districtId && { districtId: data.districtId }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.officeAddress !== undefined && { officeAddress: data.officeAddress }),
        ...(data.status && { status: data.status as any }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        taluka: {
          select: {
            id: true,
            name: true,
            talukaCode: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
            districtCode: true,
          },
        },
      },
    });

    return updatedVillage;
  }

  async deleteVillage(id: string) {
    const village = await prisma.village.findUnique({
      where: { id },
    });

    if (!village) {
      throw new AppError('Village not found', 404);
    }

    await prisma.village.delete({
      where: { id },
    });

    return { message: 'Village deleted successfully' };
  }
}
