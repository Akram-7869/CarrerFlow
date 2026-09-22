import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { jobsApi, resumesApi, tailoringApi } from '../services/api.js';
import { useNavigate } from 'react-router-dom';

const recommendations = {
  use_existing_resume: { title: 'Use this resume', message: 'This resume has strong evidence for the role. Review the remaining gaps before applying.' },
  targeted_changes: { title: 'Make targeted improvements', message: 'The resume is a reasonable base, but relevant verified experience could be presented more clearly.' },
  significant_gaps: { title: 'Significant gaps remain', message: 'Several requirements lack supporting evidence. Do not add skills you cannot truthfully support.' },
};

const breakdownLabels = { requiredSkills: 'Required skills', preferredSkills: 'Preferred skills', experience: 'Experience', responsibilities: 'Responsibilities', keywords: 'Keyword coverage' };

function RequirementList({ title, tone, items, emptyMessage }) {
  return (
    <section className={`match-column match-column-${tone}`}>
      <div className="match-column-title"><span>{items.length}</span><h2>{title}</h2></div>
      {items.length === 0 ? <p className="section-empty">{emptyMessage}</p> : items.map((item) => (
        <article className="requirement-item" key={`${item.requirementType}-${item.requirement}`}>
          <div className="requirement-name"><strong>{item.requirement}</strong><small>{item.requirementType}</small></div>
          {item.classification === 'partial' && <p>Related evidence: {item.relatedSkills.join(', ')}</p>}
          {item.evidence.map((evidence, index) => (
            <div className="match-evidence" key={`${evidence.source}-${index}`}>
              <span>{evidence.verified ? 'Verified profile' : 'Selected resume'}</span>
              <p>{evidence.detail}</p>
            </div>
          ))}
          {item.classification === 'missing' && <p>No supporting evidence was found.</p>}
        </article>
      ))}
    </section>
  );
}

export function JobMatchPage() {
  const { jobId, resumeId } = useParams();
  const [job, setJob] = useState(null);
  const [resume, setResume] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const navigate = useNavigate();

  const runMatch = useCallback(async () => {
    setMatching(true); setError('');
    try { const response = await jobsApi.match(jobId, resumeId); setMatch(response.data.match); }
    catch (requestError) { setError(requestError.message); }
    finally { setMatching(false); }
  }, [jobId, resumeId]);

  useEffect(() => {
    let active = true;
    Promise.all([jobsApi.get(jobId), resumesApi.get(resumeId), jobsApi.getMatch(jobId, resumeId)])
      .then(([jobResponse, resumeResponse, matchResponse]) => {
        if (!active) return;
        setJob(jobResponse.data.job);
        setResume(resumeResponse.data.resume);
        setMatch(matchResponse.data.match);
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [jobId, resumeId]);

  if (loading) return <p>Loading compatibility report…</p>;
  if (!job || !resume) return <div className="content-page"><div className="alert">{error || 'The job or resume could not be found.'}</div><Link to="/jobs">Back to jobs</Link></div>;

  const recommendation = match ? recommendations[match.recommendation] : null;
  const startTailoring = async () => {
    setTailoring(true); setError('');
    try {
      const response = await tailoringApi.create(jobId, resumeId);
      navigate(`/tailoring/${response.data.session.id}`);
    } catch (requestError) { setError(requestError.message); }
    finally { setTailoring(false); }
  };
  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading"><p className="eyebrow">Resume ↔ job compatibility</p><h1>{job.title}</h1><p>{resume.name} compared with {job.company}</p></div>
        <div className="review-actions"><Link className="button button-secondary" to={`/prepare?jobId=${jobId}&resumeId=${resumeId}`}>Prepare application</Link><Link className="button button-quiet" to={`/jobs/${jobId}`}>Back to job</Link><button className="button button-primary compact-button" disabled={matching} onClick={runMatch} type="button">{matching ? 'Matching…' : 'Run again'}</button></div>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      {!match ? <section className="empty-panel compact-empty"><h2>No match report yet</h2><button className="button button-primary compact-button" onClick={runMatch} type="button">Run compatibility match</button></section> : (
        <>
          <section className="match-score-hero">
            <div className="match-score"><strong>{match.matchScore}</strong><span>/100</span></div>
            <div><p className="eyebrow">Recommendation</p><h2>{recommendation.title}</h2><p>{recommendation.message}</p><small>Deterministic matcher v{match.matcherVersion}</small></div>
          </section>
          <section className="tailor-cta"><div><p className="eyebrow">Grounded improvements</p><h2>Create a tailored version</h2><p>CareerFlow will propose reviewable wording changes using only your verified evidence.</p></div><button className="button button-primary compact-button" disabled={tailoring} onClick={startTailoring} type="button">{tailoring ? 'Preparing changes…' : 'Tailor this resume'}</button></section>
          <div className="guardrail-banner"><strong>Truth over keyword stuffing.</strong> Missing requirements are application gaps—not permission to add unsupported claims to your resume.</div>
          <section className="ats-section">
            <div className="section-heading"><div><p className="eyebrow">Weighted result</p><h2>Score breakdown</h2></div></div>
            <div className="category-grid">
              {Object.entries(match.scoreBreakdown).map(([key, item]) => (
                <article className="category-card" key={key}><div className="category-title"><span>{breakdownLabels[key]}</span><strong>{item.percent === null ? 'N/A' : `${item.percent}%`}</strong></div><div className="score-track"><span style={{ width: `${item.percent || 0}%` }} /></div><small>{item.weight}% of active score</small></article>
              ))}
            </div>
          </section>
          <div className="match-columns">
            <RequirementList title="Supported" tone="supported" items={match.supported} emptyMessage="No exact supported requirements found." />
            <RequirementList title="Partial" tone="partial" items={match.partial} emptyMessage="No partial matches found." />
            <RequirementList title="Missing" tone="missing" items={match.missing} emptyMessage="No missing skill requirements found." />
          </div>
          <div className="job-analysis-grid">
            <section className="ats-section"><div className="section-heading"><div><p className="eyebrow">Experience check</p><h2>{match.experienceMatch.classification.replace('_', ' ')}</h2></div></div><p>Job minimum: <strong>{match.experienceMatch.requiredYears ?? 'Not specified'}</strong></p><p>Verified profile: <strong>{match.experienceMatch.candidateYears ?? 'Not specified'} years</strong></p></section>
            <section className="ats-section"><div className="section-heading"><div><p className="eyebrow">Responsibility alignment</p><h2>{match.responsibilityMatch.percent === null ? 'Not available' : `${match.responsibilityMatch.percent}%`}</h2></div></div><p className="section-empty">Based on meaningful phrase overlap with verified experience and resume content.</p></section>
          </div>
        </>
      )}
    </div>
  );
}
