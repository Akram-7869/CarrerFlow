import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { tailoringApi } from '../services/api.js';

const displayText = (proposal, key) => {
  const value = proposal[key];
  if (proposal.proposalType !== 'skill_reorder') return value;
  try { return JSON.parse(value).join('  •  '); } catch { return value; }
};

export function TailoringReviewPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [edits, setEdits] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    tailoringApi.get(sessionId)
      .then((response) => setSession(response.data.session))
      .catch((requestError) => setError(requestError.message));
  }, [sessionId]);

  const pendingCount = useMemo(() => session?.proposals.filter((proposal) => proposal.status === 'pending').length || 0, [session]);

  const review = async (proposal, status) => {
    setBusy(true); setError('');
    try {
      const response = await tailoringApi.review(sessionId, proposal.id, status, status === 'edited' ? edits[proposal.id] : undefined);
      setSession((current) => ({ ...current, proposals: current.proposals.map((item) => item.id === proposal.id ? response.data.proposal : item) }));
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const complete = async () => {
    setBusy(true); setError('');
    try {
      const response = await tailoringApi.complete(sessionId);
      navigate(`/resume-versions/${response.data.version.id}`);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  if (!session) return <div className="content-page">{error ? <div className="alert">{error}</div> : <p>Preparing tailored changes…</p>}</div>;
  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading"><p className="eyebrow">Human review required</p><h1>Tailor {session.resumeName}</h1><p>Target: {session.jobTitle} at {session.company}</p></div>
        <Link className="button button-quiet" to={`/jobs/${session.jobId}`}>Back to job</Link>
      </div>
      <div className="guardrail-banner"><strong>Every change is optional.</strong> The original resume remains untouched. Unsupported skills and unverified metrics are blocked by the backend.</div>
      {error && <div className="alert" role="alert">{error}</div>}
      {session.warnings.length > 0 && <section className="review-warnings"><strong>Guardrail and generation notes</strong><ul>{session.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></section>}
      <div className="proposal-summary"><span><strong>{session.proposals.length}</strong> proposed changes</span><span><strong>{pendingCount}</strong> awaiting review</span><span>Gemini {session.generationModel}</span></div>
      <div className="proposal-list">
        {session.proposals.length === 0 && <section className="empty-panel compact-empty"><h2>No safe changes were generated</h2><p>The guardrails may have blocked proposals that lacked sufficient evidence.</p></section>}
        {session.proposals.map((proposal, index) => (
          <article className={`proposal-card proposal-${proposal.status}`} key={proposal.id}>
            <div className="proposal-header"><div><span className="proposal-number">{String(index + 1).padStart(2, '0')}</span><span className="proposal-type">{proposal.sectionType.replace('_', ' ')}</span></div><span className={`decision-pill decision-${proposal.status}`}>{proposal.status}</span></div>
            <div className="change-grid">
              <div className="change-before"><small>Original</small><p>{displayText(proposal, 'originalText') || '(empty)'}</p></div>
              <div className="change-after"><small>Suggested</small><p>{displayText(proposal, 'proposedText')}</p></div>
            </div>
            <p className="proposal-rationale"><strong>Why:</strong> {proposal.rationale}</p>
            <div className="proposal-evidence"><strong>Evidence checked</strong>{proposal.evidenceRefs.map((evidence, evidenceIndex) => <blockquote key={`${evidence}-${evidenceIndex}`}>{evidence}</blockquote>)}</div>
            {proposal.proposalType !== 'skill_reorder' && (
              <label className="proposal-edit">Edit suggested wording<textarea rows="3" value={edits[proposal.id] ?? proposal.editedText ?? proposal.proposedText} onChange={(event) => setEdits((current) => ({ ...current, [proposal.id]: event.target.value }))} /></label>
            )}
            <div className="proposal-actions">
              <button className="button button-secondary" disabled={busy} onClick={() => review(proposal, 'rejected')} type="button">Reject</button>
              {proposal.proposalType !== 'skill_reorder' && <button className="button button-secondary" disabled={busy} onClick={() => review(proposal, 'edited')} type="button">Save my edit</button>}
              <button className="button button-primary compact-button" disabled={busy} onClick={() => review(proposal, 'accepted')} type="button">Accept suggestion</button>
            </div>
          </article>
        ))}
      </div>
      <section className="complete-bar"><div><strong>{pendingCount ? `${pendingCount} changes still need a decision` : 'Review complete'}</strong><p>Accepted changes will be applied to a new version, never the original.</p></div><button className="button button-primary compact-button" disabled={busy || pendingCount > 0} onClick={complete} type="button">Create tailored version</button></section>
    </div>
  );
}
