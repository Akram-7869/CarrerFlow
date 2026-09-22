import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resumesApi } from '../services/api.js';

const statusText = {
  uploaded: 'Uploaded', parsing: 'Extracting', review_required: 'Ready to review',
  confirmed: 'Profile confirmed', failed: 'Needs attention',
};

const formatSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const navigate = useNavigate();

  const loadResumes = async () => {
    try {
      const response = await resumesApi.list();
      setResumes(response.data.resumes);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadResumes(); }, []);

  const handleUpload = async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const response = await resumesApi.upload(file);
      navigate(`/resumes/${response.data.resume.id}/review`);
    } catch (requestError) {
      setError(requestError.message);
      await loadResumes();
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const retry = async (resumeId) => {
    setUploading(true);
    setError('');
    try {
      await resumesApi.retry(resumeId);
      navigate(`/resumes/${resumeId}/review`);
    } catch (requestError) {
      setError(requestError.message);
      await loadResumes();
    } finally {
      setUploading(false);
    }
  };

  const remove = async (resumeId) => {
    if (!window.confirm('Delete this resume and its stored file? Your confirmed profile will remain.')) return;
    try {
      await resumesApi.remove(resumeId);
      setResumes((current) => current.filter((resume) => resume.id !== resumeId));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading">
          <p className="eyebrow">Resume-first setup</p>
          <h1>Your resumes</h1>
          <p>Upload a PDF or DOCX. We’ll extract a draft profile for you to verify.</p>
        </div>
        <input accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="visually-hidden" onChange={handleUpload} ref={fileInput} type="file" />
        <button className="button button-primary compact-button" disabled={uploading} onClick={() => fileInput.current?.click()} type="button">
          {uploading ? 'Extracting resume…' : 'Upload resume'}
        </button>
      </div>

      <div className="privacy-strip"><span>Private by design</span> Your file stays behind authenticated routes. Only extracted text is sent to Gemini.</div>
      {error && <div className="alert" role="alert">{error}</div>}

      {loading ? <p>Loading resumes…</p> : resumes.length === 0 ? (
        <section className="empty-panel compact-empty">
          <span className="empty-mark">CV</span>
          <h2>Upload your first resume</h2>
          <p>Accepted formats: PDF and DOCX, up to 5 MB. Scanned image-only PDFs are not supported yet.</p>
        </section>
      ) : (
        <div className="resume-list">
          {resumes.map((resume) => (
            <article className="resume-card" key={resume.id}>
              <div className="file-badge">{resume.mimeType === 'application/pdf' ? 'PDF' : 'DOCX'}</div>
              <div className="resume-card-main">
                <h2>{resume.name}</h2>
                <p>{resume.originalFilename} · {formatSize(resume.fileSize)}</p>
                <span className={`status-pill status-${resume.status}`}>{statusText[resume.status] || resume.status}</span>
                {resume.extractionError && <p className="inline-error">{resume.extractionError}</p>}
              </div>
              <div className="card-actions">
                {['review_required', 'confirmed'].includes(resume.status) && <Link className="button button-secondary" to={`/resumes/${resume.id}/review`}>Review</Link>}
                {['review_required', 'confirmed'].includes(resume.status) && <Link className="button button-primary compact-button" to={`/resumes/${resume.id}/ats`}>Check ATS</Link>}
                {resume.status === 'failed' && <button className="button button-secondary" disabled={uploading} onClick={() => retry(resume.id)} type="button">Retry</button>}
                <button className="text-button danger-text" onClick={() => remove(resume.id)} type="button">Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
