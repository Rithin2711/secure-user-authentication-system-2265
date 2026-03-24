import React, { useEffect, useMemo, useState } from "react";
import { intakeAgentSample } from "../sampleData/intakeAgentSample";
import { fetchIngestionResult } from "../services/ingestionApi";

/**
 * Workflow -> Ingestion layer page (backend-integrated).
 *
 * Responsibilities:
 * - Call the provided backend URL and render the JSON response.
 * - If backend indicates missing mandatory fields:
 *    - show an error message
 *    - show a text field for user to provide missing info (UI-only in this step)
 * - Otherwise:
 *    - render the returned JSON as a table.
 *
 * Notes:
 * - The backend response shape is not specified in this repo; we detect "missing mandatory" in a tolerant way:
 *   - response.missingMandatoryFields: array with length > 0
 *   - response.missing_fields: array with length > 0
 *   - response.missingMandatory: true
 *   - response.errorCode === 'MISSING_MANDATORY_FIELDS'
 */

// --- Helpers for rendering JSON as a table ---

/**
 * Recursively convert JSON into a list of key/value pairs for display.
 * Arrays are stringified; nested objects are flattened into "a.b.c" keys.
 */
function flattenObject(obj, prefix = "") {
  if (!obj || typeof obj !== "object") return [];
  const out = [];

  for (const [key, value] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      out.push([nextKey, JSON.stringify(value)]);
    } else if (value && typeof value === "object") {
      out.push(...flattenObject(value, nextKey));
    } else {
      out.push([nextKey, value]);
    }
  }

  return out;
}

function getPreviewValue(value) {
  if (value === undefined || value === null) return "—";
  if (typeof value === "string" && value.trim() === "") return "—";
  return String(value);
}

function getValueTypeLabel(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function isMissingMandatoryFromBackend(payload) {
  if (!payload || typeof payload !== "object") return false;
  const a = payload.missingMandatoryFields;
  const b = payload.missing_fields;
  if (Array.isArray(a) && a.length > 0) return true;
  if (Array.isArray(b) && b.length > 0) return true;
  if (payload.missingMandatory === true) return true;
  if (payload.errorCode === "MISSING_MANDATORY_FIELDS") return true;
  return false;
}

// PUBLIC_INTERFACE
export default function IngestionOutputPage() {
  const extractedBase = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("intake_agent_extracted_json");
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return intakeAgentSample;
  }, []);

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [backendJson, setBackendJson] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [missingUserText, setMissingUserText] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("loading");
      setErrorMessage("");
      try {
        // Send extractedBase as payload when backend expects POST.
        const data = await fetchIngestionResult({ payload: extractedBase });
        if (cancelled) return;
        setBackendJson(data);
        setStatus("success");
      } catch (e) {
        if (cancelled) return;
        setBackendJson(null);
        setErrorMessage(e instanceof Error ? e.message : "Failed to load ingestion response.");
        setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [extractedBase]);

  const missingMandatory = useMemo(() => isMissingMandatoryFromBackend(backendJson), [backendJson]);

  const flattenedEntries = useMemo(() => {
    if (!backendJson || typeof backendJson !== "object") return [];
    const pairs = flattenObject(backendJson);
    return pairs.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [backendJson]);

  return (
    <main className="auth-page auth-page--wide" aria-label="Workflow ingestion output page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Ingestion output">
        <div className="auth-wide-content" style={{ paddingTop: 10 }}>
          <h1 className="auth-title" style={{ marginTop: 14 }}>
            Workflow · Ingestion
          </h1>
          <p className="auth-subtitle">Backend response preview.</p>

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
              <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Loading ingestion response…</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.80)", fontSize: 13, lineHeight: 1.45 }}>
                Calling backend and waiting for JSON.
              </div>
            </div>
          ) : null}

          {/* Network/HTTP error */}
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
              <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Unable to load ingestion response</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 1.45 }}>
                {errorMessage || "Request failed."}
              </div>
            </div>
          ) : null}

          {/* Backend indicates missing mandatory fields */}
          {status === "success" && missingMandatory ? (
            <div
              role="alert"
              style={{
                marginTop: 12,
                padding: "12px 12px",
                borderRadius: 14,
                border: "1px solid rgba(245,158,11,0.40)",
                background: "rgba(245,158,11,0.12)",
              }}
            >
              <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Missing mandatory fields</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 1.45 }}>
                The backend reported missing mandatory fields. Please provide the missing information below (UI-only).
              </div>

              <div className="auth-field" style={{ marginTop: 12 }}>
                <label htmlFor="missing-mandatory-input" style={{ color: "rgba(255,255,255,0.84)" }}>
                  Missing information
                </label>
                <input
                  id="missing-mandatory-input"
                  className="auth-input"
                  type="text"
                  placeholder="Enter missing mandatory field(s)…"
                  value={missingUserText}
                  onChange={(e) => setMissingUserText(e.target.value)}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.66)", lineHeight: 1.45 }}>
                  This field is displayed when the backend response indicates missing mandatory fields.
                </div>
              </div>
            </div>
          ) : null}

          {/* Success table */}
          {status === "success" && !missingMandatory ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.92)" }}>
                  Backend JSON response
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.66)" }}>{flattenedEntries.length} fields</div>
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
                        <th
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
                          }}
                        >
                          Field
                        </th>
                        <th
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
                          }}
                        >
                          Value
                        </th>
                        <th
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
                            width: 120,
                          }}
                        >
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {flattenedEntries.map(([key, value], idx) => {
                        const rowBg = idx % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)";
                        return (
                          <tr key={key} style={{ background: rowBg }}>
                            <td
                              style={{
                                padding: "12px 12px",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                verticalAlign: "top",
                              }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(255,255,255,0.86)" }}>{key}</div>
                            </td>
                            <td
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
                                {getPreviewValue(value)}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 12px",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                verticalAlign: "top",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  border: "1px solid rgba(255,255,255,0.14)",
                                  background: "rgba(0,0,0,0.10)",
                                  color: "rgba(255,255,255,0.78)",
                                  fontSize: 12,
                                  fontWeight: 900,
                                }}
                              >
                                {getValueTypeLabel(value)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          <div className="auth-footer" style={{ marginTop: 16 }}>
            <a className="auth-link" href="#/upload">
              Back to Upload
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
