import * as jobService from '../services/job-service.js';

export const create = async (request, response) => {
  const job = await jobService.createAndAnalyzeJob(request.user.id, request.validated.body);
  response.status(201).json({ data: { job } });
};

export const list = async (request, response) => {
  response.json({ data: { jobs: await jobService.getJobs(request.user.id) } });
};

export const get = async (request, response) => {
  response.json({ data: { job: await jobService.getJob(request.validated.params.jobId, request.user.id) } });
};

export const retry = async (request, response) => {
  response.json({ data: { job: await jobService.retryJobAnalysis(request.validated.params.jobId, request.user.id) } });
};

export const remove = async (request, response) => {
  await jobService.removeJob(request.validated.params.jobId, request.user.id);
  response.status(204).send();
};
