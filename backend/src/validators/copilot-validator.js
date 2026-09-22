import { z } from 'zod';

export const askCopilotSchema = z.object({
  body: z.object({
    question: z.string().trim().min(5).max(1_000),
  }).strict(),
});
