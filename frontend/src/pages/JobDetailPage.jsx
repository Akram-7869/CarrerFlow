import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobsApi, resumesApi } from '../services/api.js';

export function JobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [jobResponse, resumeResponse] = await Promise.all([jobsApi.get(jobId), resumesApi.list()]);
      setJob(jobResponse.data.job);
      const readyResumes = resumeResponse.data.resumes.filter((resume) => ['review_required', 'confirmed'].includes(resume.status));
      setResumes(readyResumes);
      setResumeId((current) => current || readyResumes[0]?.id || '');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const retry = async () => {
    setMatching(true); setError('');
    try { const response = await jobsApi.retry(jobId); setJob(response.data.job); }
    catch (requestError) { setError(requestError.message); }
    finally { setMatching(false); }
  };

  const match = async () => {
    if (!resumeId) return;
    setMatching(true); setError('');
    try {
      await jobsApi.match(jobId, resumeId);
      navigate(`/jobs/${jobId}/match/${resumeId}`);
    } catch (requestError) { setError(requestError.message); }
    finally { setMatching(false); }
  };

  if (loading) return <p>Loading job analysis…</p>;
  if (!job) return <div className="alert">{error || 'Job not found.'}</div>;
  const analysis = job.analysis;

  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading"><p className="eyebrow">{job.company}</p><h1>{job.title}</h1><p>{job.location || analysis?.location || 'Location unspecified'} · {job.workMode}</p></div>
        <div className="title-actions">{analysis && <Link className="button button-secondary" to={`/referrals?jobId=${job.id}`}>Find referrals</Link>}<Link className="button button-quiet" to="/jobs">Back to jobs</Link></div>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      {job.status === 'discovered' && <section className="editor-section"><p className="eyebrow">Discovered via {job.source}</p><h2>Analyze this job when you’re ready</h2><p>The listing is saved. Run Gemini extraction now to identify requirements and enable resume matching. This uses one free-tier AI request.</p><div className="title-actions"><button className="button button-primary compact-button" disabled={matching} onClick={retry} type="button">{matching ? 'Analyzing…' : 'Analyze job description'}</button>{job.applyUrl && <a className="button button-secondary compact-button" href={job.applyUrl} rel="noreferrer" target="_blank">View original listing ↗</a>}</div></section>}
      {job.status === 'failed' && <section className="editor-section"><h2>Analysis needs another attempt</h2><p>{job.analysisError}</p><button className="button button-primary compact-button" disabled={matching} onClick={retry} type="button">{matching ? 'Analyzing…' : 'Retry analysis'}</button></section>}
      {analysis && (
        <>
          <section className="job-analysis-hero">
            <div><p className="eyebrow">Extracted summary</p><p>{analysis.summary || 'No explicit summary was available.'}</p></div>
            <div className="analysis-facts"><span><strong>{analysis.experienceLevel}</strong> level</span><span><strong>{analysis.minYearsExperience ?? '—'}</strong> minimum years</span><span><strong>{analysis.employmentType}</strong> employment</span></div>
          </section>
          {analysis.warnings.length > 0 && <div className="review-warnings"><strong>Extraction notes</strong><ul>{analysis.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></div>}
          <div className="job-analysis-grid">
            <section className="ats-section"><div className="section-heading"><div><p className="eyebrow">Must have</p><h2>Required skills</h2></div></div><div className="tag-list">{analysis.requiredSkills.length ? analysis.requiredSkills.map((skill) => <span className="skill-tag required-tag" key={skill.name}>{skill.name}</span>) : <p className="section-empty">No explicit required skills extracted.</p>}</div></section>
            <section className="ats-section"><div className="section-heading"><div><p className="eyebrow">Nice to have</p><h2>Preferred skills</h2></div></div><div className="tag-list">{analysis.preferredSkills.length ? analysis.preferredSkills.map((skill) => <span className="skill-tag" key={skill.name}>{skill.name}</span>) : <p className="section-empty">No explicit preferred skills extracted.</p>}</div></section>
          </div>
          <section className="ats-section responsibility-section"><div className="section-heading"><div><p className="eyebrow">Role expectations</p><h2>Responsibilities</h2></div></div>{analysis.responsibilities.length ? <ul className="clean-list">{analysis.responsibilities.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="section-empty">No responsibilities were extracted verbatim.</p>}</section>
          <section className="match-cta">
            <div><p className="eyebrow">Evidence-based comparison</p><h2>Match a resume to this job</h2><p>Only your selected resume and user-confirmed Career Profile are used as evidence.</p></div>
            <div className="match-controls">
              <select value={resumeId} onChange={(event) => setResumeId(event.target.value)}><option value="">Select a resume</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}</option>)}</select>
              <button className="button button-primary compact-button" disabled={!resumeId || matching} onClick={match} type="button">{matching ? 'Matching…' : 'Run compatibility match'}</button>
            </div>
            {!resumes.length && <p className="inline-error">Upload and extract a resume before running a match.</p>}
          </section>
          <details className="jd-details"><summary>View original job description</summary><pre>{job.description}</pre></details>
        </>
      )}
      {!analysis && job.status !== 'failed' && <details className="jd-details"><summary>View discovered job description</summary><pre>{job.description}</pre></details>}
      {job.source === 'arbeitnow' && <p className="source-note">Source: <a href="https://www.arbeitnow.com" rel="noreferrer" target="_blank">Arbeitnow</a>. Verify the role on the original listing before applying.</p>}
    </div>
  );
}
