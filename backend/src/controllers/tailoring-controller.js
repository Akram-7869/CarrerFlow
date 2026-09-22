import { presentVersion } from '../services/resume-version-service.js';
import * as tailoringService from '../services/tailoring-service.js';

export const create = async (request, response) => {
  const session = await tailoringService.createTailoring(
    request.validated.params.jobId,
    request.validated.body.resumeId,
    request.user.id,
  );
  response.status(201).json({ data: { session } });
};

export const get = async (request, response) => {
  response.json({ data: { session: await tailoringService.getTailoring(request.validated.params.sessionId, request.user.id) } });
};

export const review = async (request, response) => {
  const proposal = await tailoringService.reviewProposal(
    request.validated.params.sessionId,
    request.validated.params.proposalId,
    request.user.id,
    request.validated.body,
  );
  response.json({ data: { proposal } });
};

export const complete = async (request, response) => {
  const version = await tailoringService.completeTailoring(request.validated.params.sessionId, request.user.id);
  response.status(201).json({ data: { version: presentVersion(version) } });
};
