import { prisma } from '../config/database';
import { deleteFile } from '../utils/fileUpload';
import path from 'path';

export class UploadService {
  /**
   * Upload image and return URL
   * This is a generic upload - does NOT update any user profile
   * Profile updates should be done via separate profile/user update APIs
   *
   * @param fileUrl - URL of uploaded file
   * @param oldImageUrl - URL of old image to delete (optional)
   */
  async uploadImage(fileUrl: string, oldImageUrl: string | null = null) {
    // Delete old photo if URL is provided
    if (oldImageUrl) {
      try {
        const oldFilePath = path.join(process.cwd(), 'uploads', 'profile-photos', path.basename(oldImageUrl));
        deleteFile(oldFilePath);
      } catch (error) {
        console.log('Failed to delete old image:', error);
        // Continue with upload even if delete fails
      }
    }

    // Return only the image URL - no profile update
    return { imageUrl: fileUrl };
  } 

  /**
   * Delete user profile photo
   */
  async deleteProfilePhoto(userId: string, userType: 'PARENT' | 'MEDICAL_STAFF') {
    if (userType === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { id: userId },
        select: { profilePhoto: true },
      });

      if (parent?.profilePhoto) {
        const filePath = path.join(process.cwd(), 'uploads', 'profile-photos', path.basename(parent.profilePhoto));
        deleteFile(filePath);

        await prisma.parent.update({
          where: { id: userId },
          data: { profilePhoto: '' },
        });
      }
    } else {
      const staff = await prisma.medicalStaff.findUnique({
        where: { id: userId },
        select: { profilePhoto: true },
      });

      if (staff?.profilePhoto) {
        const filePath = path.join(process.cwd(), 'uploads', 'profile-photos', path.basename(staff.profilePhoto));
        deleteFile(filePath);

        await prisma.medicalStaff.update({
          where: { id: userId },
          data: { profilePhoto: '' },
        });
      }
    }

    return { message: 'Profile photo deleted successfully' };
  }
}
