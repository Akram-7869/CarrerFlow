import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

const testEmail = `integration-${Date.now()}@careerflow.test`;
const password = 'IntegrationPass123';

let agent;
let app;
let db;
let accessToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  ({ app } = await import('../src/app.js'));
  ({ db } = await import('../src/config/database.js'));
  agent = request.agent(app);
});

afterAll(async () => {
  await db('users').whereIn('email', [testEmail, 'guest.recruiter@careerflow.demo']).delete();
  await db.destroy();
});

describe('authentication flow with PostgreSQL', () => {
  it('registers a user and returns an access token', async () => {
    const response = await agent.post('/api/v1/auth/register').send({
      name: 'Integration User',
      email: testEmail,
      password,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe(testEmail);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    accessToken = response.body.data.accessToken;
  });

  it('creates a reusable guest recruiter workspace', async () => {
    const response = await agent.post('/api/v1/auth/guest');

    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.body.data.user.email).toBe('guest.recruiter@careerflow.demo');
    expect(response.body.data.accessToken).toEqual(expect.any(String));

    const applications = await agent
      .get('/api/v1/applications')
      .set('Authorization', `Bearer ${response.body.data.accessToken}`);
    expect(applications.status, JSON.stringify(applications.body)).toBe(200);
    expect(applications.body.data.applications.length).toBeGreaterThan(0);
  });

  it('returns the current user for an authenticated request', async () => {
    const response = await agent
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(testEmail);
  });

  it('rotates the refresh token and returns a new access token', async () => {
    const response = await agent.post('/api/v1/auth/refresh');

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
  });

  it('revokes the refresh token on logout', async () => {
    const logoutResponse = await agent.post('/api/v1/auth/logout');
    expect(logoutResponse.status).toBe(204);

    const refreshResponse = await agent.post('/api/v1/auth/refresh');
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.error.code).toBe('REFRESH_TOKEN_REQUIRED');
  });
});
