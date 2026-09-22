import { z } from 'zod';
import { profileDataSchema } from './profile-validator.js';

export const resumeIdSchema = z.object({
  params: z.object({ resumeId: z.uuid() }),
});

export const updateResumeSchema = z.object({
  params: z.object({ resumeId: z.uuid() }),
  body: z.object({ name: z.string().trim().min(1).max(150) }).strict(),
});

export const confirmResumeSchema = z.object({
  params: z.object({ resumeId: z.uuid() }),
  body: z.object({ profile: profileDataSchema }).strict(),
});
