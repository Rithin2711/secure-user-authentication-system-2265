import React, { useEffect, useMemo, useRef, useState } from "react";
import { intakeAgentSample } from "../sampleData/intakeAgentSample";

/**
 * Upload page (UI-only).
 *
 * Updated behavior per request:
 * - On clicking Submit, show an "Orchestrator" view with 4 horizontally arranged agent blocks.
 * - Clicking a block navigates to a separate page.
 * - Only "Ingestion" navigation is functional for now; other blocks are placeholders.
 *
 * Note: This is UI-only and uses sample extracted JSON (intakeAgentSample).
 */

function getDisplayUserName() {
  try {
    const email = localStorage.getItem("auth_email");
    if (email && String(email).trim()) return String(email).trim();
  } catch {
    // ignore
  }
  return "User";
}

/**
 * Small, clickable agent card rendered inside the horizontal Orchestrator row.
 */
function AgentBlock({ title, subtitle, status = "idle", enabled, onClick }) {
  const statusStyles = useMemo(() => {
    const base = {
      border: "1px solid rgba(255,255,255,0.14)",
      bg: "rgba(255,255,255,0.06)",
      dot: "rgba(255,255,255,0.65)",
      label: "Idle",
    };

    if (status === "running") {
      return {
        ...base,
        border: "1px solid rgba(59,130,246,0.32)",
        bg: "linear-gradient(180deg, rgba(59,130,246,0.16), rgba(6,182,212,0.08))",
        dot: "rgba(59,130,246,0.95)",
        label: "Running",
      };
    }
    if (status === "success") {
      return {
        ...base,
        border: "1px solid rgba(34,197,94,0.28)",
        bg: "linear-gradient(180deg, rgba(34,197,94,0.14), rgba(255,255,255,0.04))",
        dot: "rgba(34,197,94,0.95)",
        label: "Complete",
      };
    }
    if (status === "warning") {
      return {
        ...base,
        border: "1px solid rgba(245,158,11,0.30)",
        bg: "linear-gradient(180deg, rgba(245,158,11,0.14), rgba(255,255,255,0.04))",
        dot: "rgba(245,158,11,0.95)",
        label: "Attention",
      };
    }
    if (status === "error") {
      return {
        ...base,
        border: "1px solid rgba(239,68,68,0.34)",
        bg: "linear-gradient(180deg, rgba(239,68,68,0.16), rgba(255,255,255,0.04))",
        dot: "rgba(239,68,68,0.95)",
        label: "Error",
      };
    }
    return base;
  }, [status]);

  return (
    <button
      type="button"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      aria-label={`${title} agent`}
      style={{
        textAlign: "left",
        cursor: enabled ? "pointer" : "not-allowed",
        opacity: enabled ? 1 : 0.65,

        width: "100%",
        minWidth: 220,

        borderRadius: 16,
        border: statusStyles.border,
        background: statusStyles.bg,
        boxShadow: "0 10px 28px rgba(0,0,0,0.20)",

        padding: "14px 14px",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            aria-hidden="true"
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: statusStyles.dot,
              boxShadow: `0 0 0 4px rgba(255,255,255,0.06), 0 0 24px ${statusStyles.dot}`,
              flex: "0 0 auto",
            }}
          />
          <div style={{ fontWeight: 950, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </div>
        </div>

        <span
          style={{
            fontSize: 12,
            fontWeight: 950,
            letterSpacing: "-0.01em",
            padding: "4px 8px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.12)",
            color: "rgba(255,255,255,0.78)",
            flex: "0 0 auto",
          }}
        >
          {statusStyles.label}
        </span>
      </div>

      {subtitle ? (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 8, lineHeight: 1.35 }}>{subtitle}</div>
      ) : null}

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.66)" }}>{enabled ? "Click to view output" : "Coming soon"}</div>
        <span
          aria-hidden="true"
          style={{
            width: 30,
            height: 30,
            display: "grid",
            placeItems: "center",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.12)",
            color: "rgba(255,255,255,0.78)",
            flex: "0 0 auto",
          }}
          title={enabled ? "Open" : "Disabled"}
        >
          →
        </span>
      </div>
    </button>
  );
}

// PUBLIC_INTERFACE
export default function UploadPage() {
  const [docType, setDocType] = useState("excel"); // excel | pdf | email
  const [file, setFile] = useState(null);
  const [emailContents, setEmailContents] = useState("");

  // Top dashboard user menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuWrapRef = useRef(null);

  // Orchestrator view state
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isFileType = docType === "excel" || docType === "pdf";

  const accept = useMemo(() => {
    if (docType === "excel")
      return ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (docType === "pdf") return "application/pdf,.pdf";
    return undefined;
  }, [docType]);

  const helperText = useMemo(() => {
    if (docType === "excel") return "Upload an Excel file (.xls or .xlsx).";
    if (docType === "pdf") return "Upload a PDF document (.pdf).";
    return "Paste the email contents below (including subject/body if available).";
  }, [docType]);

  const onChangeType = (e) => {
    const nextType = e.target.value;
    setDocType(nextType);

    // Reset previous inputs when switching modes to avoid accidental submission of stale data.
    setFile(null);
    setEmailContents("");

    // Reset orchestrator UI
    setHasSubmitted(false);

    // Clear any previously "extracted" results (UI-only).
    sessionStorage.removeItem("intake_agent_extracted_json");
  };

  const onStartOver = () => {
    // UI-only reset for another upload attempt.
    sessionStorage.removeItem("intake_agent_extracted_json");
    setHasSubmitted(false);
    setFile(null);
    setEmailContents("");
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

    // UI-only: store the intake-agent extracted JSON (used by ingestion output page).
    sessionStorage.setItem("intake_agent_extracted_json", JSON.stringify(intakeAgentSample));

    // Show orchestrator view.
    setHasSubmitted(true);
  };

  // PUBLIC_INTERFACE
  const onLogout = () => {
    /** Clears stored auth info and returns user to the Login page. */
    try {
      localStorage.removeItem("auth_access_token");
      localStorage.removeItem("auth_email");
      localStorage.removeItem("auth_user_id");
    } catch {
      // ignore
    }

    // Also clear any transient extracted state so a new session starts clean.
    try {
      sessionStorage.removeItem("intake_agent_extracted_json");
    } catch {
      // ignore
    }

    setIsUserMenuOpen(false);
    window.location.hash = "#/login";
  };

  // PUBLIC_INTERFACE
  const onOpenSettings = () => {
    /**
     * UI-only placeholder for settings.
     * No settings page/route is defined in this template, so we surface a stable message.
     */
    setIsUserMenuOpen(false);
    // eslint-disable-next-line no-alert
    alert("Settings (coming soon)");
  };

  // Close user menu on outside click / Escape for expected UX.
  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    const onDocMouseDown = (ev) => {
      const wrap = userMenuWrapRef.current;
      if (!wrap) return;
      if (!wrap.contains(ev.target)) setIsUserMenuOpen(false);
    };

    const onDocKeyDown = (ev) => {
      if (ev.key === "Escape") setIsUserMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, [isUserMenuOpen]);

  const displayName = useMemo(() => getDisplayUserName(), []);

  return (
    <main className="auth-page auth-page--wide" aria-label="Upload page">
      {/* Dashboard-style top bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,

          padding: "12px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.10)",

          background: "linear-gradient(90deg, rgba(75, 62, 120, 0.52), rgba(59, 57, 112, 0.38), rgba(10, 26, 47, 0.26))",
          boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
        role="banner"
        aria-label="Dashboard header"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.10)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              flex: "0 0 auto",
              fontSize: 15,
              lineHeight: 1,
            }}
            title="Tool"
          >
            ⬆︎
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 950,
                letterSpacing: "-0.02em",
                color: "rgba(255,255,255,0.92)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "50vw",
              }}
              title="Tool Name"
            >
              Agentic Ecosystem
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.66)" }}>Upload workspace</div>
          </div>
        </div>

        <div ref={userMenuWrapRef} style={{ position: "relative", display: "inline-flex" }}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            aria-label="Open user menu"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.12)",
              color: "rgba(255,255,255,0.92)",
              padding: "9px 12px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              maxWidth: 280,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                display: "grid",
                placeItems: "center",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.06)",
                flex: "0 0 auto",
                fontSize: 14,
                lineHeight: 1,
              }}
              title="User"
            >
              👤
            </span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 190,
              }}
              title={displayName}
            >
              {displayName}
            </span>
            <span aria-hidden="true" style={{ opacity: 0.9 }}>
              ▾
            </span>
          </button>

          {isUserMenuOpen ? (
            <div
              role="menu"
              aria-label="User menu"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                minWidth: 220,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(16, 24, 39, 0.78)",
                boxShadow: "0 18px 60px rgba(0, 0, 0, 0.45)",
                padding: 8,
                zIndex: 60,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.72)",
                  borderBottom: "1px solid rgba(255,255,255,0.10)",
                  marginBottom: 6,
                }}
              >
                Signed in as <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950 }}>{displayName}</span>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={onOpenSettings}
                style={{
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.92)",
                  padding: "10px 10px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 850,
                  letterSpacing: "-0.01em",
                  marginBottom: 8,
                }}
              >
                Settings
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={onLogout}
                style={{
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 12,
                  border: "1px solid rgba(239,68,68,0.35)",
                  background: "rgba(239,68,68,0.12)",
                  color: "rgba(255,255,255,0.92)",
                  padding: "10px 10px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 950,
                  letterSpacing: "-0.01em",
                }}
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <section className="auth-card auth-card--flat" role="region" aria-label="Upload">
        {/* spacing so content starts below fixed bar */}
        <div className="auth-wide-content" style={{ paddingTop: 86 }}>
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

            {/* Orchestrator view (post-submit) */}
            {hasSubmitted ? (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.20)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 950, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.92)" }}>Orchestrator</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 4 }}>
                        Click an agent to view its output. Only{" "}
                        <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950 }}>Ingestion</span> is wired right now.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="auth-button"
                      onClick={onStartOver}
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
                  </div>
                </div>

                {/* 4 horizontally arranged blocks */}
                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
                    gap: 12,
                    alignItems: "stretch",
                  }}
                >
                  <AgentBlock
                    title="Ingestion"
                    subtitle="Extract + basic required-field visibility (functional)"
                    status="success"
                    enabled
                    onClick={() => {
                      window.location.hash = "#/agent/ingestion";
                    }}
                  />
                  <AgentBlock title="Validation" subtitle="Rules + checks beyond ingestion (placeholder)" status="idle" enabled={false} />
                  <AgentBlock title="Pricing" subtitle="Compute pricing from extracted + validated input (placeholder)" status="idle" enabled={false} />
                  <AgentBlock title="Inventory" subtitle="Resolve inventory availability + recommendations (placeholder)" status="idle" enabled={false} />
                </div>

                <p className="auth-subtitle" style={{ marginTop: 10 }}>
                  Note: Output pages are UI-only for now. Ingestion reads the sample payload stored during Submit.
                </p>
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}
