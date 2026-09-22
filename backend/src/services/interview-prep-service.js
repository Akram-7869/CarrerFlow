import { findApplicationById } from '../repositories/application-repository.js';
import { findInterviewPrepByApplication, updateInterviewPrepProgress, upsertInterviewPrep } from '../repositories/interview-prep-repository.js';
import { findLatestJobAnalysis } from '../repositories/job-analysis-repository.js';
import { findLatestJobMatch } from '../repositories/job-match-repository.js';
import { getProfile } from '../repositories/profile-repository.js';
import { findResumeById } from '../repositories/resume-repository.js';
import { findResumeVersion } from '../repositories/resume-version-repository.js';
import { AppError } from '../utils/app-error.js';
import { jobAnalysisSchema } from '../validators/job-analysis-validator.js';
import { profileDataSchema } from '../validators/profile-validator.js';
import { requireJob } from './job-service.js';
import { generateGroundedInterviewPrep } from './interview-prep-ai-service.js';

const present = (record) => record && ({
  id: record.id,
  applicationId: record.application_id,
  questionSet: record.question_set,
  answerNotes: record.answer_notes || {},
  completedQuestions: record.completed_questions || [],
  warnings: record.warnings || [],
  model: record.model,
  generationVersion: record.generation_version,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const requireApplication = async (applicationId, userId) => {
  const application = await findApplicationById(applicationId, userId);
  if (!application) throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Application preparation not found.');
  return application;
};

const loadInputs = async (applicationId, userId) => {
  const application = await requireApplication(applicationId, userId);
  const [job, analysisRecord, resume, version, profile, match] = await Promise.all([
    requireJob(application.job_id, userId),
    findLatestJobAnalysis(application.job_id, userId),
    findResumeById(application.resume_id, userId),
    application.resume_version_id ? findResumeVersion(application.resume_version_id, userId) : null,
    getProfile(userId),
    findLatestJobMatch(application.job_id, application.resume_id, userId),
  ]);
  if (!analysisRecord) throw new AppError(409, 'JOB_NOT_ANALYZED', 'Analyze the job before generating interview preparation.');
  if (!resume?.structured_data || !resume.parsed_text) throw new AppError(409, 'RESUME_NOT_READY', 'Complete resume extraction first.');
  if (!profile) throw new AppError(409, 'CAREER_PROFILE_REQUIRED', 'Confirm your Career Profile first.');
  return {
    application,
    job,
    jobAnalysis: jobAnalysisSchema.parse(analysisRecord.analysis),
    resumeContent: profileDataSchema.parse(version?.content || resume.structured_data),
    profile,
    match,
  };
};

export const getInterviewPrep = async (userId, applicationId) => {
  await requireApplication(applicationId, userId);
  return present(await findInterviewPrepByApplication(applicationId, userId));
};

export const generateInterviewPrep = async (userId, applicationId, force = false) => {
  const existing = await findInterviewPrepByApplication(applicationId, userId);
  if (existing && !force) return present(existing);
  const inputs = await loadInputs(applicationId, userId);
  const generated = await generateGroundedInterviewPrep(inputs);
  const record = await upsertInterviewPrep({
    application_id: inputs.application.id,
    user_id: userId,
    question_set: JSON.stringify(generated.result),
    answer_notes: JSON.stringify(existing?.answer_notes || {}),
    completed_questions: JSON.stringify(existing?.completed_questions || []),
    warnings: JSON.stringify(generated.result.warnings),
    model: generated.model,
    generation_version: generated.version,
  });
  return present(record);
};

export const saveInterviewPrepProgress = async (userId, applicationId, input) => {
  await requireApplication(applicationId, userId);
  const existing = await findInterviewPrepByApplication(applicationId, userId);
  if (!existing) throw new AppError(404, 'INTERVIEW_PREP_NOT_FOUND', 'Generate interview preparation before saving progress.');
  const knownIds = new Set(existing.question_set.categories.flatMap((category) => category.questions.map((question) => question.id)));
  const answerNotes = Object.fromEntries(Object.entries(input.answerNotes).filter(([id]) => knownIds.has(id)));
  const completedQuestions = [...new Set(input.completedQuestions)].filter((id) => knownIds.has(id));
  return present(await updateInterviewPrepProgress(applicationId, userId, {
    answer_notes: JSON.stringify(answerNotes),
    completed_questions: JSON.stringify(completedQuestions),
  }));
};
