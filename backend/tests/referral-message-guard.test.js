import { describe, expect, it } from 'vitest';
import { unsupportedJobSkills, validateReferralMessage } from '../src/services/referral-message-guard-service.js';

const evidenceCorpus = 'Built React dashboards and Node.js APIs backed by PostgreSQL. Improved page speed by 20%.';
const evidenceRefs = ['Built React dashboards and Node.js APIs backed by PostgreSQL.'];

describe('referral message guardrails', () => {
  it('allows a grounded professional message', () => {
    const result = validateReferralMessage({
      message: 'Hi Asha, I am interested in the developer role. My background includes building React dashboards and Node.js APIs. Would you be comfortable sharing guidance about the role or referral process? Thank you for your time.',
      evidenceRefs,
      evidenceCorpus,
      forbiddenSkills: ['Kubernetes'],
    });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('blocks unsupported skills, invented metrics, and fabricated relationships', () => {
    const result = validateReferralMessage({
      message: 'Hi Asha, since we worked together, please refer me. I use Kubernetes and improved performance by 75%.',
      evidenceRefs,
      evidenceCorpus,
      forbiddenSkills: ['Kubernetes'],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Kubernetes');
    expect(result.errors.join(' ')).toContain('75%');
    expect(result.errors.join(' ')).toContain('relationship');
  });

  it('identifies job skills absent from verified evidence', () => {
    const skills = unsupportedJobSkills({
      requiredSkills: [{ name: 'React' }, { name: 'Kubernetes' }],
      preferredSkills: [{ name: 'AWS' }],
    }, evidenceCorpus);
    expect(skills).toEqual(['Kubernetes', 'AWS']);
  });
});
