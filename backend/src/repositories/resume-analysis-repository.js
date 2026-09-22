import { db } from '../config/database.js';

export const createResumeAnalysis = async (analysis) => {
  const [created] = await db('resume_analyses').insert({
    resume_id: analysis.resumeId,
    user_id: analysis.userId,
    overall_score: analysis.overallScore,
    rating: analysis.rating,
    parsability_score: analysis.scores.parsability,
    contact_score: analysis.scores.contact,
    structure_score: analysis.scores.structure,
    skills_score: analysis.scores.skills,
    experience_score: analysis.scores.experience,
    achievement_score: analysis.scores.achievements,
    content_score: analysis.scores.content,
    issues: JSON.stringify(analysis.issues),
    strengths: JSON.stringify(analysis.strengths),
    suggestions: JSON.stringify(analysis.suggestions),
    metrics: JSON.stringify(analysis.metrics),
    analyzer_version: analysis.analyzerVersion,
  }).returning('*');

  return created;
};

export const findLatestResumeAnalysis = (resumeId, userId) =>
  db('resume_analyses')
    .where({ resume_id: resumeId, user_id: userId })
    .orderBy('created_at', 'desc')
    .first();
