import { db } from '../config/database.js';

export const saveRefreshToken = async ({ userId, tokenHash, expiresAt }) => {
  await db('refresh_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
};

export const findActiveRefreshToken = (tokenHash) =>
  db('refresh_tokens')
    .where({ token_hash: tokenHash })
    .whereNull('revoked_at')
    .where('expires_at', '>', db.fn.now())
    .first();

export const revokeRefreshToken = (tokenHash) =>
  db('refresh_tokens')
    .where({ token_hash: tokenHash })
    .whereNull('revoked_at')
    .update({ revoked_at: db.fn.now() });
