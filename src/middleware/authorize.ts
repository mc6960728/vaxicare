import { Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types/request.types';

/**
 * Authorization Middleware
 *
 * userType = Which app/platform the user belongs to:
 *   - ADMIN         → Admin Panel (web)
 *   - PARENT        → Parent App (mobile)
 *   - MEDICAL_STAFF → Medical Staff App (mobile)
 *
 * role = Specific role within that userType:
 *   - Admin roles:  ADMIN
 *   - Staff roles:  DOCTOR, NURSE, PHARMACIST, LAB_TECHNICIAN, ADMINISTRATOR, RECEPTIONIST
 *   - Parent:       No specific roles
 *
 * Usage:
 *   authorize(['ADMIN'])         → Only admin panel users
 *   authorize(['PARENT'])        → Only parent app users
 *   authorize(['MEDICAL_STAFF']) → Only medical staff app users
 *   authorize(['ADMIN', 'MEDICAL_STAFF']) → Both admin and medical staff
 */
export const authorize = (allowedUserTypes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { userType } = req.user;

    // Check if user's userType is in the allowed list
    if (!userType || !allowedUserTypes.includes(userType)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Role-based Authorization (for granular control within a userType)
 * Use this when you need to restrict to specific roles like DOCTOR, NURSE, etc.
 *
 * Usage:
 *   authorizeRoles(['DOCTOR', 'NURSE']) → Only doctors and nurses
 */
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { role } = req.user;

    // Check if user's role is in the allowed list
    if (!role || !allowedRoles.includes(role)) {
      throw new AppError('Insufficient permissions. Required role: ' + allowedRoles.join(' or '), 403);
    }

    next();
  };
};
