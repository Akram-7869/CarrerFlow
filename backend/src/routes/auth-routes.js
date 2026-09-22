import { Router } from 'express';
import * as authController from '../controllers/auth-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { loginSchema, registerSchema } from '../validators/auth-validator.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), asyncHandler(authController.register));
authRouter.post('/login', validate(loginSchema), asyncHandler(authController.login));
authRouter.post('/guest', asyncHandler(authController.guest));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.get('/me', authenticate, asyncHandler(authController.me));
