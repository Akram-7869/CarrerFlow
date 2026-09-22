import { db } from '../config/database.js';

export const nextVersionNumber = async (sourceResumeId) => {
  const result = await db('resume_versions').where({ source_resume_id: sourceResumeId }).max('version_number as maximum').first();
  return Number(result?.maximum || 0) + 1;
};

export const createResumeVersion = async (data) => {
  const [version] = await db('resume_versions').insert(data).returning('*');
  return version;
};

export const findResumeVersion = (versionId, userId) =>
  db('resume_versions').where({ id: versionId, user_id: userId }).first();

export const findVersionBySession = (sessionId, userId) =>
  db('resume_versions').where({ tailoring_session_id: sessionId, user_id: userId }).first();

export const listResumeVersions = (sourceResumeId, userId) =>
  db('resume_versions').where({ source_resume_id: sourceResumeId, user_id: userId }).orderBy('version_number', 'desc');
