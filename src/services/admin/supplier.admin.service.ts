import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import { InventoryStatus, paymentTerms } from '@prisma/client';

interface CreateSupplierInput {
  supplierName: string;
  fullName: string;
  supplierCode: string;
  phone: string;
  email: string;
  website?: string;
  rating?: string;
  temperature?: string;
  status?: InventoryStatus;
  paymentTerms?: paymentTerms;
  address?: string;
  city: string;
  state: string;
  country?: string;
  pincode?: string;
  notes?: string;
  certification?: string;
  expiredStockHandling?: string;
  gstNumber?: string;
  licenseNumber?: string;
  taxIdNumber?: string;
  vaccineType?: string;
  vaccineSupplied?: string;
  maxSupplyCapacity?: string;
  licenseExpiryDate?: Date;
  // Banking fields
  bankName?: string;
  bankBranch?: string;
  accountType?: string;
  accountNumber?: string;
  ifscCode?: string;
  // Financial fields
  creditLimit?: number;
  totalOrders?: number;
  totalOrderValue?: number;
  lastOrderDate?: Date;
}

interface UpdateSupplierInput {
  supplierName?: string;
  fullName?: string;
  supplierCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: string;
  temperature?: string;
  status?: InventoryStatus;
  paymentTerms?: paymentTerms;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  notes?: string;
  certification?: string;
  expiredStockHandling?: string;
  gstNumber?: string;
  licenseNumber?: string;
  taxIdNumber?: string;
  vaccineType?: string;
  vaccineSupplied?: string;
  maxSupplyCapacity?: string;
  licenseExpiryDate?: Date;
  // Banking fields
  bankName?: string;
  bankBranch?: string;
  accountType?: string;
  accountNumber?: string;
  ifscCode?: string;
  // Financial fields
  creditLimit?: number;
  totalOrders?: number;
  totalOrderValue?: number;
  lastOrderDate?: Date;
}

export class SupplierAdminService {
  /**
   * Create new supplier
   */
  async createSupplier(data: CreateSupplierInput) {
    // Check if supplier code already exists
    const existingCode = await prisma.supplier.findFirst({
      where: { supplierCode: data.supplierCode },
    });

    if (existingCode) {
      throw new AppError('Supplier with this code already exists', 409);
    }

    // Check if email already exists
    const existingEmail = await prisma.supplier.findFirst({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new AppError('Supplier with this email already exists', 409);
    }

    const supplier = await prisma.supplier.create({
      data: {
        supplierName: data.supplierName,
        fullName: data.fullName,
        supplierCode: data.supplierCode,
        phone: data.phone,
        email: data.email,
        website: data.website,
        rating: data.rating,
        temperature: data.temperature,
        status: data.status || InventoryStatus.ACTIVE,
        paymentTerms: data.paymentTerms || paymentTerms.ADVANCE,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country || 'India',
        pincode: data.pincode,
        notes: data.notes,
        certification: data.certification,
        expiredStockHandling: data.expiredStockHandling,
        gstNumber: data.gstNumber,
        licenseNumber: data.licenseNumber,
        taxIdNumber: data.taxIdNumber,
        vaccineType: data.vaccineType,
        vaccineSupplied: data.vaccineSupplied,
        maxSupplyCapacity: data.maxSupplyCapacity,
        licenseExpiryDate: data.licenseExpiryDate,
        // Banking fields
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        accountType: data.accountType,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        // Financial fields
        creditLimit: data.creditLimit,
        totalOrders: data.totalOrders,
        totalOrderValue: data.totalOrderValue,
        lastOrderDate: data.lastOrderDate,
      },
    });

    return {
      message: 'Supplier created successfully',
      supplier,
    };
  }

  /**
   * Get all suppliers with pagination, filters and search
   */
  async getAllSuppliers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: InventoryStatus;
    city?: string;
    state?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by supplier name, contact person, email, phone, code
    if (params.search) {
      where.OR = [
        { supplierName: { contains: params.search, mode: 'insensitive' } },
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { supplierCode: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Filter by status
    if (params.status) {
      where.status = params.status;
    }

    // Filter by city
    if (params.city) {
      where.city = { contains: params.city, mode: 'insensitive' };
    }

    // Filter by state
    if (params.state) {
      where.state = { contains: params.state, mode: 'insensitive' };
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    // Format response with location
    const formattedSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      supplierName: supplier.supplierName,
      supplierCode: supplier.supplierCode,
      fullName: supplier.fullName,
      location: `${supplier.city}, ${supplier.state}`,
      city: supplier.city,
      state: supplier.state,
      country: supplier.country,
      phone: supplier.phone,
      email: supplier.email,
      website: supplier.website,
      rating: supplier.rating,
      status: supplier.status,
      paymentTerms: supplier.paymentTerms,
      vaccineType: supplier.vaccineType,
      vaccineSupplied: supplier.vaccineSupplied,
      licenseNumber: supplier.licenseNumber,
      licenseExpiryDate: supplier.licenseExpiryDate,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    }));

    return {
      message: 'Suppliers retrieved successfully',
      data: formattedSuppliers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    return {
      message: 'Supplier details retrieved successfully',
      supplier: {
        ...supplier,
        location: `${supplier.city}, ${supplier.state}`,
      },
    };
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, data: UpdateSupplierInput) {
    // Check if supplier exists
    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Supplier not found', 404);
    }

    // Check if supplier code is being updated and already exists
    if (data.supplierCode && data.supplierCode !== existing.supplierCode) {
      const duplicateCode = await prisma.supplier.findFirst({
        where: {
          supplierCode: data.supplierCode,
          id: { not: id },
        },
      });

      if (duplicateCode) {
        throw new AppError('Supplier with this code already exists', 409);
      }
    }

    // Check if email is being updated and already exists
    if (data.email && data.email !== existing.email) {
      const duplicateEmail = await prisma.supplier.findFirst({
        where: {
          email: data.email,
          id: { not: id },
        },
      });

      if (duplicateEmail) {
        throw new AppError('Supplier with this email already exists', 409);
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.supplierName && { supplierName: data.supplierName }),
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.supplierCode && { supplierCode: data.supplierCode }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.temperature !== undefined && { temperature: data.temperature }),
        ...(data.status && { status: data.status }),
        ...(data.paymentTerms && { paymentTerms: data.paymentTerms }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.pincode !== undefined && { pincode: data.pincode }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.certification !== undefined && { certification: data.certification }),
        ...(data.expiredStockHandling !== undefined && { expiredStockHandling: data.expiredStockHandling }),
        ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
        ...(data.taxIdNumber !== undefined && { taxIdNumber: data.taxIdNumber }),
        ...(data.vaccineType !== undefined && { vaccineType: data.vaccineType }),
        ...(data.vaccineSupplied !== undefined && { vaccineSupplied: data.vaccineSupplied }),
        ...(data.maxSupplyCapacity !== undefined && { maxSupplyCapacity: data.maxSupplyCapacity }),
        ...(data.licenseExpiryDate && { licenseExpiryDate: data.licenseExpiryDate }),
        // Banking fields
        ...(data.bankName !== undefined && { bankName: data.bankName }),
        ...(data.bankBranch !== undefined && { bankBranch: data.bankBranch }),
        ...(data.accountType !== undefined && { accountType: data.accountType }),
        ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
        ...(data.ifscCode !== undefined && { ifscCode: data.ifscCode }),
        // Financial fields
        ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
        ...(data.totalOrders !== undefined && { totalOrders: data.totalOrders }),
        ...(data.totalOrderValue !== undefined && { totalOrderValue: data.totalOrderValue }),
        ...(data.lastOrderDate && { lastOrderDate: data.lastOrderDate }),
      },
    });

    return {
      message: 'Supplier updated successfully',
      supplier,
    };
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return {
      message: 'Supplier deleted successfully',
    };
  }

  /**
   * Toggle supplier status (active/inactive)
   */
  async toggleSupplierStatus(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    const newStatus = supplier.status === InventoryStatus.ACTIVE
      ? InventoryStatus.OUT_OF_STOCK
      : InventoryStatus.ACTIVE;

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: { status: newStatus },
    });

    return {
      message: `Supplier ${newStatus === InventoryStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`,
      supplier: updatedSupplier,
    };
  }

  /**
   * Get supplier statistics
   */
  async getSupplierStatistics() {
    const [
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      suppliersByState,
    ] = await Promise.all([
      prisma.supplier.count(),
      prisma.supplier.count({ where: { status: InventoryStatus.ACTIVE } }),
      prisma.supplier.count({ where: { status: { not: InventoryStatus.ACTIVE } } }),
      prisma.supplier.groupBy({
        by: ['state'],
        _count: { state: true },
        orderBy: { _count: { state: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      message: 'Supplier statistics retrieved successfully',
      statistics: {
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers,
        suppliersByState: suppliersByState.map(s => ({
          state: s.state,
          count: s._count.state,
        })),
      },
    };
  }

  /**
   * Get suppliers for dropdown (active only)
   */
  async getSuppliersDropdown() {
    const suppliers = await prisma.supplier.findMany({
      where: { status: InventoryStatus.ACTIVE },
      select: {
        id: true,
        supplierName: true,
        supplierCode: true,
        city: true,
        state: true,
      },
      orderBy: { supplierName: 'asc' },
    });

    return {
      message: 'Suppliers dropdown retrieved successfully',
      suppliers: suppliers.map(s => ({
        id: s.id,
        label: s.supplierName,
        code: s.supplierCode,
        location: `${s.city}, ${s.state}`,
      })),
    };
  }
}
