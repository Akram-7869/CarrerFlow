import { db } from '../config/database.js';

export const findPreferences = (userId) =>
  db('job_search_preferences').where({ user_id: userId }).first();

export const savePreferences = async (userId, preferences) => {
  const [record] = await db('job_search_preferences')
    .insert({ user_id: userId, ...preferences })
    .onConflict('user_id')
    .merge({ ...preferences, updated_at: db.fn.now() })
    .returning('*');
  return record;
};

export const saveDiscoveredJob = async (userId, job) => {
  const existing = await db('jobs')
    .where({ user_id: userId, source: job.source, source_job_id: job.source_job_id })
    .first();

  if (existing) {
    const preserveAnalyzedSnapshot = existing.status !== 'discovered';
    const [updated] = await db('jobs')
      .where({ id: existing.id, user_id: userId })
      .update({
        company: job.company,
        title: job.title,
        description: preserveAnalyzedSnapshot ? existing.description : job.description,
        location: job.location,
        work_mode: job.work_mode,
        employment_type: job.employment_type,
        apply_url: job.apply_url,
        posted_at: job.posted_at,
        remote: job.remote,
        tags: job.tags,
        job_hash: preserveAnalyzedSnapshot ? existing.job_hash : job.job_hash,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return { job: updated, created: false };
  }

  const [created] = await db('jobs').insert({ user_id: userId, ...job }).returning('*');
  return { job: created, created: true };
};

export const createDiscoveryRun = async (data) => {
  const [run] = await db('job_discovery_runs').insert(data).returning('*');
  return run;
};
