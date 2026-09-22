import { z } from 'zod';

const text = (max) => z.string().trim().max(max);

export const tailoringAiSchema = z.object({
  summaryProposal: z.union([
    z.object({ originalText: text(5000), proposedText: text(5000), rationale: text(1000), evidenceRefs: z.array(text(1500)).min(1).max(10) }),
    z.null(),
  ]),
  skillOrder: z.array(text(120)).max(200),
  bulletProposals: z.array(z.object({
    sectionType: z.enum(['experience', 'project']),
    itemIndex: z.number().int().min(0),
    bulletIndex: z.number().int().min(-1),
    originalText: text(5000),
    proposedText: text(5000),
    rationale: text(1000),
    evidenceRefs: z.array(text(1500)).min(1).max(10),
  })).max(30),
  warnings: z.array(text(500)).max(50),
});
