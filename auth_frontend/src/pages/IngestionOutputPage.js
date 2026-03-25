import React, { useEffect, useState } from "react";
import { fetchMockRequiredIngestionFields } from "../services/ingestionApi";
import JsonTable from "../components/JsonTable";

/**
 * Workflow -> Ingestion layer page (backend-integrated).
 *
 * Requirement for this subtask:
 * - Call GET /mock from the backend
 * - Render the returned JSON payload EXACTLY as returned (same keys/sections),
 *   including nested objects/arrays, in table format.
 */

// PUBLIC_INTERFACE
export default function IngestionOutputPage() {
  /**
   * Workflow ingestion output page that displays the backend /mock response
   * without reshaping it (renders exact JSON structure).
   */
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [payload, setPayload] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("loading");
      setErrorMessage("");

      try {
        const data = await fetchMockRequiredIngestionFields();
        if (cancelled) return;
        // IMPORTANT: do not reshape. Render exactly what backend returns.
        setPayload(data);
        setStatus("success");
      } catch (e) {
        if (cancelled) return;
        setPayload(null);
        setErrorMessage(e instanceof Error ? e.message : "Failed to load /mock response.");
        setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="auth-page auth-page--wide" aria-label="Workflow ingestion mock output page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Mock ingestion payload">
        <div className="auth-wide-content ingestion-output">
          <header className="ingestion-output__header">
            <h1 className="auth-title ingestion-output__title">Workflow · Ingestion (/mock)</h1>
            <p className="auth-subtitle ingestion-output__subtitle">
              Displaying the backend <code>/mock</code> payload in a nested table format (exact structure).
            </p>
          </header>

          {/* Loading */}
          {status === "loading" ? (
            <div className="ingestion-output__notice ingestion-output__notice--loading" role="status">
              <div className="ingestion-output__noticeTitle">Loading /mock payload…</div>
              <div className="ingestion-output__noticeBody">
                Calling backend <code>/mock</code> and waiting for JSON.
              </div>
            </div>
          ) : null}

          {/* Error */}
          {status === "error" ? (
            <div className="ingestion-output__notice ingestion-output__notice--error" role="alert">
              <div className="ingestion-output__noticeTitle">Unable to load /mock payload</div>
              <div className="ingestion-output__noticeBody">{errorMessage || "Request failed."}</div>

              <div className="ingestion-output__actions">
                <button type="button" className="ingestion-output__ghostBtn" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {/* Success (ONLY the JSON-rendered table should appear under the heading) */}
          {status === "success" ? (
            <div className="ingestion-output__tableWrap" aria-label="Mock payload table">
              {payload === null || payload === undefined ? (
                <div className="ingestion-output__empty">No payload returned.</div>
              ) : (
                <JsonTable value={payload} minWidth={840} />
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
