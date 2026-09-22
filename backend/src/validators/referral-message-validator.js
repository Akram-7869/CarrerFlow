import { z } from 'zod';

export const referralMessageAiSchema = z.object({
  message: z.string().trim().min(40).max(2_000),
  evidenceRefs: z.array(z.string().trim().min(1).max(1_500)).min(1).max(8),
  warnings: z.array(z.string().trim().max(500)).max(10),
});

export const createReferralMessageSchema = z.object({
  params: z.object({ candidateId: z.uuid() }),
  body: z.object({ resumeId: z.uuid(), tone: z.enum(['concise', 'warm', 'formal']).default('concise') }).strict(),
});

export const listReferralMessagesSchema = z.object({ params: z.object({ candidateId: z.uuid() }) });

export const updateReferralMessageSchema = z.object({
  params: z.object({ messageId: z.uuid() }),
  body: z.object({ message: z.string().trim().min(40).max(2_000) }).strict(),
});

export const deleteReferralMessageSchema = z.object({ params: z.object({ messageId: z.uuid() }) });
