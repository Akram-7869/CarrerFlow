import { z } from 'zod';

export const createTailoringSchema = z.object({
  params: z.object({ jobId: z.uuid() }),
  body: z.object({ resumeId: z.uuid() }).strict(),
});

export const sessionIdSchema = z.object({
  params: z.object({ sessionId: z.uuid() }),
});

export const proposalActionSchema = z.object({
  params: z.object({ sessionId: z.uuid(), proposalId: z.uuid() }),
  body: z.object({
    status: z.enum(['accepted', 'rejected', 'edited']),
    editedText: z.string().trim().max(5000).optional(),
  }).strict().superRefine((value, context) => {
    if (value.status === 'edited' && !value.editedText) {
      context.addIssue({ code: 'custom', path: ['editedText'], message: 'Edited text is required.' });
    }
  }),
});

export const versionIdSchema = z.object({
  params: z.object({ versionId: z.uuid() }),
});

export const versionDownloadSchema = z.object({
  params: z.object({ versionId: z.uuid(), format: z.enum(['pdf', 'docx']) }),
});
