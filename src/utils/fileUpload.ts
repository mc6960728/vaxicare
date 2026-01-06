import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promises as fsAsync } from 'fs';
import { AppError } from './AppError';

// Upload directories
const uploadsDir = path.join(process.cwd(), 'uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile-photos');
const documentsDir = path.join(uploadsDir, 'documents');
const mediaDir = path.join(uploadsDir, 'media');
const videosDir = path.join(uploadsDir, 'videos');

/**
 * Initialize upload directories asynchronously
 * Called once at server startup
 * Skipped on Vercel (read-only filesystem)
 */
export const initializeUploadDirectories = async (): Promise<void> => {
  // Skip on Vercel - filesystem is read-only
  if (process.env.VERCEL) {
    console.log('[Upload] Skipping directory initialization on Vercel (read-only filesystem)');
    return;
  }

  const directories = [uploadsDir, profilePhotosDir, documentsDir, mediaDir, videosDir];

  await Promise.all(
    directories.map(async (dir) => {
      try {
        await fsAsync.access(dir);
      } catch {
        await fsAsync.mkdir(dir, { recursive: true });
      }
    })
  );
};

// Synchronous fallback for initial module load (runs once)
// This ensures directories exist before multer tries to use them
// Skip on Vercel (read-only filesystem)
if (!process.env.VERCEL) {
  [uploadsDir, profilePhotosDir, documentsDir, mediaDir, videosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Max file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_MEDIA_SIZE = 50 * 1024 * 1024; // 50MB for mixed upload

// Storage configuration for profile photos (with username)
const profilePhotoStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, profilePhotosDir);
  },
  filename: function (req: any, file, cb) {
    // Get username from authenticated user
    const userId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const sanitizedOriginalName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');

    // Format: profilePhoto-userId-timestamp-randomSuffix-originalname.ext
    cb(null, `${file.fieldname}-${userId}-${timestamp}-${randomSuffix}-${sanitizedOriginalName}${ext}`);
  }
});

// Storage configuration for general uploads
const storage = multer.diskStorage({
  destination: function (_req, file, cb) {
    // Determine destination based on field name
    if (file.fieldname === 'document') {
      cb(null, documentsDir);
    } else if (file.fieldname === 'files' || file.fieldname === 'media') {
      // For multiple uploads, separate by type
      if (file.mimetype.startsWith('video/')) {
        cb(null, videosDir);
      } else {
        cb(null, mediaDir);
      }
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: function (_req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

// File filter for images
const imageFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400));
  }
};

// File filter for documents
const documentFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only PDF and image files are allowed.', 400));
  }
};

// Upload middleware for profile photos
export const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
}).single('image');

// Upload middleware for documents
export const uploadDocument = multer({
  storage: storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
  },
}).single('document');

// File filter for media (images + videos)
const mediaFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MEDIA_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only images (JPEG, PNG, WebP) and videos (MP4, MPEG, MOV, AVI, WebM) are allowed.', 400));
  }
};

// Upload middleware for multiple images only
export const uploadMultipleImages = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
}).array('images', 10); // Max 10 images

// Upload middleware for multiple media files (images + videos)
export const uploadMultipleMedia = multer({
  storage: storage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: MAX_MEDIA_SIZE,
  },
}).array('files', 20); // Max 20 files (images + videos combined)

/**
 * Delete file asynchronously (non-blocking)
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await fsAsync.access(filePath);
    await fsAsync.unlink(filePath);
  } catch (error) {
    // File doesn't exist or can't be deleted - log but don't throw
    console.error('Error deleting file:', error);
  }
};

/**
 * Delete file synchronously (use only when async is not possible)
 * @deprecated Use deleteFile (async) instead
 */
export const deleteFileSync = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Utility function to get file URL
export const getFileUrl = (req: any, filename: string, type: 'profile' | 'document' | 'media' | 'video' = 'profile'): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  let folder = 'profile-photos';

  switch (type) {
    case 'profile':
      folder = 'profile-photos';
      break;
    case 'document':
      folder = 'documents';
      break;
    case 'media':
      folder = 'media';
      break;
    case 'video':
      folder = 'videos';
      break;
  }

  return `${baseUrl}/uploads/${folder}/${filename}`;
};

// Utility function to get file type from mimetype
export const getFileType = (mimetype: string): 'image' | 'video' | 'document' => {
  if (mimetype.startsWith('image/')) {
    return 'image';
  } else if (mimetype.startsWith('video/')) {
    return 'video';
  }
  return 'document';
};
