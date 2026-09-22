import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/dashboard">
          <span className="brand-mark">CF</span>
          <span>CareerFlow AI</span>
        </NavLink>
        <div className="user-actions">
          <span className="user-name">{user.name}</span>
          <button className="button button-quiet" onClick={handleLogout} type="button">
            Log out
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar" aria-label="Primary navigation">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/resumes">Resumes</NavLink>
          <NavLink to="/profile">Career profile</NavLink>
          <NavLink to="/jobs">Jobs & matching</NavLink>
          <NavLink to="/referrals">Referrals</NavLink>
          <NavLink to="/prepare">Application prep</NavLink>
          <NavLink to="/applications">Applications</NavLink>
          <NavLink to="/copilot">Career Copilot</NavLink>
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
