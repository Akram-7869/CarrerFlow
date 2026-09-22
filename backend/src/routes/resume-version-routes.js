import { Router } from 'express';
import * as versionController from '../controllers/resume-version-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { versionDownloadSchema, versionIdSchema } from '../validators/tailoring-validator.js';

export const resumeVersionRouter = Router();

resumeVersionRouter.use(authenticate);
resumeVersionRouter.get('/:versionId', validate(versionIdSchema), asyncHandler(versionController.get));
resumeVersionRouter.get('/:versionId/download/:format', validate(versionDownloadSchema), asyncHandler(versionController.download));
