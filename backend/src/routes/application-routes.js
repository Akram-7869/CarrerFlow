import { Router } from 'express';
import * as controller from '../controllers/application-controller.js';
import * as interviewPrepController from '../controllers/interview-prep-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  applicationIdSchema, createApplicationEventSchema, eventIdSchema, generateCoverLetterSchema,
  listApplicationsSchema, prepareApplicationSchema, updateApplicationEventSchema,
  updateApplicationNotesSchema, updateApplicationPreparationSchema, updateApplicationStatusSchema,
  updateCoverLetterSchema,
} from '../validators/application-validator.js';
import { generateInterviewPrepSchema, getInterviewPrepSchema, updateInterviewPrepSchema } from '../validators/interview-prep-validator.js';

export const applicationRouter = Router();

applicationRouter.use(authenticate);
applicationRouter.post('/prepare', validate(prepareApplicationSchema), asyncHandler(controller.prepare));
applicationRouter.get('/', validate(listApplicationsSchema), asyncHandler(controller.list));
applicationRouter.patch('/events/:eventId', validate(updateApplicationEventSchema), asyncHandler(controller.updateEvent));
applicationRouter.delete('/events/:eventId', validate(eventIdSchema), asyncHandler(controller.removeEvent));
applicationRouter.get('/:applicationId', validate(applicationIdSchema), asyncHandler(controller.get));
applicationRouter.patch('/:applicationId', validate(updateApplicationPreparationSchema), asyncHandler(controller.update));
applicationRouter.patch('/:applicationId/status', validate(updateApplicationStatusSchema), asyncHandler(controller.updateStatus));
applicationRouter.patch('/:applicationId/notes', validate(updateApplicationNotesSchema), asyncHandler(controller.updateNotes));
applicationRouter.post('/:applicationId/events', validate(createApplicationEventSchema), asyncHandler(controller.createEvent));
applicationRouter.post('/:applicationId/cover-letter', validate(generateCoverLetterSchema), asyncHandler(controller.generateCoverLetter));
applicationRouter.patch('/:applicationId/cover-letter', validate(updateCoverLetterSchema), asyncHandler(controller.updateCoverLetter));
applicationRouter.get('/:applicationId/interview-prep', validate(getInterviewPrepSchema), asyncHandler(interviewPrepController.get));
applicationRouter.post('/:applicationId/interview-prep', validate(generateInterviewPrepSchema), asyncHandler(interviewPrepController.generate));
applicationRouter.patch('/:applicationId/interview-prep', validate(updateInterviewPrepSchema), asyncHandler(interviewPrepController.update));
