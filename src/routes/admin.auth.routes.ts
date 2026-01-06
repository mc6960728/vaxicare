import { Router } from 'express';
import { AdminAuthController } from '../controllers/admin.auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { adminSignupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validators';
import { authenticate } from '../middleware/auth';

const router = Router();
const adminAuthController = new AdminAuthController();

/**
 * Admin Signup
 * POST /api/v1/auth/admin/signup
 *
 * Request Body:
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john@example.com",
 *   "organization": "Vaxicare",
 *   "password": "password123",
 *   "confirmPassword": "password123"
 * }
 */
router.post('/signup', validateRequest(adminSignupSchema), adminAuthController.signup);

router.post('/login', validateRequest(loginSchema), adminAuthController.login);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), adminAuthController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), adminAuthController.resetPassword);
router.post('/logout', authenticate, adminAuthController.logout);

export default router;
