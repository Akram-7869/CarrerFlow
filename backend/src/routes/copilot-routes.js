import { Router } from 'express';
import * as controller from '../controllers/copilot-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { askCopilotSchema } from '../validators/copilot-validator.js';

export const copilotRouter = Router();

copilotRouter.use(authenticate);
copilotRouter.post('/ask', validate(askCopilotSchema), asyncHandler(controller.ask));
