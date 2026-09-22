import * as referralService from '../services/referral-service.js';

export const list = async (request, response) => {
  response.json({ data: { candidates: await referralService.getCandidates(request.user.id, request.validated.params.jobId) } });
};

export const get = async (request, response) => {
  response.json({ data: { candidate: await referralService.getCandidate(request.user.id, request.validated.params.candidateId) } });
};

export const search = async (request, response) => {
  response.json({ data: await referralService.discoverCandidates(request.user.id, request.validated.body) });
};

export const create = async (request, response) => {
  response.status(201).json({ data: { candidate: await referralService.addCandidate(request.user.id, request.validated.body) } });
};

export const remove = async (request, response) => {
  await referralService.removeCandidate(request.user.id, request.validated.params.candidateId);
  response.status(204).send();
};
