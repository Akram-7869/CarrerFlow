import 'dotenv/config';

const shared = {
  client: 'pg',
  migrations: {
    directory: './migrations',
    extension: 'js',
  },
};

const connection = process.env.DATABASE_URL;

export default {
  development: {
    ...shared,
    connection,
  },
  test: {
    ...shared,
    connection,
  },
  production: {
    ...shared,
    connection: {
      connectionString: connection,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: { min: 2, max: 10 },
  },
};
