import { z } from 'zod';

export const jobIdSchema = z.object({
  params: z.object({ jobId: z.uuid() }),
});

export const matchIdSchema = z.object({
  params: z.object({ jobId: z.uuid(), resumeId: z.uuid() }),
});

export const createJobSchema = z.object({
  body: z.object({
    company: z.string().trim().min(1).max(180),
    title: z.string().trim().min(1).max(180),
    description: z.string().trim().min(100, 'Job description must contain at least 100 characters').max(100_000),
    location: z.string().trim().max(180).default(''),
    applyUrl: z.union([z.url(), z.literal('')]).default(''),
  }).strict(),
});

export const createMatchSchema = z.object({
  params: z.object({ jobId: z.uuid() }),
  body: z.object({ resumeId: z.uuid() }).strict(),
});
