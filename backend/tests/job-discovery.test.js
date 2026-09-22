import { describe, expect, it } from 'vitest';
import { htmlToText, normalizeArbeitnowJob } from '../src/job-sources/arbeitnow-source.js';
import { matchesDiscoveryFilters } from '../src/services/job-discovery-service.js';

const rawJob = {
  slug: 'frontend-developer-example',
  company_name: 'Example GmbH',
  title: 'Junior Frontend Developer',
  description: '<p>Build accessible apps with <strong>React</strong>.</p><ul><li>Write tests</li></ul>',
  remote: true,
  url: 'https://www.arbeitnow.com/jobs/frontend-developer-example',
  tags: ['React', 'JavaScript', 'Junior'],
  job_types: ['Full time'],
  location: 'Berlin or remote',
  created_at: 1_788_969_600,
};

describe('Arbeitnow job discovery', () => {
  it('converts source HTML into readable plain text', () => {
    expect(htmlToText(rawJob.description)).toContain('Build accessible apps with React.');
    expect(htmlToText(rawJob.description)).toContain('- Write tests');
    expect(htmlToText(rawJob.description)).not.toContain('<strong>');
  });

  it('normalizes source fields and creates a stable hash', () => {
    const job = normalizeArbeitnowJob(rawJob);
    expect(job).toMatchObject({
      company: 'Example GmbH',
      title: 'Junior Frontend Developer',
      work_mode: 'remote',
      employment_type: 'full-time',
      source: 'arbeitnow',
      source_job_id: rawJob.slug,
      status: 'discovered',
    });
    expect(job.job_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('applies role, location, mode, experience, and freshness filters deterministically', () => {
    const job = normalizeArbeitnowJob(rawJob);
    const filters = {
      roles: ['React'],
      locations: ['Berlin'],
      workModes: ['remote'],
      experienceLevels: ['Junior'],
      postedWithinHours: 168,
    };
    expect(matchesDiscoveryFilters(job, filters, new Date('2026-09-10T12:00:00Z'))).toBe(true);
    expect(matchesDiscoveryFilters(job, { ...filters, roles: ['Python'] }, new Date('2026-09-10T12:00:00Z'))).toBe(false);
    expect(matchesDiscoveryFilters(job, { ...filters, workModes: ['onsite'] }, new Date('2026-09-10T12:00:00Z'))).toBe(false);
  });
});
