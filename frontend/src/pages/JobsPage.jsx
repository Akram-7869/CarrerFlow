import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../services/api.js';

const statusLabels = { discovered: 'Ready to analyze', analyzing: 'Analyzing', ready: 'Ready to match', failed: 'Needs attention' };

export function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    jobsApi.list()
      .then((response) => setJobs(response.data.jobs))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (jobId) => {
    if (!window.confirm('Delete this saved job and all of its match reports?')) return;
    try {
      await jobsApi.remove(jobId);
      setJobs((current) => current.filter((job) => job.id !== jobId));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading"><p className="eyebrow">Job intelligence</p><h1>Saved jobs</h1><p>Discover jobs from a free public source or paste a description, then compare it with your verified experience.</p></div>
        <div className="title-actions"><Link className="button button-primary compact-button" to="/jobs/discover">Discover jobs</Link><Link className="button button-quiet compact-button" to="/jobs/new">Paste a JD</Link></div>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      {loading ? <p>Loading jobs…</p> : jobs.length === 0 ? (
        <section className="empty-panel compact-empty"><span className="empty-mark">JD</span><h2>Find or add your first job</h2><p>Search a free public job feed, or paste any job description you already have.</p><div className="title-actions"><Link className="button button-primary compact-button" to="/jobs/discover">Discover jobs</Link><Link className="button button-secondary compact-button" to="/jobs/new">Paste a job</Link></div></section>
      ) : (
        <div className="job-grid">
          {jobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="company-mark">{job.company.slice(0, 2).toUpperCase()}</div>
              <div className="job-card-copy">
                <p className="job-company">{job.company}</p>
                <h2>{job.title}</h2>
                <div className="job-meta"><span>{job.location || 'Location unspecified'}</span><span>{job.workMode}</span></div>
                <span className={`status-pill status-${job.status}`}>{statusLabels[job.status] || job.status}</span>
                {job.analysisError && <p className="inline-error">{job.analysisError}</p>}
              </div>
              <div className="card-actions">
                <Link className="button button-secondary" to={`/jobs/${job.id}`}>{job.status === 'ready' ? 'View analysis' : 'View'}</Link>
                <button className="text-button danger-text" onClick={() => remove(job.id)} type="button">Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
