import { Router } from 'express';
import { db } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json({ status: 'ok' });
});

healthRouter.get(
  '/ready',
  asyncHandler(async (_request, response) => {
    await db.raw('select 1');
    response.json({ status: 'ready' });
  }),
);
