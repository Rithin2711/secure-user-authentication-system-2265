import React, { useMemo, useState } from "react";
import { intakeAgentSample, requiredFieldPaths } from "../sampleData/intakeAgentSample";

/**
 * Input Validation page (UI-only).
 *
 * Responsibilities:
 * - Display the extracted intake-agent JSON (key/value output).
 * - Validate missing/empty required fields (simple, deterministic rules).
 * - Provide a HITL-style loop: show error messages and allow user to re-upload.
 */

/**
 * Gets a nested value from an object using a dot-separated path (e.g. "a.b.c").
 */
function getValueAtPath(obj, path) {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = String(path || "").split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = cur[p];
    else return undefined;
  }
  return cur;
}

/**
 * Define emptiness for validation:
 * - undefined/null => empty
 * - string => empty if trimmed length is 0
 * - array => empty if length is 0 OR all items empty
 * - object => empty if has no keys
 * - number/boolean => NOT empty
 */
function isEmptyValue(v) {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) {
    if (v.length === 0) return true;
    return v.every((item) => isEmptyValue(item));
  }
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}

function humanizePath(path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .map((p) => p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" → ");
}

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

// PUBLIC_INTERFACE
export default function InputValidationPage() {
  const [expanded, setExpanded] = useState(true);

  const extracted = useMemo(() => {
    // Prefer payload from Upload page; fall back to the sample attachment JSON.
    try {
      const raw = sessionStorage.getItem("intake_agent_extracted_json");
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore and fall back.
    }
    return intakeAgentSample;
  }, []);

  const missingRequired = useMemo(() => {
    return requiredFieldPaths
      .map((path) => ({ path, value: getValueAtPath(extracted, path) }))
      .filter(({ value }) => isEmptyValue(value));
  }, [extracted]);

  const hasErrors = missingRequired.length > 0;

  const flattenedEntries = useMemo(() => {
    const pairs = flattenObject(extracted);
    // Stable sorting keeps UI predictable.
    return pairs.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [extracted]);

  const onReupload = () => {
    // Clear previous extracted payload so the next run is "fresh".
    sessionStorage.removeItem("intake_agent_extracted_json");
    window.location.hash = "#/upload";
  };

  return (
    <main className="auth-page auth-page--wide" aria-label="Input validation page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Input validation results">
        <div className="auth-wide-content">
          <h1 className="auth-title">Input validation</h1>
          <p className="auth-subtitle">
            Review the extracted fields. If any required fields are empty, a human-in-the-loop (HITL) re-upload is required.
          </p>

          {/* HITL error panel */}
          {hasErrors ? (
            <div
              role="alert"
              style={{
                marginTop: 14,
                padding: "12px 12px",
                borderRadius: 14,
                border: "1px solid rgba(239,68,68,0.40)",
                background: "rgba(239,68,68,0.12)",
              }}
            >
              <div style={{ fontWeight: 850, letterSpacing: "-0.01em" }}>Action required</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 1.45 }}>
                The following required fields are missing or empty. Please re-upload and ensure these fields are provided:
              </div>

              <ul style={{ margin: "10px 0 0 18px", padding: 0, color: "rgba(255,255,255,0.92)", fontSize: 13 }}>
                {missingRequired.map(({ path }) => (
                  <li key={path} style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 800 }}>{humanizePath(path)}</span>{" "}
                    <span style={{ color: "rgba(255,255,255,0.72)" }}>({path})</span>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="auth-button"
                  onClick={onReupload}
                  style={{
                    width: "auto",
                    padding: "10px 14px",
                    marginTop: 0,
                    background: "linear-gradient(135deg, rgba(239,68,68,0.95), rgba(239,68,68,0.65))",
                    boxShadow: "0 10px 26px rgba(239, 68, 68, 0.20)",
                  }}
                >
                  Re-upload / try again
                </button>

                <a className="auth-link" href="#/upload" onClick={(e) => e.preventDefault() || onReupload()}>
                  Back to Upload
                </a>
              </div>
            </div>
          ) : (
            <div
              role="status"
              style={{
                marginTop: 14,
                padding: "12px 12px",
                borderRadius: 14,
                border: "1px solid rgba(6,182,212,0.35)",
                background: "rgba(6,182,212,0.10)",
              }}
            >
              <div style={{ fontWeight: 850, letterSpacing: "-0.01em" }}>Validation passed</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 1.45 }}>
                All required fields are present.
              </div>
            </div>
          )}

          {/* Collapsible extracted JSON */}
          <div
            style={{
              marginTop: 16,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls="validation-results-panel"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 14px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Extracted fields (intake-agent JSON)</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 2 }}>
                  Click to {expanded ? "collapse" : "expand"}
                </div>
              </div>

              <span
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.06)",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 160ms ease, background-color 160ms ease",
                  flex: "0 0 auto",
                }}
              >
                ▼
              </span>
            </button>

            {expanded ? (
              <div
                id="validation-results-panel"
                style={{
                  padding: "12px 14px 14px 14px",
                  borderTop: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  {flattenedEntries.map(([key, value]) => {
                    const isRequired = requiredFieldPaths.includes(key);
                    const isMissing = isRequired && isEmptyValue(value);

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: isMissing ? "1px solid rgba(239,68,68,0.45)" : "1px solid rgba(255,255,255,0.12)",
                          background: isMissing ? "rgba(239,68,68,0.10)" : "rgba(0,0,0,0.12)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "rgba(255,255,255,0.70)", fontSize: 12, fontWeight: 750 }}>
                            {key}
                            {isRequired ? (
                              <span style={{ marginLeft: 8, fontWeight: 850, color: "rgba(255,255,255,0.78)" }}>
                                • required
                              </span>
                            ) : null}
                          </div>
                          {isMissing ? (
                            <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,210,210,0.95)", fontWeight: 750 }}>
                              Empty — please re-upload with this field provided.
                            </div>
                          ) : null}
                        </div>

                        <div
                          style={{
                            color: "rgba(255,255,255,0.92)",
                            fontSize: 12,
                            fontWeight: 750,
                            textAlign: "right",
                            wordBreak: "break-word",
                            maxWidth: "55%",
                          }}
                        >
                          {value === undefined || value === null || String(value).trim() === "" ? (
                            <span style={{ color: "rgba(255,255,255,0.55)" }}>—</span>
                          ) : (
                            String(value)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="auth-subtitle" style={{ marginTop: 12 }}>
                  UI-only preview. This page currently reads extracted JSON from session storage (set by Upload) or falls back to the sample
                  intake-agent output.
                </p>
              </div>
            ) : null}
          </div>

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
