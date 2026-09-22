import { loadCopilotRecords } from '../repositories/copilot-repository.js';
import { AppError } from '../utils/app-error.js';
import { answerCareerQuestion } from './copilot-ai-service.js';

const compact = (value, length = 900) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, length);
const names = (items, key = 'name', limit = 5) => (Array.isArray(items) ? items.map((item) => item?.[key] || item).filter(Boolean).slice(0, limit).join(', ') : '');
const requirements = (items, limit = 5) => (Array.isArray(items) ? items.map((item) => item.requirement).filter(Boolean).slice(0, limit).join(', ') : '');

const tokenize = (text) => new Set(compact(text).toLowerCase().split(/[^a-z0-9+#.]+/).filter((word) => word.length > 2));

const scoreChunk = (questionTokens, chunk) => {
  const chunkTokens = tokenize(`${chunk.title} ${chunk.text}`);
  let score = 0;
  for (const token of questionTokens) if (chunkTokens.has(token)) score += 1;
  return score;
};

const buildChunks = ({ resumes, versions, jobs, matches, applications, interviewPreps }) => {
  const chunks = [];
  resumes.forEach((resume, index) => {
    const profile = resume.structured_data || {};
    chunks.push({
      id: `R${index + 1}`,
      type: 'resume',
      title: resume.name,
      text: `Resume ${resume.name}. Status ${resume.status}. Skills: ${names(profile.skills)}. Experience: ${names(profile.experience || profile.experiences, 'company', 3)}. Summary: ${compact(profile.summary || resume.parsed_text, 320)}`,
      source: { kind: 'resume', id: resume.id },
    });
  });
  versions.forEach((version, index) => {
    const content = version.content || {};
    chunks.push({
      id: `V${index + 1}`,
      type: 'tailored_resume_version',
      title: version.name,
      text: `Tailored resume version ${version.name}. Version ${version.version_number}. Skills: ${names(content.skills)}. Summary: ${compact(content.summary, 320)}`,
      source: { kind: 'resume_version', id: version.id },
    });
  });
  jobs.forEach((job, index) => {
    chunks.push({
      id: `J${index + 1}`,
      type: 'job',
      title: `${job.company} - ${job.title}`,
      text: `Job ${job.title} at ${job.company}. Location ${job.location || 'unspecified'}. Status ${job.status}. Description: ${compact(job.description, 1_100)}`,
      source: { kind: 'job', id: job.id },
    });
  });
  matches.forEach((match, index) => {
    chunks.push({
      id: `M${index + 1}`,
      type: 'match',
      title: `Match score ${match.match_score}`,
      text: `Resume-job match score ${match.match_score}. Recommendation ${match.recommendation.replaceAll('_', ' ')}. Supported: ${requirements(match.supported)}. Partial: ${requirements(match.partial)}. Missing: ${requirements(match.missing)}.`,
      source: { kind: 'job_match', id: match.id },
    });
  });
  applications.forEach((application, index) => {
    chunks.push({
      id: `A${index + 1}`,
      type: 'application',
      title: `Application ${application.status}`,
      text: `Application status ${application.status.replaceAll('_', ' ')}. Notes: ${compact(application.notes, 180)}. Cover letter available: ${application.cover_letter ? 'yes' : 'no'}.`,
      source: { kind: 'application', id: application.id },
    });
  });
  interviewPreps.forEach((prep, index) => {
    const categories = prep.question_set?.categories?.map((category) => category.title).filter(Boolean).join(', ');
    chunks.push({
      id: `I${index + 1}`,
      type: 'interview_prep',
      title: 'Interview prep',
      text: `Interview prep exists. Categories: ${categories || 'technical, behavioral, resume, job-specific, skill gaps'}. Saved answer notes: ${Object.keys(prep.answer_notes || {}).length}.`,
      source: { kind: 'interview_prep', id: prep.id },
    });
  });
  return chunks;
};

export const askCareerCopilot = async (userId, question) => {
  const records = await loadCopilotRecords(userId);
  const chunks = buildChunks(records);
  if (!chunks.length) throw new AppError(409, 'COPILOT_NO_DATA', 'Add a resume, job, or application before asking Career Copilot.');
  const questionTokens = tokenize(question);
  const ranked = chunks
    .map((chunk) => ({ ...chunk, score: scoreChunk(questionTokens, chunk) }))
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  const evidence = ranked.filter((chunk) => chunk.score > 0).slice(0, 5);
  const selected = evidence.length ? evidence : ranked.slice(0, 4);
  const generated = await answerCareerQuestion({ question, evidence: selected });
  return {
    question,
    answer: generated.answer,
    evidence: selected.map(({ id, type, title, text, source }) => ({ id, type, title, excerpt: compact(text, 160), source })),
    model: generated.model,
    version: generated.version,
  };
};
