import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';
import { registerSchema } from '../utils/validators';

const router = Router();
const userController = new UserController();

router.post('/register', validateRequest(registerSchema), userController.register);

// Protected routes - require authentication
router.use(authenticate);


router.get('/profile', userController.getProfile);
router.post('/profile', userController.updateProfile);

// Admin only routes
router.get('/', authorize(['ADMIN']), userController.getAllUsers);
router.get('/:id', authorize(['ADMIN']), userController.getUserById);
router.delete('/:id', authorize(['ADMIN']), userController.deleteUser);

export default router;
