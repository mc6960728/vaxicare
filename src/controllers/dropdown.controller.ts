import { Request, Response, NextFunction } from 'express';
import { DropdownService } from '../services/dropdown.service';

const dropdownService = new DropdownService();

export class DropdownController {
  /**
   * Get all STATIC dropdown data in a single API call
   * GET /api/v1/dropdowns
   *
   * Returns static enums only (no DB queries):
   * - User & Profile: bloodGroups, allergies, genders, relations, medicalConditions
   * - Staff: staffRoles, employmentStatuses, userStatuses
   * - Appointment: appointmentStatuses
   * - Vaccine: vaccineTypes, administrationRoutes, vialTypes, vaccineCategories,
   *            openedVialStatuses, dosageUnits, storageTemperatures, vaccineAgeGroups
   */
  async getAllDropdowns(_req: Request, res: Response, next: NextFunction) {
    try {
      const dropdowns = dropdownService.getAllDropdowns();

      res.status(200).json({
        status: 'success',
        message: 'All dropdowns fetched successfully',
        data: dropdowns,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get districts dropdown (from database)
   * GET /api/v1/dropdowns/districts
   */
  async getDistricts(_req: Request, res: Response, next: NextFunction) {
    try {
      const districts = await dropdownService.getDistricts();

      res.status(200).json({
        status: 'success',
        message: 'Districts fetched successfully',
        data: districts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get talukas by district
   * GET /api/v1/dropdowns/talukas/:districtId
   */
  async getTalukasByDistrict(req: Request, res: Response, next: NextFunction) {
    try {
      const { districtId } = req.params;
      const talukas = await dropdownService.getTalukasByDistrict(districtId);

      res.status(200).json({
        status: 'success',
        message: 'Talukas fetched successfully',
        data: talukas,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get villages by taluka
   * GET /api/v1/dropdowns/villages/:talukaId
   */
  async getVillagesByTaluka(req: Request, res: Response, next: NextFunction) {
    try {
      const { talukaId } = req.params;
      const villages = await dropdownService.getVillagesByTaluka(talukaId);

      res.status(200).json({
        status: 'success',
        message: 'Villages fetched successfully',
        data: villages,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all villages with taluka and district info (for auto-fill)
   * GET /api/v1/dropdowns/villages-with-location
   */
  async getAllVillagesWithLocation(_req: Request, res: Response, next: NextFunction) {
    try {
      const villages = await dropdownService.getAllVillagesWithLocation();

      res.status(200).json({
        status: 'success',
        message: 'Villages with location fetched successfully',
        data: villages,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get vaccination centers dropdown (from database)
   * GET /api/v1/dropdowns/vaccination-centers
   * Query params: ?isAdmin=true (for admin panel - returns only id & name)
   */
  async getVaccinationCenters(req: Request, res: Response, next: NextFunction) {
    try {
      const { isAdmin } = req.query;
      const isAdminPanel = isAdmin === 'true';

      const vaccinationCenters = await dropdownService.getVaccinationCenters(isAdminPanel);

      res.status(200).json({
        status: 'success',
        message: 'Vaccination centers fetched successfully',
        data: vaccinationCenters,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get vaccines dropdown (from database)
   * GET /api/v1/dropdowns/vaccines
   * Query params: ?ageGroupLabel=Birth&isActive=true
   */
  async getVaccines(req: Request, res: Response, next: NextFunction) {
    try {
      const { ageGroupLabel, isActive } = req.query;

      const filters = {
        ...(ageGroupLabel && { ageGroupLabel: ageGroupLabel as string }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      };

      const vaccines = await dropdownService.getVaccines(filters);

      res.status(200).json({
        status: 'success',
        message: 'Vaccines fetched successfully',
        data: vaccines,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get medical staff dropdown (Doctors/Paediatricians)
   * GET /api/v1/dropdowns/medical-staff
   * Query params: ?clinicId=xxx&role=DOCTOR
   */
  async getMedicalStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { clinicId, role } = req.query;

      const filters = {
        ...(clinicId && { clinicId: clinicId as string }),
        ...(role && { role: role as string }),
      };

      const medicalStaff = await dropdownService.getMedicalStaff(filters);

      res.status(200).json({
        status: 'success',
        message: 'Medical staff fetched successfully',
        data: medicalStaff,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctors by vaccination center
   * GET /api/v1/dropdowns/doctors/:clinicId
   */
  async getDoctorsByCenter(req: Request, res: Response, next: NextFunction) {
    try {
      const { clinicId } = req.params;
      const doctors = await dropdownService.getDoctorsByCenter(clinicId);

      res.status(200).json({
        status: 'success',
        message: 'Doctors fetched successfully',
        data: doctors,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get suppliers dropdown (from database)
   * GET /api/v1/dropdowns/suppliers
   */
  async getSuppliers(_req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await dropdownService.getSuppliers();

      res.status(200).json({
        status: 'success',
        message: 'Suppliers fetched successfully',
        data: suppliers,
      });
    } catch (error) {
      next(error);
    }
  }
}
