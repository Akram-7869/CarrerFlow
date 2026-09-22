import { Router } from 'express';
import * as controller from '../controllers/referral-controller.js';
import * as messageController from '../controllers/referral-message-controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createReferralSchema, referralCandidateSchema, referralJobSchema, searchReferralsSchema } from '../validators/referral-validator.js';
import { createReferralMessageSchema, deleteReferralMessageSchema, listReferralMessagesSchema, updateReferralMessageSchema } from '../validators/referral-message-validator.js';

export const referralRouter = Router();

referralRouter.use(authenticate);
referralRouter.get('/jobs/:jobId', validate(referralJobSchema), asyncHandler(controller.list));
referralRouter.post('/search', validate(searchReferralsSchema), asyncHandler(controller.search));
referralRouter.post('/', validate(createReferralSchema), asyncHandler(controller.create));
referralRouter.get('/:candidateId/messages', validate(listReferralMessagesSchema), asyncHandler(messageController.list));
referralRouter.post('/:candidateId/messages', validate(createReferralMessageSchema), asyncHandler(messageController.create));
referralRouter.patch('/messages/:messageId', validate(updateReferralMessageSchema), asyncHandler(messageController.update));
referralRouter.delete('/messages/:messageId', validate(deleteReferralMessageSchema), asyncHandler(messageController.remove));
referralRouter.get('/:candidateId', validate(referralCandidateSchema), asyncHandler(controller.get));
referralRouter.delete('/:candidateId', validate(referralCandidateSchema), asyncHandler(controller.remove));
