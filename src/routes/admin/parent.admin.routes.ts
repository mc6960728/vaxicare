import { Router } from 'express';
import { ParentAdminController } from '../../controllers/admin/parent.admin.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { createParentSchema, updateParentSchema } from '../../utils/validators';

const router = Router();
const parentAdminController = new ParentAdminController();

// All routes are admin-protected (authenticate and authorize middleware applied in main routes file)
router.get('/stats', parentAdminController.getParentStats);
router.post('/', validateRequest(createParentSchema), parentAdminController.createParent);
router.get('/', parentAdminController.getAllParents);
router.get('/:id', parentAdminController.getParentById);
router.put('/:id', validateRequest(updateParentSchema), parentAdminController.updateParent);
router.delete('/:id', parentAdminController.deleteParent);

/**
 * Toggle parent status (activate/deactivate)
 * PATCH /api/v1/admin/parents/:id/status
 *
 * Request Body:
 * {
 *   "action": "activate" | "deactivate"
 * }
 *
 * When deactivating:
 * - Parent status changes to INACTIVE
 * - All pending appointments are cancelled
 * - Parent cannot login or perform any actions
 *
 * When activating:
 * - Parent status changes to ACTIVE
 * - Parent can login and perform actions again
 */
router.patch('/:id/status', parentAdminController.toggleParentStatus);

export default router;
