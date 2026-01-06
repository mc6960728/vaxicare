import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
const dashboardController = new DashboardController();

/**
 * Get parent dashboard data
 * GET /api/v1/parent/dashboard
 *
 * Query params:
 *   - childId (optional): Select specific child to show data for
 *
 * Returns combined data for dashboard screen:
 *   - children: List of all children with age
 *   - selectedChild: Selected child with vaccination summary (completed, nextDue, pending)
 *   - bookedAppointments: Upcoming appointments with vaccine, center, doctor info
 *   - remainingVaccines: Pending vaccines with due dates and status
 *   - healthRatio: Global health ratio (protected vs at-risk percentage)
 *   - knowledgeBase: Educational articles
 *
 * Used by: Parent App - Dashboard/Home screen
 */
router.get(
  '/',
  authenticate,
  authorize(['PARENT']),
  dashboardController.getParentDashboard
);

export default router;
