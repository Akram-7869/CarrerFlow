import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(320);
const password = z
  .string()
  .min(8, 'Password must contain at least 8 characters')
  .max(128, 'Password must contain at most 128 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email,
      password,
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email,
      password: z.string().min(1).max(128),
    })
    .strict(),
});
