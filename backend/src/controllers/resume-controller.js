import * as resumeService from '../services/resume-service.js';

export const upload = async (request, response) => {
  const resume = await resumeService.uploadAndExtractResume(request.user.id, request.file);
  response.status(201).json({ data: { resume } });
};

export const list = async (request, response) => {
  response.json({ data: { resumes: await resumeService.listResumes(request.user.id) } });
};

export const get = async (request, response) => {
  const resume = await resumeService.getResume(request.validated.params.resumeId, request.user.id);
  response.json({ data: { resume } });
};

export const rename = async (request, response) => {
  const resume = await resumeService.renameResume(
    request.validated.params.resumeId,
    request.user.id,
    request.validated.body.name,
  );
  response.json({ data: { resume } });
};

export const retry = async (request, response) => {
  const resume = await resumeService.retryExtraction(request.validated.params.resumeId, request.user.id);
  response.json({ data: { resume } });
};

export const confirm = async (request, response) => {
  const profile = await resumeService.confirmResumeProfile(
    request.validated.params.resumeId,
    request.user.id,
    request.validated.body.profile,
  );
  response.json({ data: { profile } });
};

export const download = async (request, response, next) => {
  const file = await resumeService.getResumeDownload(request.validated.params.resumeId, request.user.id);
  response.download(file.path, file.filename, (error) => {
    if (error && !response.headersSent) next(error);
  });
};

export const remove = async (request, response) => {
  await resumeService.removeResume(request.validated.params.resumeId, request.user.id);
  response.status(204).send();
};
