import { db } from '../config/database.js';

export const createJobAnalysis = async (data) => {
  const [analysis] = await db('job_analyses').insert(data).returning('*');
  return analysis;
};

export const findLatestJobAnalysis = (jobId, userId) =>
  db('job_analyses')
    .where({ job_id: jobId, user_id: userId })
    .orderBy('created_at', 'desc')
    .first();
