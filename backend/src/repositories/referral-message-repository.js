import { db } from '../config/database.js';

export const createMessage = async (data) => {
  const [message] = await db('referral_messages').insert(data).returning('*');
  return message;
};

export const listMessages = (userId, candidateId) => db('referral_messages')
  .where({ user_id: userId, candidate_id: candidateId })
  .orderBy('created_at', 'desc');

export const findMessageById = (messageId, userId) =>
  db('referral_messages').where({ id: messageId, user_id: userId }).first();

export const updateMessage = async (messageId, userId, changes) => {
  const [message] = await db('referral_messages')
    .where({ id: messageId, user_id: userId })
    .update({ ...changes, updated_at: db.fn.now() })
    .returning('*');
  return message;
};

export const deleteMessage = async (messageId, userId) => {
  const [message] = await db('referral_messages').where({ id: messageId, user_id: userId }).delete().returning('*');
  return message;
};
