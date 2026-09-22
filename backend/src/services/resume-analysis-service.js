import { createResumeAnalysis, findLatestResumeAnalysis } from '../repositories/resume-analysis-repository.js';
import { findResumeById } from '../repositories/resume-repository.js';
import { AppError } from '../utils/app-error.js';
import { profileDataSchema } from '../validators/profile-validator.js';
import { analyzeResumeForAts } from './ats-analyzer-service.js';

const presentAnalysis = (record) => record && ({
  id: record.id,
  resumeId: record.resume_id,
  overallScore: record.overall_score,
  rating: record.rating,
  scores: {
    parsability: record.parsability_score,
    contact: record.contact_score,
    structure: record.structure_score,
    skills: record.skills_score,
    experience: record.experience_score,
    achievements: record.achievement_score,
    content: record.content_score,
  },
  maximums: { parsability: 15, contact: 10, structure: 15, skills: 15, experience: 20, achievements: 15, content: 10 },
  issues: record.issues,
  strengths: record.strengths,
  suggestions: record.suggestions,
  metrics: record.metrics,
  analyzerVersion: record.analyzer_version,
  createdAt: record.created_at,
});

const requireAnalyzableResume = async (resumeId, userId) => {
  const resume = await findResumeById(resumeId, userId);
  if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume not found.');
  if (!resume.parsed_text || !resume.structured_data) {
    throw new AppError(409, 'RESUME_NOT_ANALYZABLE', 'Complete resume extraction before running the ATS check.');
  }
  return resume;
};

export const runResumeAnalysis = async (resumeId, userId) => {
  const resume = await requireAnalyzableResume(resumeId, userId);
  const structuredData = profileDataSchema.parse(resume.structured_data);
  const analysis = analyzeResumeForAts({ parsedText: resume.parsed_text, structuredData });
  const saved = await createResumeAnalysis({ ...analysis, resumeId, userId });
  return presentAnalysis(saved);
};

export const getLatestResumeAnalysis = async (resumeId, userId) => {
  await requireAnalyzableResume(resumeId, userId);
  return presentAnalysis(await findLatestResumeAnalysis(resumeId, userId));
};
