import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';
import { sanitizeErrorMessage, redactSensitiveFields } from '../utils/securityChecks';

/**
 * Check if the request is from an app user endpoint (Parent or Medical Staff)
 * These endpoints need custom error handling for React Native frontend
 */
const isAppUserEndpoint = (req: Request): boolean => {
  const appUserPaths = [
    '/api/v1/auth/app',
    '/api/v1/children',
    '/api/v1/vaccination-plan',
    '/api/v1/profile/parent',
    '/api/v1/profile/medical-staff',
  ];

  return appUserPaths.some(path => req.path.startsWith(path));
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sanitize error message before logging to prevent credential leakage
  const sanitizedMessage = sanitizeErrorMessage(err.message);

  // Log errors for debugging (server-side only) with sanitization
  console.error('[ERROR]', {
    name: err.name,
    message: sanitizedMessage,
    // Only log stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  const isAppUser = isAppUserEndpoint(req);

  // Handle AppError (Custom errors)
  if (err instanceof AppError) {
    // For app users, always return 200 with error in response body
    if (isAppUser) {
      res.status(200).json({
        status: 'error',
        message: err.message,
        data: {},
      });
      return;
    }

    // For admin endpoints, use standard HTTP status codes
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      data: {},
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {

    let message = 'Database operation failed';
    let statusCode = 400;

    // Handle specific Prisma error codes
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        const field = (err.meta?.target as string[])?.join(', ') || 'field';
        message = `A record with this ${field} already exists`;
        statusCode = 409;
        break;
      case 'P2025':
        // Record not found
        message = 'Record not found';
        statusCode = 404;
        break;
      case 'P2003':
        // Foreign key constraint failed
        const fkField = (err.meta?.field_name as string) || 'related record';
        message = `Invalid reference: ${fkField} not found`;
        statusCode = 400;
        break;
      case 'P2011':
        // Null constraint violation
        const nullField = (err.meta?.constraint as string[])?.join(', ') || 'field';
        message = `Required field missing: ${nullField}`;
        statusCode = 400;
        break;
      case 'P2012':
        // Missing required value
        const missingField = (err.meta?.path as string) || 'field';
        message = `Missing required field: ${missingField}`;
        statusCode = 400;
        break;
      case 'P2014':
        // Required relation violation
        message = 'Required relation is missing';
        statusCode = 400;
        break;
      default:
        // For unknown errors, extract field info if available
        const errorField = (err.meta?.target as string[])?.join(', ') ||
                          (err.meta?.field_name as string) ||
                          (err.meta?.constraint as string[])?.join(', ');
        message = errorField ? `Database error on field: ${errorField}` : 'Database operation failed';
    }

    // For app users, always return 200 with error in response body
    if (isAppUser) {
      res.status(200).json({
        status: 'error',
        message,
        data: {},
      });
      return;
    }

    res.status(statusCode).json({
      status: 'error',
      message,
      data: {},
    });
    return;
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    // Extract field name from error message if possible
    const fieldMatch = err.message.match(/Argument `(\w+)` is missing/);
    const message = fieldMatch
      ? `Missing required field: ${fieldMatch[1]}`
      : 'Invalid data provided';

    // For app users, always return 200 with error in response body
    if (isAppUser) {
      res.status(200).json({
        status: 'error',
        message,
        data: {},
      });
      return;
    }

    res.status(400).json({
      status: 'error',
      message,
      data: {},
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';

    // For app users, always return 200 with error in response body
    if (isAppUser) {
      res.status(200).json({
        status: 'error',
        message,
        data: {},
      });
      return;
    }

    res.status(401).json({
      status: 'error',
      message,
      data: {},
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired';

    // For app users, always return 200 with error in response body
    if (isAppUser) {
      res.status(200).json({
        status: 'error',
        message,
        data: {},
      });
      return;
    }

    res.status(401).json({
      status: 'error',
      message,
      data: {},
    });
    return;
  }

  // Handle validation errors (Zod, express-validator, etc.)
  if (err.name === 'ValidationError') {
    const message = err.message || 'Validation failed';

    // For app users, always return 200 with error in response body
    if (isAppUser) {
      res.status(200).json({
        status: 'error',
        message,
        data: {},
      });
      return;
    }

    res.status(400).json({
      status: 'error',
      message,
      data: {},
    });
    return;
  }

  // Default error response
  const defaultMessage = 'Something went wrong. Please try again later.';

  // For app users, always return 200 with error in response body
  if (isAppUser) {
    res.status(200).json({
      status: 'error',
      message: defaultMessage,
      data: {},
    });
    return;
  }

  res.status(500).json({
    status: 'error',
    message: defaultMessage,
    data: {},
  });
};
