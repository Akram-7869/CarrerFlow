import { z } from 'zod';

export const applicationStatuses = ['saved', 'preparing', 'applied', 'oa', 'interview', 'offer', 'rejected', 'withdrawn'];
const applicationStatus = z.enum(applicationStatuses);
const eventType = z.enum(['follow_up', 'online_assessment', 'interview', 'deadline', 'other']);
const dateTime = z.iso.datetime({ offset: true });

export const prepareApplicationSchema = z.object({
  body: z.object({
    jobId: z.uuid(),
    resumeId: z.uuid(),
    resumeVersionId: z.uuid().nullable().default(null),
    referralCandidateId: z.uuid().nullable().default(null),
    referralMessageId: z.uuid().nullable().default(null),
    notes: z.string().trim().max(5_000).default(''),
  }).strict(),
});

export const applicationIdSchema = z.object({ params: z.object({ applicationId: z.uuid() }) });

export const updateApplicationPreparationSchema = z.object({
  params: z.object({ applicationId: z.uuid() }),
  body: z.object({
    resumeId: z.uuid(),
    resumeVersionId: z.uuid().nullable(),
    referralCandidateId: z.uuid().nullable(),
    referralMessageId: z.uuid().nullable(),
    notes: z.string().trim().max(5_000),
  }).strict(),
});

export const generateCoverLetterSchema = z.object({
  params: z.object({ applicationId: z.uuid() }),
  body: z.object({ tone: z.enum(['concise', 'warm', 'formal']).default('formal') }).strict(),
});

export const updateCoverLetterSchema = z.object({
  params: z.object({ applicationId: z.uuid() }),
  body: z.object({ coverLetter: z.string().trim().min(100).max(8_000) }).strict(),
});

export const listApplicationsSchema = z.object({
  query: z.object({ status: applicationStatus.optional() }),
});

export const updateApplicationStatusSchema = z.object({
  params: z.object({ applicationId: z.uuid() }),
  body: z.object({
    status: applicationStatus,
    note: z.string().trim().max(1_000).default(''),
    occurredAt: dateTime.optional(),
  }).strict(),
});

export const updateApplicationNotesSchema = z.object({
  params: z.object({ applicationId: z.uuid() }),
  body: z.object({ notes: z.string().trim().max(5_000) }).strict(),
});

export const createApplicationEventSchema = z.object({
  params: z.object({ applicationId: z.uuid() }),
  body: z.object({
    eventType,
    title: z.string().trim().min(1).max(180),
    scheduledAt: dateTime,
    notes: z.string().trim().max(2_000).default(''),
  }).strict(),
});

export const eventIdSchema = z.object({ params: z.object({ eventId: z.uuid() }) });

export const updateApplicationEventSchema = z.object({
  params: z.object({ eventId: z.uuid() }),
  body: z.object({
    eventType,
    title: z.string().trim().min(1).max(180),
    scheduledAt: dateTime,
    notes: z.string().trim().max(2_000),
    completed: z.boolean(),
  }).strict(),
});
