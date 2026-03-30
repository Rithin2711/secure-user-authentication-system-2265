import React, { useEffect, useMemo, useState } from 'react';
import JsonTable from '../components/JsonTable';
import {
  fetchIngestionWorkspaceResponse,
  submitIngestionWorkspaceInput,
} from '../api/ingestionApi';
import type { IngestionResult } from '../types';

type RenderMode = 'json' | 'text' | 'empty';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function extractErrorFromJson(value: unknown): string {
  if (!isPlainObject(value)) return '';
  if (!Object.prototype.hasOwnProperty.call(value, 'error')) return '';

  const e = value['error'];
  if (typeof e === 'string') return e.trim();
  if (e === null || e === undefined) return 'An error occurred.';
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

// PUBLIC_INTERFACE
/**
 * IngestionOutputPage - Workflow → Ingestion layer page.
 *
 * Behavior:
 * - If backend returns JSON without "error" key → render as tables.
 * - If backend returns JSON with "error" key → show error text + textbox + submit.
 * - If backend returns plain text → show text + textbox + submit.
 */
export default function IngestionOutputPage(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<RenderMode>('empty');
  const [jsonPayload, setJsonPayload] = useState<unknown>(null);
  const [errorText, setErrorText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle');

  const canSubmit = useMemo(
    () => submitState !== 'submitting' && Boolean(String(userInput).trim()),
    [submitState, userInput],
  );

  const applyResult = (res: IngestionResult) => {
    if (res.kind === 'json') {
      const extractedError = extractErrorFromJson(res.data);
      if (extractedError) {
        setMode('text');
        setErrorText(extractedError);
        setJsonPayload(null);
      } else {
        setMode('json');
        setJsonPayload(res.data);
        setErrorText('');
      }
    } else {
      const t = String(res.text ?? '').trim();
      setMode(t ? 'text' : 'empty');
      setErrorText(t);
      setJsonPayload(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const res = await fetchIngestionWorkspaceResponse();
        if (!cancelled) applyResult(res);
      } catch (e) {
        if (!cancelled) {
          setMode('text');
          setJsonPayload(null);
          setErrorText(e instanceof Error ? e.message : 'Failed to load ingestion response.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!canSubmit) return;

    setSubmitState('submitting');
    try {
      const res = await submitIngestionWorkspaceInput(userInput);
      applyResult(res);
    } catch (e) {
      setMode('text');
      setJsonPayload(null);
      setErrorText(e instanceof Error ? e.message : 'Unable to submit input.');
    } finally {
      setSubmitState('idle');
    }
  };

  return (
    <main className="auth-page auth-page--wide" aria-label="Workflow ingestion output page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Ingestion payload">
        <div className="auth-wide-content ingestion-output">
          <header className="ingestion-output__header">
            <h1 className="auth-title ingestion-output__title">Ingestion layer</h1>
          </header>

          {/* Loading indicator */}
          {loading && (
            <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>
              Loading…
            </div>
          )}

          {/* JSON response (without error key) → render tables */}
          {!loading && mode === 'json' ? (
            <div className="ingestion-output__tableWrap" aria-label="Ingestion payload table">
              <JsonTable value={jsonPayload} minWidth={840} />
            </div>
          ) : null}

          {/* Error/prompt message → show message + textbox + submit */}
          {!loading && mode === 'text' ? (
            <div
              role="region"
              aria-label="Ingestion layer output"
              style={{
                marginTop: 14,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(0,0,0,0.12)',
                padding: 14,
              }}
            >
              <pre
                style={{
                  marginTop: 0,
                  marginBottom: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'rgba(255,255,255,0.86)',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                }}
              >
                {errorText}
              </pre>

              <form onSubmit={onSubmit} style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <label style={{ flex: '1 1 320px', minWidth: 260 }}>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your response…"
                    aria-label="Ingestion user input"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.16)',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.92)',
                      padding: '10px 12px',
                      fontSize: 13,
                      fontWeight: 800,
                      outline: 'none',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  aria-disabled={!canSubmit}
                  style={{
                    alignSelf: 'end',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.16)',
                    background: canSubmit
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(6,182,212,0.80))'
                      : 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.92)',
                    padding: '10px 14px',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    fontSize: 13,
                    fontWeight: 950,
                    letterSpacing: '-0.01em',
                    boxShadow: canSubmit ? '0 14px 40px rgba(59,130,246,0.20)' : 'none',
                    minWidth: 110,
                    fontFamily: 'inherit',
                  }}
                >
                  {submitState === 'submitting' ? 'Submitting…' : 'Submit'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
