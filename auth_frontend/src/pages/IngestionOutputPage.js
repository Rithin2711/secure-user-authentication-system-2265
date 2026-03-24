import React, { useEffect, useState } from "react";
import { fetchMockRequiredIngestionFields } from "../services/ingestionApi";

/**
 * Orchestrator -> Ingestion layer page (backend-integrated).
 *
 * Task requirement:
 * - Call GET /mock from the backend base URL
 * - Render the returned JSON payload:
 *    - payload.message
 *    - payload.meta (as pretty JSON)
 *    - payload.items (as a table)
 */

// --- Render helpers ---

function safeToPrettyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getDisplayValue(value) {
  if (value === undefined || value === null) return "—";
  if (typeof value === "string" && value.trim() === "") return "—";
  if (typeof value === "object") return safeToPrettyJson(value);
  return String(value);
}

function getColumnsFromItems(items) {
  const columns = new Set();
  for (const item of items) {
    if (!isPlainObject(item)) continue;
    for (const k of Object.keys(item)) columns.add(k);
  }
  return Array.from(columns);
}

// PUBLIC_INTERFACE
export default function IngestionOutputPage() {
  /**
   * Ingestion output page that displays the backend /mock response.
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
        setPayload(data?.payload ?? data); // tolerate either {payload:{...}} or payload as root
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

  const message = payload?.message;
  const meta = payload?.meta;
  const items = Array.isArray(payload?.items) ? payload.items : [];

  const columns = getColumnsFromItems(items);

  return (
    <main className="auth-page auth-page--wide" aria-label="Orchestrator ingestion mock output page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Mock ingestion payload">
        <div className="auth-wide-content" style={{ paddingTop: 10 }}>
          <h1 className="auth-title" style={{ marginTop: 14 }}>
            Orchestrator · Ingestion (/mock)
          </h1>
          <p className="auth-subtitle">Displaying the backend mock ingestion payload.</p>

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
              {/* message */}
              <div
                style={{
                  padding: "12px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.14)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(255,255,255,0.72)" }}>payload.message</div>
                <div style={{ marginTop: 6, fontWeight: 950, color: "rgba(255,255,255,0.92)" }}>
                  {message ? String(message) : "—"}
                </div>
              </div>

              {/* meta */}
              <div
                style={{
                  marginTop: 12,
                  padding: "12px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.14)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(255,255,255,0.72)" }}>payload.meta</div>
                <pre
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.18)",
                    overflowX: "auto",
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "rgba(255,255,255,0.86)",
                  }}
                >
                  {safeToPrettyJson(meta ?? {})}
                </pre>
              </div>

              {/* items table */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.92)" }}>
                    payload.items
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.66)" }}>{items.length} rows</div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.14)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 720 }}>
                      <thead>
                        <tr>
                          {columns.map((col) => (
                            <th
                              key={col}
                              align="left"
                              style={{
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                                padding: "12px 12px",
                                fontSize: 12,
                                fontWeight: 950,
                                letterSpacing: "-0.01em",
                                color: "rgba(255,255,255,0.86)",
                                background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                                borderBottom: "1px solid rgba(255,255,255,0.10)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td
                              colSpan={Math.max(columns.length, 1)}
                              style={{
                                padding: "14px 12px",
                                color: "rgba(255,255,255,0.74)",
                                fontSize: 12,
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              No items returned.
                            </td>
                          </tr>
                        ) : (
                          items.map((item, idx) => {
                            const rowBg = idx % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)";
                            return (
                              <tr key={idx} style={{ background: rowBg }}>
                                {columns.map((col) => (
                                  <td
                                    key={col}
                                    style={{
                                      padding: "12px 12px",
                                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 850,
                                        color: "rgba(255,255,255,0.90)",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {isPlainObject(item) ? getDisplayValue(item[col]) : getDisplayValue(item)}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
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
