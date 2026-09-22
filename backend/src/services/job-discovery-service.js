import { createDiscoveryRun, findPreferences, saveDiscoveredJob, savePreferences } from '../repositories/job-discovery-repository.js';
import { fetchArbeitnowJobs } from '../job-sources/arbeitnow-source.js';
import { presentJob } from './job-service.js';

const defaults = {
  roles: [], locations: [], workModes: ['remote', 'hybrid', 'onsite'], experienceLevels: [], postedWithinHours: 168,
};

const lower = (value) => String(value || '').toLowerCase();
const includesAny = (haystack, needles) => !needles.length || needles.some((needle) => haystack.includes(lower(needle)));

export const matchesDiscoveryFilters = (job, filters, now = new Date()) => {
  const tags = typeof job.tags === 'string' ? JSON.parse(job.tags) : (job.tags || []);
  const searchableRole = lower([job.title, ...tags].join(' '));
  const searchableLocation = lower(job.location);
  if (!includesAny(searchableRole, filters.roles)) return false;
  if (!includesAny(searchableLocation, filters.locations)) return false;
  if (!filters.workModes.includes(job.work_mode)) return false;
  if (!includesAny(lower([job.title, ...tags].join(' ')), filters.experienceLevels)) return false;
  if (job.posted_at) {
    const ageHours = (now.getTime() - new Date(job.posted_at).getTime()) / 3_600_000;
    if (ageHours > filters.postedWithinHours) return false;
  }
  return true;
};

const presentPreferences = (record) => record ? ({
  roles: record.roles,
  locations: record.locations,
  workModes: record.work_modes,
  experienceLevels: record.experience_levels,
  postedWithinHours: record.posted_within_hours,
}) : defaults;

const toRecord = (input) => ({
  roles: JSON.stringify(input.roles),
  locations: JSON.stringify(input.locations),
  work_modes: JSON.stringify(input.workModes),
  experience_levels: JSON.stringify(input.experienceLevels),
  posted_within_hours: input.postedWithinHours,
});

export const getPreferences = async (userId) => presentPreferences(await findPreferences(userId));

export const updatePreferences = async (userId, input) =>
  presentPreferences(await savePreferences(userId, toRecord(input)));

export const discoverJobs = async (userId, input) => {
  await savePreferences(userId, toRecord(input));
  const source = await fetchArbeitnowJobs();
  const matched = source.jobs.filter((job) => matchesDiscoveryFilters(job, input)).slice(0, input.limit);
  const stored = await Promise.all(matched.map((job) => saveDiscoveredJob(userId, job)));
  const newCount = stored.filter((item) => item.created).length;

  const run = await createDiscoveryRun({
    user_id: userId,
    source: 'arbeitnow',
    filters: JSON.stringify(input),
    scanned_count: source.jobs.length,
    matched_count: matched.length,
    new_count: newCount,
  });

  return {
    jobs: stored.map(({ job }) => presentJob(job)),
    summary: { scannedCount: source.jobs.length, matchedCount: matched.length, newCount },
    source: { name: source.source, url: source.sourceUrl },
    runId: run.id,
  };
};
