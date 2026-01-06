import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validators';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/logout', authenticate, authController.logout);

export default router;
