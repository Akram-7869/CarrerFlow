import { createHash } from 'node:crypto';
import { searchGithubCandidates } from '../referral-sources/github-referral-source.js';
import { createSearchRun, deleteCandidate, findCandidateById, listCandidates, upsertCandidate } from '../repositories/referral-repository.js';
import { requireJob } from './job-service.js';
import { AppError } from '../utils/app-error.js';

const meaningfulTokens = (value) => String(value || '').toLowerCase().split(/[^a-z0-9+#.]+/)
  .filter((token) => token.length > 2 && !['and', 'the', 'for', 'with', 'developer', 'engineer', 'software'].includes(token));

export const scoreCandidate = (candidate, job) => {
  const reasons = [];
  let score = 0;
  const candidateCompany = candidate.company.toLowerCase().replace(/[^a-z0-9]/g, '');
  const jobCompany = job.company.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (candidateCompany && (candidateCompany.includes(jobCompany) || jobCompany.includes(candidateCompany))) {
    score += 50;
    reasons.push(`Public profile lists ${candidate.company}, matching the target company.`);
  }
  if (candidate.sourceOrganization) {
    score += 35;
    reasons.push(`GitHub shows public membership in the ${candidate.sourceOrganization} organization; confirm current employment manually.`);
  }

  const profileText = `${candidate.currentRole} ${candidate.bio}`.toLowerCase();
  const roleTokens = meaningfulTokens(job.title);
  const matchingTokens = roleTokens.filter((token) => profileText.includes(token));
  if (matchingTokens.length) {
    score += Math.min(30, matchingTokens.length * 10);
    reasons.push(`Profile context overlaps with the target role: ${matchingTokens.join(', ')}.`);
  }
  if (candidate.publicRepos > 0) {
    score += Math.min(10, candidate.publicRepos);
    reasons.push('Has visible public development activity on GitHub.');
  }
  if (job.location && candidate.location && candidate.location.toLowerCase().includes(job.location.toLowerCase())) {
    score += 10;
    reasons.push('Public profile location matches the job location.');
  }
  if (!reasons.length) reasons.push('Public profile was returned by the company search; verify relevance manually.');
  return { score: Math.min(100, score), reasons };
};

const presentCandidate = (candidate) => ({
  id: candidate.id,
  jobId: candidate.job_id,
  name: candidate.name,
  currentRole: candidate.current_role || '',
  company: candidate.company,
  location: candidate.location || '',
  profileUrl: candidate.profile_url,
  avatarUrl: candidate.avatar_url || '',
  bio: candidate.bio || '',
  source: candidate.source,
  relevanceScore: candidate.relevance_score,
  relevanceReasons: candidate.relevance_reasons,
  verifiedByUser: candidate.verified_by_user,
  createdAt: candidate.created_at,
});

const candidateRecord = (userId, jobId, candidate, relevance, verifiedByUser = false) => ({
  user_id: userId,
  job_id: jobId,
  name: candidate.name,
  current_role: candidate.currentRole || null,
  company: candidate.company,
  location: candidate.location || null,
  profile_url: candidate.profileUrl,
  avatar_url: candidate.avatarUrl || null,
  bio: candidate.bio || null,
  source: candidate.source,
  source_candidate_id: candidate.sourceCandidateId,
  relevance_score: relevance.score,
  relevance_reasons: JSON.stringify(relevance.reasons),
  verified_by_user: verifiedByUser,
});

export const getCandidates = async (userId, jobId) => {
  await requireJob(jobId, userId);
  return (await listCandidates(userId, jobId)).map(presentCandidate);
};

export const getCandidate = async (userId, candidateId) => {
  const candidate = await findCandidateById(candidateId, userId);
  if (!candidate) throw new AppError(404, 'REFERRAL_CANDIDATE_NOT_FOUND', 'Referral candidate not found.');
  return presentCandidate(candidate);
};

export const discoverCandidates = async (userId, { jobId, limit }) => {
  const job = await requireJob(jobId, userId);
  const result = await searchGithubCandidates(job.company, limit);
  let newCount = 0;
  const records = [];
  const existing = await listCandidates(userId, jobId);
  const existingKeys = new Set(existing.map((item) => `${item.source}:${item.source_candidate_id}`));

  for (const candidate of result.candidates) {
    const relevance = scoreCandidate(candidate, job);
    if (!existingKeys.has(`${candidate.source}:${candidate.sourceCandidateId}`)) newCount += 1;
    records.push(await upsertCandidate(candidateRecord(userId, jobId, candidate, relevance)));
  }

  const run = await createSearchRun({
    user_id: userId,
    job_id: jobId,
    source: 'github',
    company: job.company,
    result_count: records.length,
    new_count: newCount,
    rate_limit_remaining: result.rateLimitRemaining,
  });
  return {
    candidates: records.map(presentCandidate),
    summary: { resultCount: records.length, newCount, rateLimitRemaining: result.rateLimitRemaining },
    runId: run.id,
  };
};

export const addCandidate = async (userId, input) => {
  const job = await requireJob(input.jobId, userId);
  const sourceCandidateId = createHash('sha256').update(input.profileUrl.toLowerCase()).digest('hex');
  const candidate = { ...input, source: 'manual', sourceCandidateId, publicRepos: 0 };
  const relevance = scoreCandidate(candidate, job);
  return presentCandidate(await upsertCandidate(candidateRecord(userId, input.jobId, candidate, relevance, true)));
};

export const removeCandidate = async (userId, candidateId) => {
  const removed = await deleteCandidate(candidateId, userId);
  if (!removed) throw new AppError(404, 'REFERRAL_CANDIDATE_NOT_FOUND', 'Referral candidate not found.');
};
