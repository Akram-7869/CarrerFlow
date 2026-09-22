import { AppError } from '../utils/app-error.js';

export const validate = (schema) => (request, _response, next) => {
  const result = schema.safeParse({
    body: request.body,
    params: request.params,
    query: request.query,
  });

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.').replace(/^body\./, ''),
      message: issue.message,
    }));
    return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid request data', details));
  }

  request.validated = result.data;
  return next();
};
