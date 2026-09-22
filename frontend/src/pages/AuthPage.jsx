import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';

export function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, loading, login, register, guestLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      await guestLogin();
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link className="brand brand-light" to="/">
          <span className="brand-mark">CF</span>
          <span>CareerFlow AI</span>
        </Link>
        <div>
          <p className="eyebrow">Your career command center</p>
          <h1>Move from job discovery to interview readiness.</h1>
          <p className="intro-copy">
            Keep every resume, opportunity, and application organized—with AI that stays
            grounded in your real experience.
          </p>
        </div>
        <p className="trust-note">Your experience remains the source of truth.</p>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">{isRegister ? 'Create your workspace' : 'Welcome back'}</p>
            <h2>{isRegister ? 'Start building your career flow' : 'Sign in to continue'}</h2>
          </div>

          {error && <div className="alert" role="alert">{error}</div>}

          {isRegister && (
            <label>
              Full name
              <input
                autoComplete="name"
                name="name"
                onChange={updateField}
                required
                type="text"
                value={form.name}
              />
            </label>
          )}

          <label>
            Email address
            <input
              autoComplete="email"
              name="email"
              onChange={updateField}
              required
              type="email"
              value={form.email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength="8"
              name="password"
              onChange={updateField}
              required
              type="password"
              value={form.password}
            />
            {isRegister && (
              <span className="field-help">Use 8+ characters with uppercase, lowercase, and a number.</span>
            )}
          </label>

          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>

          {!isRegister && (
            <button className="button button-secondary guest-button" disabled={submitting} onClick={handleGuestLogin} type="button">
              Continue as guest
            </button>
          )}

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to CareerFlow?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
