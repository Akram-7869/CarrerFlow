import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../services/api.js';
import { applicationStatusLabels } from '../utils/applications.js';

export function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    applicationsApi.list()
      .then(({ data }) => setApplications(data.applications))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filter === 'all' ? applications : applications.filter((application) => application.status === filter), [applications, filter]);
  const counts = useMemo(() => applications.reduce((result, application) => ({ ...result, [application.status]: (result[application.status] || 0) + 1 }), {}), [applications]);

  const changeStatus = async (applicationId, status) => {
    setUpdatingId(applicationId); setError('');
    try {
      const response = await applicationsApi.updateStatus(applicationId, { status, note: '' });
      setApplications((current) => current.map((application) => application.id === applicationId ? response.data.application : application));
    } catch (requestError) { setError(requestError.message); }
    finally { setUpdatingId(''); }
  };

  if (loading) return <p>Loading applications…</p>;

  return (
    <div className="content-page">
      <div className="page-title-row"><div className="page-heading"><p className="eyebrow">Your active pipeline</p><h1>Application tracker</h1><p>Keep every application status, next step, and follow-up in one place.</p></div><Link className="button button-primary compact-button" to="/prepare">Prepare application</Link></div>
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="tracker-filters"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')} type="button">All <span>{applications.length}</span></button>{Object.entries(applicationStatusLabels).map(([status, label]) => <button className={filter === status ? 'active' : ''} key={status} onClick={() => setFilter(status)} type="button">{label} <span>{counts[status] || 0}</span></button>)}</div>
      {!filtered.length ? <section className="empty-panel compact-empty"><h2>{applications.length ? 'No applications in this status' : 'No applications prepared yet'}</h2><p>Create an application preparation to begin tracking it.</p><Link className="button button-primary compact-button" to="/prepare">Prepare an application</Link></section> : <div className="application-grid">{filtered.map((application) => {
        const nextEvent = application.events.find((event) => !event.completed && new Date(event.scheduledAt) >= new Date());
        return <article className="application-card" key={application.id}>
          <div className="application-card-top"><div className="company-mark">{application.job.company.slice(0, 2).toUpperCase()}</div><div><p className="job-company">{application.job.company}</p><h2>{application.job.title}</h2><p>{application.job.location || 'Location unspecified'}</p></div></div>
          <div className="application-metrics"><span><strong>{application.match?.matchScore ?? '—'}</strong>Match</span><span><strong>{application.ats?.overallScore ?? '—'}</strong>ATS</span><span><strong>{application.events.filter((event) => !event.completed).length}</strong>Upcoming</span></div>
          {nextEvent ? <p className="next-event"><strong>Next:</strong> {nextEvent.title} · {new Date(nextEvent.scheduledAt).toLocaleString()}</p> : <p className="section-empty">No upcoming events.</p>}
          <div className="application-card-actions"><select aria-label={`Status for ${application.job.company} ${application.job.title}`} disabled={updatingId === application.id} value={application.status} onChange={(event) => changeStatus(application.id, event.target.value)}>{Object.entries(applicationStatusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select><Link className="button button-secondary" to={`/applications/${application.id}`}>View timeline</Link></div>
        </article>;
      })}</div>}
    </div>
  );
}
