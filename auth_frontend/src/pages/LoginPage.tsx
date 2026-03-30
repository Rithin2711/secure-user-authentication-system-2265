import React, { useState } from 'react';

// PUBLIC_INTERFACE
/**
 * LoginPage - renders the user login form as the initial screen.
 *
 * Features:
 *  - Username and password input fields
 *  - Login button with blue background (#3b82f6) and white text
 *  - On hover, the Login button reduces brightness (darker blue)
 *  - On clicking Login, navigates to the Upload page (#/upload)
 */
export default function LoginPage(): React.ReactElement {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /** Handle form submission: validate inputs and navigate to Upload page */
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    // Navigate to Upload page on login click
    window.location.hash = '#/upload';
    setSubmitting(false);
  };

  return (
    <main
      className="flex items-center justify-center min-h-screen w-full"
      aria-label="Login page"
    >
      {/* Login card */}
      <section
        className="w-full max-w-md rounded-2xl p-8 auth-card"
        role="region"
        aria-label="Login box"
      >
        {/* Heading */}
        <h1 className="text-2xl font-bold tracking-tight auth-title mb-1">
          Welcome back
        </h1>
        <p className="text-sm auth-subtitle mb-6">
          Sign in to your account to continue.
        </p>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {/* Username field */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="login-username"
              className="text-xs font-semibold uppercase tracking-wide auth-muted-label"
            >
              Username
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="auth-input w-full"
              aria-label="Username"
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold uppercase tracking-wide auth-muted-label"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input w-full"
              aria-label="Password"
            />
          </div>

          {/* Error message */}
          {error && (
            <p
              className="text-sm auth-message error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Login button — blue bg, white text, reduced brightness on hover */}
          <button
            type="submit"
            disabled={submitting}
            className="login-btn mt-2 w-full rounded-xl py-3 px-4 text-white font-bold text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
            aria-label="Login"
          >
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-5 text-center text-sm auth-footer">
          Don&apos;t have an account?{' '}
          <a className="auth-link font-semibold" href="#/signup">
            Sign up
          </a>
        </div>
      </section>
    </main>
  );
}
