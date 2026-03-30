import React, { useEffect, useMemo, useRef, useState } from 'react';
import { intakeAgentSample, requiredFieldPaths } from '../data/intakeAgentSample';

/**
 * Gets a nested value from an object using a dot-separated path (e.g. "a.b.c").
 */
function getValueAtPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = String(path || '').split('.').filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

/**
 * Sets a nested value on an object using a dot-separated path.
 * Mutates the given object (expects a clone at the call site).
 */
function setValueAtPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  if (!obj || typeof obj !== 'object') return;
  const parts = String(path || '').split('.').filter(Boolean);
  if (parts.length === 0) return;

  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    const next = cur[p];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cur[p] = {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

/**
 * Define emptiness for validation purposes.
 */
function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (Array.isArray(v)) {
    if (v.length === 0) return true;
    return v.every((item) => isEmptyValue(item));
  }
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

function humanizePath(path: string): string {
  return String(path || '')
    .split('.')
    .filter(Boolean)
    .map((p) => p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' → ');
}

/**
 * Recursively flatten a JSON object into key/value pairs for display.
 */
function flattenObject(obj: unknown, prefix = ''): [string, unknown][] {
  if (!obj || typeof obj !== 'object') return [];
  const out: [string, unknown][] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      out.push([nextKey, JSON.stringify(value)]);
    } else if (value && typeof value === 'object') {
      out.push(...flattenObject(value, nextKey));
    } else {
      out.push([nextKey, value]);
    }
  }
  return out;
}

function getDisplayUserName(): string {
  try {
    const email = localStorage.getItem('auth_email');
    if (email && String(email).trim()) return String(email).trim();
  } catch { /* ignore */ }
  return 'User';
}

// PUBLIC_INTERFACE
/**
 * InputValidationPage - displays extracted intake-agent JSON, validates required fields,
 * and provides a HITL loop for filling missing fields.
 */
export default function InputValidationPage(): React.ReactElement {
  const [expanded, setExpanded] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuWrapRef = useRef<HTMLDivElement>(null);
  const [showMissingInputs, setShowMissingInputs] = useState(false);
  const [missingFieldDrafts, setMissingFieldDrafts] = useState<Record<string, string>>({});
  const [missingFieldInputs, setMissingFieldInputs] = useState<Record<string, string>>({});

  const extracted = useMemo((): unknown => {
    try {
      const raw = sessionStorage.getItem('intake_agent_extracted_json');
      if (raw) return JSON.parse(raw) as unknown;
    } catch { /* ignore */ }
    return intakeAgentSample;
  }, []);

  const mergedExtracted = useMemo((): Record<string, unknown> => {
    const clone = JSON.parse(JSON.stringify(extracted)) as Record<string, unknown>;
    for (const [path, rawValue] of Object.entries(missingFieldInputs)) {
      const v = typeof rawValue === 'string' ? rawValue : String(rawValue);
      const existing = getValueAtPath(extracted, path);
      let nextValue: unknown = v;
      if (typeof existing === 'number') {
        const n = Number(v);
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

  const hasErrors = missingRequired.length > 0;

  const flattenedEntries = useMemo(() => {
    return flattenObject(mergedExtracted).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [mergedExtracted]);

  const onReupload = () => {
    sessionStorage.removeItem('intake_agent_extracted_json');
    window.location.hash = '#/upload';
  };

  const onToggleMissingInputs = () => setShowMissingInputs((v) => !v);

  const onChangeMissingFieldDraft = (path: string, value: string) => {
    setMissingFieldDrafts((prev) => ({ ...prev, [path]: value }));
  };

  const commitMissingField = (path: string) => {
    setMissingFieldInputs((prev) => {
      const next = { ...prev };
      const v = missingFieldDrafts[path];
      if (v === undefined || v === null || String(v).trim() === '') {
        delete next[path];
        return next;
      }
      next[path] = v;
      return next;
    });
  };

  // PUBLIC_INTERFACE
  const onBack = () => {
    /** Navigate back; falls back to Upload page. */
    try {
      if (window.history.length > 1) { window.history.back(); return; }
    } catch { /* ignore */ }
    window.location.hash = '#/upload';
  };

  // PUBLIC_INTERFACE
  const onSignOut = () => {
    /** Clears auth info and navigates to Login. */
    try {
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_email');
      localStorage.removeItem('auth_user_id');
    } catch { /* ignore */ }
    try { sessionStorage.removeItem('intake_agent_extracted_json'); } catch { /* ignore */ }
    setIsUserMenuOpen(false);
    window.location.hash = '#/login';
  };

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const wrap = userMenuWrapRef.current;
      if (!wrap) return;
      if (!wrap.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    const onDocKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsUserMenuOpen(false); };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onDocKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onDocKeyDown);
    };
  }, [isUserMenuOpen]);

  const displayName = useMemo(() => getDisplayUserName(), []);

  return (
    <main className="auth-page auth-page--wide" aria-label="Input validation page">
      <section className="auth-card auth-card--flat" role="region" aria-label="Input validation results">
        <div className="auth-wide-content">
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <button type="button" onClick={onBack} aria-label="Go back"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.92)', padding: '10px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em' }}>
              <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>←</span>
              Back
            </button>

            <div ref={userMenuWrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
              <button type="button" onClick={() => setIsUserMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={isUserMenuOpen} aria-label="Open user menu"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.92)', padding: '10px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', maxWidth: 260 }}>
                <span aria-hidden="true" style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.10)', flex: '0 0 auto', fontSize: 14 }}>👤</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{displayName}</span>
                <span aria-hidden="true" style={{ opacity: 0.9 }}>▾</span>
              </button>
              {isUserMenuOpen ? (
                <div role="menu" aria-label="User menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', minWidth: 220, borderRadius: 14, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(16,24,39,0.75)', boxShadow: '0 18px 60px rgba(0,0,0,0.45)', padding: 8, zIndex: 10, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                  <div style={{ padding: '8px 10px', fontSize: 12, color: 'rgba(255,255,255,0.72)', borderBottom: '1px solid rgba(255,255,255,0.10)', marginBottom: 6 }}>
                    Signed in as <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 800 }}>{displayName}</span>
                  </div>
                  <button type="button" role="menuitem" onClick={onSignOut}
                    style={{ width: '100%', textAlign: 'left', borderRadius: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.12)', color: 'rgba(255,255,255,0.92)', padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 850 }}>
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <h1 className="auth-title">Input validation</h1>
          <p className="auth-subtitle">
            Review the extracted fields. If any required fields are empty, you can provide missing values below.
          </p>

          {/* HITL error panel */}
          {hasErrors ? (
            <div role="alert" style={{ marginTop: 14, padding: '12px', borderRadius: 14, border: '1px solid rgba(239,68,68,0.40)', background: 'rgba(239,68,68,0.12)' }}>
              <div style={{ fontWeight: 850, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.92)' }}>Action required</div>
              <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.86)', fontSize: 13, lineHeight: 1.45 }}>
                The following required fields are missing or empty. You can fill them below (UI-only) or re-upload.
              </div>
              <ul style={{ margin: '10px 0 0 18px', padding: 0, color: 'rgba(255,255,255,0.92)', fontSize: 13 }}>
                {missingRequired.map(({ path }) => (
                  <li key={path} style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 800 }}>{humanizePath(path)}</span>{' '}
                    <span style={{ color: 'rgba(255,255,255,0.72)' }}>({path})</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="auth-button" onClick={onReupload}
                  style={{ width: 'auto', padding: '10px 14px', marginTop: 0, background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(239,68,68,0.65))', boxShadow: '0 10px 26px rgba(239,68,68,0.20)' }}>
                  Re-upload / try again
                </button>
                <button type="button" className="auth-button" onClick={onToggleMissingInputs} aria-expanded={showMissingInputs}
                  style={{ width: 'auto', padding: '10px 14px', marginTop: 0, background: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(6,182,212,0.80))', boxShadow: '0 10px 26px rgba(59,130,246,0.22)' }}>
                  Upload missing data
                </button>
              </div>

              {showMissingInputs ? (
                <div style={{ marginTop: 12, padding: '12px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)' }}>
                  <div style={{ fontWeight: 800, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.92)' }}>Provide missing fields</div>
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                    {missingRequired.map(({ path }) => {
                      const label = `${humanizePath(path)}:`;
                      const id = `missing-${path.replace(/[^\w-]/g, '-')}`;
                      const draftValue = missingFieldDrafts[path] ?? '';
                      return (
                        <div className="auth-field" key={path} style={{ marginTop: 0 }}>
                          <label htmlFor={id} style={{ color: 'rgba(255,255,255,0.80)' }}>{label}</label>
                          <input id={id} className="auth-input" type="text" placeholder={`Enter ${humanizePath(path)}`}
                            value={draftValue}
                            onChange={(e) => onChangeMissingFieldDraft(path, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitMissingField(path); } }}
                          />
                          <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>
                            Press <span style={{ color: 'rgba(255,255,255,0.86)', fontWeight: 750 }}>Enter</span> to apply to the JSON preview.
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Collapsible extracted JSON */}
          <div style={{ marginTop: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls="validation-results-panel"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.92)' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>Extracted fields (intake-agent JSON)</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)', marginTop: 2 }}>Click to {expanded ? 'collapse' : 'expand'}</div>
              </div>
              <span aria-hidden="true" style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 999, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 160ms ease', flex: '0 0 auto' }}>▼</span>
            </button>

            {expanded ? (
              <div id="validation-results-panel" style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  {flattenedEntries.map(([key, value]) => {
                    const isRequired = requiredFieldPaths.includes(key);
                    const isMissing = isRequired && isEmptyValue(value);
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 12, border: isMissing ? '1px solid rgba(239,68,68,0.45)' : '1px solid rgba(255,255,255,0.12)', background: isMissing ? 'rgba(239,68,68,0.10)' : 'rgba(0,0,0,0.12)' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: 'rgba(255,255,255,0.70)', fontSize: 12, fontWeight: 750 }}>
                            {key}
                            {isRequired ? <span style={{ marginLeft: 8, fontWeight: 850, color: 'rgba(255,255,255,0.78)' }}>• required</span> : null}
                          </div>
                          {isMissing ? (
                            <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,210,210,0.95)', fontWeight: 750 }}>
                              Empty — please provide a value above or re-upload.
                            </div>
                          ) : null}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 750, textAlign: 'right', wordBreak: 'break-word', maxWidth: '55%' }}>
                          {value === undefined || value === null || String(value).trim() === '' ? (
                            <span style={{ color: 'rgba(255,255,255,0.55)' }}>—</span>
                          ) : String(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="auth-subtitle" style={{ marginTop: 12 }}>
                  UI-only preview. Missing-field inputs overwrite the extracted JSON in-memory.
                </p>
              </div>
            ) : null}
          </div>

          <div className="auth-footer" style={{ marginTop: 16 }}>
            <a className="auth-link" href="#/upload">Back to Upload</a>
          </div>
        </div>
      </section>
    </main>
  );
}
