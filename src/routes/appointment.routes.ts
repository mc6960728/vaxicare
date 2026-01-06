import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';

const router = Router();
const appointmentController = new AppointmentController();

/**
 * Get appointment statistics (Admin only)
 * GET /api/v1/appointments/stats?clinicId=xxx
 */
router.get('/stats', appointmentController.getAppointmentStats);

/**
 * Get available time slots for 30 days from current date
 * GET /api/v1/appointments/time-slots?clinicId=xxx
 *
 * Query Parameters:
 * - clinicId (required): Vaccination Center ID
 * - vaccineId (optional): Filter slots by vaccine
 *
 * Returns time slots for each day in the 30-day range with availability status
 * Response includes: dateRange, slotInfo, and dates array with slots per day
 */
router.get('/time-slots', appointmentController.getAvailableTimeSlots);

/**
 * Book an appointment
 * POST /api/v1/appointments
 *
 * Request Body:
 * {
 *   "childId": "uuid",
 *   "clinicId": "uuid",
 *   "vaccineId": "uuid",
 *   "scheduledDate": "2025-07-15",
 *   "scheduledTime": "09:00",
 *   "notes": "optional notes"
 * }
 */
router.post('/', appointmentController.bookAppointment);

/**
 * Get all appointments for logged-in user (Parent or Medical Staff)
 * GET /api/v1/appointments
 *
 * Query Parameters (all optional):
 * - status: Filter by status
 *   - "pending" - Returns SCHEDULED, CONFIRMED, CHECK_IN, START_VISIT
 *   - "completed" - Returns COMPLETED
 *   - "upcoming" - Returns SCHEDULED only
 *   - Or direct: SCHEDULED | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW | RESCHEDULED
 * - childId: Filter by specific child (Parent only)
 * - fromDate: Start date (YYYY-MM-DD) - defaults to today
 * - toDate: End date (YYYY-MM-DD) - defaults to today + 30 days
 *
 * Response differs by user type:
 * - PARENT: { count, appointments } - Original format
 * - MEDICAL_STAFF: { dateRange, statistics, appointments }
 *
 * Examples:
 * - GET /appointments                               → Next 30 days appointments
 * - GET /appointments?status=pending                → Pending appointments
 * - GET /appointments?status=completed              → Completed appointments
 * - GET /appointments?childId=xxx                   → Specific child's appointments (Parent)
 */
router.get('/', appointmentController.getParentAppointments);

/**
 * Get appointment by ID
 * GET /api/v1/appointments/:id
 *
 * Returns detailed appointment information for confirmation screen
 */
router.get('/:id', appointmentController.getAppointmentById);

/**
 * Cancel an appointment
 * DELETE /api/v1/appointments/:id
 *
 * Marks appointment as CANCELLED
 */
router.delete('/:id', appointmentController.cancelAppointment);

/**
 * Reschedule an appointment
 * PUT /api/v1/appointments/:id/reschedule
 *
 * Request Body:
 * {
 *   "scheduledDate": "2025-07-20",
 *   "scheduledTime": "10:00"
 * }
 */
router.put('/:id/reschedule', appointmentController.rescheduleAppointment);

/**
 * Mark appointment as complete (Parent acknowledges completion)
 * POST /api/v1/appointments/:id/mark-complete
 *
 * Precondition: Medical staff must have already completed the appointment
 * (appointment status must be COMPLETED)
 *
 * Sets isParentAcknowledged = true and parentAcknowledgedAt = current timestamp
 */
router.post('/:id/mark-complete', appointmentController.markAsComplete);

/**
 * Update appointment (Admin only)
 * PUT /api/v1/appointments/:id
 *
 * Request Body (all fields optional):
 * {
 *   "childId": "uuid",
 *   "parentId": "uuid",
 *   "clinicId": "uuid",
 *   "vaccineId": "uuid",
 *   "scheduledDate": "2025-07-15",
 *   "scheduledTime": "09:00",
 *   "medicalStaffId": "uuid",
 *   "status": "SCHEDULED|CONFIRMED|COMPLETED|CANCELLED|NO_SHOW",
 *   "notes": "optional notes"
 * }
 */
router.put('/:id', appointmentController.updateAppointment);

/**
 * Delete appointment (Admin only - hard delete)
 * DELETE /api/v1/appointments/:id/delete
 *
 * Note: This permanently deletes the appointment
 * Cannot delete appointments with vaccination records
 */
router.delete('/:id/delete', appointmentController.deleteAppointment);

export default router;
