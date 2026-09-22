import { z } from 'zod';

export const coverLetterAiSchema = z.object({
  coverLetter: z.string().trim().min(100).max(8_000),
  evidenceRefs: z.array(z.string().trim().min(1).max(1_500)).min(1).max(12),
  warnings: z.array(z.string().trim().max(500)).max(10),
});
