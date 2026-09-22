import { app } from './app.js';
import { db } from './config/database.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.warn(`CareerFlow API listening on http://localhost:${env.PORT}`);
});

const shutdown = async (signal) => {
  console.warn(`${signal} received; shutting down`);
  server.close(async () => {
    await db.destroy();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
