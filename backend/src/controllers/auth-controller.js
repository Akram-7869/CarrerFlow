import { env } from '../config/env.js';
import * as authService from '../services/auth-service.js';

const REFRESH_COOKIE = 'careerflow_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth',
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

const sendSession = (response, session, statusCode = 200) => {
  response.cookie(REFRESH_COOKIE, session.refreshToken, cookieOptions);
  response.status(statusCode).json({
    data: {
      user: session.user,
      accessToken: session.accessToken,
    },
  });
};

export const register = async (request, response) => {
  const session = await authService.register(request.validated.body);
  sendSession(response, session, 201);
};

export const login = async (request, response) => {
  const session = await authService.login(request.validated.body);
  sendSession(response, session);
};

export const guest = async (request, response) => {
  const session = await authService.guestLogin();
  sendSession(response, session);
};

export const refresh = async (request, response) => {
  const session = await authService.refreshSession(request.cookies[REFRESH_COOKIE]);
  sendSession(response, session);
};

export const logout = async (request, response) => {
  await authService.logout(request.cookies[REFRESH_COOKIE]);
  response.clearCookie(REFRESH_COOKIE, cookieOptions);
  response.status(204).send();
};

export const me = async (request, response) => {
  response.json({ data: { user: request.user } });
};
