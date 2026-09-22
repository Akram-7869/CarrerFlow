import * as applicationService from '../services/application-service.js';

export const prepare = async (request, response) => {
  const application = await applicationService.prepareApplication(request.user.id, request.validated.body);
  response.status(201).json({ data: { application } });
};

export const list = async (request, response) => {
  const applications = await applicationService.getApplications(request.user.id, request.validated.query.status);
  response.json({ data: { applications } });
};

export const get = async (request, response) => {
  const application = await applicationService.getApplicationPreparation(request.user.id, request.validated.params.applicationId);
  response.json({ data: { application } });
};

export const update = async (request, response) => {
  const existing = await applicationService.getApplicationPreparation(request.user.id, request.validated.params.applicationId);
  const application = await applicationService.prepareApplication(request.user.id, { jobId: existing.job.id, ...request.validated.body });
  response.json({ data: { application } });
};

export const generateCoverLetter = async (request, response) => {
  const application = await applicationService.createCoverLetter(request.user.id, request.validated.params.applicationId, request.validated.body.tone);
  response.json({ data: { application } });
};

export const updateCoverLetter = async (request, response) => {
  const application = await applicationService.editCoverLetter(request.user.id, request.validated.params.applicationId, request.validated.body.coverLetter);
  response.json({ data: { application } });
};

export const updateStatus = async (request, response) => {
  const application = await applicationService.changeApplicationStatus(request.user.id, request.validated.params.applicationId, request.validated.body);
  response.json({ data: { application } });
};

export const updateNotes = async (request, response) => {
  const application = await applicationService.saveApplicationNotes(request.user.id, request.validated.params.applicationId, request.validated.body.notes);
  response.json({ data: { application } });
};

export const createEvent = async (request, response) => {
  const event = await applicationService.addApplicationEvent(request.user.id, request.validated.params.applicationId, request.validated.body);
  response.status(201).json({ data: { event } });
};

export const updateEvent = async (request, response) => {
  const event = await applicationService.editApplicationEvent(request.user.id, request.validated.params.eventId, request.validated.body);
  response.json({ data: { event } });
};

export const removeEvent = async (request, response) => {
  await applicationService.removeApplicationEvent(request.user.id, request.validated.params.eventId);
  response.status(204).send();
};
