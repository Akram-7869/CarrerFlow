import { Router } from 'express';
import * as controller from '../controllers/job-discovery-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { discoverJobsSchema, saveJobPreferencesSchema } from '../validators/job-discovery-validator.js';

export const jobDiscoveryRouter = Router();

jobDiscoveryRouter.use(authenticate);
jobDiscoveryRouter.get('/preferences', asyncHandler(controller.preferences));
jobDiscoveryRouter.put('/preferences', validate(saveJobPreferencesSchema), asyncHandler(controller.savePreferences));
jobDiscoveryRouter.post('/search', validate(discoverJobsSchema), asyncHandler(controller.search));
