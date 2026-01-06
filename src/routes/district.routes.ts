import { Router } from 'express';
import { DistrictController } from '../controllers/district.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createDistrictSchema, updateDistrictSchema } from '../utils/validators';

const router = Router();
const districtController = new DistrictController();

// All routes are admin-protected (add authenticate and authorize middleware in main routes file)
router.post('/', validateRequest(createDistrictSchema), districtController.createDistrict);
router.get('/', districtController.getAllDistricts);
router.get('/:id', districtController.getDistrictById);
router.put('/:id', validateRequest(updateDistrictSchema), districtController.updateDistrict);
router.delete('/:id', districtController.deleteDistrict);

export default router;
