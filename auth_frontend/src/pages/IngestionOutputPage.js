import React, { useEffect, useMemo, useState } from "react";
import JsonTable from "../components/JsonTable";
import { fetchIngestionWorkspaceResponse, submitIngestionWorkspaceInput } from "../services/ingestionApi";

/**
 * Workflow -> Ingestion layer page (backend-integrated).
 *
 * Requirement:
 * - Backend response can be either JSON or plain-text error.
 * - If JSON without an "error" key: render as tables.
 * - If JSON with an "error" key: show the error message + textbox + submit to send user input.
 * - If plain text: show the text + textbox + submit.
 * - Ensure UI shows only necessary elements (no endpoint/status/debug text).
 */

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function extractErrorFromJson(value) {
  // Backend contract for this task: JSON may contain { "error": <string> }.
  // We treat any "error" field as a prompt/error state.
  if (!isPlainObject(value)) return "";
  if (!Object.prototype.hasOwnProperty.call(value, "error")) return "";

  const e = value.error;
  if (typeof e === "string") return e.trim();
  if (e === null || e === undefined) return "An error occurred.";
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

// PUBLIC_INTERFACE
export default function IngestionOutputPage() {
  /**
   * Workflow ingestion output page that displays backend ingestion output.
   * It conditionally renders:
   * - JSON output via <JsonTable /> (only if JSON does NOT contain an "error" key)
   * - Error/prompt text (from JSON.error or text response) + user input submission box
   */
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState(
    /** @type {"json" | "text" | "empty"} */ ("empty")
  );
  const [jsonPayload, setJsonPayload] = useState(null);
  const [errorText, setErrorText] = useState("");

  const [userInput, setUserInput] = useState("");
  const [submitState, setSubmitState] = useState(
    /** @type {"idle" | "submitting"} */ ("idle")
  );

  const canSubmit = useMemo(
    () => submitState !== "submitting" && Boolean(String(userInput).trim()),
    [submitState, userInput]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const res = await fetchIngestionWorkspaceResponse();
        if (cancelled) return;

        if (res.kind === "json") {
          const extractedError = extractErrorFromJson(res.data);
          if (extractedError) {
            // JSON with "error" key => treat as prompt/error mode
            setMode("text");
            setErrorText(extractedError);
            setJsonPayload(null);
          } else {
            // JSON without "error" key => render as table
            setMode("json");
            setJsonPayload(res.data);
            setErrorText("");
          }
        } else {
          const t = String(res.text ?? "").trim();
          setMode(t ? "text" : "empty");
          setErrorText(t);
          setJsonPayload(null);
        }
      } catch (e) {
        if (cancelled) return;
        // Treat fetch failure as an error-text state, but without extra debug/status UI.
        setMode("text");
        setJsonPayload(null);
        setErrorText(e instanceof Error ? e.message : "Failed to load ingestion response.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (ev) => {
    // PUBLIC_INTERFACE
    /** Submit user input to backend and re-render based on backend response (JSON or text). */
    ev.preventDefault();
    if (!canSubmit) return;

    setSubmitState("submitting");
    try {
      const res = await submitIngestionWorkspaceInput(userInput);

      if (res.kind === "json") {
        const extractedError = extractErrorFromJson(res.data);
        if (extractedError) {
          setMode("text");
          setErrorText(extractedError);
          setJsonPayload(null);
        } else {
          setMode("json");
          setJsonPayload(res.data);
          setErrorText("");
        }
      } else {
        const t = String(res.text ?? "").trim();
        setMode(t ? "text" : "empty");
        setErrorText(t);
        setJsonPayload(null);
      }
    } catch (e) {
      setMode("text");
      setJsonPayload(null);
      setErrorText(e instanceof Error ? e.message : "Unable to submit input.");
    } finally {
      setSubmitState("idle");
    }
  };

  return (
    <main className="auth-page auth-page--wide" aria-label="Workflow ingestion output page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Ingestion payload">
        <div className="auth-wide-content ingestion-output">
          <header className="ingestion-output__header">
            <h1 className="auth-title ingestion-output__title">Ingestion layer</h1>
          </header>

          {/* JSON response (without error key) => render tables */}
          {mode === "json" ? (
            <div className="ingestion-output__tableWrap" aria-label="Ingestion payload table">
              <JsonTable value={jsonPayload} minWidth={840} />
            </div>
          ) : null}

          {/* Error/prompt message => show message + textbox + submit */}
          {mode === "text" ? (
            <div
              role="region"
              aria-label="Ingestion layer output"
              style={{
                marginTop: 14,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.12)",
                padding: 14,
              }}
            >
              <pre
                style={{
                  marginTop: 0,
                  marginBottom: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.86)",
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                }}
              >
                {errorText}
              </pre>

              <form onSubmit={onSubmit} style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label style={{ flex: "1 1 320px", minWidth: 260 }}>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your response…"
                    aria-label="Ingestion user input"
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.16)",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.92)",
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 800,
                      outline: "none",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  aria-disabled={!canSubmit}
                  style={{
                    alignSelf: "end",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.16)",
                    background: canSubmit
                      ? "linear-gradient(135deg, rgba(59,130,246,0.85), rgba(6,182,212,0.80))"
                      : "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.92)",
                    padding: "10px 14px",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    fontSize: 13,
                    fontWeight: 950,
                    letterSpacing: "-0.01em",
                    boxShadow: canSubmit ? "0 14px 40px rgba(59,130,246,0.20)" : "none",
                    minWidth: 110,
                  }}
                >
                  {submitState === "submitting" ? "Submitting…" : "Submit"}
                </button>
              </form>
            </div>
          ) : null}

          {/* Empty/Loading => show nothing (per requirement: only necessary elements) */}
          {mode === "empty" || loading ? null : null}
        </div>
      </section>
    </main>
  );
}
