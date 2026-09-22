import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="page-heading">
        <p className="eyebrow">Foundation ready</p>
        <h1>Welcome, {user.name.split(' ')[0]}.</h1>
        <p>Move from resume review to job matching, application tracking, and interview readiness in one focused workspace.</p>
      </div>

      <section className="status-grid" aria-label="Project status">
        <article className="status-card complete">
          <span className="status-icon">✓</span>
          <div>
            <p>Authentication</p>
            <strong>Secure session active</strong>
          </div>
        </article>
        <article className="status-card upcoming">
          <span className="status-icon">02</span>
          <div>
            <p>Ready now</p>
            <strong>Career workflow demo</strong>
          </div>
        </article>
      </section>

      <section className="empty-panel">
        <span className="empty-mark">CF</span>
        <h2>Start with resumes or review the demo application</h2>
        <p>
          Upload a PDF or DOCX for your own workflow, or open the preloaded application tracker to see the complete recruiter-ready flow.
        </p>
        <div className="title-actions">
          <Link className="button button-primary compact-button" to="/applications">View application tracker</Link>
          <Link className="button button-secondary compact-button" to="/resumes">Manage resumes</Link>
        </div>
      </section>
    </div>
  );
}
