import { z } from 'zod';

const text = (max) => z.string().trim().max(max).default('');
const skill = z.object({ name: text(120), evidence: text(1000) });

export const jobAnalysisSchema = z.object({
  summary: text(3000),
  requiredSkills: z.array(skill).max(100).default([]),
  preferredSkills: z.array(skill).max(100).default([]),
  minYearsExperience: z.union([z.number().min(0).max(50), z.null()]).default(null),
  maxYearsExperience: z.union([z.number().min(0).max(50), z.null()]).default(null),
  experienceLevel: z.enum(['internship', 'entry', 'mid', 'senior', 'lead', 'unspecified']).default('unspecified'),
  responsibilities: z.array(text(1500)).max(50).default([]),
  educationRequirements: z.array(text(1000)).max(20).default([]),
  location: text(180),
  workMode: z.enum(['remote', 'hybrid', 'onsite', 'unspecified']).default('unspecified'),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship', 'temporary', 'unspecified']).default('unspecified'),
  keywords: z.array(text(120)).max(100).default([]),
  warnings: z.array(text(500)).max(50).default([]),
});
