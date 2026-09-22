import { beforeAll, describe, expect, it } from 'vitest';

let hashPassword;
let verifyPassword;
let createAccessToken;
let verifyAccessToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://careerflow:test@localhost:5432/careerflow_test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-at-least-32-characters';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-characters';
  ({ hashPassword, verifyPassword } = await import('../src/utils/password.js'));
  ({ createAccessToken, verifyAccessToken } = await import('../src/utils/tokens.js'));
});

describe('authentication security utilities', () => {
  it('hashes and verifies a password without storing the original', async () => {
    const password = 'StrongPass123';
    const hash = await hashPassword(password);

    expect(hash).not.toContain(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword('WrongPass123', hash)).resolves.toBe(false);
  });

  it('creates a verifiable access token with the correct identity', () => {
    const token = createAccessToken({ id: 'user-123', email: 'user@example.com' });
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('user-123');
    expect(payload.type).toBe('access');
  });
});
