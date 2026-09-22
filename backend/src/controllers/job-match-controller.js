import * as matchService from '../services/job-match-service.js';

export const run = async (request, response) => {
  const match = await matchService.runJobResumeMatch(
    request.validated.params.jobId,
    request.validated.body.resumeId,
    request.user.id,
  );
  response.status(201).json({ data: { match } });
};

export const getLatest = async (request, response) => {
  const match = await matchService.getLatestJobResumeMatch(
    request.validated.params.jobId,
    request.validated.params.resumeId,
    request.user.id,
  );
  response.json({ data: { match } });
};
