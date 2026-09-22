import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const API_URL = 'https://api.github.com';

const headers = () => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'CareerFlowAI/0.1 (referral discovery)',
  ...(env.GITHUB_TOKEN && { Authorization: `Bearer ${env.GITHUB_TOKEN}` }),
});

const requestGithub = async (path) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(12_000),
  });
  const remaining = Number(response.headers.get('x-ratelimit-remaining'));
  const reset = Number(response.headers.get('x-ratelimit-reset'));

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if ([403, 429].includes(response.status)) {
      throw new AppError(429, 'REFERRAL_SOURCE_RATE_LIMITED', 'GitHub public search has reached its temporary rate limit.', {
        resetAt: reset ? new Date(reset * 1000).toISOString() : null,
      });
    }
    throw new AppError(502, 'REFERRAL_SOURCE_UNAVAILABLE', 'GitHub public profile search is temporarily unavailable.', {
      reason: payload.message || `HTTP ${response.status}`,
    });
  }

  return { payload: await response.json(), remaining: Number.isFinite(remaining) ? remaining : null };
};

const normalizeProfile = (profile) => ({
  name: String(profile.name || profile.login).trim(),
  currentRole: String(profile.bio || '').trim().slice(0, 180),
  company: String(profile.company || '').replace(/^@/, '').trim(),
  location: String(profile.location || '').trim(),
  profileUrl: profile.html_url,
  avatarUrl: profile.avatar_url || '',
  bio: String(profile.bio || '').trim(),
  source: 'github',
  sourceCandidateId: String(profile.id),
  login: profile.login,
  publicRepos: Number(profile.public_repos || 0),
});

export const searchGithubCandidates = async (company, limit = 5) => {
  const safeLimit = Math.min(Math.max(limit, 1), 5);
  const params = new URLSearchParams({ q: `${company.replace(/"/g, '')} type:org`, per_page: '3' });
  const search = await requestGithub(`/search/users?${params}`);
  const organization = (search.payload.items || []).find((item) => item.type === 'Organization');
  if (!organization) return { candidates: [], rateLimitRemaining: search.remaining };
  const members = await requestGithub(`/orgs/${encodeURIComponent(organization.login)}/public_members?per_page=${safeLimit}`);
  const profiles = [];
  let remaining = members.remaining;

  for (const item of members.payload || []) {
    const detail = await requestGithub(`/users/${encodeURIComponent(item.login)}`);
    remaining = detail.remaining;
    if (detail.payload.type === 'User') {
      profiles.push({ ...normalizeProfile(detail.payload), sourceOrganization: organization.login });
    }
  }

  return { candidates: profiles, rateLimitRemaining: remaining };
};
