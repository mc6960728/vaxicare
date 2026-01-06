import { Router } from 'express';
import { ChildController } from '../controllers/child.controller';
import { VaccinationPlanController } from '../controllers/vaccination-plan.controller';
import { validateRequest } from '../middleware/validateRequest';
import { addChildSchema, updateChildSchema } from '../utils/validators';

const router = Router();
const childController = new ChildController();
const vaccinationPlanController = new VaccinationPlanController();

/**
 * Add a new child
 * POST /api/v1/children
 *
 * Request Body:
 * {
 *   "name": "string (optional for newborns)",
 *   "dateOfBirth": "string (ISO date, required)",
 *   "gender": "MALE | FEMALE | OTHER (required)",
 *   "weightKg": "number (optional)",
 *   "heightCm": "number (optional)",
 *   "bloodGroup": "A_POSITIVE | A_NEGATIVE | B_POSITIVE | B_NEGATIVE | AB_POSITIVE | AB_NEGATIVE | O_POSITIVE | O_NEGATIVE (optional)",
 *   "allergies": ["Peanuts", "Dust"] (array of strings, optional)",
 *   "medicalConditions": ["Asthma", "Diabetes"] (array of strings, optional)",
 *   "specialNotes": "string (optional)",
 *   "profilePhoto": "string URL (optional)"
 * }
 */
router.post('/', validateRequest(addChildSchema), childController.addChild);

/**
 * Get all children for logged-in parent
 * GET /api/v1/children
 */
router.get('/', childController.getChildren);

/**
 * Get child by ID
 * GET /api/v1/children/:id
 */
router.get('/:id', childController.getChildById);

/**
 * Update child information
 * POST /api/v1/children/:id
 *
 * Request Body: (all fields optional)
 * {
 *   "name": "string",
 *   "dateOfBirth": "string (ISO date)",
 *   "gender": "MALE | FEMALE | OTHER",
 *   "weightKg": "number",
 *   "heightCm": "number",
 *   "bloodGroup": "A_POSITIVE | A_NEGATIVE | etc.",
 *   "allergies": ["Peanuts", "Dust"],
 *   "medicalConditions": ["Asthma", "Diabetes"],
 *   "specialNotes": "string",
 *   "profilePhoto": "string URL"
 * }
 */
router.post('/:id', validateRequest(updateChildSchema), childController.updateChild);

/**
 * Delete child (soft delete)
 * DELETE /api/v1/children/:id
 */
router.delete('/:id', childController.deleteChild);

/**
 * Get child's complete vaccination plan (for Vaccination Plan Details page)
 * GET /api/v1/children/:id/vaccination-plan
 *
 * Response includes:
 * - Child information (name, age, DOB, photo)
 * - Vaccination schedule grouped by age (with expand/collapse)
 * - Completed vaccination records
 * - Upcoming appointments
 * - Statistics (completion percentage, pending vaccines)
 *
 * Use this for the full vaccination plan page with age groups
 */
router.get('/:id/vaccination-plan', vaccinationPlanController.getChildVaccinationPlan);

/**
 * Get vaccination history with status (for Child Profile page)
 * GET /api/v1/children/:id/vaccination-history?status=pending|upcoming|completed
 *
 * Query Parameters:
 * - status: 'pending' (default) | 'upcoming' | 'completed'
 *
 * Response includes:
 * - Simple list of vaccines (NOT grouped by age)
 * - Statistics with status counts
 * - Easy to display in status view
 *
 * Use this for the child profile page with status
 */
router.get('/:id/vaccination-history', vaccinationPlanController.getVaccinationHistory);

/**
 * ============================================================================
 * PARENT API - Mark Multiple Vaccinations Complete
 * ============================================================================
 * POST /api/v1/children/vaccinations/mark-complete
 *
 * 🎯 WHO CAN USE: PARENTS ONLY
 *
 * 📋 PURPOSE: Mark birth vaccines (0-30 days) as complete during registration
 *
 * Request Body:
 * {
 *   "childId": "uuid",
 *   "scheduleIds": ["uuid1", "uuid2", "uuid3"]
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "message": "3 vaccinations marked as complete",
 *   "data": {
 *     "completed": [...],
 *     "failed": [...]
 *   }
 * }
 */
router.post(
  '/vaccinations/mark-complete',
  childController.markMultipleVaccinationsComplete
);

export default router;
