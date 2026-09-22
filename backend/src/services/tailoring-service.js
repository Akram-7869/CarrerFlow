import { findLatestJobAnalysis } from '../repositories/job-analysis-repository.js';
import { findLatestJobMatch } from '../repositories/job-match-repository.js';
import { getProfile } from '../repositories/profile-repository.js';
import { findResumeById } from '../repositories/resume-repository.js';
import { createResumeVersion, findVersionBySession, nextVersionNumber } from '../repositories/resume-version-repository.js';
import {
  createTailoringSession, findProposal, findTailoringSession, insertProposals, listProposals,
  updateProposal, updateTailoringSession,
} from '../repositories/tailoring-repository.js';
import { AppError } from '../utils/app-error.js';
import { jobAnalysisSchema } from '../validators/job-analysis-validator.js';
import { profileDataSchema } from '../validators/profile-validator.js';
import { requireJob } from './job-service.js';
import { generateTailoringProposals } from './tailoring-ai-service.js';
import {
  buildCareerEvidenceCorpus, resolveProposalTarget, validateSkillOrder, validateTailoredText,
} from './tailoring-guard-service.js';

const presentProposal = (proposal) => ({
  id: proposal.id,
  proposalType: proposal.proposal_type,
  sectionType: proposal.section_type,
  itemIndex: proposal.item_index,
  bulletIndex: proposal.bullet_index,
  originalText: proposal.original_text,
  proposedText: proposal.proposed_text,
  rationale: proposal.rationale,
  evidenceRefs: proposal.evidence_refs,
  status: proposal.status,
  editedText: proposal.edited_text,
});

const presentSession = (session, proposals, context = {}) => ({
  id: session.id,
  resumeId: session.resume_id,
  jobId: session.job_id,
  status: session.status,
  warnings: session.warnings,
  generationModel: session.generation_model,
  generationVersion: session.generation_version,
  generationError: session.generation_error,
  resumeName: context.resumeName,
  jobTitle: context.jobTitle,
  company: context.company,
  proposals: proposals.map(presentProposal),
  createdAt: session.created_at,
  updatedAt: session.updated_at,
});

const loadInputs = async (jobId, resumeId, userId) => {
  const [job, resume, jobAnalysisRecord, match, profile] = await Promise.all([
    requireJob(jobId, userId),
    findResumeById(resumeId, userId),
    findLatestJobAnalysis(jobId, userId),
    findLatestJobMatch(jobId, resumeId, userId),
    getProfile(userId),
  ]);
  if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume not found.');
  if (!resume.structured_data || !resume.parsed_text) throw new AppError(409, 'RESUME_NOT_ANALYZABLE', 'Complete resume extraction first.');
  if (!jobAnalysisRecord) throw new AppError(409, 'JOB_NOT_ANALYZED', 'Analyze the job first.');
  if (!match) throw new AppError(409, 'MATCH_REQUIRED', 'Run the resume-to-job match before tailoring.');
  if (!profile) throw new AppError(409, 'CAREER_PROFILE_REQUIRED', 'Confirm your Career Profile before tailoring.');
  return {
    job,
    resume,
    resumeData: profileDataSchema.parse(resume.structured_data),
    jobAnalysis: jobAnalysisSchema.parse(jobAnalysisRecord.analysis),
    match,
    profile,
  };
};

const buildValidatedProposals = (generated, inputs) => {
  const proposals = [];
  const warnings = [...generated.warnings];
  const evidenceCorpus = buildCareerEvidenceCorpus(inputs);
  const forbiddenSkills = [...inputs.match.partial, ...inputs.match.missing].map((item) => item.requirement);
  const addTextProposal = (proposal) => {
    const target = resolveProposalTarget(inputs.resumeData, proposal);
    if (target === null || target.trim() !== proposal.originalText.trim()) {
      warnings.push(`A ${proposal.sectionType} proposal was blocked because its source text did not match the resume.`);
      return;
    }
    const validation = validateTailoredText({
      proposedText: proposal.proposedText,
      evidenceRefs: proposal.evidenceRefs,
      evidenceCorpus,
      forbiddenSkills,
    });
    if (!validation.valid) {
      warnings.push(`A ${proposal.sectionType} proposal was blocked: ${validation.errors.join(' ')}`);
      return;
    }
    if (proposal.proposedText.trim() === proposal.originalText.trim()) return;
    proposals.push(proposal);
  };

  if (generated.summaryProposal) {
    addTextProposal({
      proposalType: 'summary', sectionType: 'summary', itemIndex: null, bulletIndex: null,
      ...generated.summaryProposal,
    });
  }
  for (const proposal of generated.bulletProposals) {
    addTextProposal({ proposalType: 'bullet_rewrite', ...proposal });
  }

  const skillOrder = validateSkillOrder(inputs.resumeData, generated.skillOrder);
  const originalOrder = inputs.resumeData.skills.map((skill) => skill.name);
  if (skillOrder.length && JSON.stringify(skillOrder) !== JSON.stringify(originalOrder)) {
    proposals.unshift({
      proposalType: 'skill_reorder', sectionType: 'skills', itemIndex: null, bulletIndex: null,
      originalText: JSON.stringify(originalOrder), proposedText: JSON.stringify(skillOrder),
      rationale: 'Prioritize existing, supported skills that are most relevant to this job.',
      evidenceRefs: skillOrder,
    });
  }
  return { proposals, warnings };
};

export const createTailoring = async (jobId, resumeId, userId) => {
  const inputs = await loadInputs(jobId, resumeId, userId);
  const session = await createTailoringSession({
    user_id: userId, resume_id: resumeId, job_id: jobId,
    job_resume_match_id: inputs.match.id, status: 'generating',
  });
  try {
    const generated = await generateTailoringProposals(inputs);
    const validated = buildValidatedProposals(generated.result, inputs);
    const proposals = await insertProposals(session.id, validated.proposals);
    const updated = await updateTailoringSession(session.id, userId, {
      status: 'review',
      warnings: JSON.stringify(validated.warnings),
      generation_model: generated.model,
      generation_version: generated.version,
      generation_error: null,
    });
    return presentSession(updated, proposals, {
      resumeName: inputs.resume.name, jobTitle: inputs.job.title, company: inputs.job.company,
    });
  } catch (error) {
    await updateTailoringSession(session.id, userId, { status: 'failed', generation_error: error.message });
    if (error instanceof AppError) error.details = { ...(error.details || {}), sessionId: session.id };
    throw error;
  }
};

export const getTailoring = async (sessionId, userId) => {
  const session = await findTailoringSession(sessionId, userId);
  if (!session) throw new AppError(404, 'TAILORING_NOT_FOUND', 'Tailoring session not found.');
  const [proposals, resume, job] = await Promise.all([
    listProposals(sessionId), findResumeById(session.resume_id, userId), requireJob(session.job_id, userId),
  ]);
  return presentSession(session, proposals, { resumeName: resume.name, jobTitle: job.title, company: job.company });
};

export const reviewProposal = async (sessionId, proposalId, userId, action) => {
  const session = await findTailoringSession(sessionId, userId);
  if (!session) throw new AppError(404, 'TAILORING_NOT_FOUND', 'Tailoring session not found.');
  if (session.status !== 'review') throw new AppError(409, 'TAILORING_NOT_REVIEWABLE', 'This tailoring session is not open for review.');
  const proposal = await findProposal(proposalId, sessionId);
  if (!proposal) throw new AppError(404, 'PROPOSAL_NOT_FOUND', 'Change proposal not found.');

  if (action.status === 'edited') {
    if (proposal.proposal_type === 'skill_reorder') throw new AppError(400, 'SKILL_ORDER_NOT_EDITABLE', 'Accept or reject the skill-order proposal.');
    const inputs = await loadInputs(session.job_id, session.resume_id, userId);
    const evidenceCorpus = buildCareerEvidenceCorpus(inputs);
    const forbiddenSkills = [...inputs.match.partial, ...inputs.match.missing].map((item) => item.requirement);
    const validation = validateTailoredText({
      proposedText: action.editedText,
      evidenceRefs: proposal.evidence_refs,
      evidenceCorpus,
      forbiddenSkills,
    });
    if (!validation.valid) throw new AppError(422, 'EDIT_NOT_GROUNDED', 'The edited text introduces unsupported content.', validation.errors);
  }

  return presentProposal(await updateProposal(proposalId, sessionId, {
    status: action.status,
    edited_text: action.status === 'edited' ? action.editedText : null,
  }));
};

const applyProposal = (content, proposal) => {
  const text = proposal.status === 'edited' ? proposal.edited_text : proposal.proposed_text;
  if (proposal.proposal_type === 'summary') content.summary = text;
  if (proposal.proposal_type === 'skill_reorder') {
    const order = JSON.parse(text);
    const positions = new Map(order.map((name, index) => [name.toLowerCase(), index]));
    content.skills.sort((a, b) => (positions.get(a.name.toLowerCase()) ?? 999) - (positions.get(b.name.toLowerCase()) ?? 999));
  }
  if (proposal.proposal_type === 'bullet_rewrite') {
    const collection = proposal.section_type === 'experience' ? content.experiences : content.projects;
    if (proposal.bullet_index === -1) collection[proposal.item_index].description = text;
    else collection[proposal.item_index].highlights[proposal.bullet_index] = text;
  }
};

export const completeTailoring = async (sessionId, userId) => {
  const session = await findTailoringSession(sessionId, userId);
  if (!session) throw new AppError(404, 'TAILORING_NOT_FOUND', 'Tailoring session not found.');
  const existing = await findVersionBySession(sessionId, userId);
  if (existing) return existing;
  const proposals = await listProposals(sessionId);
  if (proposals.some((proposal) => proposal.status === 'pending')) {
    throw new AppError(409, 'REVIEW_INCOMPLETE', 'Accept or reject every proposed change before creating the version.');
  }
  const [resume, job] = await Promise.all([
    findResumeById(session.resume_id, userId), requireJob(session.job_id, userId),
  ]);
  const content = structuredClone(profileDataSchema.parse(resume.structured_data));
  for (const proposal of proposals.filter((item) => ['accepted', 'edited'].includes(item.status))) applyProposal(content, proposal);
  const versionNumber = await nextVersionNumber(resume.id);
  const version = await createResumeVersion({
    user_id: userId,
    source_resume_id: resume.id,
    job_id: job.id,
    tailoring_session_id: session.id,
    name: `${resume.name} — ${job.company} Tailored`,
    version_number: versionNumber,
    content: JSON.stringify(content),
    status: 'ready',
  });
  await updateTailoringSession(sessionId, userId, { status: 'completed' });
  return version;
};
