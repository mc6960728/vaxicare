import { config } from '../config/config';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  role: string;
}

export class UserService {
  async register(data: RegisterInput) {
    const { email, password, firstName, lastName, organization, role } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const saltRounds = config.bcrypt.saltRounds || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        organization,
        role
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = this.generateToken(user.id, user.role);

    return {
      user,
      token,
    };
  }
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organization: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async getAllUsers(options?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
    includeDeleted?: boolean;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Exclude deleted users by default
    if (!options?.includeDeleted) {
      where.isDeleted = false;
    }

    // Filter by role
    if (options?.role) {
      where.role = options.role;
    }

    // Filter by status
    if (options?.status) {
      where.status = options.status;
    }

    // Search by name or email
    if (options?.search) {
      where.OR = [
        { firstName: { contains: options.search, mode: 'insensitive' } },
        { lastName: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organization: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

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

  async updateUser(id: string, data: { firstName?: string; lastName?: string; email?: string; organization?: string }) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if email is already taken by another user
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new AppError('Email already in use', 400);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organization: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isDeleted) {
      throw new AppError('User is already deleted', 400);
    }

    // Soft delete: Update user status to DELETED and set deletedAt timestamp
    await prisma.user.update({
      where: { id },
      data: {
        status: 'DELETED',
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: 'User deleted successfully' };
  }

  private generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, config.jwt.secret, {
      expiresIn: '7d',
    });
  }
}
