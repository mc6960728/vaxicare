import { Router } from 'express';
import adminAuthRoutes from './admin.auth.routes';
import appUserAuthRoutes from './appuser.auth.routes';
import districtRoutes from './district.routes';
import talukaRoutes from './taluka.routes';
import villageRoutes from './village.routes';
import parentAdminRoutes from './admin/parent.admin.routes';
import medicalStaffAdminRoutes from './admin/medicalstaff.admin.routes';
import vaccinationCenterAdminRoutes from './admin/vaccinationcenter.admin.routes';
import vaccineInventoryAdminRoutes from './admin/vaccineinventory.admin.routes';
import supplierAdminRoutes from './admin/supplier.admin.routes';
import userAdminRoutes from './admin/user.admin.routes';
import childAdminRoutes from './admin/child.admin.routes';
import uploadRoutes from './upload.routes';
import childRoutes from './child.routes';
import commonRoutes from './common.routes';
import vaccineRoutes from './vaccine.routes';
import vaccineScheduleRoutes from './vaccine-schedule.routes';
import dropdownRoutes from './dropdown.routes';
import appointmentRoutes from './appointment.routes';
import medicalStaffRoutes from './medicalstaff.routes';
import insightsRoutes from './insights.routes';
import dashboardRoutes from './dashboard.routes';
import vaccineTransferRoutes from './vaccineTransfer.routes'
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// Public routes - Authentication
router.use('/auth/admin', adminAuthRoutes);
router.use('/auth/app', appUserAuthRoutes);

// Public/Common routes - Dropdowns (accessible to all)
router.use('/dropdowns', dropdownRoutes);

// Protected routes - File Upload (All authenticated users)
router.use('/upload', uploadRoutes);

// Protected routes - Vaccine Management (All authenticated users can view, Admin can modify)
router.use('/vaccines', vaccineRoutes);
router.use('/vaccine-schedules', vaccineScheduleRoutes);

// Protected routes - Location management (Admin only)
router.use('/districts', authenticate, authorize(['ADMIN']), districtRoutes);
router.use('/talukas', authenticate, authorize(['ADMIN']), talukaRoutes);
router.use('/villages', authenticate, authorize(['ADMIN']), villageRoutes);

// Protected routes - Admin User Management (Admin only)
router.use('/admin/vaccination-centers', authenticate, authorize(['ADMIN']), vaccinationCenterAdminRoutes);
router.use('/admin/medical-staff', authenticate, authorize(['ADMIN']), medicalStaffAdminRoutes);
router.use('/admin/vaccine-inventory', authenticate, authorize(['ADMIN']), vaccineInventoryAdminRoutes);
router.use('/admin/suppliers', authenticate, authorize(['ADMIN']), supplierAdminRoutes);

// Admin Parent Management
router.use('/admin/parents', authenticate, authorize(['ADMIN']), parentAdminRoutes);

// Admin Child Management
router.use('/admin/children', authenticate, authorize(['ADMIN']), childAdminRoutes);

// Admin User Management (Admin users CRUD)
router.use('/admin/users', userAdminRoutes);


// Protected routes - Parent Dashboard (Parents only)
// Combined API for dashboard screen with all required data
router.use('/parent/dashboard', dashboardRoutes);

// Protected routes - Child Management (Parents only)
// Includes: CRUD, vaccination plan, upcoming vaccines, vaccination records
router.use('/children', authenticate, authorize(['PARENT']), childRoutes);

// Protected routes - Appointment Management (Parents only)
// Includes: Book, view, cancel, reschedule appointments
router.use('/appointments', authenticate, authorize(['PARENT', 'MEDICAL_STAFF', 'ADMIN']), appointmentRoutes);

// Protected routes - Medical Staff App (Medical Staff only)
// Includes: Today's visits, appointment details, check-in, complete vaccination
router.use('/medical-staff', authenticate, authorize(['MEDICAL_STAFF']), medicalStaffRoutes);

// Protected routes - Common Resources (All authenticated users)
// Includes: Knowledge base articles and other shared resources
router.use('/common', commonRoutes);

// Protected routes - Insights/Analytics (All authenticated users)
// Includes: Vaccination coverage stats, health ratio, demographic analysis
router.use('/insights', authenticate, insightsRoutes);
router.use('/vaccine-transfers', authenticate, vaccineTransferRoutes);

export default router;
