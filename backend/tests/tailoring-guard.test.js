import { describe, expect, it } from 'vitest';
import { validateSkillOrder, validateTailoredText } from '../src/services/tailoring-guard-service.js';

describe('resume tailoring guardrails', () => {
  it('blocks missing skills and invented metrics', () => {
    const result = validateTailoredText({
      proposedText: 'Built Kubernetes services that improved performance by 75%.',
      evidenceRefs: ['Built Node.js services'],
      evidenceCorpus: 'Built Node.js services for customer workflows.',
      forbiddenSkills: ['Kubernetes'],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringMatching(/Kubernetes.*cannot be added/i),
      expect.stringMatching(/75%.*not supported/i),
    ]));
  });

  it('allows a grounded rewrite that preserves supported facts', () => {
    const result = validateTailoredText({
      proposedText: 'Developed Node.js APIs supporting customer workflows.',
      evidenceRefs: ['Built Node.js APIs for customer workflows'],
      evidenceCorpus: 'Built Node.js APIs for customer workflows at Acme Labs.',
      forbiddenSkills: ['Kubernetes'],
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('reorders only existing skills and restores omitted items', () => {
    const ordered = validateSkillOrder({ skills: [{ name: 'React' }, { name: 'Node.js' }, { name: 'PostgreSQL' }] }, ['PostgreSQL', 'Invented Skill', 'React']);
    expect(ordered).toEqual(['PostgreSQL', 'React', 'Node.js']);
  });
});
