import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorCodes } from '../../shared/errors.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        details: err.errors,
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'Internal server error',
    },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: ErrorCodes.NOT_FOUND,
      message: 'Route not found',
    },
  });
}
