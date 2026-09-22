import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applicationsApi, jobsApi, referralMessagesApi, referralsApi, resumesApi, resumeVersionsApi } from '../services/api.js';

const checklistLabels = {
  jobAnalyzed: 'Job description analyzed',
  resumeSelected: 'Resume selected',
  atsChecked: 'ATS compatibility checked',
  jobMatched: 'Resume matched to job',
  tailoredVersionSelected: 'Tailored resume selected (optional)',
  referralSelected: 'Referral candidate selected (optional)',
  referralMessageReady: 'Referral message ready (optional)',
  coverLetterReady: 'Cover letter ready (optional)',
  applicationUrlAvailable: 'Application link available',
};

export function ApplicationPrepPage() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [versions, setVersions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [messages, setMessages] = useState([]);
  const [jobId, setJobId] = useState(searchParams.get('jobId') || '');
  const [resumeId, setResumeId] = useState(searchParams.get('resumeId') || '');
  const [resumeVersionId, setResumeVersionId] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [messageId, setMessageId] = useState('');
  const [notes, setNotes] = useState('');
  const [application, setApplication] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [tone, setTone] = useState('formal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([jobsApi.list(), resumesApi.list()])
      .then(([jobResponse, resumeResponse]) => {
        const availableJobs = jobResponse.data.jobs;
        const availableResumes = resumeResponse.data.resumes.filter((resume) => ['confirmed', 'review_required'].includes(resume.status));
        setJobs(availableJobs);
        setResumes(availableResumes);
        setJobId((current) => current || availableJobs[0]?.id || '');
        setResumeId((current) => current || availableResumes[0]?.id || '');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!jobId) { setCandidates([]); return; }
    referralsApi.list(jobId).then(({ data }) => setCandidates(data.candidates)).catch((requestError) => setError(requestError.message));
    setCandidateId(''); setMessageId(''); setMessages([]);
  }, [jobId]);

  useEffect(() => {
    if (!resumeId) { setVersions([]); return; }
    resumeVersionsApi.list(resumeId).then(({ data }) => setVersions(data.versions.filter((version) => !jobId || version.jobId === jobId))).catch((requestError) => setError(requestError.message));
    setResumeVersionId('');
  }, [resumeId, jobId]);

  useEffect(() => {
    if (!candidateId) { setMessages([]); setMessageId(''); return; }
    referralMessagesApi.list(candidateId).then(({ data }) => setMessages(data.messages)).catch((requestError) => setError(requestError.message));
    setMessageId('');
  }, [candidateId]);

  const savePreparation = async () => {
    setSaving(true); setError('');
    try {
      const response = await applicationsApi.prepare({
        jobId, resumeId, resumeVersionId: resumeVersionId || null,
        referralCandidateId: candidateId || null, referralMessageId: messageId || null, notes,
      });
      setApplication(response.data.application);
      setCoverLetter(response.data.application.coverLetter || '');
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const generateCoverLetter = async () => {
    if (!application) return;
    setGenerating(true); setError('');
    try {
      const response = await applicationsApi.generateCoverLetter(application.id, tone);
      setApplication(response.data.application);
      setCoverLetter(response.data.application.coverLetter);
    } catch (requestError) { setError(requestError.message); }
    finally { setGenerating(false); }
  };

  const saveCoverLetter = async () => {
    setSaving(true); setError('');
    try {
      const response = await applicationsApi.updateCoverLetter(application.id, coverLetter);
      setApplication(response.data.application);
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const copyCoverLetter = async () => {
    try { await navigator.clipboard.writeText(coverLetter); setCopied(true); window.setTimeout(() => setCopied(false), 1_500); }
    catch { setError('Your browser blocked clipboard access. Select and copy the letter manually.'); }
  };

  if (loading) return <p>Loading application workspace…</p>;

  return (
    <div className="content-page">
      <div className="page-title-row"><div className="page-heading"><p className="eyebrow">Review before leaving CareerFlow</p><h1>Application preparation</h1><p>Assemble the right resume, evidence, referral, and optional cover letter before opening the employer’s application page.</p></div><Link className="button button-quiet" to="/jobs">Back to jobs</Link></div>
      {error && <div className="alert" role="alert">{error}</div>}
      {!jobs.length || !resumes.length ? <section className="empty-panel compact-empty"><h2>A job and extracted resume are required</h2><p>Add a job and resume before preparing an application.</p></section> : <>
        <section className="prep-selector">
          <label>Job<select value={jobId} onChange={(event) => setJobId(event.target.value)}>{jobs.map((job) => <option key={job.id} value={job.id}>{job.company} — {job.title}</option>)}</select></label>
          <label>Base resume<select value={resumeId} onChange={(event) => setResumeId(event.target.value)}>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}</option>)}</select></label>
          <label>Tailored version<select value={resumeVersionId} onChange={(event) => setResumeVersionId(event.target.value)}><option value="">Use base resume</option>{versions.map((version) => <option key={version.id} value={version.id}>{version.name}</option>)}</select></label>
          <label>Referral candidate<select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}><option value="">No referral candidate</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
          <label>Referral message<select disabled={!candidateId} value={messageId} onChange={(event) => setMessageId(event.target.value)}><option value="">No referral message</option>{messages.map((message) => <option key={message.id} value={message.id}>{message.tone} draft · {new Date(message.createdAt).toLocaleDateString()}</option>)}</select></label>
          <label className="wide-field">Preparation notes<textarea rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Questions to answer, form requirements, or reminders…" /></label>
          <button className="button button-primary compact-button" disabled={!jobId || !resumeId || saving} onClick={savePreparation} type="button">{saving ? 'Saving preparation…' : 'Create or update preparation'}</button>
        </section>

        {application && <>
          <section className="prep-overview">
            <div><p className="eyebrow">Application target</p><h2>{application.job.title}</h2><p>{application.job.company} · {application.job.location || 'Location unspecified'}</p></div>
            <div className="prep-scores"><span><strong>{application.ats?.overallScore ?? '—'}</strong>ATS score</span><span><strong>{application.match?.matchScore ?? '—'}</strong>Job match</span><span><strong>{application.match?.missing?.length ?? '—'}</strong>Missing requirements</span></div>
          </section>
          <div className="prep-grid">
            <section className="ats-section"><div className="section-heading"><div><p className="eyebrow">Readiness</p><h2>Application checklist</h2></div></div><ul className="prep-checklist">{Object.entries(application.checklist).map(([key, ready]) => <li className={ready ? 'check-ready' : 'check-pending'} key={key}><span>{ready ? '✓' : '○'}</span>{checklistLabels[key]}</li>)}</ul></section>
            <section className="ats-section"><div className="section-heading"><div><p className="eyebrow">Truthful gaps</p><h2>Missing requirements</h2></div></div>{application.match?.missing?.length ? <ul className="clean-list">{application.match.missing.map((item) => <li key={item.requirement}>{item.requirement}</li>)}</ul> : <p className="section-empty">{application.match ? 'No missing requirements in the latest match.' : 'Run resume matching to see verified gaps.'}</p>}</section>
          </div>

          <section className="cover-letter-panel"><div className="section-heading"><div><p className="eyebrow">Optional · evidence grounded</p><h2>Cover letter</h2></div><div className="title-actions"><select value={tone} onChange={(event) => setTone(event.target.value)}><option value="formal">Formal</option><option value="concise">Concise</option><option value="warm">Warm</option></select><button className="button button-secondary" disabled={generating} onClick={generateCoverLetter} type="button">{generating ? 'Generating…' : application.coverLetter ? 'Generate another' : 'Generate cover letter'}</button></div></div>
            {application.coverLetter ? <><textarea rows="16" value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} /><div className="message-actions"><button className="button button-primary compact-button" disabled={saving || coverLetter === application.coverLetter} onClick={saveCoverLetter} type="button">Validate and save edits</button><button className="button button-secondary" onClick={copyCoverLetter} type="button">{copied ? 'Copied' : 'Copy letter'}</button></div><details className="message-evidence"><summary>View grounding evidence</summary><ul className="clean-list">{application.coverLetterEvidenceRefs.map((evidence, index) => <li key={`${evidence}-${index}`}>“{evidence}”</li>)}</ul></details></> : <p className="section-empty">Generate a cover letter only when the application requests one.</p>}
          </section>

          <section className="apply-panel"><div><p className="eyebrow">Final user-controlled step</p><h2>Ready to continue?</h2><p>Review every detail on the employer’s website. CareerFlow does not submit forms or send referral messages.</p></div>{application.job.applyUrl ? <a className="button button-primary compact-button" href={application.job.applyUrl} rel="noreferrer" target="_blank">Open external application ↗</a> : <span className="inline-error">No application URL is saved for this job.</span>}</section>
          <div className="tracker-link-strip"><span>This preparation is now available in your application tracker.</span><Link className="button button-secondary" to={`/applications/${application.id}`}>Open application timeline</Link></div>
        </>}
      </>}
    </div>
  );
}
