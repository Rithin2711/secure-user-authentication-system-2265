import React, { useEffect, useMemo, useRef, useState } from 'react';
import { intakeAgentSample } from '../data/intakeAgentSample';
import {
  buildPersistedUploadState,
  clearUploadPageState,
  loadUploadPageState,
  saveUploadPageState,
} from '../api/uploadSessionStore';
import type { DocType, FileMeta } from '../types';

function getDisplayUserName(): string {
  try {
    const email = localStorage.getItem('auth_email');
    if (email && String(email).trim()) return String(email).trim();
  } catch { /* ignore */ }
  return 'User';
}

interface AgentBlockProps {
  title: string;
  subtitle: string;
  status?: 'idle' | 'running' | 'success' | 'warning' | 'error';
  enabled: boolean;
  onClick?: () => void;
}

/** Small, clickable agent card inside the Orchestrator row. */
function AgentBlock({ title, subtitle, status = 'idle', enabled, onClick }: AgentBlockProps): React.ReactElement {
  const s = useMemo(() => {
    const base = {
      border: '1px solid rgba(255,255,255,0.14)',
      bg: 'rgba(255,255,255,0.06)',
      dot: 'rgba(255,255,255,0.65)',
    };
    if (status === 'running') return { ...base, border: '1px solid rgba(59,130,246,0.32)', bg: 'linear-gradient(180deg, rgba(59,130,246,0.16), rgba(6,182,212,0.08))', dot: 'rgba(59,130,246,0.95)' };
    if (status === 'success') return { ...base, border: '1px solid rgba(34,197,94,0.28)', bg: 'linear-gradient(180deg, rgba(34,197,94,0.14), rgba(255,255,255,0.04))', dot: 'rgba(34,197,94,0.95)' };
    if (status === 'warning') return { ...base, border: '1px solid rgba(245,158,11,0.30)', bg: 'linear-gradient(180deg, rgba(245,158,11,0.14), rgba(255,255,255,0.04))', dot: 'rgba(245,158,11,0.95)' };
    if (status === 'error')   return { ...base, border: '1px solid rgba(239,68,68,0.34)', bg: 'linear-gradient(180deg, rgba(239,68,68,0.16), rgba(255,255,255,0.04))', dot: 'rgba(239,68,68,0.95)' };
    return base;
  }, [status]);

  return (
    <button
      type="button"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      aria-label={`${title} agent`}
      style={{
        textAlign: 'left', cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.65,
        width: '100%', minWidth: 220, borderRadius: 16, border: s.border, background: s.bg,
        boxShadow: '0 10px 28px rgba(0,0,0,0.20)', padding: '14px', color: 'rgba(255,255,255,0.92)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: s.dot, boxShadow: `0 0 0 4px rgba(255,255,255,0.06), 0 0 24px ${s.dot}`, flex: '0 0 auto' }} />
        <div style={{ fontWeight: 950, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
      </div>
      {subtitle ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)', marginTop: 8, lineHeight: 1.35 }}>{subtitle}</div> : null}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.66)' }}>Click to view output</div>
        <span aria-hidden="true" style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 999, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.12)', color: 'rgba(255,255,255,0.78)', flex: '0 0 auto' }}>→</span>
      </div>
    </button>
  );
}

// PUBLIC_INTERFACE
/**
 * UploadPage - document upload with type selection and orchestrator agent cards.
 * State is persisted in sessionStorage to survive hash-route navigation.
 */
export default function UploadPage(): React.ReactElement {
  const [docType, setDocType] = useState<DocType>('excel');
  const [file, setFile] = useState<File | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [emailContents, setEmailContents] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuWrapRef = useRef<HTMLDivElement>(null);

  const isFileType = docType === 'excel' || docType === 'pdf';

  const accept = useMemo(() => {
    if (docType === 'excel') return '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (docType === 'pdf') return 'application/pdf,.pdf';
    return undefined;
  }, [docType]);

  const helperText = useMemo(() => {
    if (docType === 'excel') return 'Upload an Excel file (.xls or .xlsx).';
    if (docType === 'pdf') return 'Upload a PDF document (.pdf).';
    return 'Paste the email contents below (including subject/body if available).';
  }, [docType]);

  // Restore persisted state on mount
  useEffect(() => {
    const persisted = loadUploadPageState();
    if (!persisted || typeof persisted !== 'object') return;
    if (persisted.docType) setDocType(persisted.docType);
    if (typeof persisted.emailContents === 'string') setEmailContents(persisted.emailContents);
    setHasSubmitted(Boolean(persisted.hasSubmitted));
    if (persisted.fileMeta && typeof persisted.fileMeta === 'object') setFileMeta(persisted.fileMeta);
    try {
      if (typeof persisted.extractedJsonRaw === 'string' && persisted.extractedJsonRaw.trim()) {
        sessionStorage.setItem('intake_agent_extracted_json', persisted.extractedJsonRaw);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist on state change
  useEffect(() => {
    let extractedJsonRaw: string | null = null;
    try { extractedJsonRaw = sessionStorage.getItem('intake_agent_extracted_json'); } catch { extractedJsonRaw = null; }
    saveUploadPageState(buildPersistedUploadState({ docType, file, emailContents, hasSubmitted, extractedJsonRaw }));
    if (file) {
      setFileMeta({ name: file.name, size: file.size, type: file.type, lastModified: file.lastModified });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType, file, emailContents, hasSubmitted]);

  const onChangeType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocType(e.target.value as DocType);
    setHasSubmitted(false);
    setFile(null);
    setFileMeta(null);
    setEmailContents('');
    try { sessionStorage.removeItem('intake_agent_extracted_json'); } catch { /* ignore */ }
  };

  const onStartOver = () => {
    try { sessionStorage.removeItem('intake_agent_extracted_json'); } catch { /* ignore */ }
    setHasSubmitted(false);
    setFile(null);
    setFileMeta(null);
    setEmailContents('');
    clearUploadPageState();
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isFileType && !file && !fileMeta) { alert('Please choose a file to upload.'); return; }
    if (!isFileType && !emailContents.trim()) { alert('Please paste the email contents.'); return; }
    try { sessionStorage.setItem('intake_agent_extracted_json', JSON.stringify(intakeAgentSample)); } catch { /* ignore */ }
    window.location.hash = '#/orchestrator';
  };

  const onLogout = () => {
    try {
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_email');
      localStorage.removeItem('auth_user_id');
    } catch { /* ignore */ }
    try { sessionStorage.removeItem('intake_agent_extracted_json'); } catch { /* ignore */ }
    clearUploadPageState();
    setIsUserMenuOpen(false);
    window.location.hash = '#/login';
  };

  const onOpenSettings = () => {
    setIsUserMenuOpen(false);
    alert('Settings (coming soon)');
  };

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

  const displayName = useMemo(() => getDisplayUserName(), []);

  const topBarStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.10)',
    background: 'linear-gradient(90deg, rgba(75,62,120,0.52), rgba(59,57,112,0.38), rgba(10,26,47,0.26))',
    boxShadow: '0 14px 40px rgba(0,0,0,0.30)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
  };

  return (
    <main className="auth-page auth-page--wide w-full" aria-label="Upload page">
      {/* Top bar */}
      <div style={topBarStyle} role="banner" aria-label="Dashboard header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div aria-hidden="true" style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 12, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(0,0,0,0.10)', flex: '0 0 auto', fontSize: 15, lineHeight: 1 }}>⬆︎</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 950, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '50vw' }}>Agentic Ecosystem</div>
            <div style={{ marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,0.66)' }}>Upload workspace</div>
          </div>
        </div>

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

      <section className="auth-card auth-card--flat" role="region" aria-label="Upload">
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
              <p className="auth-subtitle" style={{ marginTop: 8 }}>{helperText}</p>
            </div>

            {isFileType ? (
              <div className="auth-field">
                <label htmlFor="upload-file">Choose file</label>
                <input id="upload-file" className="auth-input" type="file" accept={accept}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    setFileMeta(f ? { name: f.name, size: f.size, type: f.type, lastModified: f.lastModified } : null);
                  }}
                  disabled={hasSubmitted}
                />
                {file ? (
                  <p className="auth-subtitle" style={{ marginTop: 8 }}>Selected: <span style={{ color: 'rgba(255,255,255,0.92)' }}>{file.name}</span></p>
                ) : fileMeta ? (
                  <p className="auth-subtitle" style={{ marginTop: 8 }}>
                    Previously selected: <span style={{ color: 'rgba(255,255,255,0.92)' }}>{fileMeta.name}</span>{' '}
                    <span style={{ color: 'rgba(255,255,255,0.66)' }}>(re-select file to upload again)</span>
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="auth-field">
                <label htmlFor="upload-email-contents">Email contents</label>
                <textarea id="upload-email-contents" className="auth-input" placeholder="Paste email contents here..." value={emailContents} onChange={(e) => setEmailContents(e.target.value)} rows={8} style={{ resize: 'vertical' }} disabled={hasSubmitted} />
              </div>
            )}

            <button className="auth-button" type="submit" disabled={hasSubmitted}>
              {hasSubmitted ? 'Submitted' : 'Upload'}
            </button>

            {hasSubmitted ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="auth-button" onClick={onStartOver}
                    style={{ width: 'auto', padding: '10px 14px', marginTop: 0, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 10px 26px rgba(0,0,0,0.18)' }}>
                    Upload another file
                  </button>
                </div>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))', gap: 12, alignItems: 'stretch' }}>
                  <AgentBlock title="Ingestion" subtitle="Extract + basic required-field visibility (functional)" status="success" enabled onClick={() => { window.location.hash = '#/agent/ingestion'; }} />
                  <AgentBlock title="Validation" subtitle="Rules + checks beyond ingestion (placeholder)" status="idle" enabled={false} />
                  <AgentBlock title="Inventory" subtitle="Resolve inventory availability + recommendations (placeholder)" status="idle" enabled={false} />
                  <AgentBlock title="Pricing" subtitle="Compute pricing from extracted + validated input (placeholder)" status="idle" enabled={false} />
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
