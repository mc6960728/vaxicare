import { Router } from 'express';
import { VaccinationCenterAdminController } from '../../controllers/admin/vaccinationcenter.admin.controller';

const router = Router();
const vaccinationCenterController = new VaccinationCenterAdminController();

/**
 * Vaccination Center Admin Routes
 * Base: /api/v1/admin/vaccination-centers
 * All routes require Admin/Super Admin authentication
 */

/**
 * Create a new vaccination center
 * POST /api/v1/admin/vaccination-centers
 *
 * Request Body:
 * {
 *   "name": "Primary Health Center",
 *   "address": "Main Road, Near Bus Stand",
 *   "landmark": "Opposite Bank",
 *   "villageId": "uuid",
 *   "city": "Ahmedabad",
 *   "district": "Ahmedabad",
 *   "state": "Gujarat",
 *   "pincode": "380001",
 *   "country": "India",
 *   "phone": "1234567890",
 *   "email": "phc@example.com",
 *   "licenseNumber": "LIC123456",
 *   "openingHours": "9 AM - 6 PM",
 *   "facilities": "Cold Storage, Emergency Care",
 *   "status": "ACTIVE",
 *   "notes": "Optional notes"
 * }
 */
router.post('/', vaccinationCenterController.createVaccinationCenter);

/**
 * Get all vaccination centers with pagination and filters
 * GET /api/v1/admin/vaccination-centers
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - search: Search by name, city, address, license number
 * - city: Filter by city
 * - state: Filter by state
 * - isActive: Filter by active status (true/false)
 *
 * Example: ?page=1&limit=10&search=Primary&city=Ahmedabad&isActive=true
 */
router.get('/', vaccinationCenterController.getAllVaccinationCenters);

/**
 * Get vaccination center by ID with details
 * GET /api/v1/admin/vaccination-centers/:id
 *
 * Returns center details with medical staff list and counts
 */
router.get('/:id', vaccinationCenterController.getVaccinationCenterById);

/**
 * Update vaccination center
 * PUT /api/v1/admin/vaccination-centers/:id
 *
 * Request Body: (all fields optional)
 * {
 *   "name": "Updated Name",
 *   "address": "New Address",
 *   "phone": "9876543210",
 *   "status": "INACTIVE",
 *   ...
 * }
 */
router.put('/:id', vaccinationCenterController.updateVaccinationCenter);

/**
 * Delete vaccination center (soft delete - marks as inactive)
 * DELETE /api/v1/admin/vaccination-centers/:id
 *
 * Note: Cannot delete if center has active appointments
 */
router.delete('/:id', vaccinationCenterController.deleteVaccinationCenter);

/**
 * Toggle vaccination center active/inactive status
 * PATCH /api/v1/admin/vaccination-centers/:id/toggle-status
 *
 * Toggles between active and inactive
 */
router.patch('/:id/toggle-status', vaccinationCenterController.toggleActiveStatus);

/**
 * Get vaccination center statistics
 * GET /api/v1/admin/vaccination-centers/:id/stats
 *
 * Returns:
 * - Total/completed/scheduled appointments
 * - Total/active medical staff
 * - Vaccine inventory count
 */
router.get('/:id/stats', vaccinationCenterController.getVaccinationCenterStats);

export default router;
