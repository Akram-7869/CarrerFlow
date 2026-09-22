import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProfileEditor } from '../components/ProfileEditor.jsx';
import { resumesApi } from '../services/api.js';

export function ResumeReviewPage() {
  const { resumeId } = useParams();
  const [resume, setResume] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    resumesApi.get(resumeId)
      .then((response) => {
        setResume(response.data.resume);
        setProfile(response.data.resume.structuredData);
      })
      .catch((requestError) => setError(requestError.message));
  }, [resumeId]);

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      await resumesApi.confirm(resumeId, profile);
      navigate('/profile', { replace: true, state: { saved: true } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !resume) return <div className="content-page"><div className="alert">{error}</div><Link to="/resumes">Back to resumes</Link></div>;
  if (!resume) return <p>Loading extracted profile…</p>;
  if (!profile) return <div className="content-page"><div className="alert">No extracted profile is available for this resume.</div><Link to="/resumes">Back to resumes</Link></div>;

  return (
    <div className="content-page review-page">
      <div className="page-title-row sticky-review-header">
        <div className="page-heading">
          <p className="eyebrow">Human review required</p>
          <h1>Verify your profile</h1>
          <p>Extracted from {resume.originalFilename}. Correct anything that isn’t accurate before confirming.</p>
        </div>
        <div className="review-actions">
          <Link className="button button-quiet" to="/resumes">Cancel</Link>
          <button className="button button-primary compact-button" disabled={saving} onClick={confirm} type="button">
            {saving ? 'Saving…' : 'Confirm profile'}
          </button>
        </div>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      <ProfileEditor profile={profile} onChange={setProfile} />
    </div>
  );
}
