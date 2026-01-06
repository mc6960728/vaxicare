import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export class DistrictService {
  async createDistrict(data: {
    name: string;
    state?: string;
    districtCode: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    officeAddress?: string;
    status?: string;
    notes?: string;
  }) {
    // Check if district code already exists
    const existingDistrict = await prisma.district.findUnique({
      where: { districtCode: data.districtCode },
    });

    if (existingDistrict) {
      throw new AppError('District with this code already exists', 400);
    }

    const district = await prisma.district.create({
      data: {
        name: data.name,
        state: data.state || 'Gujarat',
        districtCode: data.districtCode,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        officeAddress: data.officeAddress,
        status: (data.status as any) || 'ACTIVE',
        notes: data.notes,
      },
    });

    return district;
  }

  async getAllDistricts(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by status
    if (options?.status) {
      where.status = options.status;
    }

    // Search by name or district code
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { districtCode: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [districts, total] = await Promise.all([
      prisma.district.findMany({
        where,
        include: {
          _count: {
            select: {
              talukas: true,
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
      prisma.district.count({ where }),
    ]);

    return {
      data: districts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDistrictById(id: string) {
    const district = await prisma.district.findUnique({
      where: { id },
      include: {
        talukas: {
          select: {
            id: true,
            name: true,
            talukaCode: true,
            status: true,
          },
        },
        _count: {
          select: {
            talukas: true,
            villages: true,
          },
        },
      },
    });

    if (!district) {
      throw new AppError('District not found', 404);
    }

    return district;
  }

  async updateDistrict(
    id: string,
    data: {
      name?: string;
      state?: string;
      districtCode?: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      officeAddress?: string;
      status?: string;
      notes?: string;
    }
  ) {
    const district = await prisma.district.findUnique({
      where: { id },
    });

    if (!district) {
      throw new AppError('District not found', 404);
    }

    // Check if new district code is already taken
    if (data.districtCode && data.districtCode !== district.districtCode) {
      const existing = await prisma.district.findUnique({
        where: { districtCode: data.districtCode },
      });

      if (existing) {
        throw new AppError('District code already in use', 400);
      }
    }

    const updatedDistrict = await prisma.district.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.state && { state: data.state }),
        ...(data.districtCode && { districtCode: data.districtCode }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.officeAddress !== undefined && { officeAddress: data.officeAddress }),
        ...(data.status && { status: data.status as any }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        _count: {
          select: {
            talukas: true,
            villages: true,
          },
        },
      },
    });

    return updatedDistrict;
  }

  async deleteDistrict(id: string) {
    const district = await prisma.district.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            talukas: true,
            villages: true,
          },
        },
      },
    });

    if (!district) {
      throw new AppError('District not found', 404);
    }

    // Check if district has talukas or villages
    if (district._count.talukas > 0 || district._count.villages > 0) {
      throw new AppError(
        'Cannot delete district with associated talukas or villages. Please delete them first.',
        400
      );
    }

    await prisma.district.delete({
      where: { id },
    });

    return { message: 'District deleted successfully' };
  }
}
