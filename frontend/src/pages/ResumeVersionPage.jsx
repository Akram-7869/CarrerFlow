import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { resumeVersionsApi } from '../services/api.js';

export function ResumeVersionPage() {
  const { versionId } = useParams();
  const [version, setVersion] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    resumeVersionsApi.get(versionId).then((response) => setVersion(response.data.version)).catch((requestError) => setError(requestError.message));
  }, [versionId]);

  const download = async (format) => {
    setDownloading(format); setError('');
    try {
      const file = await resumeVersionsApi.download(versionId, format);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = file.filename; anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.message); }
    finally { setDownloading(''); }
  };

  if (!version) return <div className="content-page">{error ? <div className="alert">{error}</div> : <p>Loading tailored resume…</p>}</div>;
  const content = version.content;
  return (
    <div className="content-page">
      <div className="page-title-row"><div className="page-heading"><p className="eyebrow">Tailored resume · Version {version.versionNumber}</p><h1>{version.name}</h1><p>The original uploaded resume has not been changed.</p></div><div className="review-actions"><Link className="button button-quiet" to={`/jobs/${version.jobId}`}>View job</Link><button className="button button-secondary" disabled={Boolean(downloading)} onClick={() => download('docx')} type="button">{downloading === 'docx' ? 'Preparing…' : 'Download DOCX'}</button><button className="button button-primary compact-button" disabled={Boolean(downloading)} onClick={() => download('pdf')} type="button">{downloading === 'pdf' ? 'Preparing…' : 'Download PDF'}</button></div></div>
      {error && <div className="alert">{error}</div>}
      <article className="resume-preview">
        <header><h1>{content.basicInfo.name}</h1><p>{[content.basicInfo.email, content.basicInfo.phone, content.basicInfo.location].filter(Boolean).join(' · ')}</p><p>{[content.basicInfo.linkedinUrl, content.basicInfo.githubUrl, content.basicInfo.portfolioUrl].filter(Boolean).join(' · ')}</p></header>
        {content.summary && <section><h2>Professional Summary</h2><p>{content.summary}</p></section>}
        {content.skills.length > 0 && <section><h2>Skills</h2><p>{content.skills.map((skill) => skill.name).join(' · ')}</p></section>}
        {content.experiences.length > 0 && <section><h2>Experience</h2>{content.experiences.map((item, index) => <div className="preview-entry" key={`${item.company}-${index}`}><div><strong>{item.jobTitle}</strong><span>{item.company}</span></div><small>{[item.startDate, item.endDate || (item.isCurrent ? 'Present' : '')].filter(Boolean).join(' – ')}</small>{item.description && <p>{item.description}</p>}{item.highlights.length > 0 && <ul>{item.highlights.map((bullet, bulletIndex) => <li key={`${bullet}-${bulletIndex}`}>{bullet}</li>)}</ul>}</div>)}</section>}
        {content.projects.length > 0 && <section><h2>Projects</h2>{content.projects.map((item, index) => <div className="preview-entry" key={`${item.name}-${index}`}><strong>{item.name}</strong>{item.description && <p>{item.description}</p>}{item.highlights.length > 0 && <ul>{item.highlights.map((bullet, bulletIndex) => <li key={`${bullet}-${bulletIndex}`}>{bullet}</li>)}</ul>}</div>)}</section>}
        {content.education.length > 0 && <section><h2>Education</h2>{content.education.map((item, index) => <div className="preview-entry" key={`${item.institution}-${index}`}><strong>{item.degree}{item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ''}</strong><span>{item.institution}</span></div>)}</section>}
      </article>
    </div>
  );
}
