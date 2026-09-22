import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ProfileEditor } from '../components/ProfileEditor.jsx';
import { profileApi } from '../services/api.js';

export function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(useLocation().state?.saved ? 'Profile confirmed from your resume.' : '');

  useEffect(() => {
    profileApi.get()
      .then((response) => setProfile(response.data.profile))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await profileApi.save(profile, profile.sourceResumeId || null);
      setProfile(response.data.profile);
      setSuccess('Your career profile has been updated.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile…</p>;

  if (!profile) {
    return (
      <div className="content-page">
        <div className="page-heading"><p className="eyebrow">Verified career evidence</p><h1>Career profile</h1></div>
        {error && <div className="alert">{error}</div>}
        <section className="empty-panel compact-empty">
          <span className="empty-mark">CV</span>
          <h2>Build your profile from a resume</h2>
          <p>Upload a resume, review the extracted information, and confirm it before it becomes verified career evidence.</p>
          <Link className="button button-primary compact-button" to="/resumes">Upload a resume</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="content-page">
      <div className="page-title-row">
        <div className="page-heading"><p className="eyebrow">Verified career evidence</p><h1>Career profile</h1><p>You can manually correct or add information at any time.</p></div>
        <button className="button button-primary compact-button" disabled={saving} onClick={save} type="button">{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      {success && <div className="success-alert" role="status">{success}</div>}
      <ProfileEditor profile={profile} onChange={setProfile} />
    </div>
  );
}
