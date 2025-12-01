import { Response } from 'express';
import { logger } from '../services/logger.service.js';

/**
 * Standardized error response interface
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

/**
 * Success response interface
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * API Response type
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Standardized error handler for API routes
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Async route wrapper to handle errors consistently
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleApiError(error, res, req);
    });
  };
}

/**
 * Handle API errors consistently across the application
 */
export function handleApiError(error: any, res: Response, req?: any): void {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle ApiError instances
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  }
  // Handle validation errors
  else if (error.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data';
    details = error.errors;
  }
  // Handle database errors
  else if (error.code === '23505') { // Unique constraint violation
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource already exists';
  }
  else if (error.code === '23503') { // Foreign key constraint violation
    statusCode = 400;
    code = 'INVALID_REFERENCE';
    message = 'Invalid reference to related resource';
  }
  // Handle generic errors
  else if (error instanceof Error) {
    message = error.message;
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production') {
      details = undefined;
    } else {
      details = {
        stack: error.stack,
        name: error.name
      };
    }
  }

  // Log the error
  logger.error(`API Error: ${message}`, {
    statusCode,
    code,
    path: req?.path,
    method: req?.method,
    userAgent: req?.get('User-Agent'),
    ip: req?.ip,
    details,
    stack: error?.stack
  });

  // Send error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: code,
    message,
    code,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(message && { message })
  };

  res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): void {
  const errorResponse: ErrorResponse = {
    success: false,
    error: code,
    message,
    code,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };

  // Log the error
  logger.error(`Manual error response: ${message}`, {
    statusCode,
    code,
    details
  });

  res.status(statusCode).json(errorResponse);
}

/**
 * Validate required fields in request
 */
export function validateRequired(fields: Record<string, any>, required: string[]): void {
  const missing = required.filter(field => !fields[field]);
  if (missing.length > 0) {
    throw new ApiError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      'MISSING_REQUIRED_FIELDS',
      { missingFields: missing }
    );
  }
}

/**
 * Validate request body exists
 */
export function validateBody(req: any): void {
  if (!req.body) {
    throw new ApiError('Request body is required', 400, 'MISSING_BODY');
  }
}
