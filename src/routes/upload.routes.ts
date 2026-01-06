import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { uploadProfilePhoto, uploadMultipleMedia } from '../utils/fileUpload';

const router = Router();
const uploadController = new UploadController();

// All routes require authentication
router.use(authenticate);

/**
 * Upload profile photo
 * POST /api/v1/upload/profile-photo
 *
 * Form Data:
 * - profilePhoto: File (JPEG, PNG, WebP, max 5MB)
 * - removeImage: URL of old image to delete (optional)
 *
 * Example: removeImage: "http://localhost:3000/uploads/profile-photos/old-photo.jpg"
 */
router.post('', uploadProfilePhoto, uploadController.uploadProfilePhoto);

/**
 * Upload multiple media files (images and videos)
 * POST /api/v1/upload/media
 *
 * Form Data:
 * - files: Multiple files (images: JPEG, PNG, WebP; videos: MP4, MPEG, MOV, AVI, WebM)
 * - Max 20 files
 * - Max 50MB per file
 *
 * Response includes separate arrays for images and videos
 */
router.post('/media', uploadMultipleMedia, uploadController.uploadMultipleMedia);

export default router;
