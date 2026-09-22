import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const createAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, type: 'access' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL, issuer: 'careerflow-api', audience: 'careerflow-web' },
  );

export const createRefreshToken = (user) =>
  jwt.sign(
    { sub: user.id, type: 'refresh', jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
      issuer: 'careerflow-api',
      audience: 'careerflow-web',
    },
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'careerflow-api',
    audience: 'careerflow-web',
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'careerflow-api',
    audience: 'careerflow-web',
  });

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
