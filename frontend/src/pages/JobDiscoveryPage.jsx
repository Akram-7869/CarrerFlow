import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobDiscoveryApi } from '../services/api.js';

const splitValues = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);
const joinValues = (values) => (values || []).join(', ');

export function JobDiscoveryPage() {
  const [form, setForm] = useState({ roles: '', locations: '', workModes: ['remote', 'hybrid', 'onsite'], experienceLevels: '', postedWithinHours: 168, limit: 50 });
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    jobDiscoveryApi.getPreferences()
      .then(({ data }) => setForm((current) => ({
        ...current,
        roles: joinValues(data.preferences.roles),
        locations: joinValues(data.preferences.locations),
        workModes: data.preferences.workModes,
        experienceLevels: joinValues(data.preferences.experienceLevels),
        postedWithinHours: data.preferences.postedWithinHours,
      })))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleMode = (mode) => setForm((current) => ({
    ...current,
    workModes: current.workModes.includes(mode) ? current.workModes.filter((item) => item !== mode) : [...current.workModes, mode],
  }));

  const search = async (event) => {
    event.preventDefault();
    setSearching(true);
    setError('');
    try {
      const response = await jobDiscoveryApi.search({
        roles: splitValues(form.roles),
        locations: splitValues(form.locations),
        workModes: form.workModes,
        experienceLevels: splitValues(form.experienceLevels),
        postedWithinHours: Number(form.postedWithinHours),
        limit: Number(form.limit),
      });
      setJobs(response.data.jobs);
      setSummary(response.data.summary);
      setSource(response.data.source);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSearching(false);
    }
  };

  if (loading) return <p>Loading search preferences…</p>;

  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading"><p className="eyebrow">Free public job feed</p><h1>Discover jobs</h1><p>Search current roles, save matching results automatically, then analyze only the jobs you choose.</p></div>
        <Link className="button button-quiet" to="/jobs">Saved jobs</Link>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      <form className="discovery-form" onSubmit={search}>
        <div className="discovery-fields">
          <label>Roles or keywords<input value={form.roles} onChange={(event) => setForm({ ...form, roles: event.target.value })} placeholder="React developer, Node.js" /><span className="field-help">Separate multiple terms with commas.</span></label>
          <label>Locations<input value={form.locations} onChange={(event) => setForm({ ...form, locations: event.target.value })} placeholder="India, Bengaluru" /><span className="field-help">Leave empty to search every location.</span></label>
          <label>Experience keywords<input value={form.experienceLevels} onChange={(event) => setForm({ ...form, experienceLevels: event.target.value })} placeholder="Junior, Mid, Senior" /></label>
          <label>Posted within<select value={form.postedWithinHours} onChange={(event) => setForm({ ...form, postedWithinHours: Number(event.target.value) })}><option value={24}>Last 24 hours</option><option value={72}>Last 3 days</option><option value={168}>Last 7 days</option><option value={720}>Last 30 days</option><option value={2160}>Last 90 days</option></select></label>
        </div>
        <fieldset className="mode-fieldset"><legend>Work mode</legend>{['remote', 'hybrid', 'onsite'].map((mode) => <label className="check-option" key={mode}><input checked={form.workModes.includes(mode)} onChange={() => toggleMode(mode)} type="checkbox" />{mode}</label>)}</fieldset>
        <button className="button button-primary compact-button" disabled={searching || form.workModes.length === 0} type="submit">{searching ? 'Searching free source…' : 'Find jobs'}</button>
      </form>

      {summary && <section className="discovery-summary"><div><strong>{summary.scannedCount}</strong><span>scanned</span></div><div><strong>{summary.matchedCount}</strong><span>matched</span></div><div><strong>{summary.newCount}</strong><span>newly saved</span></div><p>Source: <a href={source.url} rel="noreferrer" target="_blank">{source.name}</a></p></section>}
      {summary && jobs.length === 0 && <section className="empty-panel compact-empty"><h2>No matching jobs found</h2><p>Try broader role or location terms, or increase the posted-date range.</p></section>}
      {jobs.length > 0 && <div className="job-grid discovery-results">{jobs.map((job) => (
        <article className="job-card" key={job.id}>
          <div className="company-mark">{job.company.slice(0, 2).toUpperCase()}</div>
          <div className="job-card-copy"><p className="job-company">{job.company}</p><h2>{job.title}</h2><div className="job-meta"><span>{job.location || 'Location unspecified'}</span><span>{job.workMode}</span>{job.postedAt && <span>{new Date(job.postedAt).toLocaleDateString()}</span>}</div><span className="status-pill">Saved · ready to analyze</span></div>
          <div className="card-actions"><Link className="button button-secondary" to={`/jobs/${job.id}`}>Review job</Link>{job.applyUrl && <a className="text-button" href={job.applyUrl} rel="noreferrer" target="_blank">Original listing ↗</a>}</div>
        </article>
      ))}</div>}
      <p className="source-note">Listings are provided by <a href="https://www.arbeitnow.com" rel="noreferrer" target="_blank">Arbeitnow</a>. CareerFlow does not guarantee listing accuracy or availability. Always verify the employer and role before applying.</p>
    </div>
  );
}
