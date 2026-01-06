import { Router } from 'express';
import { InsightsController } from '../controllers/insights.controller';

const router = Router();
const insightsController = new InsightsController();

/**
 * Get vaccination insights/analytics
 * GET /api/v1/insights
 *  Good Health Ratio Page
 * Returns:
 * - healthRatio: { protectedPercent, atRiskPercent, description }
 * - globalCoverage: { fullyVaccinated, partiallyVaccinated, unvaccinated } (for pie chart)
 * - vaccineWiseCoverage: [{ vaccineId, vaccineName, coveragePercent }] (for bar chart)
 * - demographicsCoverage: { boys, girls } (for bar chart)
 *
 * Used by: Mobile app - Insights screen
 *  | API                                   | Screen                                    |
  |---------------------------------------|-------------------------------------------|
  | GET /insights                         | Insights Page (Image 2)                   |
  | GET /children                         | Dashboard - Children list + Summary cards |
  | GET /appointments                     | Dashboard - Booked Appointments           |
  | GET /children/:id/vaccination-history | Dashboard - Remaining Vaccines            |
  | GET /common/knowledge-base/articles   | Dashboard - Knowledge Base                |
 */
router.get('/', insightsController.getVaccinationInsights);

/**
 * Get insights for a specific vaccination center
 * GET /api/v1/insights/clinic/:clinicId
 *
 * Returns clinic-specific vaccination statistics
 * Used by: Admin panel - Clinic dashboard
 * Not in use this API
 */
router.get('/clinic/:clinicId', insightsController.getClinicInsights);

export default router;
