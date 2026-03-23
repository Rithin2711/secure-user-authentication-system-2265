import React, { useMemo, useState } from "react";
import { intakeAgentSample, requiredFieldPaths } from "../sampleData/intakeAgentSample";

/**
 * Upload page (UI only).
 *
 * Requested behavior:
 * - After Submit, DO NOT navigate away.
 * - Disable Submit and show an inline expandable “Input validation” section below it.
 * - The expandable section contains:
 *   - Missing-field detection
 *   - Inline missing-field entry UI (commit value on Enter)
 *   - Extracted content display (flattened key/value)
 *
 * Note: This is UI-only and uses sample extracted JSON (intakeAgentSample),
 * consistent with the existing template behavior.
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
 * Sets a nested value on an object using a dot-separated path (e.g. "a.b.c").
 * Mutates the given object (expects a clone at the call site).
 */
function setValueAtPath(obj, path, value) {
  if (!obj || typeof obj !== "object") return;
  const parts = String(path || "").split(".").filter(Boolean);
  if (parts.length === 0) return;

  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const p = parts[i];
    const next = cur[p];

    // Create intermediate objects as needed so the path always becomes writable.
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cur[p] = {};
    }
    cur = cur[p];
  }

  cur[parts[parts.length - 1]] = value;
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
export default function UploadPage() {
  const [docType, setDocType] = useState("excel"); // excel | pdf | email
  const [file, setFile] = useState(null);
  const [emailContents, setEmailContents] = useState("");

  // Submit / inline validation section state
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [validationExpanded, setValidationExpanded] = useState(true);

  // Missing-field UI state: reveal inputs on demand (inside inline validation section)
  const [showMissingInputs, setShowMissingInputs] = useState(false);

  /**
   * Draft vs committed missing-field state:
   * - missingFieldDrafts: what the user is currently typing (does NOT affect JSON preview)
   * - missingFieldInputs: committed values (only updated when user presses Enter)
   */
  const [missingFieldDrafts, setMissingFieldDrafts] = useState({});
  const [missingFieldInputs, setMissingFieldInputs] = useState({});

  const isFileType = docType === "excel" || docType === "pdf";

  const accept = useMemo(() => {
    if (docType === "excel") return ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (docType === "pdf") return "application/pdf,.pdf";
    return undefined;
  }, [docType]);

  const helperText = useMemo(() => {
    if (docType === "excel") return "Upload an Excel file (.xls or .xlsx).";
    if (docType === "pdf") return "Upload a PDF document (.pdf).";
    return "Paste the email contents below (including subject/body if available).";
  }, [docType]);

  const extracted = useMemo(() => {
    // Prefer payload in sessionStorage (if any), else the sample.
    // On Upload page we explicitly set it on Submit for this UI-only flow.
    try {
      const raw = sessionStorage.getItem("intake_agent_extracted_json");
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return intakeAgentSample;
  }, [hasSubmitted]);

  /**
   * UI-only "merged" JSON:
   * - Start with extracted JSON
   * - Overwrite any required paths the user COMMITTED via the missing-field inputs (Enter key)
   */
  const mergedExtracted = useMemo(() => {
    const clone = structuredClone ? structuredClone(extracted) : JSON.parse(JSON.stringify(extracted));

    for (const [path, rawValue] of Object.entries(missingFieldInputs)) {
      // Treat empty input as "not provided" (so it will still be considered missing).
      const v = typeof rawValue === "string" ? rawValue : String(rawValue);

      // Preserve number-like required fields by casting when the original value is a number.
      const existing = getValueAtPath(extracted, path);
      let nextValue = v;

      if (typeof existing === "number") {
        const n = Number(v);
        // If it's not a valid number, keep the raw string so the user can see what they typed.
        nextValue = Number.isFinite(n) ? n : v;
      }

      setValueAtPath(clone, path, nextValue);
    }

    return clone;
  }, [extracted, missingFieldInputs]);

  const missingRequired = useMemo(() => {
    return requiredFieldPaths
      .map((path) => ({ path, value: getValueAtPath(mergedExtracted, path) }))
      .filter(({ value }) => isEmptyValue(value));
  }, [mergedExtracted]);

  const hasErrors = hasSubmitted && missingRequired.length > 0;

  const flattenedEntries = useMemo(() => {
    const pairs = flattenObject(mergedExtracted);
    return pairs.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [mergedExtracted]);

  const onChangeType = (e) => {
    const nextType = e.target.value;
    setDocType(nextType);

    // Reset previous inputs when switching modes to avoid accidental submission of stale data.
    setFile(null);
    setEmailContents("");

    // Reset inline validation UI
    setHasSubmitted(false);
    setValidationExpanded(true);
    setShowMissingInputs(false);
    setMissingFieldDrafts({});
    setMissingFieldInputs({});

    // Clear any previously "extracted" results (UI-only).
    sessionStorage.removeItem("intake_agent_extracted_json");
  };

  const onChangeMissingFieldDraft = (path, value) => {
    setMissingFieldDrafts((prev) => ({ ...prev, [path]: value }));
  };

  const commitMissingField = (path) => {
    setMissingFieldInputs((prev) => {
      const next = { ...prev };
      const v = missingFieldDrafts[path];

      // If committed value is empty, remove the key entirely
      // (so required-field validation still treats it as missing).
      if (v === undefined || v === null || String(v).trim() === "") {
        delete next[path];
        return next;
      }

      next[path] = v;
      return next;
    });
  };

  const onReuploadTryAgain = () => {
    // UI-only reset for another upload attempt.
    sessionStorage.removeItem("intake_agent_extracted_json");

    setHasSubmitted(false);
    setValidationExpanded(true);
    setShowMissingInputs(false);
    setMissingFieldDrafts({});
    setMissingFieldInputs({});

    // Keep whatever docType user selected; reset its input field.
    setFile(null);
    setEmailContents("");
  };

  const onProceedToValidation = () => {
    /** Navigate to the dedicated Validation page (reads sessionStorage payload). */
    window.location.hash = "#/input-validation";
  };

  const onSubmit = (e) => {
    e.preventDefault();

    // UI-only validation (keep on same page).
    if (isFileType && !file) {
      // eslint-disable-next-line no-alert
      alert("Please choose a file to upload.");
      return;
    }
    if (!isFileType && !emailContents.trim()) {
      // eslint-disable-next-line no-alert
      alert("Please paste the email contents.");
      return;
    }

    // UI-only: store the intake-agent extracted JSON.
    // In a future backend integration, this will be replaced by a real API call.
    sessionStorage.setItem("intake_agent_extracted_json", JSON.stringify(intakeAgentSample));

    // Disable submit and reveal inline Input validation.
    setHasSubmitted(true);
    setValidationExpanded(true);
  };

  return (
    <main className="auth-page auth-page--wide" aria-label="Upload page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Upload">
        <div className="auth-wide-content">
          <h1 className="auth-title">Upload</h1>
          <p className="auth-subtitle">Choose a document type and provide the content to upload.</p>

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-field">
              <label htmlFor="upload-type">Document format</label>
              <select id="upload-type" className="auth-input" value={docType} onChange={onChangeType} disabled={hasSubmitted}>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
                <option value="email">Email</option>
              </select>
              <p className="auth-subtitle" style={{ marginTop: 8 }}>
                {helperText}
              </p>
              {hasSubmitted ? null : null}
            </div>

            {isFileType ? (
              <div className="auth-field">
                <label htmlFor="upload-file">Choose file</label>
                <input
                  id="upload-file"
                  className="auth-input"
                  type="file"
                  accept={accept}
                  onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  disabled={hasSubmitted}
                />
                {file ? (
                  <p className="auth-subtitle" style={{ marginTop: 8 }}>
                    Selected: <span style={{ color: "rgba(255,255,255,0.92)" }}>{file.name}</span>
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="auth-field">
                <label htmlFor="upload-email-contents">Email contents</label>
                <textarea
                  id="upload-email-contents"
                  className="auth-input"
                  placeholder="Paste email contents here..."
                  value={emailContents}
                  onChange={(e) => setEmailContents(e.target.value)}
                  rows={8}
                  style={{ resize: "vertical" }}
                  disabled={hasSubmitted}
                />
              </div>
            )}

            <button className="auth-button" type="submit" disabled={hasSubmitted}>
              {hasSubmitted ? "Submitted" : "Submit"}
            </button>

            {/* Inline expandable “Input validation” section (revealed post-submit) */}
            {hasSubmitted ? (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "linear-gradient(180deg, rgba(75, 62, 120, 0.40), rgba(59, 57, 112, 0.28))",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setValidationExpanded((v) => !v)}
                  aria-expanded={validationExpanded}
                  aria-controls="upload-inline-validation-panel"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.92)",
                    textAlign: "left",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 850, letterSpacing: "-0.01em" }}>Input validation</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 2 }}>
                      Click to {validationExpanded ? "collapse" : "expand"}
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    style={{
                      width: 32,
                      height: 32,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(0,0,0,0.12)",
                      transform: validationExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
                      flex: "0 0 auto",
                      color: "rgba(255,255,255,0.78)",
                    }}
                  >
                    ▼
                  </span>
                </button>

                {validationExpanded ? (
                  <div
                    id="upload-inline-validation-panel"
                    style={{
                      padding: "14px 16px 16px",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {/* Missing fields panel (inline) */}
                    {hasErrors ? (
                      <div
                        role="alert"
                        style={{
                          padding: "12px 12px",
                          borderRadius: 14,
                          border: "1px solid rgba(239,68,68,0.40)",
                          background: "rgba(239,68,68,0.12)",
                        }}
                      >
                        <div style={{ fontWeight: 900, letterSpacing: "-0.01em" }}>Action required</div>
                        <div style={{ marginTop: 6, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 1.45 }}>
                          The following required fields are missing or empty. Provide missing values below (UI-only) to update the preview.
                        </div>

                        <ul style={{ margin: "10px 0 0 18px", padding: 0, color: "rgba(255,255,255,0.92)", fontSize: 13 }}>
                          {missingRequired.map(({ path }) => (
                            <li key={path} style={{ marginBottom: 6 }}>
                              <span style={{ fontWeight: 850 }}>{humanizePath(path)}</span>{" "}
                              <span style={{ color: "rgba(255,255,255,0.72)" }}>({path})</span>
                            </li>
                          ))}
                        </ul>

                        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="auth-button"
                            onClick={onReuploadTryAgain}
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

                          <button
                            type="button"
                            className="auth-button"
                            onClick={() => setShowMissingInputs((v) => !v)}
                            aria-expanded={showMissingInputs}
                            style={{
                              width: "auto",
                              padding: "10px 14px",
                              marginTop: 0,
                              background: "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(6,182,212,0.80))",
                              boxShadow: "0 10px 26px rgba(59, 130, 246, 0.22)",
                            }}
                          >
                            Upload missing data
                          </button>
                        </div>

                        {showMissingInputs ? (
                          <div
                            style={{
                              marginTop: 12,
                              padding: "12px 12px",
                              borderRadius: 14,
                              border: "1px solid rgba(255,255,255,0.14)",
                              background: "rgba(0,0,0,0.12)",
                            }}
                          >
                            <div style={{ fontWeight: 850, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.92)" }}>
                              Provide missing fields
                            </div>

                            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                              {missingRequired.map(({ path }) => {
                                const label = `${humanizePath(path)}:`;
                                const id = `missing-${path.replace(/[^\w-]/g, "-")}`;
                                const draftValue = missingFieldDrafts[path] ?? "";

                                return (
                                  <div className="auth-field" key={path} style={{ marginTop: 0 }}>
                                    <label htmlFor={id} style={{ color: "rgba(255,255,255,0.80)" }}>
                                      {label}
                                    </label>
                                    <input
                                      id={id}
                                      className="auth-input"
                                      type="text"
                                      placeholder={`Enter ${humanizePath(path)}`}
                                      value={draftValue}
                                      onChange={(ev) => onChangeMissingFieldDraft(path, ev.target.value)}
                                      onKeyDown={(ev) => {
                                        if (ev.key === "Enter") {
                                          ev.preventDefault();
                                          commitMissingField(path);
                                        }
                                      }}
                                    />
                                    <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.62)" }}>
                                      Press <span style={{ color: "rgba(255,255,255,0.86)", fontWeight: 800 }}>Enter</span> to apply to
                                      the preview.
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div
                        role="status"
                        style={{
                          padding: "12px 12px",
                          borderRadius: 14,
                          border: "1px solid rgba(34,197,94,0.28)",
                          background: "rgba(34,197,94,0.10)",
                        }}
                      >
                        <div style={{ fontWeight: 900, letterSpacing: "-0.01em" }}>All required fields look good</div>
                        <div style={{ marginTop: 6, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 1.45 }}>
                          No missing required fields were detected in the extracted content (UI-only).
                        </div>

                        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="auth-button"
                            onClick={onReuploadTryAgain}
                            style={{
                              width: "auto",
                              padding: "10px 14px",
                              marginTop: 0,
                              background: "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(6,182,212,0.80))",
                              boxShadow: "0 10px 26px rgba(59, 130, 246, 0.22)",
                            }}
                          >
                            Re-upload / try again
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Extracted content (inline) */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 850, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.92)" }}>Extracted content</div>
                      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
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
                                <div style={{ color: "rgba(255,255,255,0.70)", fontSize: 12, fontWeight: 800 }}>
                                  {key}
                                  {isRequired ? (
                                    <span style={{ marginLeft: 8, fontWeight: 900, color: "rgba(255,255,255,0.78)" }}>• required</span>
                                  ) : null}
                                </div>
                                {isMissing ? (
                                  <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,210,210,0.95)", fontWeight: 800 }}>
                                    Empty — provide a value above (UI-only) or re-upload with this field provided.
                                  </div>
                                ) : null}
                              </div>

                              <div
                                style={{
                                  color: "rgba(255,255,255,0.92)",
                                  fontSize: 12,
                                  fontWeight: 800,
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

                      <p className="auth-subtitle" style={{ marginTop: 10 }}>
                        UI-only preview. Missing-field inputs overwrite the extracted JSON in-memory so you can see updated values
                        immediately.
                      </p>
                    </div>

                    {/* Requested: buttons inside the expandable Input validation section (moved to bottom/end) */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
                      <button
                        type="button"
                        className="auth-button"
                        onClick={onReuploadTryAgain}
                        style={{
                          width: "auto",
                          padding: "10px 14px",
                          marginTop: 0,
                          background: "rgba(255,255,255,0.10)",
                          border: "1px solid rgba(255,255,255,0.16)",
                          boxShadow: "0 10px 26px rgba(0, 0, 0, 0.18)",
                        }}
                      >
                        Upload another file
                      </button>

                      <button
                        type="button"
                        className="auth-button"
                        onClick={onProceedToValidation}
                        style={{ width: "auto", padding: "10px 14px", marginTop: 0 }}
                      >
                        Proceed to Validation
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="auth-footer">
              <a className="auth-link" href="#/login">
                Back to Login
              </a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
