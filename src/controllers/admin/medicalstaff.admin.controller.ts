import { Request, Response, NextFunction } from 'express';
import { MedicalStaffAdminService } from '../../services/admin/medicalstaff.admin.service';

export class MedicalStaffAdminController {
  private medicalStaffAdminService: MedicalStaffAdminService;

  constructor() {
    this.medicalStaffAdminService = new MedicalStaffAdminService();
  }

  createMedicalStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const medicalStaff = await this.medicalStaffAdminService.createMedicalStaff(req.body);
      res.status(201).json({
        status: 'success',
        data: medicalStaff,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllMedicalStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const options = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string,
        status: req.query.status as string,
        role: req.query.role as string,
        clinicId: req.query.clinicId as string,
        employmentStatus: req.query.employmentStatus as string,
      };

      const result = await this.medicalStaffAdminService.getAllMedicalStaff(options);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getMedicalStaffById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const medicalStaff = await this.medicalStaffAdminService.getMedicalStaffById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: medicalStaff,
      });
    } catch (error) {
      next(error);
    }
  };

  updateMedicalStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const medicalStaff = await this.medicalStaffAdminService.updateMedicalStaff(
        req.params.id,
        req.body
      );
      res.status(200).json({
        status: 'success',
        data: medicalStaff,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMedicalStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.medicalStaffAdminService.deleteMedicalStaff(req.params.id);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
