import { Router } from 'express';
import { VaccineScheduleController } from '../controllers/vaccine-schedule.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';
import {
  createVaccineScheduleSchema,
  updateVaccineScheduleSchema,
} from '../utils/validators';

const router = Router();
const vaccineScheduleController = new VaccineScheduleController();

/**
 * Get all vaccine schedules (grouped by age)
 * GET /api/v1/vaccine-schedules
 *
 * Returns all schedules organized by age groups
 * Used by: Admin panel, Mobile app (vaccination timeline)
 */
router.get('/', authenticate, vaccineScheduleController.getAllSchedules);

/**
 * Get schedules for a specific vaccine
 * GET /api/v1/vaccine-schedules/vaccine/:vaccineId
 *
 * Returns all doses/schedules for a particular vaccine
 * Used by: Admin panel (View vaccine details)
 */
router.get(
  '/vaccine/:vaccineId',
  authenticate,
  vaccineScheduleController.getSchedulesByVaccine
);

/**
 * Get schedule by ID
 * GET /api/v1/vaccine-schedules/:id
 */
router.get('/:id', authenticate, vaccineScheduleController.getScheduleById);

/**
 * Admin Only Routes
 */

/**
 * Create vaccine schedule
 * POST /api/v1/vaccine-schedules
 *
 * Request Body:
 * {
 *   "vaccineId": "uuid",
 *   "vaccineName": "Hepatitis B",
 *   "ageGroupLabel": "6 Weeks",
 *   "ageInDays": 42,
 *   "ageInMonths": 1.5,
 *   "doseNumber": 2,
 *   "displayOrder": 1,
 *   "isRequired": true,
 *   "description": "Second dose at 6 weeks"
 * }
 *
 * Used by: Admin panel - Add vaccine schedule
 */
router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validateRequest(createVaccineScheduleSchema),
  vaccineScheduleController.createSchedule
);

/**
 * Update vaccine schedule
 * PUT /api/v1/vaccine-schedules/:id
 *
 * Request Body: (All fields optional)
 * {
 *   "ageInDays": 45,
 *   "isRequired": false
 * }
 *
 * Used by: Admin panel - Edit vaccine schedule
 */
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateRequest(updateVaccineScheduleSchema),
  vaccineScheduleController.updateSchedule
);

/**
 * Delete vaccine schedule
 * DELETE /api/v1/vaccine-schedules/:id
 *
 * Used by: Admin panel - Delete schedule
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  vaccineScheduleController.deleteSchedule
);

export default router;
