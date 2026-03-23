import React, { useMemo, useState } from "react";

/**
 * Input Validation Results page (UI-only).
 * - Matches the same auth theme/background as login/signup/upload by using shared auth-* classes.
 * - Provides a collapsible "Input validation" card with a down-arrow control.
 * - Shows static sample key/value output (placeholder for future agent results integration).
 */

// PUBLIC_INTERFACE
export default function InputValidationPage() {
  const [expanded, setExpanded] = useState(false);

  const sampleResults = useMemo(
    () => ({
      DocumentType: "PDF",
      FileName: "sample_document.pdf",
      FileSize: "1.2 MB",
      "Checksum (SHA-256)": "b6b7f28c...d1a9",
      "Validation status": "PASS",
      "Required fields present": "Yes",
      "PII detected": "No",
      "Schema version": "v1",
      Notes: "Static sample output (UI only).",
    }),
    []
  );

  const entries = useMemo(() => Object.entries(sampleResults), [sampleResults]);

  return (
    <main className="auth-page" aria-label="Input validation page">
      <section className="auth-card" role="region" aria-label="Input validation results">
        <h1 className="auth-title">Input validation</h1>
        <p className="auth-subtitle">Review the validation output for your submitted input.</p>

        {/* Collapsible card */}
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
              <div style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Input validation</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 2 }}>
                Click to {expanded ? "collapse" : "expand"} results
              </div>
            </div>

            {/* Down arrow (rotates when expanded) */}
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 10,
                }}
              >
                {entries.map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(0,0,0,0.12)",
                    }}
                  >
                    <div style={{ color: "rgba(255,255,255,0.70)", fontSize: 12, fontWeight: 650 }}>
                      {key}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.92)",
                        fontSize: 12,
                        fontWeight: 750,
                        textAlign: "right",
                        wordBreak: "break-word",
                      }}
                    >
                      {String(value)}
                    </div>
                  </div>
                ))}
              </div>

              <p className="auth-subtitle" style={{ marginTop: 12 }}>
                This is a static UI preview. Future integration will populate these values from the validation agent output.
              </p>
            </div>
          ) : null}
        </div>

        <div className="auth-footer" style={{ marginTop: 16 }}>
          <a className="auth-link" href="#/upload">
            Back to Upload
          </a>
        </div>
      </section>
    </main>
  );
}
