import { Router } from 'express';
import { VaccineTransferController } from '../controllers/vaccineTransfer.controller';

const router = Router();
const vaccineTransferController = new VaccineTransferController();

/**
 * Get transfer statistics (Admin only)
 * GET /api/v1/vaccine-transfers/stats?locationId=xxx
 * 
 * Query Parameters:
 * - locationId (optional): Filter stats by location (as source or destination)
 * 
 * Returns:
 * - total: Total number of transfers
 * - byTransferStatus: Count by delivery status (ORDERED, PACKED, etc.)
 * - byStatus: Count by overall status (RECEIVED, COMPLETED, REJECTED)
 * - pending: Count of transfers not yet completed
 */
router.get('/stats', vaccineTransferController.getTransferStats);

/**
 * Get all vaccine transfers with filters
 * GET /api/v1/vaccine-transfers
 * 
 * Query Parameters (all optional):
 * - vaccineId: Filter by vaccine
 * - fromLocationId: Filter by source location
 * - toLocationId: Filter by destination location
 * - transferStatus: ORDERED | PACKED | DISPATCHED | IN_TRANSIT | ARRIVED
 * - status: DISPATCHED | RECEIVED | COMPLETED | REJECTED
 * - fromDate: Start date (YYYY-MM-DD)
 * - toDate: End date (YYYY-MM-DD)
 * - search: Search by transfer ID, batch number, tracking number, or invoice number
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * 
 * Response:
 * {
 *   "transfers": [...],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 50,
 *     "totalPages": 3
 *   }
 * }
 */
router.get('/', vaccineTransferController.getTransfers);

/**
 * Create a new vaccine transfer
 * POST /api/v1/vaccine-transfers
 * Admin or Medical Staff only
 * 
 * Request Body:
 * {
 *   "vaccineId": "uuid",
 *   "batchNumber": "BATCH-12345",
 *   "quantityDispatched": 100,
 *   "fromLocationId": "uuid",
 *   "toLocationId": "uuid",
 *   "expectedDeliveryDate": "2025-01-15",  // optional
 *   "expiryDate": "2026-12-31",            // optional
 *   "manufacturingDate": "2024-06-01",     // optional
 *   "price": 25.50,                        // optional
 *   "packagingType": "Cold Chain Box",     // optional
 *   "storageCondition": "2-8°C",           // optional
 *   "dispatchRemarks": "Handle with care"  // optional
 * }
 * 
 * Notes:
 * - Automatically generates unique transferId
 * - Calculates totalAmount if price is provided
 * - Verifies sufficient inventory at source location
 * - Initial status: ORDERED, transferStatus: ORDERED
 */
router.post('/', vaccineTransferController.createTransfer);

/**
 * Get transfer by ID
 * GET /api/v1/vaccine-transfers/:id
 * 
 * Returns detailed transfer information including:
 * - Full vaccine details
 * - Source and destination location details
 * - All status and quality check information
 * - Timestamps for each stage
 */
router.get('/:id', vaccineTransferController.getTransferById);

/**
 * Update transfer status
 * PATCH /api/v1/vaccine-transfers/:id/status
 * 
 * Updates the transfer delivery status through the workflow:
 * ORDERED → PACKED → DISPATCHED → IN_TRANSIT → ARRIVED
 * 
 * Request Body:
 * {
 *   "transferStatus": "PACKED",                     // required
 *   "temperatureAtDispatch": "4°C",                 // optional
 *   "courierName": "Express Logistics",             // optional
 *   "trackingNumber": "TRACK-123456",               // optional
 *   "coldChainMaintained": true,                    // optional
 *   "invoiceNo": "INV-2024-001"                     // optional
 * }
 * 
 * Validates status transitions to prevent invalid workflow
 */
router.patch('/:id/status', vaccineTransferController.updateTransferStatus);

/**
 * Receive vaccine transfer at destination
 * POST /api/v1/vaccine-transfers/:id/receive
 * 
 * Preconditions:
 * - Transfer must be in ARRIVED status
 * - Transfer must not already be received
 * 
 * Request Body:
 * {
 *   "quantityReceived": 98,                         // required
 *   "quantityAccepted": 95,                         // required
 *   "quantityRejected": 3,                          // required
 *   "temperatureAtReceive": "3°C",                  // optional
 *   "qualityCheck": "APPROVED",                     // required: APPROVED | REJECTED | PENDING
 *   "receiveRemarks": "3 damaged vials"             // optional
 * }
 * 
 * Note: quantityReceived must equal quantityAccepted + quantityRejected
 * 
 * Actions:
 * - Sets receivedOn, receivedBy, and all quantity fields
 * - Updates status to RECEIVED
 * - Updates inventory at destination (adds accepted quantity)
 * - Deducts quantity from source inventory
 */
router.post('/:id/receive', vaccineTransferController.receiveTransfer);

/**
 * Quality inspection by authorized personnel
 * POST /api/v1/vaccine-transfers/:id/inspect
 * 
 * Preconditions:
 * - Transfer must be received first
 * 
 * Request Body:
 * {
 *   "inspectedQualityCheck": "APPROVED",            // required: APPROVED | REJECTED | PENDING
 *   "insepectedRemarks": "All quality checks passed" // optional
 * }
 * 
 * Actions:
 * - Records inspector ID and inspection timestamp
 * - Sets final quality check status
 * - Updates overall status to COMPLETED (if approved) or REJECTED (if failed)
 */
router.post('/:id/inspect', vaccineTransferController.inspectTransfer);

/**
 * Update transfer details
 * PUT /api/v1/vaccine-transfers/:id
 * 
 * Request Body (all fields optional):
 * {
 *   "expectedDeliveryDate": "2025-01-20",
 *   "courierName": "New Courier Service",
 *   "trackingNumber": "TRACK-789012",
 *   "dispatchRemarks": "Updated remarks",
 *   "receiveRemarks": "Additional notes"
 * }
 */
router.put('/:id', vaccineTransferController.updateTransfer);

/**
 * Delete vaccine transfer (Admin only)
 * DELETE /api/v1/vaccine-transfers/:id
 * 
 * Restrictions:
 * - Can only delete transfers in ORDERED status
 * - Cannot delete transfers that have been dispatched or further along
 * 
 * Use Case: Cancel a transfer order before it's been processed
 */
router.delete('/:id', vaccineTransferController.deleteTransfer);

export default router;