import { Router } from 'express';
import { DropdownController } from '../controllers/dropdown.controller';

const router = Router();
const dropdownController = new DropdownController();

/**
 * Common Dropdown Routes
 * Base: /api/v1/dropdowns
 *
 * These routes are public/authenticated based on parent router configuration
 */

/**
 * GET /api/v1/dropdowns
 *
 * Get all STATIC dropdowns in a single API call (recommended for app & admin panel)
 *
 * Returns (static enums only - no DB queries):
 * - User & Profile: bloodGroups, allergies, genders, relations, medicalConditions
 * - Staff: staffRoles, employmentStatuses, userStatuses
 * - Appointment: appointmentStatuses
 * - Vaccine: vaccineTypes, administrationRoutes, vialTypes, vaccineCategories,
 *            openedVialStatuses, dosageUnits, storageTemperatures, vaccineAgeGroups
 */
router.get('/', dropdownController.getAllDropdowns);

// ========== DATABASE DROPDOWNS ==========

// GET /api/v1/dropdowns/districts - Get all active districts
router.get('/districts', dropdownController.getDistricts);

// GET /api/v1/dropdowns/talukas/:districtId - Get talukas by district
router.get('/talukas/:districtId', dropdownController.getTalukasByDistrict);

// GET /api/v1/dropdowns/villages/:talukaId - Get villages by taluka
router.get('/villages/:talukaId', dropdownController.getVillagesByTaluka);

// GET /api/v1/dropdowns/villages-with-location - Get all villages with taluka and district info (for auto-fill)
router.get('/villages-with-location', dropdownController.getAllVillagesWithLocation);

// GET /api/v1/dropdowns/vaccination-centers - Get all active vaccination centers
router.get('/vaccination-centers', dropdownController.getVaccinationCenters);

// GET /api/v1/dropdowns/vaccines - Get all vaccines
// Query params: ?isActive=true&ageGroupLabel=Birth
router.get('/vaccines', dropdownController.getVaccines);

// ========== MEDICAL STAFF DROPDOWNS (with filters) ==========

// GET /api/v1/dropdowns/medical-staff - All medical staff
// GET /api/v1/dropdowns/medical-staff?clinicId=xxx - Medical staff by center
// GET /api/v1/dropdowns/medical-staff?role=DOCTOR - Only doctors
// GET /api/v1/dropdowns/medical-staff?clinicId=xxx&role=DOCTOR - Doctors by center
router.get('/medical-staff', dropdownController.getMedicalStaff);

// GET /api/v1/dropdowns/doctors/:clinicId - Get doctors for a specific vaccination center
router.get('/doctors/:clinicId', dropdownController.getDoctorsByCenter);

// GET /api/v1/dropdowns/suppliers - Get all active suppliers
router.get('/suppliers', dropdownController.getSuppliers);

export default router;
