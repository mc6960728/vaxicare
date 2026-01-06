import { Router } from 'express';
import { MedicalStaffAdminController } from '../../controllers/admin/medicalstaff.admin.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { createMedicalStaffSchema, updateMedicalStaffSchema } from '../../utils/validators';

const router = Router();
const medicalStaffAdminController = new MedicalStaffAdminController();

// All routes are admin-protected (authenticate and authorize middleware applied in main routes file)
router.post('/', validateRequest(createMedicalStaffSchema), medicalStaffAdminController.createMedicalStaff);
router.get('/', medicalStaffAdminController.getAllMedicalStaff);
router.get('/:id', medicalStaffAdminController.getMedicalStaffById);
router.put('/:id', validateRequest(updateMedicalStaffSchema), medicalStaffAdminController.updateMedicalStaff);
router.delete('/:id', medicalStaffAdminController.deleteMedicalStaff);

export default router;
