import { z } from 'zod';

export const referralJobSchema = z.object({ params: z.object({ jobId: z.uuid() }) });

export const searchReferralsSchema = z.object({
  body: z.object({ jobId: z.uuid(), limit: z.number().int().min(1).max(5).default(5) }).strict(),
});

export const createReferralSchema = z.object({
  body: z.object({
    jobId: z.uuid(),
    name: z.string().trim().min(1).max(180),
    currentRole: z.string().trim().max(180).default(''),
    company: z.string().trim().min(1).max(180),
    location: z.string().trim().max(180).default(''),
    profileUrl: z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'Profile URL must use HTTP or HTTPS'),
    bio: z.string().trim().max(2_000).default(''),
  }).strict(),
});

export const referralCandidateSchema = z.object({ params: z.object({ candidateId: z.uuid() }) });
