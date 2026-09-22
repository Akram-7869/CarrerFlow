import { z } from 'zod';

const questionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  question: z.string().trim().min(10).max(600),
  whyItMatters: z.string().trim().min(10).max(800),
  strongAnswerSignals: z.array(z.string().trim().min(3).max(300)).min(2).max(5),
  evidenceRefs: z.array(z.string().trim().min(3).max(500)).min(1).max(5),
}).strict();

export const interviewQuestionSetSchema = z.object({
  overview: z.string().trim().min(20).max(1500),
  categories: z.array(z.object({
    key: z.string().trim().min(2).max(60),
    title: z.string().trim().min(3).max(120),
    focus: z.string().trim().min(10).max(500),
    questions: z.array(questionSchema).min(1).max(5),
  }).strict()).min(1).max(6),
  studyPlan: z.array(z.string().trim().min(5).max(400)).min(3).max(7),
  warnings: z.array(z.string().trim().max(500)).max(10),
}).strict();

export const generateInterviewPrepSchema = z.object({
  params: z.object({ applicationId: z.uuid() }),
  body: z.object({ force: z.boolean().default(false) }).strict(),
});

export const getInterviewPrepSchema = z.object({ params: z.object({ applicationId: z.uuid() }) });

export const updateInterviewPrepSchema = z.object({
  params: z.object({ applicationId: z.uuid() }),
  body: z.object({
    answerNotes: z.record(z.string().trim().min(1).max(80), z.string().max(4_000)).default({}),
    completedQuestions: z.array(z.string().trim().min(1).max(80)).max(80).default([]),
  }).strict(),
});
