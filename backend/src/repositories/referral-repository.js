import { db } from '../config/database.js';

export const listCandidates = (userId, jobId) => db('referral_candidates')
  .where({ user_id: userId, job_id: jobId })
  .orderBy([{ column: 'relevance_score', order: 'desc' }, { column: 'created_at', order: 'desc' }]);

export const upsertCandidate = async (candidate) => {
  const [record] = await db('referral_candidates')
    .insert(candidate)
    .onConflict(['user_id', 'job_id', 'source', 'source_candidate_id'])
    .merge({
      name: candidate.name,
      current_role: candidate.current_role,
      company: candidate.company,
      location: candidate.location,
      profile_url: candidate.profile_url,
      avatar_url: candidate.avatar_url,
      bio: candidate.bio,
      relevance_score: candidate.relevance_score,
      relevance_reasons: candidate.relevance_reasons,
      updated_at: db.fn.now(),
    })
    .returning('*');
  return record;
};

export const findCandidateById = (candidateId, userId) =>
  db('referral_candidates').where({ id: candidateId, user_id: userId }).first();

export const deleteCandidate = async (candidateId, userId) => {
  const [candidate] = await db('referral_candidates')
    .where({ id: candidateId, user_id: userId })
    .delete()
    .returning('*');
  return candidate;
};

export const createSearchRun = async (data) => {
  const [run] = await db('referral_search_runs').insert(data).returning('*');
  return run;
};
