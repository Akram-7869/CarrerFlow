import { z } from 'zod';

const text = (max) => z.string().trim().max(max).default('');
const optionalNumber = z.union([z.number().min(0).max(80), z.null()]).default(null);
const stringList = z.array(text(500)).max(50).default([]);

export const basicInfoSchema = z.object({
  name: text(150),
  email: text(320),
  phone: text(50),
  location: text(180),
  linkedinUrl: text(500),
  githubUrl: text(500),
  portfolioUrl: text(500),
});

export const skillSchema = z.object({
  name: text(120),
  level: text(50),
  years: optionalNumber,
  evidence: text(1000),
});

export const experienceSchema = z.object({
  company: text(180),
  jobTitle: text(180),
  location: text(180),
  startDate: text(50),
  endDate: text(50),
  isCurrent: z.boolean().default(false),
  description: text(5000),
  highlights: stringList,
  technologies: z.array(text(120)).max(50).default([]),
  evidence: text(1500),
});

export const educationSchema = z.object({
  institution: text(220),
  degree: text(180),
  fieldOfStudy: text(180),
  location: text(180),
  startDate: text(50),
  endDate: text(50),
  grade: text(80),
  description: text(3000),
  evidence: text(1500),
});

export const projectSchema = z.object({
  name: text(180),
  description: text(5000),
  url: text(500),
  startDate: text(50),
  endDate: text(50),
  highlights: stringList,
  technologies: z.array(text(120)).max(50).default([]),
  evidence: text(1500),
});

export const certificationSchema = z.object({
  name: text(220),
  issuer: text(180),
  issueDate: text(50),
  expiryDate: text(50),
  credentialId: text(150),
  credentialUrl: text(500),
  evidence: text(1500),
});

export const profileDataSchema = z.object({
  basicInfo: basicInfoSchema,
  summary: text(5000),
  yearsExperience: optionalNumber,
  skills: z.array(skillSchema).max(200).default([]),
  experiences: z.array(experienceSchema).max(50).default([]),
  education: z.array(educationSchema).max(30).default([]),
  projects: z.array(projectSchema).max(50).default([]),
  certifications: z.array(certificationSchema).max(50).default([]),
  warnings: z.array(text(500)).max(50).default([]),
});

export const saveProfileSchema = z.object({
  body: z
    .object({
      resumeId: z.uuid().nullable().optional(),
      profile: profileDataSchema,
    })
    .strict(),
});
