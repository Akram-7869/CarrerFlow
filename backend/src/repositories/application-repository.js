import { db } from '../config/database.js';

export const upsertApplication = async (data) => {
  const [record] = await db('applications')
    .insert(data)
    .onConflict(['user_id', 'job_id'])
    .merge({
      resume_id: data.resume_id,
      resume_version_id: data.resume_version_id,
      job_resume_match_id: data.job_resume_match_id,
      resume_analysis_id: data.resume_analysis_id,
      referral_candidate_id: data.referral_candidate_id,
      referral_message_id: data.referral_message_id,
      notes: data.notes,
      updated_at: db.fn.now(),
    })
    .returning('*');
  return record;
};

export const findApplicationById = (applicationId, userId) =>
  db('applications').where({ id: applicationId, user_id: userId }).first();

export const findApplicationByJob = (jobId, userId) =>
  db('applications').where({ job_id: jobId, user_id: userId }).first();

export const updateApplication = async (applicationId, userId, changes) => {
  const [record] = await db('applications')
    .where({ id: applicationId, user_id: userId })
    .update({ ...changes, updated_at: db.fn.now() })
    .returning('*');
  return record;
};

export const listApplications = (userId, status) => {
  const query = db('applications').where({ user_id: userId });
  if (status) query.andWhere({ status });
  return query.orderBy('updated_at', 'desc');
};

export const transitionApplication = (application, userId, status, note, occurredAt) =>
  db.transaction(async (transaction) => {
    if (application.status === status) return application;
    const [updated] = await transaction('applications')
      .where({ id: application.id, user_id: userId })
      .update({
        status,
        last_status_changed_at: occurredAt,
        ...(status === 'applied' && !application.applied_at && { applied_at: occurredAt }),
        updated_at: transaction.fn.now(),
      })
      .returning('*');
    await transaction('application_status_history').insert({
      application_id: application.id,
      user_id: userId,
      from_status: application.status,
      to_status: status,
      note: note || null,
      occurred_at: occurredAt,
    });
    return updated;
  });

export const listStatusHistory = (applicationId, userId) => db('application_status_history')
  .where({ application_id: applicationId, user_id: userId })
  .orderBy('occurred_at', 'desc');

export const createStatusHistory = async (data) => {
  const [history] = await db('application_status_history').insert(data).returning('*');
  return history;
};

export const listEvents = (applicationId, userId) => db('application_events')
  .where({ application_id: applicationId, user_id: userId })
  .orderBy('scheduled_at', 'asc');

export const createEvent = async (data) => {
  const [event] = await db('application_events').insert(data).returning('*');
  return event;
};

export const findEventById = (eventId, userId) =>
  db('application_events').where({ id: eventId, user_id: userId }).first();

export const updateEvent = async (eventId, userId, changes) => {
  const [event] = await db('application_events')
    .where({ id: eventId, user_id: userId })
    .update({ ...changes, updated_at: db.fn.now() })
    .returning('*');
  return event;
};

export const deleteEvent = async (eventId, userId) => {
  const [event] = await db('application_events').where({ id: eventId, user_id: userId }).delete().returning('*');
  return event;
};
