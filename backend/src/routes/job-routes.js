import { Router } from 'express';
import * as jobController from '../controllers/job-controller.js';
import * as matchController from '../controllers/job-match-controller.js';
import * as tailoringController from '../controllers/tailoring-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createJobSchema, createMatchSchema, jobIdSchema, matchIdSchema } from '../validators/job-validator.js';
import { createTailoringSchema } from '../validators/tailoring-validator.js';

export const jobRouter = Router();

jobRouter.use(authenticate);
jobRouter.get('/', asyncHandler(jobController.list));
jobRouter.post('/', validate(createJobSchema), asyncHandler(jobController.create));
jobRouter.get('/:jobId/matches/:resumeId', validate(matchIdSchema), asyncHandler(matchController.getLatest));
jobRouter.post('/:jobId/matches', validate(createMatchSchema), asyncHandler(matchController.run));
jobRouter.post('/:jobId/tailor', validate(createTailoringSchema), asyncHandler(tailoringController.create));
jobRouter.post('/:jobId/analyze', validate(jobIdSchema), asyncHandler(jobController.retry));
jobRouter.get('/:jobId', validate(jobIdSchema), asyncHandler(jobController.get));
jobRouter.delete('/:jobId', validate(jobIdSchema), asyncHandler(jobController.remove));
