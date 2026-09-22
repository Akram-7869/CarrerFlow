import { Router } from 'express';
import * as tailoringController from '../controllers/tailoring-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { proposalActionSchema, sessionIdSchema } from '../validators/tailoring-validator.js';

export const tailoringRouter = Router();

tailoringRouter.use(authenticate);
tailoringRouter.get('/:sessionId', validate(sessionIdSchema), asyncHandler(tailoringController.get));
tailoringRouter.patch('/:sessionId/proposals/:proposalId', validate(proposalActionSchema), asyncHandler(tailoringController.review));
tailoringRouter.post('/:sessionId/complete', validate(sessionIdSchema), asyncHandler(tailoringController.complete));
