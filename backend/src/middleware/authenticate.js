import { findUserById } from '../repositories/user-repository.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const authenticate = asyncHandler(async (request, _response, next) => {
  const authorization = request.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
  }

  try {
    const payload = verifyAccessToken(authorization.slice(7));

    if (payload.type !== 'access') {
      throw new Error('Unexpected token type');
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      throw new Error('User no longer exists');
    }

    request.user = user;
    next();
  } catch {
    throw new AppError(401, 'INVALID_ACCESS_TOKEN', 'The access token is invalid or expired');
  }
});
