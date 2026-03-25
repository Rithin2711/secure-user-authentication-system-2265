import React, { useEffect, useState } from "react";
import { fetchDateTimeMissingErrorMessage } from "../services/ingestionApi";

/**
 * Workflow -> Ingestion layer page (backend-integrated).
 *
 * Requirement for this subtask:
 * - Call GET /error/date-time-missing from the backend
 * - Render the returned plain-text error response under the heading
 * - No JSON table for this view.
 */

// PUBLIC_INTERFACE
export default function IngestionOutputPage() {
  /**
   * Workflow ingestion output page that displays the backend plain-text error response
   * returned from /error/date-time-missing.
   */
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("loading");
      setErrorMessage("");
      setMessage("");

      try {
        const text = await fetchDateTimeMissingErrorMessage();
        if (cancelled) return;
        setMessage(text);
        setStatus("success");
      } catch (e) {
        if (cancelled) return;
        setMessage("");
        setErrorMessage(e instanceof Error ? e.message : "Failed to load error response.");
        setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="auth-page auth-page--wide" aria-label="Workflow ingestion error output page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Ingestion error message">
        <div className="auth-wide-content ingestion-output">
          <header className="ingestion-output__header">
            <h1 className="auth-title ingestion-output__title">Workflow · Ingestion (/error/date-time-missing)</h1>
            <p className="auth-subtitle ingestion-output__subtitle">
              Displaying the backend plain-text error response from <code>/error/date-time-missing</code>.
            </p>
          </header>

          {/* Loading */}
          {status === "loading" ? (
            <div className="ingestion-output__notice ingestion-output__notice--loading" role="status">
              <div className="ingestion-output__noticeTitle">Loading error message…</div>
              <div className="ingestion-output__noticeBody">
                Calling backend <code>/error/date-time-missing</code> and waiting for plain text.
              </div>
            </div>
          ) : null}

          {/* Error */}
          {status === "error" ? (
            <div className="ingestion-output__notice ingestion-output__notice--error" role="alert">
              <div className="ingestion-output__noticeTitle">Unable to load error message</div>
              <div className="ingestion-output__noticeBody">{errorMessage || "Request failed."}</div>

              <div className="ingestion-output__actions">
                <button type="button" className="ingestion-output__ghostBtn" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {/* Success: show plain-text message under heading */}
          {status === "success" ? (
            <div className="ingestion-output__tableWrap" aria-label="Error message output">
              {message ? (
                <div className="ingestion-output__notice ingestion-output__notice--error" role="note">
                  <div className="ingestion-output__noticeTitle">Response</div>
                  <div className="ingestion-output__noticeBody">{message}</div>
                </div>
              ) : (
                <div className="ingestion-output__empty">No message returned.</div>
              )}
            </div>
          ) : null}

          <div className="auth-footer ingestion-output__footer">
            <a className="auth-link" href="#/orchestrator">
              Back to Orchestrator
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
