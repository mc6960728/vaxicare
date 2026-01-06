import { generateAlphanumericString } from '../utils/helper';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { DeliveryType, QualityCheckStatus } from '@prisma/client';


interface PaginationQuery {
  page?: number;
  limit?: number;
}

export class VaccineTransferService {
  /**
   * ------------------------
   * STATS
   * ------------------------
   */
  static async getTransferStats(query: any) {
    const { locationId } = query;

    const where: any = {};
    if (locationId) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId },
      ];
    }

    const [
      total,
      byTransferStatus,
      byStatus,
      pending,
    ] = await Promise.all([
      prisma.vaccineTransfer.count({ where }),

      prisma.vaccineTransfer.groupBy({
        by: ['transferStatus'],
        where,
        _count: true,
      }),

      prisma.vaccineTransfer.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      prisma.vaccineTransfer.count({
        where: {
          ...where,
          // transferStatus: { notIn: ['COMPLETED', 'REJECTED'] },
          
        },
      }),
    ]);

    return {
      total,
      byTransferStatus,
      byStatus,
      pending,
    };
  }

  /**
   * ------------------------
   * LIST WITH FILTERS + PAGINATION
   * ------------------------
   */
  static async getTransfers(query: any) {
    const {
      vaccineId,
      fromLocationId,
      toLocationId,
      transferStatus,
      status,
      search,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (vaccineId) where.vaccineId = vaccineId;
    if (fromLocationId) where.fromLocationId = fromLocationId;
    if (toLocationId) where.toLocationId = toLocationId;
    if (transferStatus) where.transferStatus = transferStatus;
    if (status) where.status = status;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    if (search) {
      where.OR = [
        { transferId: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { invoiceNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      prisma.vaccineTransfer.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          vaccine: true,
          fromLocation: true,
          toLocation: true,
        },
      }),
      prisma.vaccineTransfer.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async generateTransferId() {
    try {
      const transferId = generateAlphanumericString(12)
      const existing = await prisma.vaccineTransfer.findUnique({ where: { transferId }, select: { id: true } })
      if (existing) await this.generateTransferId()

      return transferId

    } catch (err) {
      console.log(err)
    }

  }
  /**
   * ------------------------
   * CREATE TRANSFER
   * ------------------------
   */
  static async createTransfer(data: any) {
    // Validate supplier exists
    if (data?.supplierId) {
      const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId }, select: { id: true } })
      if (!supplier) throw new AppError('Supplier not found')
    }

    // Validate locations are different
    if (data?.fromLocationId?.toString() === data?.toLocationId?.toString()) {
      throw new AppError('From and To Location cannot be same')
    }

    // Validate fromLocation exists
    if (data?.fromLocationId) {
      const fromLocation = await prisma.vaccinationCenter.findUnique({ where: { id: data.fromLocationId } })
      if (!fromLocation) throw new AppError(`The vaccination center from which vaccine is to be dispatched doesn't exist`)
    }

    // Validate toLocation exists
    if (data?.toLocationId) {
      const toLocation = await prisma.vaccinationCenter.findUnique({ where: { id: data.toLocationId } })
      if (!toLocation) throw new AppError(`The vaccination center to which vaccine is to be received doesn't exist`)
    }

    // Validate vaccine exists
    if (data?.vaccineId) {
      const vaccine = await prisma.vaccine.findUnique({ where: { id: data.vaccineId } })
      if (!vaccine) throw new AppError('Vaccine not found')
    }

    const transfer = await prisma.vaccineTransfer.create({
      data: {
        transferId: await this.generateTransferId(),
        transferStatus: DeliveryType.ORDERED,
        status: DeliveryType.DISPATCHED,
        batchNumber: data.batchNumber,
        quantityDispatched: data.quantityDispatched,
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        manufacturingDate: data.manufacturingDate ? new Date(data.manufacturingDate) : undefined,
        price: data.price,
        packagingType: data.packagingType,
        storageCondition: data.storageCondition,
        dispatchRemarks: data.dispatchRemarks,
        coldChainMaintained: data.coldChainMaintained,
        courierName: data.courierName,
        trackingNumber: data.trackingNumber,
        invoiceNo: data.invoiceNo,
        temperatureAtDispatch: data.temperatureAtDispatch,
        // Use Prisma relation syntax for foreign keys
        vaccine: { connect: { id: data.vaccineId } },
        fromLocation: { connect: { id: data.fromLocationId } },
        toLocation: { connect: { id: data.toLocationId } },
        ...(data.supplierId && { manufacturer: { connect: { id: data.supplierId } } }),
      },
    });

    return transfer;
  }

  /**
   * ------------------------
   * GET BY ID
   * ------------------------
   */
  static async getTransferById(id: string) {
    return prisma.vaccineTransfer.findUnique({
      where: { id },
      include: {
        vaccine: true,
        fromLocation: true,
        toLocation: true,
      },
    });
  }

  /**
   * ------------------------
   * UPDATE TRANSFER STATUS
   * ------------------------
   */
  static async updateTransferStatus(
    id: string,
    transferStatus: DeliveryType,
    payload: any
  ) {
    const transfer = await prisma.vaccineTransfer.findUnique({ where: { id } });

    if (!transfer) {
      throw new AppError('Transfer not found', 404);
    }

    return prisma.vaccineTransfer.update({
      where: { id },
      data: {
        transferStatus,
        ...payload,
      },
    });
  }

  /**
   * ------------------------
   * RECEIVE TRANSFER
   * ------------------------
   */
  static async receiveTransfer(id: string, payload: any) {
    const {
      quantityReceived,
      quantityAccepted,
      quantityRejected,
      qualityCheck,
      receivedBy,
    } = payload;

    if (quantityAccepted + quantityRejected !== quantityReceived) {
      throw new AppError(
        'quantityAccepted + quantityRejected must equal quantityReceived',
        400
      );
    }

    const transfer = await prisma.vaccineTransfer.findUnique({ where: { id } });

    if (!transfer) {
      throw new AppError('Transfer not found', 404);
    }

    if (transfer.transferStatus !== DeliveryType.ARRIVED) {
      throw new AppError('Transfer must be ARRIVED before receiving', 400);
    }

    return prisma.vaccineTransfer.update({
      where: { id },
      data: {
        ...payload,
        receivedOn: new Date(),
        receivedBy,
        status: DeliveryType.ARRIVED,
      },
    });
  }

  /**
   * ------------------------
   * INSPECT TRANSFER
   * ------------------------
   */
  static async inspectTransfer(id: string, payload: any) {
    const { inspectedQualityCheck, insepectedBy } = payload;

    const transfer = await prisma.vaccineTransfer.findUnique({ where: { id } });

    if (!transfer) {
      throw new AppError('Transfer not found', 404);
    }

    if (DeliveryType.ARRIVED !== transfer.transferStatus) {
      throw new AppError('Transfer must be received before inspection', 400);
    }

    const finalStatus =
      inspectedQualityCheck === QualityCheckStatus.PASSED
        ? QualityCheckStatus.PASSED
        : QualityCheckStatus.FAILED;

    return prisma.vaccineTransfer.update({
      where: { id },
      data: {
        insepectedBy,
        insepectedOn: new Date(),
        inspectedQualityCheck: finalStatus,
      },
    });
  }

  /**
   * ------------------------
   * UPDATE TRANSFER
   * ------------------------
   */
  static async updateTransfer(id: string, payload: any) {
    const transfer = await prisma.vaccineTransfer.findUnique({ where: { id } });

    if (!transfer) {
      throw new AppError('Transfer not found', 404);
    }

    return prisma.vaccineTransfer.update({
      where: { id },
      data: payload,
    });
  }

  /**
   * ------------------------
   * DELETE TRANSFER
   * ------------------------
   */
  static async deleteTransfer(id: string) {
    const transfer = await prisma.vaccineTransfer.findUnique({ where: { id } });

    if (!transfer) {
      throw new AppError('Transfer not found', 404);
    }

    if (transfer.transferStatus !== DeliveryType.ORDERED) {
      throw new AppError(
        'Only ORDERED transfers can be deleted',
        400
      );
    }

    await prisma.vaccineTransfer.delete({ where: { id } });
  }
}
