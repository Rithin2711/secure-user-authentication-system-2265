import React, { useState } from "react";
import { login, persistAuth } from "../services/authApi";

// PUBLIC_INTERFACE
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!email.trim() || !password) {
      setMessage({ type: "error", text: "Please enter email and password." });
      return;
    }

    setSubmitting(true);
    try {
      const data = await login({ email: email.trim(), password });
      persistAuth(data);

      // Backend now returns message: "Login Successfull"
      setMessage({ type: "success", text: data?.message || "Login Successfull" });

      // Redirect to the exact same page used by the "Upload a document" flow.
      // This app uses hash routing (see App.js), so we update window.location.hash.
      window.location.hash = "#/upload";
    } catch (err) {
      // Backend returns 401 detail: "Login failed"
      const msg = err?.message && String(err.message).trim() ? err.message : "Login failed";
      setMessage({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
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

          {/* Link requested: shown under the Login button and navigates to upload page */}
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <a className="auth-link" href="#/upload">
              Upload a document
            </a>
          </div>

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
