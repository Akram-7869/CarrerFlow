import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { jobsApi, referralsApi } from '../services/api.js';

const emptyCandidate = { name: '', currentRole: '', company: '', location: '', profileUrl: '', bio: '' };

export function ReferralsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(searchParams.get('jobId') || '');
  const [candidates, setCandidates] = useState([]);
  const [manual, setManual] = useState(emptyCandidate);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCandidates = useCallback(async (selectedJobId) => {
    if (!selectedJobId) { setCandidates([]); return; }
    const response = await referralsApi.list(selectedJobId);
    setCandidates(response.data.candidates);
  }, []);

  useEffect(() => {
    jobsApi.list()
      .then(async ({ data }) => {
        setJobs(data.jobs);
        const selected = jobId || data.jobs[0]?.id || '';
        setJobId(selected);
        if (selected) await loadCandidates(selected);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [jobId, loadCandidates]);

  const selectJob = async (value) => {
    setJobId(value);
    setSearchParams(value ? { jobId: value } : {});
    setSummary(null);
    setError('');
    try { await loadCandidates(value); } catch (requestError) { setError(requestError.message); }
  };

  const discover = async () => {
    if (!jobId) return;
    setSearching(true); setError('');
    try {
      const response = await referralsApi.search(jobId);
      setSummary(response.data.summary);
      await loadCandidates(jobId);
    } catch (requestError) { setError(requestError.message); }
    finally { setSearching(false); }
  };

  const addManual = async (event) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      await referralsApi.create({ jobId, ...manual });
      setManual(emptyCandidate);
      await loadCandidates(jobId);
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const remove = async (candidateId) => {
    try {
      await referralsApi.remove(candidateId);
      setCandidates((current) => current.filter((candidate) => candidate.id !== candidateId));
    } catch (requestError) { setError(requestError.message); }
  };

  if (loading) return <p>Loading referral workspace…</p>;
  const selectedJob = jobs.find((job) => job.id === jobId);

  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading"><p className="eyebrow">Public profiles · user controlled</p><h1>Referral discovery</h1><p>Find public developer profiles connected to a target company, verify them yourself, and prepare for respectful outreach.</p></div>
        <Link className="button button-quiet" to="/jobs">Back to jobs</Link>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      {!jobs.length ? <section className="empty-panel compact-empty"><h2>Add a job first</h2><p>Referral discovery needs a target company and role.</p><Link className="button button-primary compact-button" to="/jobs">Open jobs</Link></section> : <>
        <section className="referral-toolbar">
          <label>Target job<select value={jobId} onChange={(event) => selectJob(event.target.value)}>{jobs.map((job) => <option key={job.id} value={job.id}>{job.company} — {job.title}</option>)}</select></label>
          <div><p className="eyebrow">Free public source</p><p>Looks for <strong>{selectedJob?.company}</strong> on GitHub, then checks profiles with publicly visible membership in the matching organization.</p></div>
          <button className="button button-primary compact-button" disabled={!jobId || searching} onClick={discover} type="button">{searching ? 'Searching public profiles…' : 'Find public profiles'}</button>
        </section>
        {summary && <div className="privacy-strip">Found {summary.resultCount} public profiles; {summary.newCount} were new. GitHub requests remaining: {summary.rateLimitRemaining ?? 'not reported'}.</div>}

        <section className="referral-section">
          <div className="section-heading"><div><p className="eyebrow">Review before outreach</p><h2>Referral candidates</h2></div></div>
          {!candidates.length ? <p className="section-empty">No candidates saved for this job yet. Run public search or add a profile manually.</p> : <div className="candidate-grid">{candidates.map((candidate) => (
            <article className="candidate-card" key={candidate.id}>
              <div className="candidate-head"><div className="company-mark">{candidate.name.slice(0, 2).toUpperCase()}</div><div><p className="job-company">{candidate.source === 'github' ? 'GitHub public profile' : 'User-added profile'}</p><h3>{candidate.name}</h3><p>{candidate.currentRole || 'Role not listed'}{candidate.company && ` · ${candidate.company}`}</p></div><span className="candidate-score">{candidate.relevanceScore}</span></div>
              {candidate.location && <p className="candidate-location">{candidate.location}</p>}
              <ul className="clean-list candidate-reasons">{candidate.relevanceReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              <p className="verification-note">Public profile details are self-reported. Verify identity, employer, and relevance before contacting anyone.</p>
              <div className="card-actions"><Link className="button button-primary compact-button" to={`/referrals/${candidate.id}/messages`}>Prepare message</Link><a className="button button-secondary" href={candidate.profileUrl} rel="noreferrer" target="_blank">View public profile ↗</a><button className="text-button danger-text" onClick={() => remove(candidate.id)} type="button">Remove</button></div>
            </article>
          ))}</div>}
        </section>

        <details className="manual-candidate-panel"><summary>Add a public profile manually</summary><form className="discovery-form" onSubmit={addManual}>
          <div className="discovery-fields">
            <label>Name<input required value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} /></label>
            <label>Current role<input value={manual.currentRole} onChange={(event) => setManual({ ...manual, currentRole: event.target.value })} /></label>
            <label>Company<input required value={manual.company} onChange={(event) => setManual({ ...manual, company: event.target.value })} /></label>
            <label>Location<input value={manual.location} onChange={(event) => setManual({ ...manual, location: event.target.value })} /></label>
            <label className="wide-field">Public profile URL<input required type="url" value={manual.profileUrl} onChange={(event) => setManual({ ...manual, profileUrl: event.target.value })} placeholder="https://…" /></label>
            <label className="wide-field">Public profile context<textarea rows="3" value={manual.bio} onChange={(event) => setManual({ ...manual, bio: event.target.value })} placeholder="Only add public, work-related context relevant to this referral." /></label>
          </div>
          <button className="button button-primary compact-button" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save candidate'}</button>
        </form></details>
        <p className="source-note">CareerFlow only links to public profiles. It does not scrape LinkedIn, access private information, or contact anyone automatically.</p>
      </>}
    </div>
  );
}
