import React, { useState } from 'react';

// PUBLIC_INTERFACE
/**
 * LoginPage - renders the user login form.
 * Handles client-side validation and navigates to Upload on success.
 */
export default function LoginPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!email.trim() || !password) {
      setMessage({ type: 'error', text: 'Please enter email and password.' });
      return;
    }

    setSubmitting(true);
    // Navigate to Upload page
    window.location.hash = '#/upload';
    setSubmitting(false);
  };

  return (
    <main className="auth-page" aria-label="Login page">
      <section className="auth-card" role="region" aria-label="Login box">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Welcome back — sign in to continue.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              autoComplete="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="auth-input"
              type="password"
              autoComplete="current-password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Login'}
          </button>

          <div className="auth-row">
            <span />
            <a className="auth-link" href="#/login" onClick={(e) => e.preventDefault()}>
              Forgot Password
            </a>
          </div>

          {message.text ? (
            <p
              className={`auth-message ${message.type}`}
              role={message.type === 'error' ? 'alert' : 'status'}
            >
              {message.text}
            </p>
          ) : null}
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <a className="auth-link" href="#/signup">
            Sign up
          </a>
        </div>
      </section>
    </main>
  );
}
