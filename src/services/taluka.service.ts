import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export class TalukaService {
  async createTaluka(data: {
    name: string;
    districtId: string;
    talukaCode: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    officeAddress?: string;
    status?: string;
    notes?: string;
  }) {
    // Check if taluka code already exists
    const existingTaluka = await prisma.taluka.findUnique({
      where: { talukaCode: data.talukaCode },
    });

    if (existingTaluka) {
      throw new AppError('Taluka with this code already exists', 400);
    }

    // Verify district exists
    const district = await prisma.district.findUnique({
      where: { id: data.districtId },
    });

    if (!district) {
      throw new AppError('District not found', 404);
    }

    const taluka = await prisma.taluka.create({
      data: {
        name: data.name,
        districtId: data.districtId,
        talukaCode: data.talukaCode,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        officeAddress: data.officeAddress,
        status: (data.status as any) || 'ACTIVE',
        notes: data.notes,
      },
      include: {
        district: {
          select: {
            id: true,
            name: true,
            districtCode: true,
          },
        },
      },
    });

    return taluka;
  }

  async getAllTalukas(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    districtId?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by district
    if (options?.districtId) {
      where.districtId = options.districtId;
    }

    // Filter by status
    if (options?.status) {
      where.status = options.status;
    }

    // Search by name or taluka code
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { talukaCode: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [talukas, total] = await Promise.all([
      prisma.taluka.findMany({
        where,
        include: {
          district: {
            select: {
              id: true,
              name: true,
              districtCode: true,
            },
          },
          _count: {
            select: {
              villages: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.taluka.count({ where }),
    ]);

    return {
      data: talukas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTalukaById(id: string) {
    const taluka = await prisma.taluka.findUnique({
      where: { id },
      include: {
        district: {
          select: {
            id: true,
            name: true,
            districtCode: true,
            state: true,
          },
        },
        villages: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            villages: true,
          },
        },
      },
    });

    if (!taluka) {
      throw new AppError('Taluka not found', 404);
    }

    return taluka;
  }

  async updateTaluka(
    id: string,
    data: {
      name?: string;
      districtId?: string;
      talukaCode?: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      officeAddress?: string;
      status?: string;
      notes?: string;
    }
  ) {
    const taluka = await prisma.taluka.findUnique({
      where: { id },
    });

    if (!taluka) {
      throw new AppError('Taluka not found', 404);
    }

    // Check if new taluka code is already taken
    if (data.talukaCode && data.talukaCode !== taluka.talukaCode) {
      const existing = await prisma.taluka.findUnique({
        where: { talukaCode: data.talukaCode },
      });

      if (existing) {
        throw new AppError('Taluka code already in use', 400);
      }
    }

    // Verify new district exists if changing
    if (data.districtId && data.districtId !== taluka.districtId) {
      const district = await prisma.district.findUnique({
        where: { id: data.districtId },
      });

      if (!district) {
        throw new AppError('District not found', 404);
      }
    }

    const updatedTaluka = await prisma.taluka.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.districtId && { districtId: data.districtId }),
        ...(data.talukaCode && { talukaCode: data.talukaCode }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.officeAddress !== undefined && { officeAddress: data.officeAddress }),
        ...(data.status && { status: data.status as any }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        district: {
          select: {
            id: true,
            name: true,
            districtCode: true,
          },
        },
        _count: {
          select: {
            villages: true,
          },
        },
      },
    });

    return updatedTaluka;
  }

  async deleteTaluka(id: string) {
    const taluka = await prisma.taluka.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            villages: true,
          },
        },
      },
    });

    if (!taluka) {
      throw new AppError('Taluka not found', 404);
    }

    // Check if taluka has villages
    if (taluka._count.villages > 0) {
      throw new AppError(
        'Cannot delete taluka with associated villages. Please delete them first.',
        400
      );
    }

    await prisma.taluka.delete({
      where: { id },
    });

    return { message: 'Taluka deleted successfully' };
  }
}
