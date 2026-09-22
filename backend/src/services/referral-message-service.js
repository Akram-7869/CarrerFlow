import { findLatestJobAnalysis } from '../repositories/job-analysis-repository.js';
import { findResumeById } from '../repositories/resume-repository.js';
import { getProfile } from '../repositories/profile-repository.js';
import { findCandidateById } from '../repositories/referral-repository.js';
import { createMessage, deleteMessage, findMessageById, listMessages, updateMessage } from '../repositories/referral-message-repository.js';
import { AppError } from '../utils/app-error.js';
import { jobAnalysisSchema } from '../validators/job-analysis-validator.js';
import { profileDataSchema } from '../validators/profile-validator.js';
import { buildCareerEvidenceCorpus } from './tailoring-guard-service.js';
import { generateReferralMessage } from './referral-message-ai-service.js';
import { unsupportedJobSkills, validateReferralMessage } from './referral-message-guard-service.js';
import { requireJob } from './job-service.js';

const presentMessage = (record) => ({
  id: record.id,
  candidateId: record.candidate_id,
  jobId: record.job_id,
  resumeId: record.resume_id,
  message: record.message,
  generatedMessage: record.generated_message,
  tone: record.tone,
  evidenceRefs: record.evidence_refs,
  warnings: record.warnings,
  isEdited: record.is_edited,
  generationModel: record.generation_model,
  generationVersion: record.generation_version,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const requireCandidate = async (candidateId, userId) => {
  const candidate = await findCandidateById(candidateId, userId);
  if (!candidate) throw new AppError(404, 'REFERRAL_CANDIDATE_NOT_FOUND', 'Referral candidate not found.');
  return candidate;
};

const loadGroundedInputs = async (candidateId, resumeId, userId) => {
  const candidate = await requireCandidate(candidateId, userId);
  const [job, jobAnalysisRecord, resume, profile] = await Promise.all([
    requireJob(candidate.job_id, userId),
    findLatestJobAnalysis(candidate.job_id, userId),
    findResumeById(resumeId, userId),
    getProfile(userId),
  ]);
  if (!jobAnalysisRecord) throw new AppError(409, 'JOB_NOT_ANALYZED', 'Analyze the job before generating a referral message.');
  if (!resume?.parsed_text || !resume.structured_data) throw new AppError(409, 'RESUME_NOT_READY', 'Select an extracted resume.');
  if (!profile) throw new AppError(409, 'CAREER_PROFILE_REQUIRED', 'Confirm your Career Profile first.');
  const resumeData = profileDataSchema.parse(resume.structured_data);
  const jobAnalysis = jobAnalysisSchema.parse(jobAnalysisRecord.analysis);
  const evidenceCorpus = buildCareerEvidenceCorpus({ profile, resume, resumeData });
  return { candidate, job, jobAnalysis, resume, resumeData, profile, evidenceCorpus };
};

export const generateMessage = async (userId, candidateId, { resumeId, tone }) => {
  const inputs = await loadGroundedInputs(candidateId, resumeId, userId);
  const generated = await generateReferralMessage({ ...inputs, tone });
  const forbiddenSkills = unsupportedJobSkills(inputs.jobAnalysis, inputs.evidenceCorpus);
  const validation = validateReferralMessage({
    message: generated.result.message,
    evidenceRefs: generated.result.evidenceRefs,
    evidenceCorpus: inputs.evidenceCorpus,
    forbiddenSkills,
  });
  if (!validation.valid) {
    throw new AppError(422, 'UNSAFE_REFERRAL_MESSAGE', 'The generated message failed CareerFlow grounding checks. Please generate another draft.', { errors: validation.errors });
  }

  return presentMessage(await createMessage({
    user_id: userId,
    job_id: inputs.job.id,
    candidate_id: candidateId,
    resume_id: resumeId,
    generated_message: generated.result.message,
    message: generated.result.message,
    tone,
    evidence_refs: JSON.stringify(generated.result.evidenceRefs),
    warnings: JSON.stringify(generated.result.warnings),
    generation_model: generated.model,
    generation_version: generated.version,
  }));
};

export const getMessages = async (userId, candidateId) => {
  await requireCandidate(candidateId, userId);
  return (await listMessages(userId, candidateId)).map(presentMessage);
};

export const editMessage = async (userId, messageId, text) => {
  const existing = await findMessageById(messageId, userId);
  if (!existing) throw new AppError(404, 'REFERRAL_MESSAGE_NOT_FOUND', 'Referral message not found.');
  const inputs = await loadGroundedInputs(existing.candidate_id, existing.resume_id, userId);
  const validation = validateReferralMessage({
    message: text,
    evidenceRefs: existing.evidence_refs,
    evidenceCorpus: inputs.evidenceCorpus,
    forbiddenSkills: unsupportedJobSkills(inputs.jobAnalysis, inputs.evidenceCorpus),
  });
  if (!validation.valid) throw new AppError(422, 'UNSAFE_REFERRAL_MESSAGE', 'The edited message failed CareerFlow grounding checks.', { errors: validation.errors });
  return presentMessage(await updateMessage(messageId, userId, { message: text, is_edited: text !== existing.generated_message }));
};

export const removeMessage = async (userId, messageId) => {
  if (!await deleteMessage(messageId, userId)) throw new AppError(404, 'REFERRAL_MESSAGE_NOT_FOUND', 'Referral message not found.');
};

export { requireCandidate };
