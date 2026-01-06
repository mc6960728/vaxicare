import { Router } from 'express';
import { VaccinationPlanController } from '../controllers/vaccination-plan.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const vaccinationPlanController = new VaccinationPlanController();

/**
 * Common routes - Accessible to all authenticated users
 * Includes: Knowledge Base articles and other common resources
 */

/**
 * Get knowledge base articles
 * GET /api/v1/common/knowledge-base/articles?category=vaccination&limit=10
 *
 * Query Parameters:
 * - category (optional): Filter by category
 * - limit (optional): Number of articles to return (default: 10)
 *
 * Use Case: Educational content for parents, medical staff, and admins
 */
router.get(
  '/knowledge-base/articles',
  authenticate,
  vaccinationPlanController.getKnowledgeBaseArticles
);

/**
 * Get single knowledge base article
 * GET /api/v1/common/knowledge-base/:articleId
 *
 * Auto-increments view count when accessed
 *
 * Use Case: View detailed article content
 */
router.get(
  '/knowledge-base/:articleId',
  authenticate,
  vaccinationPlanController.getKnowledgeBaseArticle
);

export default router;
