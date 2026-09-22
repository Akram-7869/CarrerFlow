import { z } from 'zod';

const stringList = z.array(z.string().trim().min(1).max(100)).max(10);
const workModes = z.array(z.enum(['remote', 'hybrid', 'onsite'])).min(1).max(3);

const preferences = z.object({
  roles: stringList.default([]),
  locations: stringList.default([]),
  workModes: workModes.default(['remote', 'hybrid', 'onsite']),
  experienceLevels: stringList.default([]),
  postedWithinHours: z.number().int().min(24).max(2160).default(168),
}).strict();

export const saveJobPreferencesSchema = z.object({ body: preferences });

export const discoverJobsSchema = z.object({
  body: preferences.extend({ limit: z.number().int().min(1).max(100).default(50) }),
});
