import * as interviewPrepService from '../services/interview-prep-service.js';

export const get = async (request, response) => {
  const prep = await interviewPrepService.getInterviewPrep(request.user.id, request.validated.params.applicationId);
  response.json({ data: { prep } });
};

export const generate = async (request, response) => {
  const prep = await interviewPrepService.generateInterviewPrep(
    request.user.id,
    request.validated.params.applicationId,
    request.validated.body.force,
  );
  response.status(201).json({ data: { prep } });
};

export const update = async (request, response) => {
  const prep = await interviewPrepService.saveInterviewPrepProgress(
    request.user.id,
    request.validated.params.applicationId,
    request.validated.body,
  );
  response.json({ data: { prep } });
};
