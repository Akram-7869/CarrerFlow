import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const email = `referral-${Date.now()}@careerflow.test`;
const otherEmail = `referral-other-${Date.now()}@careerflow.test`;
const password = 'IntegrationPass123';
let app;
let db;
let token;
let otherToken;
let userId;
let jobId;
let candidateId;

const response = (payload, remaining = '54') => ({
  ok: true,
  status: 200,
  headers: { get: (name) => name.toLowerCase() === 'x-ratelimit-remaining' ? remaining : null },
  json: async () => payload,
});

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (String(url).includes('/search/users')) return response({ items: [{ login: 'acme-cloud', type: 'Organization' }] }, '56');
    if (String(url).includes('/public_members')) return response([{ login: 'asha-dev' }], '55');
    return response({
      id: 4242,
      login: 'asha-dev',
      name: 'Asha Developer',
      company: 'Acme Cloud',
      bio: 'Senior backend engineer building Node.js platforms',
      location: 'Bengaluru, India',
      html_url: 'https://github.com/asha-dev',
      avatar_url: 'https://avatars.githubusercontent.com/u/4242',
      public_repos: 12,
      type: 'User',
    }, '54');
  }));
  ({ app } = await import('../src/app.js'));
  ({ db } = await import('../src/config/database.js'));
  const registration = await request(app).post('/api/v1/auth/register').send({ name: 'Referral Owner', email, password });
  token = registration.body.data.accessToken;
  const other = await request(app).post('/api/v1/auth/register').send({ name: 'Other User', email: otherEmail, password });
  otherToken = other.body.data.accessToken;
  userId = (await db('users').where({ email }).first()).id;
  const [job] = await db('jobs').insert({
    user_id: userId,
    company: 'Acme Cloud',
    title: 'Senior Backend Engineer',
    description: 'Build reliable backend services with Node.js and PostgreSQL for a growing cloud platform.',
    location: 'Bengaluru',
    work_mode: 'hybrid',
    source: 'manual',
    status: 'ready',
  }).returning('*');
  jobId = job.id;
});

afterAll(async () => {
  await db('users').whereIn('email', [email, otherEmail]).delete();
  await db.destroy();
  vi.unstubAllGlobals();
});

describe('referral discovery flow', () => {
  it('discovers, scores, and saves a public candidate', async () => {
    const result = await request(app)
      .post('/api/v1/referrals/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobId, limit: 5 });
    expect(result.status, JSON.stringify(result.body)).toBe(200);
    expect(result.body.data.summary).toEqual({ resultCount: 1, newCount: 1, rateLimitRemaining: 54 });
    expect(result.body.data.candidates[0]).toMatchObject({ name: 'Asha Developer', company: 'Acme Cloud', source: 'github' });
    expect(result.body.data.candidates[0].relevanceScore).toBeGreaterThan(50);
    candidateId = result.body.data.candidates[0].id;
  });

  it('deduplicates repeated public searches', async () => {
    const result = await request(app)
      .post('/api/v1/referrals/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobId, limit: 5 });
    expect(result.status).toBe(200);
    expect(result.body.data.summary.newCount).toBe(0);
    expect(result.body.data.candidates[0].id).toBe(candidateId);
  });

  it('allows user-verified manual public profiles', async () => {
    const result = await request(app)
      .post('/api/v1/referrals')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobId, name: 'Manual Candidate', currentRole: 'Backend Lead', company: 'Acme Cloud', location: '', profileUrl: 'https://example.com/public-profile', bio: 'Public professional profile.' });
    expect(result.status, JSON.stringify(result.body)).toBe(201);
    expect(result.body.data.candidate).toMatchObject({ source: 'manual', verifiedByUser: true });
  });

  it('isolates candidates and target jobs between users', async () => {
    const result = await request(app)
      .get(`/api/v1/referrals/jobs/${jobId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(result.status).toBe(404);
  });
});
