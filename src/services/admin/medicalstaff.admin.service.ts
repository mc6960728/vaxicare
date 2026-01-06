import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import bcrypt from 'bcrypt';
import { config } from '../../config/config';

export class MedicalStaffAdminService {
  async createMedicalStaff(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    role: string;
    specialization?: string;
    department?: string;
    licenseNumber: string;
    licenseExpiryDate?: string;
    experienceYears?: number;
    qualifications?: string;
    clinicId?: string;
    joiningDate?: string;
    salary?: number;
    workingHours?: string;
    employmentStatus?: string;
  }) {
    // OPTIMIZED: Run all validation queries in parallel instead of sequentially
    const [existingByEmail, existingByPhone, existingByLicense, vaccinationCenter] = await Promise.all([
      // Check if email already exists (exclude soft-deleted)
      prisma.medicalStaff.findFirst({
        where: { email: data.email, isDeleted: false },
        select: { id: true }
      }),
      // Check if phone already exists (exclude soft-deleted)
      prisma.medicalStaff.findFirst({
        where: { phone: data.phone, isDeleted: false },
        select: { id: true }
      }),
      // Check if license number already exists (exclude soft-deleted)
      prisma.medicalStaff.findFirst({
        where: { licenseNumber: data.licenseNumber, isDeleted: false },
        select: { id: true }
      }),
      // Verify vaccination center exists (only if clinicId is provided)
      data.clinicId
        ? prisma.vaccinationCenter.findUnique({
            where: { id: data.clinicId },
            select: { id: true }
          })
        : Promise.resolve(null)
    ]);

    // Validate results
    if (existingByEmail) {
      throw new AppError('User with this email already exists', 400);
    }

    if (existingByPhone) {
      throw new AppError('User with this phone number already exists', 400);
    }

    if (existingByLicense) {
      throw new AppError('Medical staff with this license number already exists', 400);
    }

    if (data.clinicId && !vaccinationCenter) {
      throw new AppError('Vaccination center not found', 404);
    }

    // Hash password (use default if not provided)
    const password = data.password || 'Staff@123';
    const saltRounds = config.bcrypt.saltRounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create MedicalStaff (all fields are on the model directly)
    const medicalStaff = await prisma.medicalStaff.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender as any,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        role: data.role as any,
        specialization: data.specialization,
        department: data.department,
        licenseNumber: data.licenseNumber,
        licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : null,
        experienceYears: data.experienceYears,
        qualifications: data.qualifications,
        clinicId: data.clinicId || null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
        salary: data.salary,
        workingHours: data.workingHours,
        employmentStatus: (data.employmentStatus as any) || 'ACTIVE',
        status: 'ACTIVE',
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

    return medicalStaff;
  }

  async getAllMedicalStaff(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
    clinicId?: string;
    employmentStatus?: string;
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

    // Filter by clinic
    if (options?.clinicId) {
      where.clinicId = options.clinicId;
    }

    // Filter by employment status
    if (options?.employmentStatus) {
      where.employmentStatus = options.employmentStatus;
    }

    // Search by name, email, or license number
    if (options?.search) {
      where.OR = [
        { firstName: { contains: options.search, mode: 'insensitive' } },
        { lastName: { contains: options.search, mode: 'insensitive' } },
        { fullName: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { licenseNumber: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [medicalStaff, total] = await Promise.all([
      prisma.medicalStaff.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          fullName: true,
          dialCode: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          profilePhoto: true,
          address: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          status: true,
          role: true,
          specialization: true,
          department: true,
          licenseNumber: true,
          licenseExpiryDate: true,
          experienceYears: true,
          qualifications: true,
          clinicId: true,
          joiningDate: true,
          salary: true,
          workingHours: true,
          employmentStatus: true,
          createdAt: true,
          updatedAt: true,
          vaccinationCenter: {
            select: {
              id: true,
              name: true,
              address: true,
              pincode: true,
              district: { select: { id: true, name: true } },
              taluka: { select: { id: true, name: true } },
              village: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.medicalStaff.count({ where }),
    ]);

    return {
      data: medicalStaff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMedicalStaffById(id: string) {
    const medicalStaff = await prisma.medicalStaff.findUnique({
      where: { id },
      include: {
        vaccinationCenter: true,
        _count: {
          select: {
            appointments: true,
            vaccinationRecords: true,
          },
        },
      },
    });

    if (!medicalStaff) {
      throw new AppError('Medical staff not found', 404);
    }

    // Remove password from response
    const { password, ...staffWithoutPassword } = medicalStaff;
    return staffWithoutPassword;
  }

  async updateMedicalStaff(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      dateOfBirth?: string;
      gender?: string;
      address?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      role?: string;
      specialization?: string;
      department?: string;
      licenseNumber?: string;
      licenseExpiryDate?: string;
      experienceYears?: number;
      qualifications?: string;
      clinicId?: string;
      joiningDate?: string;
      salary?: number;
      workingHours?: string;
      employmentStatus?: string;
      status?: string;
    }
  ) {
    const medicalStaff = await prisma.medicalStaff.findUnique({
      where: { id },
    });

    if (!medicalStaff) {
      throw new AppError('Medical staff not found', 404);
    }

    // Check if new email is already taken
    if (data.email && data.email !== medicalStaff.email) {
      const existing = await prisma.medicalStaff.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        throw new AppError('Email already in use', 400);
      }
    }

    // Check if new phone is already taken
    if (data.phone && data.phone !== medicalStaff.phone) {
      const existing = await prisma.medicalStaff.findUnique({
        where: { phone: data.phone },
      });

      if (existing) {
        throw new AppError('Phone number already in use', 400);
      }
    }

    // Check if new license number is already taken
    if (data.licenseNumber && data.licenseNumber !== medicalStaff.licenseNumber) {
      const existing = await prisma.medicalStaff.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });

      if (existing) {
        throw new AppError('License number already in use', 400);
      }
    }

    // Verify new vaccination center exists if provided
    if (data.clinicId && data.clinicId !== medicalStaff.clinicId) {
      const vaccinationCenter = await prisma.vaccinationCenter.findUnique({
        where: { id: data.clinicId },
      });

      if (!vaccinationCenter) {
        throw new AppError('Vaccination center not found', 404);
      }
    }

    // Build fullName if firstName or lastName changed
    let fullName = medicalStaff.fullName;
    if (data.firstName || data.lastName) {
      const newFirstName = data.firstName || medicalStaff.firstName;
      const newLastName = data.lastName || medicalStaff.lastName;
      fullName = `${newFirstName} ${newLastName}`;
    }

    // Update MedicalStaff
    const updatedMedicalStaff = await prisma.medicalStaff.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...((data.firstName || data.lastName) && { fullName }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(data.gender && { gender: data.gender as any }),
        ...(data.address && { address: data.address }),
        ...(data.emergencyContactName && { emergencyContactName: data.emergencyContactName }),
        ...(data.emergencyContactPhone && { emergencyContactPhone: data.emergencyContactPhone }),
        ...(data.role && { role: data.role as any }),
        ...(data.specialization && { specialization: data.specialization }),
        ...(data.department && { department: data.department }),
        ...(data.licenseNumber && { licenseNumber: data.licenseNumber }),
        ...(data.licenseExpiryDate && { licenseExpiryDate: new Date(data.licenseExpiryDate) }),
        ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
        ...(data.qualifications && { qualifications: data.qualifications }),
        ...(data.clinicId !== undefined && { clinicId: data.clinicId || null }),
        ...(data.joiningDate && { joiningDate: new Date(data.joiningDate) }),
        ...(data.salary !== undefined && { salary: data.salary }),
        ...(data.workingHours && { workingHours: data.workingHours }),
        ...(data.employmentStatus && { employmentStatus: data.employmentStatus as any }),
        ...(data.status && { status: data.status as any }),
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

    // Remove password from response
    const { password, ...staffWithoutPassword } = updatedMedicalStaff;
    return staffWithoutPassword;
  }

  async deleteMedicalStaff(id: string) {
    const medicalStaff = await prisma.medicalStaff.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appointments: true,
            vaccinationRecords: true,
          },
        },
      },
    });

    if (!medicalStaff) {
      throw new AppError('Medical staff not found', 404);
    }

    // Soft delete: Modify email, phone, licenseNumber to free up unique constraints
    const deletedEmail = `${medicalStaff.email}_deleted_${Date.now()}`;
    const deletedPhone = `${medicalStaff.phone}_deleted_${Date.now()}`;
    const deletedLicenseNumber = `${medicalStaff.licenseNumber}_deleted_${Date.now()}`;

    await prisma.medicalStaff.update({
      where: { id },
      data: {
        email: deletedEmail,
        phone: deletedPhone,
        licenseNumber: deletedLicenseNumber,
        status: 'DELETED',
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: 'Medical staff deleted successfully' };
  }
}
