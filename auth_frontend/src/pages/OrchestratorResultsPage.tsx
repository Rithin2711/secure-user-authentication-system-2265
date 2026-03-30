import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchBackendErrorMessage } from '../api/ingestionApi';
import type { Agent } from '../types';

type AgentKey = 'ingestion' | 'validation' | 'inventory' | 'pricing';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function tryParseJson(text: string): unknown {
  const t = text.trim();
  if (!t) return undefined;
  try { return JSON.parse(t); } catch { return undefined; }
}

function extractErrorFromJson(value: unknown): string {
  if (!isPlainObject(value)) return '';
  const candidates: unknown[] = [];
  if (Object.prototype.hasOwnProperty.call(value, 'error')) candidates.push(value['error']);
  if (isPlainObject(value['payload']) && Object.prototype.hasOwnProperty.call(value['payload'], 'error')) {
    candidates.push((value['payload'] as Record<string, unknown>)['error']);
  }
  for (const e of candidates) {
    if (typeof e === 'string' && e.trim()) return e.trim();
    if (e === null || e === undefined) return 'An error occurred.';
    try { return JSON.stringify(e); } catch { return String(e); }
  }
  return '';
}

// PUBLIC_INTERFACE
/**
 * OrchestratorResultsPage - Work Flow results page with agent selectors and output area.
 * Renders Ingestion tab output (from /error-message) and placeholder tabs for other agents.
 */
export default function OrchestratorResultsPage(): React.ReactElement {
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>('ingestion');
  const [backendErrorStatus, setBackendErrorStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [backendErrorText, setBackendErrorText] = useState('');
  const [ingestionHasErrorKey, setIngestionHasErrorKey] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuWrapRef = useRef<HTMLDivElement>(null);

  const displayName = useMemo(() => {
    try {
      const email = localStorage.getItem('auth_email');
      if (email && String(email).trim()) return String(email).trim();
    } catch { /* ignore */ }
    return 'User';
  }, []);

  const canSubmit = useMemo(
    () => submitState !== 'submitting' && Boolean(String(userInput).trim()),
    [submitState, userInput],
  );

  const loadBackendErrorMessage = async () => {
    setBackendErrorStatus('loading');
    try {
      const text = await fetchBackendErrorMessage();
      const parsed = tryParseJson(text);
      const extractedError = parsed !== undefined ? extractErrorFromJson(parsed) : '';
      const hasErrorKey = Boolean(extractedError);
      setIngestionHasErrorKey(hasErrorKey);
      setBackendErrorText(hasErrorKey ? extractedError : text);
      setBackendErrorStatus('success');
    } catch (e) {
      setBackendErrorText(e instanceof Error ? e.message : 'Failed to load /error-message response.');
      setIngestionHasErrorKey(false);
      setBackendErrorStatus('error');
    }
  };

  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!canSubmit) return;
    setSubmitState('submitting');
    try {
      const trimmed = String(userInput || '').trim();
      setBackendErrorText((prev) => (prev ? `${prev}\n\nSubmitted input: ${trimmed}` : `Submitted input: ${trimmed}`));
      setUserInput('');
    } finally {
      setSubmitState('idle');
    }
  };

  useEffect(() => {
    if (selectedAgent !== 'ingestion') return;
    if (backendErrorStatus !== 'idle') return;
    loadBackendErrorMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent]);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onDocMouseDown = (ev: MouseEvent) => {
      const wrap = userMenuWrapRef.current;
      if (!wrap) return;
      if (!wrap.contains(ev.target as Node)) setIsUserMenuOpen(false);
    };
    const onDocKeyDown = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setIsUserMenuOpen(false); };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onDocKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onDocKeyDown);
    };
  }, [isUserMenuOpen]);

  const agents: Agent[] = useMemo(() => [
    { key: 'ingestion', title: 'Ingestion', subtitle: 'Display backend /error-message output', status: 'success' },
    { key: 'validation', title: 'Validation', subtitle: 'Validate extracted payload (placeholder)', status: 'idle' },
    { key: 'inventory', title: 'Inventory', subtitle: 'Check inventory availability (placeholder)', status: 'idle' },
    { key: 'pricing', title: 'Pricing', subtitle: 'Compute pricing & totals (placeholder)', status: 'idle' },
  ], []);

  const outputHeader = useMemo(() => {
    const a = agents.find((x) => x.key === selectedAgent);
    return a ? a.title : 'Output';
  }, [agents, selectedAgent]);

  const onLogout = () => {
    try { localStorage.removeItem('auth_access_token'); localStorage.removeItem('auth_email'); localStorage.removeItem('auth_user_id'); } catch { /* ignore */ }
    try { sessionStorage.removeItem('intake_agent_extracted_json'); } catch { /* ignore */ }
    setIsUserMenuOpen(false);
    window.location.hash = '#/login';
  };

  const onOpenSettings = () => { setIsUserMenuOpen(false); alert('Settings (coming soon)'); };

  const getAgentCardStyles = (status: string, isSelected: boolean) => {
    let border = '1px solid rgba(255,255,255,0.14)';
    let bg = 'rgba(255,255,255,0.06)';
    let dot = 'rgba(255,255,255,0.65)';
    let glow = 'transparent';
    if (status === 'success') { border = '1px solid rgba(34,197,94,0.28)'; bg = 'linear-gradient(180deg, rgba(34,197,94,0.14), rgba(255,255,255,0.04))'; dot = 'rgba(34,197,94,0.95)'; glow = 'rgba(34,197,94,0.14)'; }
    if (isSelected) { border = '1px solid rgba(255,255,255,0.22)'; bg = 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))'; dot = 'rgba(255,255,255,0.92)'; glow = 'rgba(59,130,246,0.22)'; }
    return { border, bg, dot, glow };
  };

  const topBarStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.10)',
    background: 'linear-gradient(90deg, rgba(75,62,120,0.52), rgba(59,57,112,0.38), rgba(10,26,47,0.26))',
    boxShadow: '0 14px 40px rgba(0,0,0,0.30)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
  };

  const renderIngestionTabOutput = () => (
    <div role="region" aria-label="Ingestion layer output" style={{ marginTop: 14, borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)', padding: 14 }}>
      <div style={{ fontWeight: 950, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.92)' }}>Ingestion layer</div>
      <pre style={{ marginTop: 10, marginBottom: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.86)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
        {backendErrorText && backendErrorText.trim() ? backendErrorText : backendErrorStatus === 'loading' ? '' : ''}
      </pre>
      {ingestionHasErrorKey ? (
        <form onSubmit={onSubmit} style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ flex: '1 1 320px', minWidth: 260 }}>
            <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Type your response…" aria-label="Ingestion user input"
              style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.92)', padding: '10px 12px', fontSize: 13, fontWeight: 800, outline: 'none', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)', fontFamily: 'inherit' }} />
          </label>
          <button type="submit" disabled={!canSubmit} aria-disabled={!canSubmit}
            style={{ alignSelf: 'end', borderRadius: 12, border: '1px solid rgba(255,255,255,0.16)', background: canSubmit ? 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(6,182,212,0.80))' : 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.92)', padding: '10px 14px', cursor: canSubmit ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 950, letterSpacing: '-0.01em', boxShadow: canSubmit ? '0 14px 40px rgba(59,130,246,0.20)' : 'none', minWidth: 110, fontFamily: 'inherit' }}>
            {submitState === 'submitting' ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      ) : null}
    </div>
  );

  const renderOutput = () => {
    if (selectedAgent === 'ingestion') return renderIngestionTabOutput();
    const placeholderTitle = selectedAgent === 'validation' ? 'Validation output' : selectedAgent === 'inventory' ? 'Inventory output' : 'Pricing output';
    return (
      <div role="region" aria-label={placeholderTitle} style={{ marginTop: 14, borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)', padding: 14 }}>
        <div style={{ fontWeight: 950, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.92)' }}>{placeholderTitle}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.70)', lineHeight: 1.5 }}>
          This agent is not wired yet. Select <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 850 }}>Ingestion</span> to view the implemented output.
        </div>
      </div>
    );
  };

  return (
    <main className="auth-page auth-page--wide" aria-label="Orchestrator results page">
      <div style={topBarStyle} role="banner" aria-label="Dashboard header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div aria-hidden="true" style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 12, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(0,0,0,0.10)', flex: '0 0 auto', fontSize: 15 }}>⬆︎</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 950, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '50vw' }}>Agentic Ecosystem</div>
            <div style={{ marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,0.66)' }}>Work Flow results</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={() => { window.location.hash = '#/upload'; }} aria-label="Back to upload"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(0,0,0,0.12)', color: 'rgba(255,255,255,0.92)', padding: '9px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 900, letterSpacing: '-0.01em', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>
            <span aria-hidden="true">←</span> Upload
          </button>

          <div ref={userMenuWrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
            <button type="button" onClick={() => setIsUserMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={isUserMenuOpen} aria-label="Open user menu"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, borderRadius: 999, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(0,0,0,0.12)', color: 'rgba(255,255,255,0.92)', padding: '9px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 900, letterSpacing: '-0.01em', maxWidth: 280, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
              <span aria-hidden="true" style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 999, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', flex: '0 0 auto', fontSize: 14 }}>👤</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>{displayName}</span>
              <span aria-hidden="true" style={{ opacity: 0.9 }}>▾</span>
            </button>
            {isUserMenuOpen ? (
              <div role="menu" aria-label="User menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', minWidth: 220, borderRadius: 14, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(16,24,39,0.78)', boxShadow: '0 18px 60px rgba(0,0,0,0.45)', padding: 8, zIndex: 60, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                <div style={{ padding: '8px 10px', fontSize: 12, color: 'rgba(255,255,255,0.72)', borderBottom: '1px solid rgba(255,255,255,0.10)', marginBottom: 6 }}>
                  Signed in as <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 950 }}>{displayName}</span>
                </div>
                <button type="button" role="menuitem" onClick={onOpenSettings} style={{ width: '100%', textAlign: 'left', borderRadius: 12, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.92)', padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 850, marginBottom: 8 }}>Settings</button>
                <button type="button" role="menuitem" onClick={onLogout} style={{ width: '100%', textAlign: 'left', borderRadius: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.12)', color: 'rgba(255,255,255,0.92)', padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 950 }}>Logout</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="auth-card auth-card--flat" role="region" aria-label="Orchestrator content">
        <div className="auth-wide-content" style={{ paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 className="auth-title" style={{ margin: 0 }}>Work Flow</h1>
              <p className="auth-subtitle" style={{ marginTop: 8 }}>Select an agent to view its output.</p>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)', padding: '8px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
              Selected: <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 950 }}>{outputHeader}</span>
            </div>
          </div>

          {/* Agent selectors */}
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))', gap: 12, alignItems: 'stretch' }}>
            {agents.map((a) => {
              const isSelected = a.key === selectedAgent;
              const s = getAgentCardStyles(a.status, isSelected);
              return (
                <button key={a.key} type="button"
                  onClick={() => { if (a.key === 'ingestion') loadBackendErrorMessage(); setSelectedAgent(a.key as AgentKey); }}
                  aria-pressed={isSelected} aria-label={`Select ${a.title} agent`}
                  style={{ textAlign: 'left', cursor: 'pointer', width: '100%', minWidth: 220, borderRadius: 16, border: s.border, background: s.bg, boxShadow: isSelected ? `0 18px 48px ${s.glow}` : '0 10px 28px rgba(0,0,0,0.20)', padding: '14px', color: 'rgba(255,255,255,0.92)', transform: isSelected ? 'translateY(-1px)' : 'translateY(0px)', transition: 'transform 120ms ease, box-shadow 160ms ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: s.dot, boxShadow: `0 0 0 4px rgba(255,255,255,0.06), 0 0 24px ${s.dot}`, flex: '0 0 auto' }} />
                      <div style={{ fontWeight: 950, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    </div>
                    <span aria-hidden="true" style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 999, border: isSelected ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.14)', background: isSelected ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)', color: 'rgba(255,255,255,0.78)', flex: '0 0 auto' }}>
                      {isSelected ? '✓' : '→'}
                    </span>
                  </div>
                  {a.subtitle ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)', marginTop: 8, lineHeight: 1.35 }}>{a.subtitle}</div> : null}
                </button>
              );
            })}
          </div>

          {/* Output */}
          <div style={{ marginTop: 16 }}>{renderOutput()}</div>
        </div>
      </section>
    </main>
  );
}
