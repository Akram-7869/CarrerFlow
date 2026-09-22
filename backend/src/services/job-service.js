import { createJobAnalysis, findLatestJobAnalysis } from '../repositories/job-analysis-repository.js';
import { createJob, deleteJob, findJobById, listJobs, updateJob } from '../repositories/job-repository.js';
import { AppError } from '../utils/app-error.js';
import { analyzeJobDescription } from './job-analysis-service.js';

const presentAnalysis = (record) => record && ({
  id: record.id,
  ...record.analysis,
  extractionModel: record.extraction_model,
  extractionVersion: record.extraction_version,
  createdAt: record.created_at,
});

const presentJob = (job, analysis = null, includeDescription = false) => ({
  id: job.id,
  company: job.company,
  title: job.title,
  ...(includeDescription && { description: job.description }),
  location: job.location || '',
  workMode: job.work_mode,
  employmentType: job.employment_type || '',
  applyUrl: job.apply_url || '',
  source: job.source,
  sourceJobId: job.source_job_id || '',
  postedAt: job.posted_at,
  remote: Boolean(job.remote),
  tags: job.tags || [],
  status: job.status,
  analysisError: job.analysis_error,
  analysis: presentAnalysis(analysis),
  createdAt: job.created_at,
  updatedAt: job.updated_at,
});

const requireJob = async (jobId, userId) => {
  const job = await findJobById(jobId, userId);
  if (!job) throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found.');
  return job;
};

const runAnalysis = async (job) => {
  await updateJob(job.id, job.user_id, { status: 'analyzing', analysis_error: null });
  try {
    const result = await analyzeJobDescription(job.description);
    const analysis = await createJobAnalysis({
      job_id: job.id,
      user_id: job.user_id,
      analysis: JSON.stringify(result.analysis),
      extraction_model: result.model,
      extraction_version: result.version,
    });
    const updated = await updateJob(job.id, job.user_id, {
      status: 'ready',
      analysis_error: null,
      work_mode: result.analysis.workMode,
      employment_type: result.analysis.employmentType === 'unspecified' ? null : result.analysis.employmentType,
      location: job.location || result.analysis.location || null,
    });
    return presentJob(updated, analysis, true);
  } catch (error) {
    await updateJob(job.id, job.user_id, { status: 'failed', analysis_error: error.message });
    if (error instanceof AppError) error.details = { ...(error.details || {}), jobId: job.id };
    throw error;
  }
};

export const createAndAnalyzeJob = async (userId, input) => {
  const job = await createJob({
    user_id: userId,
    company: input.company,
    title: input.title,
    description: input.description,
    location: input.location || null,
    apply_url: input.applyUrl || null,
    source: 'manual',
    status: 'analyzing',
  });
  return runAnalysis(job);
};

export const retryJobAnalysis = async (jobId, userId) => runAnalysis(await requireJob(jobId, userId));

export const getJob = async (jobId, userId) => {
  const job = await requireJob(jobId, userId);
  const analysis = await findLatestJobAnalysis(jobId, userId);
  return presentJob(job, analysis, true);
};

export const getJobs = async (userId) => Promise.all((await listJobs(userId)).map(async (job) =>
  presentJob(job, await findLatestJobAnalysis(job.id, userId))));

export const removeJob = async (jobId, userId) => {
  await requireJob(jobId, userId);
  await deleteJob(jobId, userId);
};

export { requireJob, presentAnalysis, presentJob };
