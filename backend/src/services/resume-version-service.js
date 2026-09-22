import { findResumeVersion, listResumeVersions } from '../repositories/resume-version-repository.js';
import { AppError } from '../utils/app-error.js';
import { profileDataSchema } from '../validators/profile-validator.js';
import { generateDocx, generatePdf } from './resume-export-service.js';

export const presentVersion = (version) => ({
  id: version.id,
  sourceResumeId: version.source_resume_id,
  jobId: version.job_id,
  tailoringSessionId: version.tailoring_session_id,
  name: version.name,
  versionNumber: version.version_number,
  content: version.content,
  status: version.status,
  createdAt: version.created_at,
  updatedAt: version.updated_at,
});

export const getResumeVersion = async (versionId, userId) => {
  const version = await findResumeVersion(versionId, userId);
  if (!version) throw new AppError(404, 'RESUME_VERSION_NOT_FOUND', 'Resume version not found.');
  return presentVersion(version);
};

export const getResumeVersions = async (resumeId, userId) =>
  (await listResumeVersions(resumeId, userId)).map(presentVersion);

export const exportResumeVersion = async (versionId, userId, format) => {
  const version = await findResumeVersion(versionId, userId);
  if (!version) throw new AppError(404, 'RESUME_VERSION_NOT_FOUND', 'Resume version not found.');
  const content = profileDataSchema.parse(version.content);
  const buffer = format === 'pdf' ? await generatePdf(content) : await generateDocx(content);
  return {
    buffer,
    filename: `${version.name.replace(/[^a-z0-9 _-]/gi, '').trim() || 'tailored-resume'}.${format}`,
    contentType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
};
