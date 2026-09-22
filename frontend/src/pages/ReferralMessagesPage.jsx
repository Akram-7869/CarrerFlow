import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { jobsApi, referralMessagesApi, referralsApi, resumesApi } from '../services/api.js';

export function ReferralMessagesPage() {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState('');
  const [tone, setTone] = useState('concise');
  const [messages, setMessages] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [error, setError] = useState('');

  const loadMessages = useCallback(async () => {
    const response = await referralMessagesApi.list(candidateId);
    setMessages(response.data.messages);
    setDrafts(Object.fromEntries(response.data.messages.map((message) => [message.id, message.message])));
  }, [candidateId]);

  useEffect(() => {
    const load = async () => {
      try {
        const [candidateResponse, resumeResponse] = await Promise.all([referralsApi.get(candidateId), resumesApi.list()]);
        const loadedCandidate = candidateResponse.data.candidate;
        const readyResumes = resumeResponse.data.resumes.filter((resume) => ['confirmed', 'review_required'].includes(resume.status));
        setCandidate(loadedCandidate);
        setResumes(readyResumes);
        setResumeId(readyResumes[0]?.id || '');
        const [jobResponse] = await Promise.all([jobsApi.get(loadedCandidate.jobId), loadMessages()]);
        setJob(jobResponse.data.job);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [candidateId, loadMessages]);

  const generate = async () => {
    setGenerating(true); setError('');
    try {
      await referralMessagesApi.generate(candidateId, resumeId, tone);
      await loadMessages();
    } catch (requestError) { setError(requestError.message); }
    finally { setGenerating(false); }
  };

  const save = async (messageId) => {
    setSavingId(messageId); setError('');
    try {
      const response = await referralMessagesApi.update(messageId, drafts[messageId]);
      setMessages((current) => current.map((message) => message.id === messageId ? response.data.message : message));
    } catch (requestError) { setError(requestError.message); }
    finally { setSavingId(''); }
  };

  const copy = async (message) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(message);
      window.setTimeout(() => setCopiedId(''), 1_500);
    } catch {
      setError('Your browser blocked clipboard access. Select and copy the message manually.');
    }
  };

  const remove = async (messageId) => {
    try {
      await referralMessagesApi.remove(messageId);
      setMessages((current) => current.filter((message) => message.id !== messageId));
    } catch (requestError) { setError(requestError.message); }
  };

  if (loading) return <p>Loading message workspace…</p>;
  if (!candidate || !job) return <div className="alert">{error || 'Referral candidate not found.'}</div>;

  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading"><p className="eyebrow">Grounded outreach drafts</p><h1>Message {candidate.name}</h1><p>Prepare a respectful message about the {job.title} role at {job.company}. CareerFlow never sends it automatically.</p></div>
        <Link className="button button-quiet" to={`/referrals?jobId=${candidate.jobId}`}>Back to candidates</Link>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      <section className="message-generator">
        <div><p className="eyebrow">Public recipient</p><h2>{candidate.name}</h2><p>{candidate.currentRole || 'Role not listed'}{candidate.company && ` · ${candidate.company}`}</p><a href={candidate.profileUrl} rel="noreferrer" target="_blank">View public profile ↗</a></div>
        <label>Evidence resume<select value={resumeId} onChange={(event) => setResumeId(event.target.value)}><option value="">Select a resume</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}</option>)}</select></label>
        <label>Tone<select value={tone} onChange={(event) => setTone(event.target.value)}><option value="concise">Concise</option><option value="warm">Warm</option><option value="formal">Formal</option></select></label>
        <button className="button button-primary compact-button" disabled={!resumeId || generating} onClick={generate} type="button">{generating ? 'Generating grounded draft…' : 'Generate message draft'}</button>
      </section>
      {!resumes.length && <div className="alert">Upload and extract a resume before generating a message.</div>}
      <div className="privacy-strip">Every AI-generated career claim is checked against your selected resume and confirmed Career Profile. Public candidate details are treated as untrusted context.</div>

      <section className="message-list">
        <div className="section-heading"><div><p className="eyebrow">Saved versions</p><h2>Message drafts</h2></div></div>
        {!messages.length ? <p className="section-empty">No drafts yet. Select a resume and generate the first version.</p> : messages.map((message, index) => (
          <article className="message-card" key={message.id}>
            <div className="message-card-heading"><div><p className="eyebrow">Draft {messages.length - index} · {message.tone}</p><h3>{message.isEdited ? 'Edited and validated' : 'AI-generated and validated'}</h3></div><span>{new Date(message.createdAt).toLocaleString()}</span></div>
            <textarea aria-label={`Referral message draft ${messages.length - index}`} rows="8" value={drafts[message.id] ?? ''} onChange={(event) => setDrafts({ ...drafts, [message.id]: event.target.value })} />
            <div className="message-actions"><button className="button button-primary compact-button" disabled={savingId === message.id || drafts[message.id] === message.message} onClick={() => save(message.id)} type="button">{savingId === message.id ? 'Validating…' : 'Save edits'}</button><button className="button button-secondary" onClick={() => copy(drafts[message.id])} type="button">{copiedId === drafts[message.id] ? 'Copied' : 'Copy message'}</button><a className="button button-quiet" href={candidate.profileUrl} rel="noreferrer" target="_blank">Open profile ↗</a><button className="text-button danger-text" onClick={() => remove(message.id)} type="button">Delete</button></div>
            <details className="message-evidence"><summary>View grounding evidence</summary><ul className="clean-list">{message.evidenceRefs.map((evidence, evidenceIndex) => <li key={`${evidence}-${evidenceIndex}`}>“{evidence}”</li>)}</ul>{message.warnings.length > 0 && <div className="review-warnings"><strong>Generation notes</strong><ul>{message.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}</details>
          </article>
        ))}
      </section>
    </div>
  );
}
