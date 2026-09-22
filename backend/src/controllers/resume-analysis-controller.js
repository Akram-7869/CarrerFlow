import * as analysisService from '../services/resume-analysis-service.js';

export const getLatest = async (request, response) => {
  const analysis = await analysisService.getLatestResumeAnalysis(request.validated.params.resumeId, request.user.id);
  response.json({ data: { analysis } });
};

export const run = async (request, response) => {
  const analysis = await analysisService.runResumeAnalysis(request.validated.params.resumeId, request.user.id);
  response.status(201).json({ data: { analysis } });
};
