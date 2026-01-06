import { Router } from 'express';
import { VaccineController } from '../controllers/vaccine.controller';
import { authenticate } from '../middleware/auth';
// import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';
import {
  createVaccineSchema,
  updateVaccineSchema,
} from '../utils/validators';

const router = Router();
const vaccineController = new VaccineController();

/**
 * Public/Common Routes (All authenticated users)
 */

/**
 * Get all vaccines with filters
 * GET /api/v1/vaccines?isActive=true&ageGroupLabel=Birth&search=bcg&page=1&limit=10
 *
 * Query Parameters:
 * - isActive (optional): true/false - Filter by status
 * - ageGroupLabel (optional): string - Filter by age group
 * - search (optional): string - Search by name or manufacturer
 * - page (optional): number - Page number (default: 1)
 * - limit (optional): number - Items per page (default: 10)
 *
 * Used by: Admin panel (all vaccines), Mobile app (active only)
 */
router.get('/', authenticate, vaccineController.getAllVaccines);

/**
 * Get age groups dropdown
 * GET /api/v1/vaccines/age-groups
 *
 * Returns list of age groups for dropdowns
 * Used by: Admin panel (Add Vaccine form), Mobile app filters
 */
router.get('/age-groups', authenticate, vaccineController.getAgeGroups);

/**
 * Get vaccine statistics
 * GET /api/v1/vaccines/statistics
 *
 * Returns: Total vaccines, active/inactive counts, stock info
 * Used by: Admin dashboard
 */
router.get(
  '/statistics',
  authenticate,
  // authorize(['ADMIN']),
  vaccineController.getStatistics
);

/**
 * Search vaccines
 * GET /api/v1/vaccines/search?q=bcg&activeOnly=true
 *
 * Query Parameters:
 * - q (required): Search query
 * - activeOnly (optional): true/false - Show only active vaccines
 *
 * Used by: Admin panel search, Mobile app search
 */
router.get('/search', authenticate, vaccineController.searchVaccines);

/**
 * Get vaccines by age group
 * GET /api/v1/vaccines/age-group/:ageGroupLabel
 *
 * Example: /api/v1/vaccines/age-group/Birth
 *
 * Used by: Mobile app - Filter vaccines by age
 */
router.get(
  '/age-group/:ageGroupLabel',
  authenticate,
  vaccineController.getVaccinesByAgeGroup
);

/**
 * Get single vaccine details
 * GET /api/v1/vaccines/:id
 *
 * Returns complete vaccine info including inventory and schedules
 * Used by: Admin panel (View/Edit), Mobile app (Vaccine details)
 */
router.get('/:id', authenticate, vaccineController.getVaccineById);

/**
 * Admin Only Routes
 */

/**
 * Create new vaccine
 * POST /api/v1/vaccines
 *
 * Request Body:
 * {
 *   "name": "BCG",
 *   "manufacturer": "Serum Institute of India",
 *   "description": "Tuberculosis vaccine",
 *   "vaccineType": "INJECTABLE",
 *   "administrationRoute": "INTRADERMAL",
 *   "vialType": "MULTI_DOSE",
 *   "category": "UIP",
 *   "dosage": "0.1ml",
 *   "dosageUnit": "ml",
 *   "dosagePerChild": 0.1,
 *   "dosesPerVial": 10,
 *   "childrenPerVial": 10,

 *   "ageGroupLabel": "Birth",
 *   "dosageCount": 1,
 *   "storageTemperatureMin": 2,
 *   "storageTemperatureMax": 8,
 *   "openVialPolicyHours": 4,
 *   "discardAfterOpening": true,
 *   "contraindications": ["Immunocompromised"],
 *   "diseasesPrevented": ["Tuberculosis"],
 *   "vaccineCode": "BCG",
 *   "price": 50.00,
 *   "sideEffects": "Small scar at injection site",
 *   "notes": "Store at 2-8°C",
 *   "isActive": true
 * }
 *
 * Used by: Admin panel - Add Vaccine form
 */
router.post(
  '/',
  authenticate,
  // authorize(['ADMIN']),
  validateRequest(createVaccineSchema),
  vaccineController.createVaccine
);

/**
 * Update vaccine
 * PUT /api/v1/vaccines/:id
 *
 * Request Body: Same as create (all fields optional)
 *
 * Used by: Admin panel - Edit Vaccine form
 */
router.put(
  '/:id',
  authenticate,
  // authorize(['ADMIN']),
  validateRequest(updateVaccineSchema),
  vaccineController.updateVaccine
);

/**
 * Delete vaccine
 * DELETE /api/v1/vaccines/:id
 *
 * Note: Soft delete if vaccine has existing records
 *
 * Used by: Admin panel - Delete action
 */
router.delete(
  '/:id',
  authenticate,
  // authorize(['ADMIN']),
  vaccineController.deleteVaccine
);

export default router;
