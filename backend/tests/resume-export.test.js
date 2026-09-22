import { describe, expect, it } from 'vitest';
import { generateDocx, generatePdf } from '../src/services/resume-export-service.js';

const content = {
  basicInfo: { name: 'Asha Rao', email: 'asha@example.com', phone: '', location: 'Bengaluru', linkedinUrl: '', githubUrl: '', portfolioUrl: '' },
  summary: 'Full stack developer.', yearsExperience: 3,
  skills: [{ name: 'React' }, { name: 'Node.js' }],
  experiences: [{ company: 'Acme', jobTitle: 'Developer', location: '', startDate: '2023', endDate: '', isCurrent: true, description: '', highlights: ['Built reliable APIs.'], technologies: [] }],
  projects: [], education: [], certifications: [], warnings: [],
};

describe('local tailored resume export', () => {
  it('generates a valid DOCX zip container', async () => {
    const file = await generateDocx(content);
    expect(file.subarray(0, 2).toString()).toBe('PK');
    expect(file.length).toBeGreaterThan(500);
  });

  it('generates a valid PDF document', async () => {
    const file = await generatePdf(content);
    expect(file.subarray(0, 4).toString()).toBe('%PDF');
    expect(file.length).toBeGreaterThan(500);
  });
});
