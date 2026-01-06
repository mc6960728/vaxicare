import { Router } from 'express';
import { SupplierAdminController } from '../../controllers/admin/supplier.admin.controller';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createSupplierSchema,
  updateSupplierSchema,
} from '../../utils/validators';

const router = Router();
const supplierController = new SupplierAdminController();

/**
 * Supplier Management Admin Routes
 * Base: /api/v1/admin/suppliers
 * All routes require Admin authentication
 */

/**
 * ============================================================================
 * STATISTICS & DROPDOWN (Define specific routes first to avoid param conflicts)
 * ============================================================================
 */

/**
 * Get supplier statistics
 * GET /api/v1/admin/suppliers/statistics
 *
 * Returns:
 * {
 *   "totalSuppliers": 10,
 *   "activeSuppliers": 8,
 *   "inactiveSuppliers": 2,
 *   "suppliersByState": [{ "state": "Gujarat", "count": 5 }]
 * }
 */
router.get('/statistics', supplierController.getSupplierStatistics);

/**
 * Get suppliers for dropdown (active only)
 * GET /api/v1/admin/suppliers/dropdown
 *
 * Returns list of active suppliers for dropdown selection
 */
router.get('/dropdown', supplierController.getSuppliersDropdown);

/**
 * ============================================================================
 * CRUD OPERATIONS
 * ============================================================================
 */

/**
 * Create new supplier
 * POST /api/v1/admin/suppliers
 *
 * Request Body:
 * {
 *   "supplierName": "Serum Institute of India" (required),
 *   "fullName": "Mr. Rajesh Kumar" (required, contact person),
 *   "supplierCode": "SII-001" (required, unique),
 *   "phone": "+91-20-26993900" (required),
 *   "email": "contact@seruminstitute.com" (required, unique),
 *   "website": "https://www.seruminstitute.com" (optional),
 *   "rating": "5" (optional),
 *   "city": "Pune" (required),
 *   "state": "Maharashtra" (required),
 *   "country": "India" (optional, defaults to India),
 *   "address": "212/2, Hadapsar" (optional),
 *   "pincode": "411028" (optional),
 *   "gstNumber": "27AAACS1234A1Z5" (optional),
 *   "licenseNumber": "MFG-2024-001" (optional),
 *   "taxIdNumber": "AAACS1234A" (optional),
 *   "vaccineType": "Injectable" (optional),
 *   "vaccineSupplied": "BCG, Hepatitis B, OPV" (optional),
 *   "certification": "WHO, FDA" (optional),
 *   "maxSupplyCapacity": "1000000 doses/month" (optional),
 *   "licenseExpiryDate": "31/12/2025" (optional, DD/MM/YYYY or YYYY-MM-DD),
 *   "paymentTerms": "ADVANCE | PAYMENT_ON_DELIVERY | LC | MILESTONE" (optional),
 *   "status": "ACTIVE | OUT_OF_STOCK" (optional, defaults to ACTIVE),
 *   "notes": "Additional notes" (optional)
 * }
 */
router.post(
  '/',
  validateRequest(createSupplierSchema),
  supplierController.createSupplier
);

/**
 * Get all suppliers with pagination and filters
 * GET /api/v1/admin/suppliers
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - search: Search by supplier name, contact person, email, phone, code
 * - status: Filter by status (ACTIVE, OUT_OF_STOCK, etc.)
 * - city: Filter by city
 * - state: Filter by state
 *
 * Example: ?page=1&limit=20&search=Serum&status=ACTIVE&state=Maharashtra
 */
router.get('/', supplierController.getAllSuppliers);

/**
 * Get supplier by ID
 * GET /api/v1/admin/suppliers/:id
 *
 * Returns detailed supplier information
 */
router.get('/:id', supplierController.getSupplierById);

/**
 * Update supplier
 * PUT /api/v1/admin/suppliers/:id
 *
 * Request Body: (all fields optional)
 * Same fields as create endpoint
 */
router.put(
  '/:id',
  validateRequest(updateSupplierSchema),
  supplierController.updateSupplier
);

/**
 * Delete supplier
 * DELETE /api/v1/admin/suppliers/:id
 *
 * Permanently deletes the supplier record
 */
router.delete('/:id', supplierController.deleteSupplier);

/**
 * Toggle supplier status (active/inactive)
 * PATCH /api/v1/admin/suppliers/:id/toggle-status
 *
 * Toggles between ACTIVE and OUT_OF_STOCK status
 */
router.patch('/:id/toggle-status', supplierController.toggleSupplierStatus);

export default router;
