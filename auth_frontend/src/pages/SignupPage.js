import React, { useState } from "react";
import { persistAuth, signup } from "../services/authApi";

// PUBLIC_INTERFACE
export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    setSubmitting(true);
    try {
      const data = await signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      persistAuth(data);
      setMessage({ type: "success", text: "Account created successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Signup failed." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page" aria-label="Sign up page">
      <section className="auth-card" role="region" aria-label="Sign up box">
        <h1 className="auth-title">Sign Up</h1>
        <p className="auth-subtitle">Create your account in just a moment.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-name">Name</label>
            <input
              id="signup-name"
              className="auth-input"
              type="text"
              autoComplete="name"
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-phone">Phone Number</label>
            <input
              id="signup-phone"
              className="auth-input"
              type="tel"
              autoComplete="tel"
              placeholder="phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Sign Up"}
          </button>

          {message.text ? (
            <p className={`auth-message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>
              {message.text}
            </p>
          ) : null}
        </form>

        <div className="auth-footer">
          Already have an account? <a className="auth-link" href="#/login">Login</a>
        </div>
      </section>
    </main>
  );
}
