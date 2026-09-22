import knex from 'knex';
import { env } from './env.js';

export const db = knex({
  client: 'pg',
  connection: {
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: env.NODE_ENV === 'test' ? 0 : 2,
    max: 10,
  },
});
