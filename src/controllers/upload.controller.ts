import { Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import { ApiResponse } from '../types/response.types';
import { AuthRequest } from '../types/request.types';
import { AppError } from '../utils/AppError';
import { getFileUrl, getFileType } from '../utils/fileUpload';

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  /**
   * Upload image (generic - for any purpose)
   * Form Data:
   * - profilePhoto: File (required)
   * - removeImage: URL of old image to delete (optional)
   *
   * Note: This API only uploads the file and returns the URL.
   * To update a user's profile photo, use the returned URL with the profile update API.
   */
  uploadProfilePhoto = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      // Get old image URL to delete (if provided)
      const oldImageUrl = req.body.removeImage || null;

      const fileUrl = getFileUrl(req, req.file.filename, 'profile');

      // Just upload and return URL - no profile update
      const result = await this.uploadService.uploadImage(fileUrl, oldImageUrl);

      const response: ApiResponse = {
        status: 'success',
        message: 'Image uploaded successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };


  /**
   * Upload multiple media files (images and videos)
   */
  uploadMultipleMedia = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const uploadedFiles = req.files.map((file: Express.Multer.File) => {
        const fileType = getFileType(file.mimetype);
        const urlType = file.mimetype.startsWith('video/') ? 'video' : 'media';

        return {
          fieldname: file.fieldname,
          originalname: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: getFileUrl(req, file.filename, urlType),
          type: fileType,
        };
      });

      // Separate images and videos
      const images = uploadedFiles.filter(f => f.type === 'image');
      const videos = uploadedFiles.filter(f => f.type === 'video');

      const response: ApiResponse = {
        status: 'success',
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
        data: {
          totalFiles: uploadedFiles.length,
          images: {
            count: images.length,
            files: images,
          },
          videos: {
            count: videos.length,
            files: videos,
          },
          allFiles: uploadedFiles,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
