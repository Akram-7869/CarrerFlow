import { describe, expect, it } from 'vitest';
import { matchResumeToJob } from '../src/services/job-matcher-service.js';

const profile = {
  basicInfo: { name: 'Asha Rao', email: 'asha@example.com', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
  summary: 'Full stack developer',
  yearsExperience: 3,
  skills: [
    { name: 'React', evidence: 'Built React dashboards' },
    { name: 'Node.js', evidence: 'Developed Node.js APIs' },
    { name: 'Docker', evidence: 'Containerized services' },
  ],
  experiences: [{ jobTitle: 'Developer', company: 'Acme', description: 'Built dashboards and APIs', highlights: [], technologies: ['PostgreSQL'] }],
  projects: [], education: [], certifications: [], warnings: [],
};

const resumeData = { ...profile, skills: profile.skills.map((item) => ({ ...item, level: '', years: null })) };

describe('evidence-based job matcher', () => {
  it('separates supported, related, and missing requirements without inventing claims', () => {
    const result = matchResumeToJob({
      profile,
      resume: { parsed_text: 'React Node.js Docker PostgreSQL dashboards APIs' },
      resumeData,
      jobAnalysis: {
        requiredSkills: [{ name: 'React' }, { name: 'Kubernetes' }, { name: 'Go' }],
        preferredSkills: [{ name: 'PostgreSQL' }],
        minYearsExperience: 4,
        responsibilities: ['Build reliable dashboards and APIs'],
        keywords: ['React', 'Kubernetes', 'PostgreSQL'],
      },
    });

    expect(result.supported.map((item) => item.requirement)).toEqual(expect.arrayContaining(['React', 'PostgreSQL']));
    expect(result.partial.find((item) => item.requirement === 'Kubernetes').relatedSkills).toContain('Docker');
    expect(result.missing.map((item) => item.requirement)).toContain('Go');
    expect(result.experienceMatch.classification).toBe('partial');
    expect(result.matchScore).toBeGreaterThan(0);
    expect(result.matchScore).toBeLessThan(100);
  });

  it('returns missing when no verified or resume evidence supports a skill', () => {
    const result = matchResumeToJob({
      profile: { ...profile, skills: [], experiences: [], projects: [] },
      resume: { parsed_text: 'General software development' },
      resumeData: { ...resumeData, skills: [] },
      jobAnalysis: { requiredSkills: [{ name: 'Kubernetes' }], preferredSkills: [], minYearsExperience: null, responsibilities: [], keywords: [] },
    });

    expect(result.missing[0]).toMatchObject({ requirement: 'Kubernetes', classification: 'missing', evidence: [] });
    expect(result.matchScore).toBe(0);
    expect(result.recommendation).toBe('significant_gaps');
  });
});
