import { Response, NextFunction } from 'express';
import { VaccineTransferService } from '../services/vaccine-transfer.service';
import { AuthRequest } from '../types/request.types';
import { AppError } from '../utils/AppError';
import {
    QualityCheckStatus,
    DeliveryType,
} from '@prisma/client';

export class VaccineTransferController {
    private service = VaccineTransferService;

    /**
     * GET /stats
     */
    getTransferStats = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const stats = await this.service.getTransferStats(req.query);

            res.status(200).json({
                status: 'success',
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /
     */
    getTransfers = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const result = await this.service.getTransfers(req.query);

            res.status(200).json({
                status: 'success',
                message: 'Transfers fetched successfully',
                data: { transfers: result.data },
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /
     */
    createTransfer = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const transfer = await this.service.createTransfer({
                ...req.body,
                // createdBy: req.user!.id,
            });

            res.status(201).json({
                status: 'success',
                data: transfer,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /:id
     */
    getTransferById = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const transfer = await this.service.getTransferById(req.params.id);

            if (!transfer) {
                throw new AppError('Vaccine transfer not found', 404);
            }

            res.status(200).json({
                status: 'success',
                message: 'Transfer fetched successfully.',
                data: transfer,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * PATCH /:id/status
     */
    updateTransferStatus = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { transferStatus } = req.body;

            if (!Object.values(DeliveryType).includes(transferStatus)) {
                throw new AppError('Invalid transfer status', 400);
            }

            const updated = await this.service.updateTransferStatus(
                req.params.id,
                transferStatus,
                req.body
            );

            res.status(200).json({
                status: 'success',
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /:id/receive
     */
    receiveTransfer = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const received = await this.service.receiveTransfer(
                req.params.id,
                {
                    ...req.body,
                    receivedBy: req.user!.id,
                }
            );

            res.status(200).json({
                status: 'success',
                data: received,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /:id/inspect
     */
    inspectTransfer = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { inspectedQualityCheck } = req.body;

            if (
                !Object.values(QualityCheckStatus).includes(inspectedQualityCheck)
            ) {
                throw new AppError('Invalid quality check status', 400);
            }

            const inspected = await this.service.inspectTransfer(
                req.params.id,
                {
                    ...req.body,
                    inspectedBy: req.user!.id,
                }
            );

            res.status(200).json({
                status: 'success',
                data: inspected,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * PUT /:id
     */
    updateTransfer = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const updated = await this.service.updateTransfer(
                req.params.id,
                req.body
            );

            res.status(200).json({
                status: 'success',
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * DELETE /:id
     */
    deleteTransfer = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            await this.service.deleteTransfer(req.params.id);

            res.status(204).json({
                status: 'success',
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}
