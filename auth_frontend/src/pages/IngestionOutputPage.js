import React, { useEffect, useMemo, useState } from "react";
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

  const topLevelEntries = useMemo(() => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
    // Preserve original key order as provided by backend (do NOT sort).
    return Object.entries(payload);
  }, [payload]);

  return (
    <main className="auth-page auth-page--wide" aria-label="Workflow ingestion mock output page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Mock ingestion payload">
        <div className="auth-wide-content" style={{ paddingTop: 10 }}>
          <h1 className="auth-title" style={{ marginTop: 14 }}>
            Workflow · Ingestion (/mock)
          </h1>
          <p className="auth-subtitle">Displaying the backend /mock payload in table format (exact structure).</p>

          {/* Loading */}
          {status === "loading" ? (
            <div
              role="status"
              style={{
                marginTop: 12,
                padding: "12px 12px",
                borderRadius: 14,
                border: "1px solid rgba(59,130,246,0.28)",
                background: "rgba(59,130,246,0.10)",
              }}
            >
              <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Loading /mock payload…</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.80)", fontSize: 13, lineHeight: 1.45 }}>
                Calling backend <code style={{ fontWeight: 900 }}>/mock</code> and waiting for JSON.
              </div>
            </div>
          ) : null}

          {/* Error */}
          {status === "error" ? (
            <div
              role="alert"
              style={{
                marginTop: 12,
                padding: "12px 12px",
                borderRadius: 14,
                border: "1px solid rgba(239,68,68,0.40)",
                background: "rgba(239,68,68,0.12)",
              }}
            >
              <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Unable to load /mock payload</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 1.45 }}>
                {errorMessage || "Request failed."}
              </div>
            </div>
          ) : null}

          {/* Success */}
          {status === "success" ? (
            <div style={{ marginTop: 14 }}>
              {payload === null || payload === undefined ? (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.80)" }}>No payload returned.</div>
              ) : typeof payload !== "object" || Array.isArray(payload) ? (
                <div
                  style={{
                    padding: "12px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.14)",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(255,255,255,0.72)" }}>payload</div>
                  <div style={{ marginTop: 8 }}>
                    <JsonTable value={payload} />
                  </div>
                </div>
              ) : (
                // Render each top-level key as its own labeled table block, preserving key order.
                <div>
                  {topLevelEntries.map(([key, value]) => (
                    <div
                      key={String(key)}
                      style={{
                        marginTop: 12,
                        padding: "12px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(0,0,0,0.14)",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(255,255,255,0.72)" }}>{String(key)}</div>
                      <div style={{ marginTop: 8 }}>
                        <JsonTable value={value} minWidth={720} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="auth-footer" style={{ marginTop: 16 }}>
            <a className="auth-link" href="#/orchestrator">
              Back to Orchestrator
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
