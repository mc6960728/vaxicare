import { Router } from 'express';
import { ChildAdminController } from '../../controllers/admin/child.admin.controller';
import { VaccinationPlanController } from '../../controllers/vaccination-plan.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { addChildSchema, updateChildSchema } from '../../utils/validators';
import { z } from 'zod';

const router = Router();
const childAdminController = new ChildAdminController();
const vaccinationPlanController = new VaccinationPlanController();

// Admin add child schema (extends addChildSchema with required parentId)
const adminAddChildSchema = addChildSchema.extend({
  parentId: z.string().uuid('Invalid parent ID'),
});

/**
 * Admin: Add a new child for a parent
 * POST /api/v1/admin/children
 *
 * Request Body:
 * {
 *   "parentId": "uuid (required)",
 *   "name": "string (optional for newborns)",
 *   "dateOfBirth": "string (DD/MM/YYYY or YYYY-MM-DD, required)",
 *   "gender": "MALE | FEMALE | OTHER (required)",
 *   "weightKg": "number (optional)",
 *   "heightCm": "number (optional)",
 *   "bloodGroup": "A_POSITIVE | A_NEGATIVE | B_POSITIVE | B_NEGATIVE | AB_POSITIVE | AB_NEGATIVE | O_POSITIVE | O_NEGATIVE (optional)",
 *   "pediatrician": "string (optional)",
 *   "allergies": ["Peanuts", "Dust"] (array of strings, optional)",
 *   "medicalConditions": ["Asthma", "Diabetes"] (array of strings, optional)",
 *   "specialNotes": "string (optional)",
 *   "profilePhoto": "string URL (optional)"
 * }
 */
router.post('/', validateRequest(adminAddChildSchema), childAdminController.addChild);

/**
 * Admin: Get all children with filters and pagination
 * GET /api/v1/admin/children?parentId=xxx&search=xxx&page=1&limit=10
 *
 * Query Parameters:
 * - parentId: Filter by parent ID (optional)
 * - search: Search by child name, parent name, or phone (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
router.get('/', childAdminController.getAllChildren);

/**
 * Admin: Get child by ID
 * GET /api/v1/admin/children/:id
 */
router.get('/:id', childAdminController.getChildById);

/**
 * Admin: Update child information
 * PUT /api/v1/admin/children/:id
 *
 * Request Body: (all fields optional)
 * {
 *   "name": "string",
 *   "dateOfBirth": "string (DD/MM/YYYY or YYYY-MM-DD)",
 *   "gender": "MALE | FEMALE | OTHER",
 *   "weightKg": "number",
 *   "heightCm": "number",
 *   "bloodGroup": "A_POSITIVE | A_NEGATIVE | etc.",
 *   "pediatrician": "string",
 *   "allergies": ["Peanuts", "Dust"],
 *   "medicalConditions": ["Asthma", "Diabetes"],
 *   "specialNotes": "string",
 *   "profilePhoto": "string URL"
 * }
 */
router.put('/:id', validateRequest(updateChildSchema), childAdminController.updateChild);

/**
 * Admin: Delete child (soft delete)
 * DELETE /api/v1/admin/children/:id
 */
router.delete('/:id', childAdminController.deleteChild);

/**
 * Admin: Get child's vaccination history with status
 * GET /api/v1/admin/children/:id/vaccination-history?status=pending|upcoming|completed
 *
 * Query Parameters:
 * - status: Optional. If not provided, returns all data (pending, upcoming, completed)
 * - status=pending: Returns only pendingVaccines array
 * - status=upcoming: Returns only upcomingVaccines array (next 3-5 upcoming vaccines with dates)
 * - status=completed: Returns only completedVaccines array
 *
 * Same response format as parent API for consistency
 */
router.get('/:id/vaccination-history', vaccinationPlanController.getVaccinationHistory);

export default router;
