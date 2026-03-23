import React, { useEffect, useMemo, useState } from "react";
import { intakeAgentSample, requiredFieldPaths } from "../sampleData/intakeAgentSample";

/**
 * Ingestion Output page (UI-only).
 *
 * Responsibilities:
 * - Read the ingestion output (sample JSON) from sessionStorage (set on Upload submit), or fall back to intakeAgentSample.
 * - Render a clean output view (table of flattened fields).
 * - Show missing required fields and allow user to enter them via an "Add missing items" UI (UI-only; not persisted yet).
 *
 * Missing-field entry behavior:
 * - Inputs are treated as drafts while typing.
 * - Values are only committed into the displayed JSON when the user presses Enter.
 */

function getValueAtPath(obj, path) {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = String(path || "")
    .split(".")
    .filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = cur[p];
    else return undefined;
  }
  return cur;
}

/**
 * Sets a value on an object by a dot-separated path, creating intermediate objects as needed.
 * Returns a NEW root object (does not mutate input).
 */
function setValueAtPathImmutable(obj, path, value) {
  const parts = String(path || "")
    .split(".")
    .filter(Boolean);

  // If path is empty, treat as no-op.
  if (parts.length === 0) return obj;

  // Ensure we always operate on an object root.
  const root = obj && typeof obj === "object" ? obj : {};
  const nextRoot = Array.isArray(root) ? [...root] : { ...root };

  let cur = nextRoot;

  for (let i = 0; i < parts.length; i += 1) {
    const key = parts[i];
    const isLeaf = i === parts.length - 1;

    if (isLeaf) {
      cur[key] = value;
      break;
    }

    const existing = cur[key];
    let nextLevel;
    if (existing && typeof existing === "object" && !Array.isArray(existing)) {
      nextLevel = { ...existing };
    } else {
      nextLevel = {};
    }

    cur[key] = nextLevel;
    cur = nextLevel;
  }

  return nextRoot;
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

/**
 * Prefer a human-friendly label for missing items.
 * If you later add field-level metadata to `requiredFieldPaths` (e.g., { path, label }),
 * update this helper accordingly.
 */
function getMissingFieldLabel(path) {
  return humanizePath(path);
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

  /**
   * The JSON shown in the UI. This is what the table (and missing detection) reflect.
   * Missing-field inputs should only update this object on Enter.
   */
  const [displayedJson, setDisplayedJson] = useState(extractedBase);

  const flattenedEntries = useMemo(() => {
    const pairs = flattenObject(displayedJson);
    return pairs.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [displayedJson]);

  const missingRequired = useMemo(() => {
    return requiredFieldPaths
      .map((path) => ({ path, value: getValueAtPath(displayedJson, path) }))
      .filter(({ value }) => isEmptyValue(value));
  }, [displayedJson]);

  const hasMissing = missingRequired.length > 0;

  // UI-only state for "Add missing items"
  const [showAddMissing, setShowAddMissing] = useState(false);

  /**
   * Draft input values (what user has typed but not yet committed to JSON).
   * Keys are the required-field paths.
   */
  const [missingInputs, setMissingInputs] = useState(() => {
    const init = {};
    for (const { path } of missingRequired) init[path] = "";
    return init;
  });

  /**
   * If missingRequired changes (e.g., after committing values with Enter, or a different extraction loaded),
   * keep the draft state consistent and auto-collapse the missing-items panel when nothing is missing.
   *
   * Note: This must be an effect (not useMemo) because it performs state updates (side effects).
   */
  useEffect(() => {
    setMissingInputs((prev) => {
      const next = { ...prev };

      // Ensure any newly-missing fields exist in draft state.
      for (const { path } of missingRequired) {
        if (!(path in next)) next[path] = "";
      }

      // Remove drafts for fields that are no longer missing (i.e., were committed).
      for (const k of Object.keys(next)) {
        if (!missingRequired.some((m) => m.path === k)) delete next[k];
      }

      return next;
    });

    // Auto-collapse the panel as soon as the last missing field is no longer missing.
    if (!hasMissing) setShowAddMissing(false);
  }, [hasMissing, missingRequired]);

  // PUBLIC_INTERFACE
  function commitMissingField(path) {
    /**
     * Commit a draft missing-field value into the displayed JSON.
     * This is triggered only when the user presses Enter in a missing-field input.
     */
    const draft = missingInputs[path] ?? "";
    setDisplayedJson((prev) => setValueAtPathImmutable(prev, path, draft));
  }

  const addMissingButtonId = "add-missing-items-toggle";

  return (
    <main className="auth-page auth-page--wide" aria-label="Ingestion output page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Ingestion output">
        <div className="auth-wide-content" style={{ paddingTop: 10 }}>
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }} />

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
                Use <span style={{ fontWeight: 850 }}>Add missing items</span> to enter missing values. (UI-only; saving will be
                wired later.)
              </div>

              <ul style={{ margin: "10px 0 0 18px", padding: 0, color: "rgba(255,255,255,0.92)", fontSize: 13 }}>
                {missingRequired.map(({ path }) => (
                  <li key={path} style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 850 }}>{getMissingFieldLabel(path)}</span>{" "}
                    <span style={{ color: "rgba(255,255,255,0.72)" }}>({path})</span>
                  </li>
                ))}
              </ul>

              {/* Add missing items CTA */}
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  id={addMissingButtonId}
                  type="button"
                  onClick={() => setShowAddMissing((s) => !s)}
                  aria-expanded={showAddMissing}
                  aria-controls="add-missing-items-panel"
                  style={{
                    appearance: "none",
                    border: "1px solid rgba(245,158,11,0.55)",
                    background: showAddMissing ? "rgba(245,158,11,0.20)" : "rgba(0,0,0,0.14)",
                    color: "rgba(255,255,255,0.92)",
                    padding: "10px 12px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  Add missing items
                </button>

                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.74)" }}>
                  {showAddMissing ? "Fill the fields below." : "Click to enter the missing fields."}
                </div>
              </div>

              {/* Missing items entry panel */}
              {showAddMissing ? (
                <div
                  id="add-missing-items-panel"
                  role="region"
                  aria-label="Add missing items"
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.12)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {missingRequired.map(({ path }) => {
                      const label = getMissingFieldLabel(path);

                      return (
                        <div key={path} className="auth-field" style={{ margin: 0 }}>
                          <label htmlFor={`missing-${path}`} style={{ color: "rgba(255,255,255,0.78)" }}>
                            {label}
                          </label>
                          <input
                            id={`missing-${path}`}
                            className="auth-input"
                            type="text"
                            placeholder={`Enter ${label}`}
                            value={missingInputs[path] ?? ""}
                            onChange={(e) => {
                              const nextVal = e.target.value;
                              setMissingInputs((prev) => ({ ...prev, [path]: nextVal }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitMissingField(path);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.66)", lineHeight: 1.45 }}>
                    Note: these values are currently only committed into the JSON preview when you press Enter.
                  </div>
                </div>
              ) : null}
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
