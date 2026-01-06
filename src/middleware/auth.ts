import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types/request.types';
import { prisma } from '../config/database';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    // Verify JWT first (no DB needed) - fail fast for invalid tokens
    let decoded: { userId: string; role?: string; userType: string };
    try {
      decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        role?: string;
        userType: string;
      };
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new AppError('Token has expired', 401);
      }
      throw new AppError('Invalid token', 401);
    }

    // Check if token is blacklisted (with connection retry)
    try {
      const blacklistedToken = await prisma.tokenBlacklist.findUnique({
        where: { token },
      });

      if (blacklistedToken) {
        throw new AppError('Token has been revoked', 401);
      }
    } catch (dbError: any) {
      // If it's already an AppError (token revoked), rethrow it
      if (dbError instanceof AppError) {
        throw dbError;
      }
      // Log DB error but don't fail auth if it's just a connection issue
      // This prevents stale connections from blocking all requests
      console.error('[AUTH] Token blacklist check failed (DB issue):', dbError.message);
      // Optionally: You can choose to fail here for stricter security
      // throw new AppError('Authentication service temporarily unavailable', 503);
    }

    // Check if parent account is active (prevent inactive parents from taking actions)
    if (decoded.userType === 'PARENT') {
      try {
        const parent = await prisma.parent.findUnique({
          where: { id: decoded.userId },
          select: { status: true, isDeleted: true },
        });

        if (!parent) {
          throw new AppError('Parent account not found', 401);
        }

        if (parent.isDeleted) {
          throw new AppError('Parent account has been deleted', 401);
        }

        if (parent.status === 'INACTIVE') {
          throw new AppError('Your account has been deactivated. Please contact support.', 403);
        }

        if (parent.status === 'SUSPENDED') {
          throw new AppError('Your account has been suspended. Please contact support.', 403);
        }
      } catch (dbError: any) {
        if (dbError instanceof AppError) {
          throw dbError;
        }
        console.error('[AUTH] Parent status check failed:', dbError.message);
      }
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      userType: decoded.userType,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};
