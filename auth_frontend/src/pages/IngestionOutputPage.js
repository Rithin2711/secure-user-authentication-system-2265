import React, { useMemo } from "react";
import { intakeAgentSample, requiredFieldPaths } from "../sampleData/intakeAgentSample";

/**
 * Ingestion Output page (UI-only).
 *
 * Responsibilities:
 * - Read the ingestion output (sample JSON) from sessionStorage (set on Upload submit), or fall back to intakeAgentSample.
 * - Render a clean output view (table of flattened fields).
 * - Provide navigation back to Upload.
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

// PUBLIC_INTERFACE
export default function IngestionOutputPage() {
  const extracted = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("intake_agent_extracted_json");
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return intakeAgentSample;
  }, []);

  const flattenedEntries = useMemo(() => {
    const pairs = flattenObject(extracted);
    return pairs.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [extracted]);

  const missingRequired = useMemo(() => {
    return requiredFieldPaths
      .map((path) => ({ path, value: getValueAtPath(extracted, path) }))
      .filter(({ value }) => isEmptyValue(value));
  }, [extracted]);

  const hasMissing = missingRequired.length > 0;

  return (
    <main className="auth-page auth-page--wide" aria-label="Ingestion output page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Ingestion output">
        <div className="auth-wide-content" style={{ paddingTop: 10 }}>
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.70)",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.12)",
                padding: "8px 10px",
                borderRadius: 999,
              }}
            >
              Ingestion agent output (UI-only)
            </div>
          </div>

          <h1 className="auth-title" style={{ marginTop: 14 }}>
            Ingestion
          </h1>
          <p className="auth-subtitle">Extracted payload and basic required-field visibility.</p>

          {/* Missing required fields summary */}
          {hasMissing ? (
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
              <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Missing required fields detected</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 1.45 }}>
                This is informational for now. (HITL edits will be wired later.)
              </div>
              <ul style={{ margin: "10px 0 0 18px", padding: 0, color: "rgba(255,255,255,0.92)", fontSize: 13 }}>
                {missingRequired.map(({ path }) => (
                  <li key={path} style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 850 }}>{humanizePath(path)}</span>{" "}
                    <span style={{ color: "rgba(255,255,255,0.72)" }}>({path})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div
              role="status"
              style={{
                marginTop: 12,
                padding: "12px 12px",
                borderRadius: 14,
                border: "1px solid rgba(34,197,94,0.28)",
                background: "rgba(34,197,94,0.10)",
              }}
            >
              <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>All required fields present</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 1.45 }}>
                No missing required fields were detected (UI-only).
              </div>
            </div>
          )}

          {/* Extracted content table */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.92)" }}>Extracted content</div>
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
                          width: 130,
                        }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {flattenedEntries.map(([key, value], idx) => {
                      const isRequired = requiredFieldPaths.includes(key);
                      const isMissing = isRequired && isEmptyValue(value);
                      const rowBg = idx % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)";
                      const statusLabel = isRequired ? (isMissing ? "Missing" : "Required") : "Optional";
                      const statusStyle = isRequired
                        ? isMissing
                          ? {
                              border: "1px solid rgba(245,158,11,0.45)",
                              bg: "rgba(245,158,11,0.14)",
                              text: "rgba(255,240,210,0.95)",
                            }
                          : {
                              border: "1px solid rgba(59,130,246,0.34)",
                              bg: "rgba(59,130,246,0.12)",
                              text: "rgba(210,230,255,0.95)",
                            }
                        : {
                            border: "1px solid rgba(255,255,255,0.14)",
                            bg: "rgba(0,0,0,0.10)",
                            text: "rgba(255,255,255,0.72)",
                          };

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
                            <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.62)" }}>{humanizePath(key)}</div>
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
                                color: isMissing ? "rgba(255,240,210,0.95)" : "rgba(255,255,255,0.90)",
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
                                padding: "6px 10px",
                                borderRadius: 999,
                                border: statusStyle.border,
                                background: statusStyle.bg,
                                color: statusStyle.text,
                                fontSize: 12,
                                fontWeight: 950,
                              }}
                            >
                              {statusLabel}
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

          <div className="auth-footer" style={{ marginTop: 16 }} />
        </div>
      </section>
    </main>
  );
}
