import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      const errorMessage = error.errors
        ?.map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      next(new AppError(errorMessage || 'Validation error', 400));
    }
  };
};
