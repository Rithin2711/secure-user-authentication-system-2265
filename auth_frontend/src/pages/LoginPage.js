import React, { useState } from "react";

// PUBLIC_INTERFACE
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Keep the same UI behavior (disable button + show inline message) but remove
   * any backend dependency. Clicking "Login" always navigates to Upload.
   */
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const onSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // No backend auth for now; keep minimal client-side check to avoid "empty submit" confusion.
    if (!email.trim() || !password) {
      setMessage({ type: "error", text: "Please enter email and password." });
      return;
    }

    setSubmitting(true);

    // Navigate to the existing Upload route (hash routing, see App.js).
    window.location.hash = "#/upload";

    // Reset submitting state (navigation happens immediately in this app, but keep state consistent).
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
            {submitting ? "Logging in..." : "Login"}
          </button>

          <div className="auth-row">
            <span />
            {/* No backend forgot-password flow defined in the work item; keep as UI link. */}
            <a className="auth-link" href="#/login" onClick={(e) => e.preventDefault()}>
              Forgot Password
            </a>
          </div>

          {message.text ? (
            <p className={`auth-message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>
              {message.text}
            </p>
          ) : null}
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <a className="auth-link" href="#/signup">Sign up</a>
        </div>
      </section>
    </main>
  );
}
