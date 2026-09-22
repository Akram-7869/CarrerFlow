import { db } from '../config/database.js';

export const createJob = async (data) => {
  const [job] = await db('jobs').insert(data).returning('*');
  return job;
};

export const findJobById = (jobId, userId) =>
  db('jobs').where({ id: jobId, user_id: userId }).first();

export const listJobs = (userId) =>
  db('jobs').where({ user_id: userId }).orderBy('created_at', 'desc');

export const updateJob = async (jobId, userId, changes) => {
  const [job] = await db('jobs')
    .where({ id: jobId, user_id: userId })
    .update({ ...changes, updated_at: db.fn.now() })
    .returning('*');
  return job;
};

export const deleteJob = async (jobId, userId) => {
  const [job] = await db('jobs').where({ id: jobId, user_id: userId }).delete().returning('*');
  return job;
};
