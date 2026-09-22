import {
  createEvent, createStatusHistory, deleteEvent, findApplicationById, findApplicationByJob, findEventById,
  listApplications, listEvents, listStatusHistory, transitionApplication, updateApplication, updateEvent, upsertApplication,
} from '../repositories/application-repository.js';
import { findLatestJobAnalysis } from '../repositories/job-analysis-repository.js';
import { findLatestJobMatch } from '../repositories/job-match-repository.js';
import { getProfile } from '../repositories/profile-repository.js';
import { findCandidateById } from '../repositories/referral-repository.js';
import { findMessageById } from '../repositories/referral-message-repository.js';
import { findLatestResumeAnalysis } from '../repositories/resume-analysis-repository.js';
import { findResumeById } from '../repositories/resume-repository.js';
import { findResumeVersion } from '../repositories/resume-version-repository.js';
import { AppError } from '../utils/app-error.js';
import { jobAnalysisSchema } from '../validators/job-analysis-validator.js';
import { profileDataSchema } from '../validators/profile-validator.js';
import { buildCareerEvidenceCorpus, validateTailoredText } from './tailoring-guard-service.js';
import { generateGroundedCoverLetter } from './cover-letter-ai-service.js';
import { unsupportedJobSkills } from './referral-message-guard-service.js';
import { requireJob } from './job-service.js';

const presentAts = (record) => record && ({
  id: record.id,
  overallScore: record.overall_score,
  rating: record.rating,
  issues: record.issues,
  suggestions: record.suggestions,
  analyzerVersion: record.analyzer_version,
});

const presentMatch = (record) => record && ({
  id: record.id,
  matchScore: record.match_score,
  recommendation: record.recommendation,
  supported: record.supported,
  partial: record.partial,
  missing: record.missing,
  matcherVersion: record.matcher_version,
});

const presentHistory = (record) => ({
  id: record.id,
  fromStatus: record.from_status,
  toStatus: record.to_status,
  note: record.note || '',
  occurredAt: record.occurred_at,
});

const presentEvent = (record) => ({
  id: record.id,
  eventType: record.event_type,
  title: record.title,
  scheduledAt: record.scheduled_at,
  notes: record.notes || '',
  completedAt: record.completed_at,
  completed: Boolean(record.completed_at),
});

const requireApplication = async (applicationId, userId) => {
  const application = await findApplicationById(applicationId, userId);
  if (!application) throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Application preparation not found.');
  return application;
};

const validateSelections = async (userId, input) => {
  const [job, resume, version, candidate, message] = await Promise.all([
    requireJob(input.jobId, userId),
    findResumeById(input.resumeId, userId),
    input.resumeVersionId ? findResumeVersion(input.resumeVersionId, userId) : null,
    input.referralCandidateId ? findCandidateById(input.referralCandidateId, userId) : null,
    input.referralMessageId ? findMessageById(input.referralMessageId, userId) : null,
  ]);
  if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume not found.');
  if (version && (version.source_resume_id !== resume.id || version.job_id !== job.id)) {
    throw new AppError(400, 'INVALID_RESUME_VERSION', 'The tailored resume version does not belong to this resume and job.');
  }
  if (input.resumeVersionId && !version) throw new AppError(404, 'RESUME_VERSION_NOT_FOUND', 'Resume version not found.');
  if (input.referralCandidateId && (!candidate || candidate.job_id !== job.id)) {
    throw new AppError(400, 'INVALID_REFERRAL_CANDIDATE', 'The referral candidate does not belong to this job.');
  }
  if (input.referralMessageId && (!message || !candidate || message.candidate_id !== candidate.id || message.job_id !== job.id)) {
    throw new AppError(400, 'INVALID_REFERRAL_MESSAGE', 'The referral message does not belong to the selected candidate and job.');
  }
  return { job, resume, version, candidate, message };
};

const assemble = async (application, userId) => {
  const [job, resume, version, match, ats, candidate, message, history, events] = await Promise.all([
    requireJob(application.job_id, userId),
    findResumeById(application.resume_id, userId),
    application.resume_version_id ? findResumeVersion(application.resume_version_id, userId) : null,
    application.job_resume_match_id ? findLatestJobMatch(application.job_id, application.resume_id, userId) : null,
    application.resume_analysis_id ? findLatestResumeAnalysis(application.resume_id, userId) : null,
    application.referral_candidate_id ? findCandidateById(application.referral_candidate_id, userId) : null,
    application.referral_message_id ? findMessageById(application.referral_message_id, userId) : null,
    listStatusHistory(application.id, userId),
    listEvents(application.id, userId),
  ]);
  const checklist = {
    jobAnalyzed: job.status === 'ready',
    resumeSelected: Boolean(resume),
    atsChecked: Boolean(ats),
    jobMatched: Boolean(match),
    tailoredVersionSelected: Boolean(version),
    referralSelected: Boolean(candidate),
    referralMessageReady: Boolean(message),
    coverLetterReady: Boolean(application.cover_letter),
    applicationUrlAvailable: Boolean(job.apply_url),
  };
  return {
    id: application.id,
    status: application.status,
    notes: application.notes || '',
    job: { id: job.id, company: job.company, title: job.title, location: job.location || '', applyUrl: job.apply_url || '', status: job.status },
    resume: { id: resume.id, name: resume.name, status: resume.status },
    resumeVersion: version && { id: version.id, name: version.name, versionNumber: version.version_number },
    ats: presentAts(ats),
    match: presentMatch(match),
    referralCandidate: candidate && { id: candidate.id, name: candidate.name, currentRole: candidate.current_role || '', profileUrl: candidate.profile_url },
    referralMessage: message && { id: message.id, message: message.message },
    coverLetter: application.cover_letter || '',
    coverLetterEvidenceRefs: application.cover_letter_evidence_refs,
    coverLetterWarnings: application.cover_letter_warnings,
    coverLetterEdited: application.cover_letter_edited,
    appliedAt: application.applied_at,
    lastStatusChangedAt: application.last_status_changed_at,
    statusHistory: history.map(presentHistory),
    events: events.map(presentEvent),
    checklist,
    createdAt: application.created_at,
    updatedAt: application.updated_at,
  };
};

export const prepareApplication = async (userId, input) => {
  await validateSelections(userId, input);
  const [match, ats, existing] = await Promise.all([
    findLatestJobMatch(input.jobId, input.resumeId, userId),
    findLatestResumeAnalysis(input.resumeId, userId),
    findApplicationByJob(input.jobId, userId),
  ]);
  let record = await upsertApplication({
    user_id: userId,
    job_id: input.jobId,
    resume_id: input.resumeId,
    resume_version_id: input.resumeVersionId,
    job_resume_match_id: match?.id || null,
    resume_analysis_id: ats?.id || null,
    referral_candidate_id: input.referralCandidateId,
    referral_message_id: input.referralMessageId,
    status: 'preparing',
    notes: input.notes || null,
  });
  if (!existing) {
    await createStatusHistory({
      application_id: record.id,
      user_id: userId,
      from_status: null,
      to_status: 'preparing',
      note: 'Application preparation created.',
      occurred_at: record.created_at,
    });
  }
  if (existing && (existing.resume_id !== input.resumeId || existing.resume_version_id !== input.resumeVersionId)) {
    record = await updateApplication(record.id, userId, {
      cover_letter: null,
      generated_cover_letter: null,
      cover_letter_evidence_refs: JSON.stringify([]),
      cover_letter_warnings: JSON.stringify([]),
      cover_letter_model: null,
      cover_letter_version: null,
      cover_letter_edited: false,
    });
  }
  return assemble(record, userId);
};

export const getApplicationPreparation = async (userId, applicationId) =>
  assemble(await requireApplication(applicationId, userId), userId);

export const getApplications = async (userId, status) =>
  Promise.all((await listApplications(userId, status)).map((application) => assemble(application, userId)));

export const changeApplicationStatus = async (userId, applicationId, input) => {
  const application = await requireApplication(applicationId, userId);
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const updated = await transitionApplication(application, userId, input.status, input.note, occurredAt);
  return assemble(updated, userId);
};

export const saveApplicationNotes = async (userId, applicationId, notes) => {
  await requireApplication(applicationId, userId);
  return assemble(await updateApplication(applicationId, userId, { notes: notes || null }), userId);
};

export const addApplicationEvent = async (userId, applicationId, input) => {
  await requireApplication(applicationId, userId);
  const event = await createEvent({
    application_id: applicationId,
    user_id: userId,
    event_type: input.eventType,
    title: input.title,
    scheduled_at: new Date(input.scheduledAt),
    notes: input.notes || null,
  });
  return presentEvent(event);
};

export const editApplicationEvent = async (userId, eventId, input) => {
  const event = await findEventById(eventId, userId);
  if (!event) throw new AppError(404, 'APPLICATION_EVENT_NOT_FOUND', 'Application event not found.');
  return presentEvent(await updateEvent(eventId, userId, {
    event_type: input.eventType,
    title: input.title,
    scheduled_at: new Date(input.scheduledAt),
    notes: input.notes || null,
    completed_at: input.completed ? (event.completed_at || new Date()) : null,
  }));
};

export const removeApplicationEvent = async (userId, eventId) => {
  if (!await deleteEvent(eventId, userId)) throw new AppError(404, 'APPLICATION_EVENT_NOT_FOUND', 'Application event not found.');
};

const loadCoverLetterInputs = async (applicationId, userId) => {
  const application = await requireApplication(applicationId, userId);
  const [job, analysisRecord, resume, version, profile, match] = await Promise.all([
    requireJob(application.job_id, userId),
    findLatestJobAnalysis(application.job_id, userId),
    findResumeById(application.resume_id, userId),
    application.resume_version_id ? findResumeVersion(application.resume_version_id, userId) : null,
    getProfile(userId),
    findLatestJobMatch(application.job_id, application.resume_id, userId),
  ]);
  if (!analysisRecord) throw new AppError(409, 'JOB_NOT_ANALYZED', 'Analyze the job before generating a cover letter.');
  if (!resume?.structured_data || !resume.parsed_text) throw new AppError(409, 'RESUME_NOT_READY', 'Complete resume extraction first.');
  if (!profile) throw new AppError(409, 'CAREER_PROFILE_REQUIRED', 'Confirm your Career Profile first.');
  const resumeContent = profileDataSchema.parse(version?.content || resume.structured_data);
  const jobAnalysis = jobAnalysisSchema.parse(analysisRecord.analysis);
  const evidenceCorpus = buildCareerEvidenceCorpus({ profile, resume, resumeData: resumeContent });
  return { application, job, jobAnalysis, resume, resumeContent, profile, match, evidenceCorpus };
};

export const createCoverLetter = async (userId, applicationId, tone) => {
  const inputs = await loadCoverLetterInputs(applicationId, userId);
  const generated = await generateGroundedCoverLetter({ ...inputs, tone });
  const forbiddenSkills = inputs.match
    ? [...inputs.match.partial, ...inputs.match.missing].map((item) => item.requirement)
    : unsupportedJobSkills(inputs.jobAnalysis, inputs.evidenceCorpus);
  const validation = validateTailoredText({
    proposedText: generated.result.coverLetter,
    evidenceRefs: generated.result.evidenceRefs,
    evidenceCorpus: inputs.evidenceCorpus,
    forbiddenSkills,
  });
  if (!validation.valid) throw new AppError(422, 'UNSAFE_COVER_LETTER', 'The generated cover letter failed CareerFlow grounding checks.', { errors: validation.errors });
  const updated = await updateApplication(applicationId, userId, {
    cover_letter: generated.result.coverLetter,
    generated_cover_letter: generated.result.coverLetter,
    cover_letter_evidence_refs: JSON.stringify(generated.result.evidenceRefs),
    cover_letter_warnings: JSON.stringify(generated.result.warnings),
    cover_letter_model: generated.model,
    cover_letter_version: generated.version,
    cover_letter_edited: false,
  });
  return assemble(updated, userId);
};

export const editCoverLetter = async (userId, applicationId, coverLetter) => {
  const inputs = await loadCoverLetterInputs(applicationId, userId);
  const forbiddenSkills = inputs.match
    ? [...inputs.match.partial, ...inputs.match.missing].map((item) => item.requirement)
    : unsupportedJobSkills(inputs.jobAnalysis, inputs.evidenceCorpus);
  const validation = validateTailoredText({
    proposedText: coverLetter,
    evidenceRefs: inputs.application.cover_letter_evidence_refs,
    evidenceCorpus: inputs.evidenceCorpus,
    forbiddenSkills,
  });
  if (!validation.valid) throw new AppError(422, 'UNSAFE_COVER_LETTER', 'The edited cover letter introduces unsupported content.', { errors: validation.errors });
  const updated = await updateApplication(applicationId, userId, {
    cover_letter: coverLetter,
    cover_letter_edited: coverLetter !== inputs.application.generated_cover_letter,
  });
  return assemble(updated, userId);
};
