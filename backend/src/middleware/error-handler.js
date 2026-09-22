import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export const errorHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
  }

  if (error?.code === '23505') {
    return response.status(409).json({
      error: {
        code: 'RESOURCE_CONFLICT',
        message: 'A record with that value already exists',
      },
    });
  }

  if (env.NODE_ENV !== 'test') {
    console.error(error);
  }

  return response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
