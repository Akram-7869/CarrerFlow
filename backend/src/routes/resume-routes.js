import { Router } from 'express';
import * as resumeController from '../controllers/resume-controller.js';
import * as analysisController from '../controllers/resume-analysis-controller.js';
import * as versionController from '../controllers/resume-version-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { uploadResume } from '../middleware/resume-upload.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { confirmResumeSchema, resumeIdSchema, updateResumeSchema } from '../validators/resume-validator.js';

export const resumeRouter = Router();

resumeRouter.use(authenticate);
resumeRouter.get('/', asyncHandler(resumeController.list));
resumeRouter.post('/upload', uploadResume, asyncHandler(resumeController.upload));
resumeRouter.get('/:resumeId/ats', validate(resumeIdSchema), asyncHandler(analysisController.getLatest));
resumeRouter.post('/:resumeId/ats', validate(resumeIdSchema), asyncHandler(analysisController.run));
resumeRouter.get('/:resumeId/versions', validate(resumeIdSchema), asyncHandler(versionController.list));
resumeRouter.get('/:resumeId', validate(resumeIdSchema), asyncHandler(resumeController.get));
resumeRouter.get('/:resumeId/download', validate(resumeIdSchema), asyncHandler(resumeController.download));
resumeRouter.patch('/:resumeId', validate(updateResumeSchema), asyncHandler(resumeController.rename));
resumeRouter.post('/:resumeId/extract', validate(resumeIdSchema), asyncHandler(resumeController.retry));
resumeRouter.post('/:resumeId/confirm', validate(confirmResumeSchema), asyncHandler(resumeController.confirm));
resumeRouter.delete('/:resumeId', validate(resumeIdSchema), asyncHandler(resumeController.remove));
