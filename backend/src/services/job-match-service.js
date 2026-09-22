import { createJobMatch, findLatestJobMatch } from '../repositories/job-match-repository.js';
import { findLatestJobAnalysis } from '../repositories/job-analysis-repository.js';
import { findResumeById } from '../repositories/resume-repository.js';
import { getProfile } from '../repositories/profile-repository.js';
import { AppError } from '../utils/app-error.js';
import { jobAnalysisSchema } from '../validators/job-analysis-validator.js';
import { profileDataSchema } from '../validators/profile-validator.js';
import { matchResumeToJob } from './job-matcher-service.js';
import { requireJob } from './job-service.js';

const presentMatch = (record) => record && ({
  id: record.id,
  jobId: record.job_id,
  resumeId: record.resume_id,
  matchScore: record.match_score,
  recommendation: record.recommendation,
  scoreBreakdown: record.score_breakdown,
  supported: record.supported,
  partial: record.partial,
  missing: record.missing,
  experienceMatch: record.experience_match,
  responsibilityMatch: record.responsibility_match,
  keywordMatch: record.keyword_match,
  matcherVersion: record.matcher_version,
  createdAt: record.created_at,
});

const requireInputs = async (jobId, resumeId, userId) => {
  const [job, jobAnalysisRecord, resume, profile] = await Promise.all([
    requireJob(jobId, userId),
    findLatestJobAnalysis(jobId, userId),
    findResumeById(resumeId, userId),
    getProfile(userId),
  ]);
  if (!jobAnalysisRecord) throw new AppError(409, 'JOB_NOT_ANALYZED', 'Analyze the job description before matching a resume.');
  if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume not found.');
  if (!resume.parsed_text || !resume.structured_data) throw new AppError(409, 'RESUME_NOT_ANALYZABLE', 'Complete resume extraction before matching it.');
  if (!profile) throw new AppError(409, 'CAREER_PROFILE_REQUIRED', 'Confirm your Career Profile before matching a resume.');
  return {
    job,
    jobAnalysis: jobAnalysisSchema.parse(jobAnalysisRecord.analysis),
    resume,
    resumeData: profileDataSchema.parse(resume.structured_data),
    profile,
  };
};

export const runJobResumeMatch = async (jobId, resumeId, userId) => {
  const inputs = await requireInputs(jobId, resumeId, userId);
  const result = matchResumeToJob(inputs);
  return presentMatch(await createJobMatch({ ...result, jobId, resumeId, userId }));
};

export const getLatestJobResumeMatch = async (jobId, resumeId, userId) => {
  await requireInputs(jobId, resumeId, userId);
  return presentMatch(await findLatestJobMatch(jobId, resumeId, userId));
};
