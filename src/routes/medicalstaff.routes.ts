import { Router } from 'express';
import { MedicalStaffController } from '../controllers/medicalstaff.controller';
import { validateRequest } from '../middleware/validateRequest';
import { updateAppointmentStatusSchema } from '../utils/validators';

const router = Router();
const medicalStaffController = new MedicalStaffController();

/**
 * Medical Staff App Routes
 * Base: /api/v1/medical-staff
 * All routes require Medical Staff authentication
 */

/**
 * Get dashboard data for medical staff home screen
 * GET /api/v1/medical-staff/dashboard
 *
 * Returns:
 * - staff: { id, fullName, firstName, profilePhoto, role, specialization }
 * - vaccinationCenter: { id, name }
 * - todayOverview: { totalAppointments, vaccinesGiven, remaining }
 * - upcomingAppointments: Array of upcoming appointments (max 5)
 * - quickActions: Array of quick action items
 *
 * Used by: Medical Staff App - Home/Dashboard screen
 */
router.get('/dashboard', medicalStaffController.getDashboard);

/**
 * Get appointments for logged-in medical staff
 * GET /api/v1/medical-staff/appointments
 *
 * Query Parameters:
 * - date (optional): Specific date in YYYY-MM-DD format (defaults to today)
 * - status (optional): Filter by status - accepts:
 *   - "pending" - Returns SCHEDULED, CONFIRMED, CHECK_IN, START_VISIT appointments
 *   - "completed" - Returns COMPLETED appointments
 *   - "upcoming" - Returns SCHEDULED appointments only 
 *   - Or direct status: SCHEDULED | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW | RESCHEDULED | START_VISIT | CHECK_IN | CHECK_OUT
 *
 * Returns:
 * - List of appointments for selected date at staff's vaccination center
 * - Statistics (total, completed, pending)
 * - Each appointment includes: child info, vaccine, time, location, status
 *
 * Used by: Medical Staff App - Appointments list screen with calendar
 */
router.get('/appointments', medicalStaffController.getTodayVisits);

/**
 * Get appointment details by ID
 * GET /api/v1/medical-staff/appointments/:id
 *
 * Returns:
 * - Child info (name, age, photo, allergies, medical conditions)
 * - Vaccine info (name, description, dosage, side effects)
 * - Doctor/Pediatric info
 * - Date and time slot
 * - Location (Clinic address)
 * - Parent contact information
 *
 * Used by: Medical Staff App - Appointment Details screen
 */
router.get('/appointments/:id', medicalStaffController.getAppointmentDetails);

/**
 * Start visit
 * POST /api/v1/medical-staff/appointments/:id/start-visit
 *
 * Actions:
 * - Marks appointment as CONFIRMED (visit started)
 * - Assigns current medical staff to appointment
 *
 * Used by: Medical Staff App - "Start Visit" button
 */
// router.post('/appointments/:id/start-visit', medicalStaffController.startVisit);

/**
 * Check-in appointment (deprecated - use start-visit instead)
 * POST /api/v1/medical-staff/appointments/:id/check-in
 */
// router.post('/appointments/:id/check-in', medicalStaffController.checkInAppointment);

/**
 * Complete vaccination
 * POST /api/v1/medical-staff/appointments/:id/complete
 *
 * Request Body:
 * {
 *   "batchNumber": "BATCH-2025-001" (optional),
 *   "reactions": "No adverse reactions" (optional),
 *   "notes": "Vaccination completed successfully" (optional)
 * }
 *
 * Actions:
 * - Marks appointment as COMPLETED
 * - Creates vaccination record
 * - Associates medical staff with vaccination
 * - Records batch number, reactions, and notes
 *
 * Used by: Medical Staff App - Complete vaccination flow
 */
// router.post('/appointments/:id/complete', medicalStaffController.completeVaccination);
/**
 * Update appointment status (unified endpoint)
 * POST /api/v1/medical-staff/appointments/:id/update-status
 *
 * Request Body:
 * {
 *   "status": "start_visit" | "check_in" | "check_out",
 *   "batchNumber": "BATCH-2025-001" (optional, required for check_out),
 *   "reactions": "No adverse reactions" (optional, for check_out),
 *   "notes": "Additional notes" (optional)
 * }
 *
 * Actions based on status:
 * - start_visit: Marks appointment as CONFIRMED (visit started), assigns medical staff
 * - check_in: Checks in the patient (deprecated flow, kept for backward compatibility)
 * - check_out: Marks appointment as COMPLETED, creates vaccination record
 *
 * Used by: Medical Staff App - Unified appointment status management
 */
router.post(
  '/appointments/:id/update-status',
  validateRequest(updateAppointmentStatusSchema),
  medicalStaffController.updateAppointmentStatus
);
/**
 * Cancel appointment
 * POST /api/v1/medical-staff/appointments/:id/cancel
 *
 * Request Body:
 * {
 *   "reason": "Patient not available" (required),
 *   "notes": "Additional notes" (optional)
 * }
 *
 * Actions:
 * - Marks appointment as CANCELLED
 * - Records cancellation reason
 * - Associates medical staff who cancelled
 *
 * Validations:
 * - Cannot cancel already completed appointments
 * - Cannot cancel already cancelled appointments
 * - Reason is required
 *
 * Used by: Medical Staff App - Cancel appointment button
 */
router.post('/appointments/:id/cancel', medicalStaffController.cancelAppointment);

/**
 * Get vaccination records (completed visits history)
 * GET /api/v1/medical-staff/records
 *
 * Query Parameters:
 * - search (optional): Search by child name or vaccine name
 *
 * Returns:
 * - totalRecords: Total count of records
 * - records: Array of completed vaccinations with:
 *   - child info (name, age, ageLabel, profilePhoto)
 *   - vaccine info (name, doseLabel, ageGroupLabel)
 *   - dueDateTime, scheduledDate, scheduledTime
 *   - location
 *   - status, completedAt
 *   - vaccinationRecord details
 *
 * Used by: Medical Staff App - Records screen
 */
router.get('/records', medicalStaffController.getRecords);

/**
 * Get inventory for medical staff's vaccination center
 * GET /api/v1/medical-staff/inventory
 *
 * Query Parameters:
 * - search (optional): Search by vaccine name or batch number
 *
 * Returns:
 * - vaccinationCenter: { id, name }
 * - statistics: { totalItems, inStock, lowStock, outOfStock, expired }
 * - inventory: Array with vaccine info, currentStock, batchNumber, expiryDate, status
 *
 * Used by: Medical Staff App - Inventory screen
 */
router.get('/inventory', medicalStaffController.getInventory);

/**
 * Request new stock
 * POST /api/v1/medical-staff/inventory/request
 *
 * Request Body:
 * {
 *   "vaccineName": "Hepatitis B",
 *   "vaccineType": "Injectable" (optional),
 *   "quantity": 20,
 *   "preferredDeliveryDate": "2025-01-15" (optional)
 * }
 *
 * Actions:
 * - Creates stock request with PENDING status
 * - Admin can approve/reject from admin panel
 *
 * Used by: Medical Staff App - Request New Stock screen
 */
router.post('/inventory/request', medicalStaffController.requestStock);

/**
 * Get stock requests history
 * GET /api/v1/medical-staff/inventory/requests
 *
 * Returns:
 * - totalRequests: Total count
 * - requests: Array of stock requests with status, dates, admin notes
 *
 * Used by: Medical Staff App - View submitted stock requests
 */
router.get('/inventory/requests', medicalStaffController.getStockRequests);

export default router;
