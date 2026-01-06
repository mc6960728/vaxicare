import { Router } from 'express';
import { AppUserAuthController } from '../controllers/appuser.auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  sendOtpSchema,
  loginWithPhoneSchema,
  registerParentSchema,
  registerMedicalStaffSchema,
  updateParentProfileSchema,
  updateMedicalStaffProfileSchema,
} from '../utils/validators';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';


const router = Router();
const appUserAuthController = new AppUserAuthController();


// ============================Parent Registration======================
// Step 1: Submit registration data, create user, and send OTP
router.post('/register/parent', validateRequest(registerParentSchema), appUserAuthController.registerParent);

// ===================Medical Staff Registration===========================
// Step 1: Submit registration data, create user, and send OTP
router.post('/register/medical-staff', validateRequest(registerMedicalStaffSchema), appUserAuthController.registerMedicalStaff);


/**
 * Send OTP to phone (first time - for login)
 * POST /api/v1/auth/app/send-otp
 *
 * Validates: User must exist, no existing unexpired OTP
 */
router.post('/send-otp', validateRequest(sendOtpSchema), appUserAuthController.sendOtp);

/**
 * Resend OTP to phone
 * POST /api/v1/auth/app/resend-otp
 *
 * Validates:
 * - User must exist
 * - Must have called send-otp first
 * - 1 minute cooldown between resends
 * - Max 5 resend attempts per hour
 */
router.post('/resend-otp', validateRequest(sendOtpSchema), appUserAuthController.resendOtp);

// Login with phone and OTP (verifies OTP and logs in user)
router.post('/login', validateRequest(loginWithPhoneSchema), appUserAuthController.loginWithPhone);

router.post('/forgot-password', validateRequest(forgotPasswordSchema), appUserAuthController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), appUserAuthController.resetPassword);
router.post('/logout', authenticate, appUserAuthController.logout);

// ==================== Profile Management ====================

/**
 * Get Profile (Unified endpoint for both Parent and Medical Staff)
 * GET /api/v1/auth/app/profile
 *
 * Automatically returns profile based on authenticated user's type
 * - Parent: Returns parent-specific fields (fullName, email, phone, relationWithChild, etc.)
 * - Medical Staff: Returns medical staff-specific fields (fullName, email, phone, role, specialization, etc.)
 */
router.get('/profile', authenticate, authorize(['PARENT', 'MEDICAL_STAFF']), appUserAuthController.getProfile);

/**
 * Update Profile (Unified endpoint for both Parent and Medical Staff)
 * POST /api/v1/auth/app/profile
 *
 * Request Body (Parent):
 * {
 *   "fullName": "string (optional)",
 *   "dialCode": "string (optional)",
 *   "phone": "string (optional)",
 *   "email": "string (optional)",
 *   "relationWithChild": "Father | Mother | Guardian (optional)",
 *   "profilePhoto": "string URL (optional)"
 * }
 *
 * Request Body (Medical Staff):
 * {
 *   "fullName": "string (optional)",
 *   "dialCode": "string (optional)",
 *   "phone": "string (optional)",
 *   "email": "string (optional)",
 *   "licenseNumber": "string (optional)",
 *   "specialization": "string (optional)",
 *   "experienceYears": "number (optional)",
 *   "profilePhoto": "string URL (optional)"
 * }
 *
 * Automatically validates and updates based on authenticated user's type
 */
router.post('/profile', authenticate, authorize(['PARENT', 'MEDICAL_STAFF']), (req, res, next) => {
  // Dynamic validation based on user type
  const userType = (req as any).user?.userType;
  const schema = userType === 'PARENT' ? updateParentProfileSchema : updateMedicalStaffProfileSchema;
  validateRequest(schema)(req, res, next);
}, appUserAuthController.updateProfile);

export default router;
