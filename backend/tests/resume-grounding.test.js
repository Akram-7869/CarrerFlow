import { describe, expect, it } from 'vitest';
import { groundResumeExtraction } from '../src/services/resume-grounding-service.js';

const baseProfile = {
  basicInfo: { name: 'Asha Rao', email: 'asha@example.com', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
  summary: '', yearsExperience: null, skills: [], experiences: [], education: [], projects: [], certifications: [], warnings: [],
};

describe('resume extraction grounding', () => {
  it('removes AI-produced entities that do not appear in source text', () => {
    const result = groundResumeExtraction({
      ...baseProfile,
      skills: [
        { name: 'React', level: '', years: null, evidence: 'React' },
        { name: 'Kubernetes', level: '', years: null, evidence: '' },
      ],
    }, 'Asha Rao asha@example.com Skills: React and JavaScript');

    expect(result.skills.map((skill) => skill.name)).toEqual(['React']);
    expect(result.warnings[0]).toMatch(/Kubernetes.*removed/i);
  });

  it('removes contact details not found in the parsed document', () => {
    const result = groundResumeExtraction(baseProfile, 'Asha Rao Software Developer');

    expect(result.basicInfo.email).toBe('');
    expect(result.warnings[0]).toMatch(/email was removed/i);
  });
});
