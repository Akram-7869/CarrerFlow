import { describe, expect, it } from 'vitest';
import { analyzeResumeForAts } from '../src/services/ats-analyzer-service.js';

const emptyProfile = {
  basicInfo: { name: '', email: '', phone: '', location: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
  summary: '', yearsExperience: null, skills: [], experiences: [], education: [], projects: [], certifications: [], warnings: [],
};

describe('deterministic ATS analyzer', () => {
  it('provides a high explainable score for a complete evidence-rich resume', () => {
    const profile = {
      ...emptyProfile,
      basicInfo: { name: 'Asha Rao', email: 'asha@example.com', phone: '+91 9999999999', location: 'Bengaluru', linkedinUrl: '', githubUrl: 'github.com/asha', portfolioUrl: '' },
      summary: 'Full stack developer building accessible web applications.',
      skills: ['JavaScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'Git'].map((name) => ({ name, level: '', years: null, evidence: name })),
      experiences: [{ company: 'Acme Labs', jobTitle: 'Software Developer', location: '', startDate: '2023', endDate: 'Present', isCurrent: true, description: '', highlights: ['Built a React dashboard that reduced reporting time by 40% for 25 users.', 'Developed Node.js APIs supporting customer workflows and reliable data access.'], technologies: ['React', 'Node.js'], evidence: 'Acme Labs' }],
      education: [{ institution: 'Example University', degree: 'B.Tech', fieldOfStudy: 'Computer Science', location: '', startDate: '2018', endDate: '2022', grade: '', description: '', evidence: 'Example University' }],
      projects: [{ name: 'TaskFlow', description: '', url: '', startDate: '', endDate: '', highlights: ['Created an accessible task management application for distributed teams.'], technologies: ['React'], evidence: 'TaskFlow' }],
    };
    const parsedText = `${JSON.stringify(profile)} ${'software engineering delivery collaboration '.repeat(35)}`;

    const result = analyzeResumeForAts({ parsedText, structuredData: profile });

    expect(result.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.rating).toBe('excellent');
    expect(result.metrics.measurableBulletCount).toBe(1);
    expect(result.strengths.some((item) => item.category === 'achievements')).toBe(true);
  });

  it('returns exact deductions and actionable issues for a sparse resume', () => {
    const result = analyzeResumeForAts({ parsedText: 'Developer with basic experience.', structuredData: emptyProfile });
    const codes = result.issues.map((issue) => issue.code);

    expect(result.overallScore).toBeLessThan(50);
    expect(result.rating).toBe('needs_work');
    expect(codes).toContain('LOW_EXTRACTED_TEXT');
    expect(codes).toContain('MISSING_EMAIL');
    expect(codes).toContain('NO_SKILLS');
    expect(codes).toContain('NO_ACHIEVEMENT_BULLETS');
    expect(result.issues.every((issue) => issue.pointsDeducted > 0)).toBe(true);
  });
});
