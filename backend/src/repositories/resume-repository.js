import { db } from '../config/database.js';

const publicColumns = [
  'id', 'user_id', 'name', 'original_filename', 'mime_type', 'file_size', 'status',
  'structured_data', 'extraction_model', 'extraction_version', 'extraction_error',
  'created_at', 'updated_at',
];

export const createResume = async (data) => {
  const [resume] = await db('resumes').insert(data).returning(publicColumns);
  return resume;
};

export const findResumeById = (id, userId) =>
  db('resumes').where({ id, user_id: userId }).first();

export const findResumeByHash = (fileHash, userId) =>
  db('resumes').where({ file_hash: fileHash, user_id: userId }).first(publicColumns);

export const listResumes = (userId) =>
  db('resumes').where({ user_id: userId }).select(publicColumns).orderBy('created_at', 'desc');

export const updateResume = async (id, userId, changes) => {
  const [resume] = await db('resumes')
    .where({ id, user_id: userId })
    .update({ ...changes, updated_at: db.fn.now() })
    .returning('*');
  return resume;
};

export const deleteResume = async (id, userId) => {
  const [resume] = await db('resumes').where({ id, user_id: userId }).delete().returning('*');
  return resume;
};
