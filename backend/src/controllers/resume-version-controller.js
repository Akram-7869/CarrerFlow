import * as versionService from '../services/resume-version-service.js';

export const get = async (request, response) => {
  response.json({ data: { version: await versionService.getResumeVersion(request.validated.params.versionId, request.user.id) } });
};

export const list = async (request, response) => {
  response.json({ data: { versions: await versionService.getResumeVersions(request.validated.params.resumeId, request.user.id) } });
};

export const download = async (request, response) => {
  const file = await versionService.exportResumeVersion(
    request.validated.params.versionId,
    request.user.id,
    request.validated.params.format,
  );
  response.setHeader('Content-Type', file.contentType);
  response.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  response.send(file.buffer);
};
