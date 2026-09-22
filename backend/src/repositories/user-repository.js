import { db } from '../config/database.js';

const publicColumns = ['id', 'name', 'email', 'created_at', 'updated_at'];

export const findUserByEmail = (email) => db('users').where({ email }).first();

export const findUserById = (id) => db('users').where({ id }).first(publicColumns);

export const createUser = async ({ name, email, passwordHash }) => {
  const [user] = await db('users')
    .insert({ name, email, password_hash: passwordHash })
    .returning(publicColumns);

  return user;
};
