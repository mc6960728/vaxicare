import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import bcrypt from 'bcrypt';
import { config } from '../../config/config';

export class UserAdminService {
  /**
   * Create a new user
   */
  async createUser(data: {
    fullName: string;
    email: string;
    password?: string;
    role: string;
    status?: string;
    profilePhoto?: string;
    phone?: string;
  }) {
    // Check if email already exists (exclude soft-deleted users)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        isDeleted: false,
      },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // If a soft-deleted user has this email, free up the constraint
    const deletedUserWithEmail = await prisma.user.findFirst({
      where: {
        email: data.email,
        isDeleted: true,
      },
    });

    if (deletedUserWithEmail) {
      await prisma.user.update({
        where: { id: deletedUserWithEmail.id },
        data: {
          email: `${data.email}_deleted_${Date.now()}`,
        },
      });
    }

    // Hash password (use default if not provided)
    const password = data.password || 'Admin@123';
    const saltRounds = config.bcrypt.saltRounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        role: data.role as any,
        status: (data.status as any) || 'ACTIVE',
        profilePhoto: data.profilePhoto,
        phone: data.phone,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profilePhoto: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
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

    // Filter by role
    if (options?.role) {
      where.role = options.role;
    }

    // Search by name or email
    if (options?.search) {
      where.OR = [
        { fullName: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          profilePhoto: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profilePhoto: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
      role?: string;
      status?: string;
      profilePhoto?: string;
      password?: string;
    }
  ) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if new email is already taken (exclude soft-deleted users)
    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: data.email,
          isDeleted: false,
        },
      });

      if (existing) {
        throw new AppError('Email already in use', 400);
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role as any;
    if (data.status) updateData.status = data.status as any;
    if (data.profilePhoto !== undefined) updateData.profilePhoto = data.profilePhoto;

    // Hash new password if provided
    if (data.password) {
      const saltRounds = config.bcrypt.saltRounds;
      updateData.password = await bcrypt.hash(data.password, saltRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profilePhoto: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string, currentUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent self-deletion
    if (id === currentUserId) {
      throw new AppError('You cannot delete your own account', 400);
    }

    // Soft delete - modify email to free up the unique constraint
    const deletedEmail = `${user.email}_deleted_${Date.now()}`;

    await prisma.user.update({
      where: { id },
      data: {
        email: deletedEmail,
        status: 'DELETED',
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: 'User deleted successfully' };
  }
}
