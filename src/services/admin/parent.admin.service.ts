import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import bcrypt from 'bcrypt';
import { config } from '../../config/config';

export class ParentAdminService {
  /**
   * Create a new parent
   */
  async createParent(data: {
    // Personal Info
    parentName: string;
    age?: number;
    gender?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    numberOfChildren?: number;
    relationWithChild?: string;
    profilePhoto?: string;

    // Contact & Address
    phone: string;
    dialCode?: string;
    email: string;
    password?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;

    // Medical & Notes
    registrationDate?: string;
    registrationTime?: string;
    lastVisitDate?: string;
    lastVisitTime?: string;
    status?: string;
    medicalHistory?: string;
    notes?: string;
  }) {
    // Check if email already exists (exclude soft-deleted parents)
    const existingEmail = await prisma.parent.findFirst({
      where: {
        email: data.email,
        isDeleted: false,
      },
    });

    if (existingEmail) {
      throw new AppError('Parent with this email already exists', 400);
    }

    // If a soft-deleted parent has this email, free up the constraint
    const deletedParentWithEmail = await prisma.parent.findFirst({
      where: {
        email: data.email,
        isDeleted: true,
      },
    });

    if (deletedParentWithEmail) {
      await prisma.parent.update({
        where: { id: deletedParentWithEmail.id },
        data: {
          email: `${data.email}_deleted_${Date.now()}`,
        },
      });
    }

    // Check if phone already exists (exclude soft-deleted parents)
    const existingPhone = await prisma.parent.findFirst({
      where: {
        phone: data.phone,
        isDeleted: false,
      },
    });

    if (existingPhone) {
      throw new AppError('Parent with this phone number already exists', 400);
    }

    // If a soft-deleted parent has this phone, free up the constraint
    const deletedParentWithPhone = await prisma.parent.findFirst({
      where: {
        phone: data.phone,
        isDeleted: true,
      },
    });

    if (deletedParentWithPhone) {
      await prisma.parent.update({
        where: { id: deletedParentWithPhone.id },
        data: {
          phone: `${data.phone}_deleted_${Date.now()}`,
        },
      });
    }

    // Hash password (use default if not provided)
    const password = data.password || 'Parent@123';
    const saltRounds = config.bcrypt.saltRounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create Parent
    const parent = await prisma.parent.create({
      data: {
        // Basic Info
        fullName: data.parentName,
        email: data.email,
        phone: data.phone,
        dialCode: data.dialCode || '+91',
        password: hashedPassword,
        relationWithChild: data.relationWithChild || 'Guardian',
        profilePhoto: data.profilePhoto,
        status: (data.status as any) || 'ACTIVE',

        // Personal Info
        age: data.age,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender as any,
        bloodGroup: data.bloodGroup as any,
        numberOfChildren: data.numberOfChildren,

        // Contact & Address
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,

        // Medical & Notes
        registrationDate: data.registrationDate ? new Date(data.registrationDate) : new Date(),
        registrationTime: data.registrationTime,
        lastVisitDate: data.lastVisitDate ? new Date(data.lastVisitDate) : null,
        lastVisitTime: data.lastVisitTime,
        medicalHistory: data.medicalHistory,
        notes: data.notes,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dialCode: true,
        relationWithChild: true,
        profilePhoto: true,
        phoneVerified: true,
        emailVerified: true,
        status: true,
        age: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        numberOfChildren: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        registrationDate: true,
        registrationTime: true,
        lastVisitDate: true,
        lastVisitTime: true,
        medicalHistory: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    return {
      ...parent,
      parentName: parent.fullName,
    };
  }

  /**
   * Get all parents with pagination and filters
   */
  async getAllParents(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    city?: string;
    state?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
    };

    // Filter by status
    if (options?.status) {
      where.status = options.status;
    }

    // Filter by city
    if (options?.city) {
      where.city = { contains: options.city, mode: 'insensitive' };
    }

    // Filter by state
    if (options?.state) {
      where.state = { contains: options.state, mode: 'insensitive' };
    }

    // Search by name, email, or phone
    if (options?.search) {
      where.OR = [
        { fullName: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [parents, total] = await Promise.all([
      prisma.parent.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          dialCode: true,
          relationWithChild: true,
          profilePhoto: true,
          phoneVerified: true,
          emailVerified: true,
          status: true,
          age: true,
          dateOfBirth: true,
          gender: true,
          bloodGroup: true,
          numberOfChildren: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          registrationDate: true,
          registrationTime: true,
          lastVisitDate: true,
          lastVisitTime: true,
          medicalHistory: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              children: true,
              appointments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.parent.count({ where }),
    ]);

    // Map fullName to parentName for frontend consistency
    const formattedParents = parents.map(parent => ({
      ...parent,
      parentName: parent.fullName,
    }));

    return {
      data: formattedParents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get parent by ID
   */
  async getParentById(id: string) {
    const parent = await prisma.parent.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dialCode: true,
        relationWithChild: true,
        profilePhoto: true,
        phoneVerified: true,
        emailVerified: true,
        status: true,
        age: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        numberOfChildren: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        registrationDate: true,
        registrationTime: true,
        lastVisitDate: true,
        lastVisitTime: true,
        medicalHistory: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            profilePhoto: true,
            weightKg: true,
            heightCm: true,
            allergies: true,
            medicalConditions: true,
            specialNotes: true,
          },
        },
        _count: {
          select: {
            children: true,
            appointments: true,
          },
        },
      },
    });

    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    return {
      ...parent,
      parentName: parent.fullName,
    };
  }

  /**
   * Update parent
   */
  async updateParent(
    id: string,
    data: {
      // Personal Info
      parentName?: string;
      age?: number;
      gender?: string;
      dateOfBirth?: string;
      bloodGroup?: string;
      numberOfChildren?: number;
      relationWithChild?: string;
      profilePhoto?: string;

      // Contact & Address
      phone?: string;
      dialCode?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;

      // Medical & Notes
      registrationDate?: string;
      registrationTime?: string;
      lastVisitDate?: string;
      lastVisitTime?: string;
      status?: string;
      medicalHistory?: string;
      notes?: string;
    }
  ) {
    const parent = await prisma.parent.findUnique({
      where: { id },
    });

    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    // Check if new email is already taken
    if (data.email && data.email !== parent.email) {
      const existing = await prisma.parent.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        throw new AppError('Email already in use', 400);
      }
    }

    // Check if new phone is already taken
    if (data.phone && data.phone !== parent.phone) {
      const existing = await prisma.parent.findUnique({
        where: { phone: data.phone },
      });

      if (existing) {
        throw new AppError('Phone number already in use', 400);
      }
    }

    // Update Parent
    const updatedParent = await prisma.parent.update({
      where: { id },
      data: {
        // Basic Info
        ...(data.parentName && { fullName: data.parentName }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.dialCode && { dialCode: data.dialCode }),
        ...(data.relationWithChild && { relationWithChild: data.relationWithChild }),
        ...(data.profilePhoto !== undefined && { profilePhoto: data.profilePhoto }),
        ...(data.status && { status: data.status as any }),

        // Personal Info
        ...(data.age !== undefined && { age: data.age }),
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(data.gender && { gender: data.gender as any }),
        ...(data.bloodGroup && { bloodGroup: data.bloodGroup as any }),
        ...(data.numberOfChildren !== undefined && { numberOfChildren: data.numberOfChildren }),

        // Contact & Address
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.pincode !== undefined && { pincode: data.pincode }),
        ...(data.emergencyContactName !== undefined && { emergencyContactName: data.emergencyContactName }),
        ...(data.emergencyContactPhone !== undefined && { emergencyContactPhone: data.emergencyContactPhone }),

        // Medical & Notes
        ...(data.registrationDate && { registrationDate: new Date(data.registrationDate) }),
        ...(data.registrationTime !== undefined && { registrationTime: data.registrationTime }),
        ...(data.lastVisitDate && { lastVisitDate: new Date(data.lastVisitDate) }),
        ...(data.lastVisitTime !== undefined && { lastVisitTime: data.lastVisitTime }),
        ...(data.medicalHistory !== undefined && { medicalHistory: data.medicalHistory }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dialCode: true,
        relationWithChild: true,
        profilePhoto: true,
        phoneVerified: true,
        emailVerified: true,
        status: true,
        age: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        numberOfChildren: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        registrationDate: true,
        registrationTime: true,
        lastVisitDate: true,
        lastVisitTime: true,
        medicalHistory: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            children: true,
            appointments: true,
          },
        },
      },
    });

    return {
      ...updatedParent,
      parentName: updatedParent.fullName,
    };
  }

  /**
   * Delete parent (soft delete)
   */
  async deleteParent(id: string) {
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            appointments: true,
          },
        },
      },
    });

    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    // Check for active appointments
    const activeAppointments = await prisma.appointment.count({
      where: {
        parentId: id,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    });

    if (activeAppointments > 0) {
      throw new AppError(
        `Cannot delete parent. They have ${activeAppointments} active appointments. Please cancel them first.`,
        400
      );
    }

    // Soft delete - modify email and phone to free up the unique constraints
    const deletedEmail = `${parent.email}_deleted_${Date.now()}`;
    const deletedPhone = `${parent.phone}_deleted_${Date.now()}`;

    await prisma.parent.update({
      where: { id },
      data: {
        email: deletedEmail,
        phone: deletedPhone,
        status: 'DELETED',
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: 'Parent deleted successfully' };
  }

  /**
   * Toggle parent status (activate/deactivate)
   */
  async toggleParentStatus(id: string, action: 'activate' | 'deactivate') {
    const parent = await prisma.parent.findUnique({
      where: { id },
    });

    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    if (parent.isDeleted) {
      throw new AppError('Cannot modify status of a deleted parent', 400);
    }

    const newStatus = action === 'activate' ? 'ACTIVE' : 'INACTIVE';

    // Check if status is already the same
    if (parent.status === newStatus) {
      throw new AppError(`Parent is already ${newStatus.toLowerCase()}`, 400);
    }

    // If deactivating, cancel any pending appointments
    if (action === 'deactivate') {
      await prisma.appointment.updateMany({
        where: {
          parentId: id,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'Parent account deactivated by admin',
        },
      });
    }

    // Update parent status
    const updatedParent = await prisma.parent.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      ...updatedParent,
      parentName: updatedParent.fullName,
      message: `Parent ${action === 'activate' ? 'activated' : 'deactivated'} successfully`,
    };
  }

  /**
   * Get parent statistics
   */
  async getParentStats() {
    const [
      totalParents,
      activeParents,
      verifiedParents,
      totalChildren,
    ] = await Promise.all([
      prisma.parent.count({ where: { isDeleted: false } }),
      prisma.parent.count({ where: { isDeleted: false, status: 'ACTIVE' } }),
      prisma.parent.count({ where: { isDeleted: false, phoneVerified: true } }),
      prisma.child.count({ where: { isActive: true } }),
    ]);

    return {
      totalParents,
      activeParents,
      verifiedParents,
      totalChildren,
      avgChildrenPerParent: totalParents > 0 ? (totalChildren / totalParents).toFixed(2) : 0,
    };
  }
}
