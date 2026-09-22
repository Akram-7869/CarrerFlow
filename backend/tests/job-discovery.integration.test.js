import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const email = `discovery-${Date.now()}@careerflow.test`;
const password = 'IntegrationPass123';
let app;
let db;
let token;
let firstJobId;

const sourcePayload = {
  data: [{
    slug: 'react-developer-test-role',
    company_name: 'Public Jobs Ltd',
    title: 'React Developer',
    description: '<p>Build accessible React products with JavaScript and APIs.</p>',
    remote: true,
    url: 'https://www.arbeitnow.com/jobs/react-developer-test-role',
    tags: ['React', 'JavaScript', 'Mid'],
    job_types: ['Full time'],
    location: 'Remote, India',
    created_at: Math.floor(Date.now() / 1000),
  }],
  links: { next: null },
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => sourcePayload,
  }));
  ({ app } = await import('../src/app.js'));
  ({ db } = await import('../src/config/database.js'));
  const registration = await request(app).post('/api/v1/auth/register').send({ name: 'Discovery User', email, password });
  token = registration.body.data.accessToken;
});

afterAll(async () => {
  await db('users').where({ email }).delete();
  await db.destroy();
  vi.unstubAllGlobals();
});

describe('job discovery flow', () => {
  const search = () => request(app)
    .post('/api/v1/job-discovery/search')
    .set('Authorization', `Bearer ${token}`)
    .send({
      roles: ['React'],
      locations: ['India'],
      workModes: ['remote'],
      experienceLevels: ['Mid'],
      postedWithinHours: 168,
      limit: 20,
    });

  it('normalizes, filters, saves, and reports a public-source result', async () => {
    const response = await search();
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.body.data.summary).toEqual({ scannedCount: 1, matchedCount: 1, newCount: 1 });
    expect(response.body.data.source).toEqual({ name: 'Arbeitnow', url: 'https://www.arbeitnow.com' });
    expect(response.body.data.jobs[0]).toMatchObject({ source: 'arbeitnow', status: 'discovered', remote: true });
    firstJobId = response.body.data.jobs[0].id;
  });

  it('deduplicates repeated searches and preserves the saved job id', async () => {
    const response = await search();
    expect(response.status).toBe(200);
    expect(response.body.data.summary.newCount).toBe(0);
    expect(response.body.data.jobs[0].id).toBe(firstJobId);
  });

  it('persists the user search preferences', async () => {
    const response = await request(app)
      .get('/api/v1/job-discovery/preferences')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data.preferences).toMatchObject({
      roles: ['React'], locations: ['India'], workModes: ['remote'], experienceLevels: ['Mid'], postedWithinHours: 168,
    });
  });
});
