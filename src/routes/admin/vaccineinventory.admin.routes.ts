import { Router } from 'express';
import { VaccineInventoryAdminController } from '../../controllers/admin/vaccineinventory.admin.controller';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createVaccineInventorySchema,
  updateVaccineInventorySchema,
} from '../../utils/validators';

const router = Router();
const inventoryController = new VaccineInventoryAdminController();

/**
 * Vaccine Inventory Admin Routes (Stock Management)
 * Base: /api/v1/admin/vaccine-inventory
 * All routes require Admin authentication
 */

/**
 * ============================================================================
 * STATISTICS & ALERTS (Define specific routes first to avoid param conflicts)
 * ============================================================================
 */

/**
 * Get inventory statistics
 * GET /api/v1/admin/vaccine-inventory/statistics
 *
 * Query Parameters:
 * - clinicId: Filter by vaccination center (optional)
 *
 * Returns:
 * {
 *   "totalItems": 150,
 *   "activeItems": 120,
 *   "lowStockItems": 15,
 *   "expiredItems": 10,
 *   "outOfStockItems": 5,
 *   "totalQuantity": 5000
 * }
 */
router.get('/statistics', inventoryController.getInventoryStatistics);

/**
 * Get low stock alerts
 * GET /api/v1/admin/vaccine-inventory/alerts/low-stock
 *
 * Query Parameters:
 * - clinicId: Filter by vaccination center (optional)
 *
 * Returns list of inventory items with LOW_STOCK or OUT_OF_STOCK status
 */
router.get('/alerts/low-stock', inventoryController.getLowStockAlerts);

/**
 * Get expired vaccines
 * GET /api/v1/admin/vaccine-inventory/alerts/expired
 *
 * Query Parameters:
 * - clinicId: Filter by vaccination center (optional)
 *
 * Returns list of expired vaccine inventory
 */
router.get('/alerts/expired', inventoryController.getExpiredVaccines);

/**
 * ============================================================================
 * CRUD OPERATIONS
 * ============================================================================
 */

/**
 * Create new vaccine inventory/stock
 * POST /api/v1/admin/vaccine-inventory
 *
 * Request Body:
 * {
 *   "vaccineId": "uuid (required)",
 *   "clinicId": "uuid (required)",
 *   "batchNumber": "string (required, e.g., BCG2024A001)",
 *   "quantity": "number (required, e.g., 100)",
 *   "costPerUnit": "number (optional, e.g., 150.00)",
 *   "manufacturingDate": "string (optional, DD/MM/YYYY or YYYY-MM-DD)",
 *   "expiryDate": "string (required, DD/MM/YYYY or YYYY-MM-DD)",
 *   "supplier": "string (optional, e.g., Serum Institute of India)",
 *   "storageLocation": "string (optional, e.g., Cold Storage Room 1)",
 *   "temperature": "string (optional, e.g., 2-8°C)",
 *   "status": "ACTIVE | EXPIRED | LOW_STOCK | OUT_OF_STOCK | QUARANTINE (optional)",
 *   "notes": "string (optional)"
 * }
 *
 * Notes:
 * - Status is auto-calculated based on quantity and expiry
 * - Batch number must be unique per vaccine per center
 * - Manufacturing date must be before expiry date
 */
router.post(
  '/',
  validateRequest(createVaccineInventorySchema),
  inventoryController.createVaccineInventory
);

/**
 * Get all vaccine inventory with pagination and filters
 * GET /api/v1/admin/vaccine-inventory
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - search: Search by batch number, vaccine name, center name, supplier
 * - vaccineId: Filter by vaccine ID
 * - clinicId: Filter by vaccination center ID
 * - status: Filter by status (ACTIVE, EXPIRED, LOW_STOCK, OUT_OF_STOCK, QUARANTINE)
 * - lowStock: true to show only low stock items (quantity < 10)
 * - expired: true to show only expired items
 *
 * Example: ?page=1&limit=20&search=BCG&clinicId=xyz&status=ACTIVE&lowStock=true
 */
router.get('/', inventoryController.getAllVaccineInventory);

/**
 * Get inventory by vaccination center
 * GET /api/v1/admin/vaccine-inventory/center/:clinicId
 *
 * Query Parameters:
 * - vaccineId: Filter by specific vaccine (optional)
 */
router.get('/center/:clinicId', inventoryController.getInventoryByCenter);

/**
 * Get vaccine inventory by ID
 * GET /api/v1/admin/vaccine-inventory/:id
 *
 * Returns detailed inventory information with vaccine and center details
 */
router.get('/:id', inventoryController.getVaccineInventoryById);

/**
 * Update vaccine inventory
 * PUT /api/v1/admin/vaccine-inventory/:id
 *
 * Request Body: (all fields optional)
 * {
 *   "batchNumber": "string",
 *   "quantity": "number",
 *   "costPerUnit": "number",
 *   "manufacturingDate": "string (DD/MM/YYYY or YYYY-MM-DD)",
 *   "expiryDate": "string (DD/MM/YYYY or YYYY-MM-DD)",
 *   "supplier": "string",
 *   "storageLocation": "string",
 *   "temperature": "string",
 *   "status": "ACTIVE | EXPIRED | LOW_STOCK | OUT_OF_STOCK | QUARANTINE",
 *   "notes": "string"
 * }
 *
 * Notes:
 * - Status is auto-updated based on quantity if not explicitly provided
 * - Batch number must remain unique per vaccine per center
 */
router.put(
  '/:id',
  validateRequest(updateVaccineInventorySchema),
  inventoryController.updateVaccineInventory
);

/**
 * Delete vaccine inventory
 * DELETE /api/v1/admin/vaccine-inventory/:id
 *
 * Permanently deletes the inventory record
 * Use with caution - consider updating status to QUARANTINE instead
 */
router.delete('/:id', inventoryController.deleteVaccineInventory);

/**
 * Update inventory quantity (when vaccine is used)
 * PATCH /api/v1/admin/vaccine-inventory/:id/quantity
 *
 * Request Body:
 * {
 *   "quantityUsed": "number (required)"
 * }
 *
 * Auto-updates status based on remaining quantity:
 * - 0 → OUT_OF_STOCK
 * - < 10 → LOW_STOCK
 *
 * Note: This is typically called automatically when vaccinations are administered
 */
router.patch('/:id/quantity', inventoryController.updateInventoryQuantity);

export default router;
