import { Router } from 'express';
import * as profileController from '../controllers/profile-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { saveProfileSchema } from '../validators/profile-validator.js';

export const profileRouter = Router();

profileRouter.use(authenticate);
profileRouter.get('/', asyncHandler(profileController.get));
profileRouter.put('/', validate(saveProfileSchema), asyncHandler(profileController.save));
