import { Router } from 'express';
import { TalukaController } from '../controllers/taluka.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createTalukaSchema, updateTalukaSchema } from '../utils/validators';

const router = Router();
const talukaController = new TalukaController();

// All routes are admin-protected (add authenticate and authorize middleware in main routes file)
router.post('/', validateRequest(createTalukaSchema), talukaController.createTaluka);
router.get('/', talukaController.getAllTalukas);
router.get('/:id', talukaController.getTalukaById);
router.put('/:id', validateRequest(updateTalukaSchema), talukaController.updateTaluka);
router.delete('/:id', talukaController.deleteTaluka);

export default router;
