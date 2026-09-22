import { db } from '../config/database.js';

export const findInterviewPrepByApplication = (applicationId, userId) =>
  db('interview_preps').where({ application_id: applicationId, user_id: userId }).first();

export const upsertInterviewPrep = async (data) => {
  const [record] = await db('interview_preps')
    .insert(data)
    .onConflict(['application_id'])
    .merge({
      question_set: data.question_set,
      warnings: data.warnings,
      model: data.model,
      generation_version: data.generation_version,
      updated_at: db.fn.now(),
    })
    .returning('*');
  return record;
};

export const updateInterviewPrepProgress = async (applicationId, userId, changes) => {
  const [record] = await db('interview_preps')
    .where({ application_id: applicationId, user_id: userId })
    .update({ ...changes, updated_at: db.fn.now() })
    .returning('*');
  return record;
};
