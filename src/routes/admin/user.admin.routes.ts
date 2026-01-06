import { Router } from 'express';
import { UserAdminController } from '../../controllers/admin/user.admin.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';
import { createAdminUserSchema, updateAdminUserSchema } from '../../utils/validators';

const router = Router();
const userAdminController = new UserAdminController();

// All routes require authentication and admin authorization
router.use(authenticate);
router.use(authorize(['ADMIN']));

// GET /api/v1/admin/users/stats - Get user statistics (must be before /:id)
// router.get('/stats', userAdminController.getUserStats);

// GET /api/v1/admin/users - Get all users
router.get('/', userAdminController.getAllUsers);

// GET /api/v1/admin/users/:id - Get user by ID
router.get('/:id', userAdminController.getUserById);

// POST /api/v1/admin/users - Create new user
router.post('/', validateRequest(createAdminUserSchema), userAdminController.createUser);

// PUT /api/v1/admin/users/:id - Update user
router.put('/:id', validateRequest(updateAdminUserSchema), userAdminController.updateUser);

// DELETE /api/v1/admin/users/:id - Delete user
router.delete('/:id', userAdminController.deleteUser);

export default router;
