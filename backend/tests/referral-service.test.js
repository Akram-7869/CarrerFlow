import { describe, expect, it } from 'vitest';
import { scoreCandidate } from '../src/services/referral-service.js';

const job = { company: 'Acme Cloud', title: 'Senior Backend Engineer', location: 'Bengaluru' };

describe('referral relevance scoring', () => {
  it('explains company, role, activity, and location evidence', () => {
    const result = scoreCandidate({
      company: 'Acme Cloud',
      currentRole: 'Senior Backend Engineer',
      bio: 'Node.js platform developer',
      location: 'Bengaluru, India',
      publicRepos: 8,
      sourceOrganization: 'acme-cloud',
    }, job);
    expect(result.score).toBeGreaterThanOrEqual(78);
    expect(result.reasons.join(' ')).toContain('matching the target company');
    expect(result.reasons.join(' ')).toContain('backend');
  });

  it('does not invent relevance when profile evidence is absent', () => {
    const result = scoreCandidate({ company: '', currentRole: '', bio: '', location: '', publicRepos: 0 }, job);
    expect(result.score).toBe(0);
    expect(result.reasons[0]).toContain('verify relevance manually');
  });
});
