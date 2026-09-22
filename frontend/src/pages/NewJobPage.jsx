import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobsApi } from '../services/api.js';

export function NewJobPage() {
  const [form, setForm] = useState({ company: '', title: '', location: '', applyUrl: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await jobsApi.create(form);
      navigate(`/jobs/${response.data.job.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-page narrow-page">
      <div className="page-heading"><p className="eyebrow">Manual job entry</p><h1>Analyze a job description</h1><p>Paste the complete description. CareerFlow will extract only what is explicitly written.</p></div>
      {error && <div className="alert" role="alert">{error}</div>}
      <form className="job-form editor-section" onSubmit={submit}>
        <div className="form-grid">
          <label>Company<input name="company" required maxLength="180" value={form.company} onChange={update} /></label>
          <label>Role title<input name="title" required maxLength="180" value={form.title} onChange={update} /></label>
          <label>Location <span className="optional-label">Optional</span><input name="location" maxLength="180" value={form.location} onChange={update} /></label>
          <label>Application URL <span className="optional-label">Optional</span><input name="applyUrl" type="url" value={form.applyUrl} onChange={update} /></label>
          <label className="full-field">Job description<textarea name="description" required minLength="100" maxLength="100000" rows="18" value={form.description} onChange={update} placeholder="Paste the complete job description here…" /><span className="field-help">{form.description.length.toLocaleString()} characters · minimum 100</span></label>
        </div>
        <div className="form-actions"><Link className="button button-quiet" to="/jobs">Cancel</Link><button className="button button-primary compact-button" disabled={submitting || form.description.length < 100} type="submit">{submitting ? 'Analyzing job…' : 'Save and analyze'}</button></div>
      </form>
    </div>
  );
}
