import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage.jsx';

vi.mock('../context/auth-context.js', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    guestLogin: vi.fn(),
  }),
}));

describe('AuthPage', () => {
  it('renders the registration fields and password guidance', () => {
    render(
      <MemoryRouter>
        <AuthPage mode="register" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /start building your career flow/i })).toBeVisible();
    expect(screen.getByLabelText(/full name/i)).toBeVisible();
    expect(screen.getByLabelText(/email address/i)).toBeVisible();
    expect(screen.getByLabelText(/^password/i)).toBeVisible();
    expect(screen.getByText(/uppercase, lowercase, and a number/i)).toBeVisible();
  });

  it('renders the login form without the name field', () => {
    render(
      <MemoryRouter>
        <AuthPage mode="login" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /sign in to continue/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /continue as guest/i })).toBeVisible();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });
});
