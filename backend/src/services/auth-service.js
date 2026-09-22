import {
  createUser,
  findUserByEmail,
  findUserById,
} from '../repositories/user-repository.js';
import {
  findActiveRefreshToken,
  revokeRefreshToken,
  saveRefreshToken,
} from '../repositories/token-repository.js';
import { AppError } from '../utils/app-error.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/tokens.js';
import { env } from '../config/env.js';
import { getOrCreateGuestUser } from './guest-demo-service.js';

const issueSession = async (user) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await saveRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  return { user, accessToken, refreshToken };
};

export const register = async ({ name, email, password }) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash });
  return issueSession(user);
};

export const login = async ({ email, password }) => {
  const userWithPassword = await findUserByEmail(email);
  const validPassword =
    userWithPassword && (await verifyPassword(password, userWithPassword.password_hash));

  if (!validPassword) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }

  const user = {
    id: userWithPassword.id,
    name: userWithPassword.name,
    email: userWithPassword.email,
    created_at: userWithPassword.created_at,
    updated_at: userWithPassword.updated_at,
  };

  return issueSession(user);
};

export const guestLogin = async () => {
  const user = await getOrCreateGuestUser();
  return issueSession(user);
};

export const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError(401, 'REFRESH_TOKEN_REQUIRED', 'A refresh token is required');
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    if (payload.type !== 'refresh') {
      throw new Error('Unexpected token type');
    }

    const tokenHash = hashToken(refreshToken);
    const storedToken = await findActiveRefreshToken(tokenHash);
    if (!storedToken) {
      throw new Error('Token was revoked or expired');
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      throw new Error('User no longer exists');
    }

    await revokeRefreshToken(tokenHash);
    return issueSession(user);
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'The refresh token is invalid or expired');
  }
};

export const logout = async (refreshToken) => {
  if (refreshToken) {
    await revokeRefreshToken(hashToken(refreshToken));
  }
};
