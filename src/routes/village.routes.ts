import { Router } from 'express';
import { VillageController } from '../controllers/village.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createVillageSchema, updateVillageSchema } from '../utils/validators';

const router = Router();
const villageController = new VillageController();

// All routes are admin-protected (add authenticate and authorize middleware in main routes file)
router.post('/', validateRequest(createVillageSchema), villageController.createVillage);
router.get('/', villageController.getAllVillages);
router.get('/:id', villageController.getVillageById);
router.put('/:id', validateRequest(updateVillageSchema), villageController.updateVillage);
router.delete('/:id', villageController.deleteVillage);

export default router;
