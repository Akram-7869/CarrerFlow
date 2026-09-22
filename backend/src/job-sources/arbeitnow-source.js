import { createHash } from 'node:crypto';
import { AppError } from '../utils/app-error.js';

const API_URL = 'https://www.arbeitnow.com/api/job-board-api';
const SOURCE_URL = 'https://www.arbeitnow.com';

const decodeEntities = (value) => String(value || '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)));

export const htmlToText = (html) => decodeEntities(String(html || '')
  .replace(/<\s*br\s*\/?\s*>/gi, '\n')
  .replace(/<\/(p|li|div|h[1-6])>/gi, '\n')
  .replace(/<li[^>]*>/gi, '- ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n\s+/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()).replace(/\s+([.,;:!?])/g, '$1');

const normalizeJobType = (types = []) => {
  const value = types.join(' ').toLowerCase();
  if (value.includes('full')) return 'full-time';
  if (value.includes('part')) return 'part-time';
  if (value.includes('contract') || value.includes('freelance')) return 'contract';
  if (value.includes('intern')) return 'internship';
  return null;
};

const safeHttpUrl = (value) => {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

export const normalizeArbeitnowJob = (raw) => {
  const description = htmlToText(raw.description);
  const workText = `${raw.title || ''} ${raw.location || ''} ${description}`.toLowerCase();
  const workMode = raw.remote ? 'remote' : (/\bhybrid\b/.test(workText) ? 'hybrid' : 'onsite');
  const sourceUrl = safeHttpUrl(raw.url);
  const fingerprint = [raw.company_name, raw.title, raw.location, raw.slug || sourceUrl]
    .map((value) => String(value || '').trim().toLowerCase())
    .join('|');
  const jobHash = createHash('sha256').update(fingerprint).digest('hex');
  const sourceJobId = String(raw.slug || jobHash).trim();

  return {
    company: String(raw.company_name || 'Unknown company').trim(),
    title: String(raw.title || 'Untitled role').trim(),
    description,
    location: String(raw.location || '').trim() || null,
    work_mode: workMode,
    employment_type: normalizeJobType(raw.job_types),
    apply_url: sourceUrl,
    source: 'arbeitnow',
    source_job_id: sourceJobId,
    status: 'discovered',
    posted_at: raw.created_at ? new Date(raw.created_at * 1000) : null,
    remote: Boolean(raw.remote),
    tags: JSON.stringify(Array.isArray(raw.tags) ? raw.tags : []),
    job_hash: jobHash,
  };
};

export const fetchArbeitnowJobs = async ({ pages = 2 } = {}) => {
  const jobs = [];
  const safePages = Math.min(Math.max(pages, 1), 3);

  try {
    for (let page = 1; page <= safePages; page += 1) {
      const response = await fetch(`${API_URL}?page=${page}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'CareerFlowAI/0.1 (job discovery)' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Arbeitnow returned HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.data)) throw new Error('Arbeitnow returned an invalid response');
      jobs.push(...payload.data.map(normalizeArbeitnowJob));
      if (!payload.links?.next) break;
    }
  } catch (error) {
    throw new AppError(502, 'JOB_SOURCE_UNAVAILABLE', 'The free job source is temporarily unavailable.', {
      source: 'Arbeitnow', reason: error.message,
    });
  }

  return { jobs, source: 'Arbeitnow', sourceUrl: SOURCE_URL };
};
