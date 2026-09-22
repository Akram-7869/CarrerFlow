import { AppError } from '../utils/app-error.js';

export const notFound = (request, _response, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${request.method} ${request.path} was not found`));
};
