import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://careerflow:test@localhost:5432/careerflow_test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-at-least-32-characters';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-characters';
  ({ app } = await import('../src/app.js'));
});

describe('API foundation', () => {
  it('reports that the process is healthy', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns a consistent 404 response', async () => {
    const response = await request(app).get('/api/v1/not-a-route');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects an invalid registration before reaching the database', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'weak',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.length).toBeGreaterThan(0);
  });
});
