import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { applicationsApi } from '../services/api.js';
import { applicationStatusLabels } from '../utils/applications.js';

const initialEvent = { eventType: 'follow_up', title: '', scheduledAt: '', notes: '' };

export function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [status, setStatus] = useState('preparing');
  const [statusNote, setStatusNote] = useState('');
  const [notes, setNotes] = useState('');
  const [event, setEvent] = useState(initialEvent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const response = await applicationsApi.get(applicationId);
    setApplication(response.data.application);
    setStatus(response.data.application.status);
    setNotes(response.data.application.notes);
  }, [applicationId]);

  useEffect(() => { load().catch((requestError) => setError(requestError.message)).finally(() => setLoading(false)); }, [load]);

  const updateStatus = async () => {
    setSaving(true); setError('');
    try {
      const response = await applicationsApi.updateStatus(applicationId, { status, note: statusNote });
      setApplication(response.data.application); setStatusNote('');
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const saveNotes = async () => {
    setSaving(true); setError('');
    try { const response = await applicationsApi.updateNotes(applicationId, notes); setApplication(response.data.application); }
    catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const addEvent = async (submitEvent) => {
    submitEvent.preventDefault();
    setSaving(true); setError('');
    try {
      await applicationsApi.createEvent(applicationId, { ...event, scheduledAt: new Date(event.scheduledAt).toISOString() });
      setEvent(initialEvent); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const toggleEvent = async (item) => {
    try {
      await applicationsApi.updateEvent(item.id, { eventType: item.eventType, title: item.title, scheduledAt: new Date(item.scheduledAt).toISOString(), notes: item.notes, completed: !item.completed });
      await load();
    } catch (requestError) { setError(requestError.message); }
  };

  const removeEvent = async (eventId) => {
    try { await applicationsApi.removeEvent(eventId); await load(); }
    catch (requestError) { setError(requestError.message); }
  };

  if (loading) return <p>Loading application…</p>;
  if (!application) return <div className="alert">{error || 'Application not found.'}</div>;

  return (
    <div className="content-page">
      <div className="page-title-row"><div className="page-heading"><p className="eyebrow">{application.job.company}</p><h1>{application.job.title}</h1><p>Tracking since {new Date(application.createdAt).toLocaleDateString()}</p></div><div className="title-actions"><Link className="button button-primary" to={`/applications/${application.id}/interview-prep`}>Interview prep</Link><Link className="button button-secondary" to={`/prepare?jobId=${application.job.id}&resumeId=${application.resume.id}`}>Edit preparation</Link><Link className="button button-quiet" to="/applications">Back to tracker</Link></div></div>
      {error && <div className="alert" role="alert">{error}</div>}
      <section className="tracker-status-panel"><div><p className="eyebrow">Current status</p><h2>{applicationStatusLabels[application.status]}</h2><p>{application.appliedAt ? `Applied ${new Date(application.appliedAt).toLocaleString()}` : 'Not marked as applied yet.'}</p></div><label>New status<select value={status} onChange={(changeEvent) => setStatus(changeEvent.target.value)}>{Object.entries(applicationStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Status note<input value={statusNote} onChange={(changeEvent) => setStatusNote(changeEvent.target.value)} placeholder="Optional context" /></label><button className="button button-primary compact-button" disabled={saving || status === application.status} onClick={updateStatus} type="button">Update status</button></section>

      <div className="tracker-detail-grid">
        <section className="ats-section"><div className="section-heading"><div><p className="eyebrow">History</p><h2>Status timeline</h2></div></div><div className="status-timeline">{application.statusHistory.map((item) => <article key={item.id}><span className="timeline-dot" /><div><strong>{applicationStatusLabels[item.toStatus]}</strong><time>{new Date(item.occurredAt).toLocaleString()}</time>{item.note && <p>{item.note}</p>}</div></article>)}</div></section>
        <section className="ats-section"><div className="section-heading"><div><p className="eyebrow">Personal workspace</p><h2>Notes</h2></div></div><textarea rows="9" value={notes} onChange={(changeEvent) => setNotes(changeEvent.target.value)} placeholder="Recruiter details, questions, feedback, or reminders…" /><button className="button button-secondary compact-button" disabled={saving || notes === application.notes} onClick={saveNotes} type="button">Save notes</button></section>
      </div>

      <section className="tracker-events"><div className="section-heading"><div><p className="eyebrow">Assessments, interviews, follow-ups</p><h2>Scheduled events</h2></div></div><form className="event-form" onSubmit={addEvent}><label>Type<select value={event.eventType} onChange={(changeEvent) => setEvent({ ...event, eventType: changeEvent.target.value })}><option value="follow_up">Follow-up</option><option value="online_assessment">Online assessment</option><option value="interview">Interview</option><option value="deadline">Deadline</option><option value="other">Other</option></select></label><label>Title<input required value={event.title} onChange={(changeEvent) => setEvent({ ...event, title: changeEvent.target.value })} /></label><label>Date and time<input required type="datetime-local" value={event.scheduledAt} onChange={(changeEvent) => setEvent({ ...event, scheduledAt: changeEvent.target.value })} /></label><label>Notes<input value={event.notes} onChange={(changeEvent) => setEvent({ ...event, notes: changeEvent.target.value })} /></label><button className="button button-primary compact-button" disabled={saving} type="submit">Add event</button></form>
        {!application.events.length ? <p className="section-empty">No events scheduled.</p> : <div className="event-list">{application.events.map((item) => <article className={item.completed ? 'event-completed' : ''} key={item.id}><div><span className="status-pill">{item.eventType.replace('_', ' ')}</span><h3>{item.title}</h3><p>{new Date(item.scheduledAt).toLocaleString()}</p>{item.notes && <small>{item.notes}</small>}</div><div className="card-actions"><button className="button button-secondary" onClick={() => toggleEvent(item)} type="button">{item.completed ? 'Mark upcoming' : 'Mark complete'}</button><button className="text-button danger-text" onClick={() => removeEvent(item.id)} type="button">Delete</button></div></article>)}</div>}
      </section>
    </div>
  );
}
