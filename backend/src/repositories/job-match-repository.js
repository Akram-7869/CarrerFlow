import { db } from '../config/database.js';

export const createJobMatch = async (match) => {
  const [created] = await db('job_resume_matches').insert({
    job_id: match.jobId,
    resume_id: match.resumeId,
    user_id: match.userId,
    match_score: match.matchScore,
    recommendation: match.recommendation,
    score_breakdown: JSON.stringify(match.scoreBreakdown),
    supported: JSON.stringify(match.supported),
    partial: JSON.stringify(match.partial),
    missing: JSON.stringify(match.missing),
    experience_match: JSON.stringify(match.experienceMatch),
    responsibility_match: JSON.stringify(match.responsibilityMatch),
    keyword_match: JSON.stringify(match.keywordMatch),
    matcher_version: match.matcherVersion,
  }).returning('*');
  return created;
};

export const findLatestJobMatch = (jobId, resumeId, userId) =>
  db('job_resume_matches')
    .where({ job_id: jobId, resume_id: resumeId, user_id: userId })
    .orderBy('created_at', 'desc')
    .first();
