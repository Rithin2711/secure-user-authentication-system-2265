/**
 * sessionStorage-backed state store for the Upload page.
 *
 * Persists across hash-route navigation (Upload → Ingestion → Back).
 * Clears automatically when the tab is closed.
 * File objects are not serializable; only metadata is stored.
 */
import type { DocType, FileMeta, PersistedUploadState } from '../types';

const STORAGE_KEY = 'upload_page_state_v1';

function safeJsonParse(raw: string | null): PersistedUploadState | null {
  try {
    if (!raw) return null;
    return JSON.parse(raw) as PersistedUploadState;
  } catch {
    return null;
  }
}

function serializeFileMeta(file: File | null): FileMeta | null {
  if (!file) return null;
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
}

/**
 * PUBLIC_INTERFACE
 * Load persisted Upload page state from sessionStorage.
 * Returns null if not found or invalid.
 */
export function loadUploadPageState(): PersistedUploadState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return safeJsonParse(raw);
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * Persist Upload page state to sessionStorage.
 */
export function saveUploadPageState(state: PersistedUploadState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (quota / disabled storage)
  }
}

/**
 * PUBLIC_INTERFACE
 * Clear persisted Upload page state from sessionStorage.
 */
export function clearUploadPageState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * PUBLIC_INTERFACE
 * Build the canonical persisted-state object for the Upload page.
 */
export function buildPersistedUploadState(params: {
  docType: DocType;
  file: File | null;
  emailContents: string;
  hasSubmitted: boolean;
  extractedJsonRaw: string | null;
}): PersistedUploadState {
  const { docType, file, emailContents, hasSubmitted, extractedJsonRaw } = params;
  return {
    docType: docType || 'excel',
    emailContents: emailContents || '',
    hasSubmitted: Boolean(hasSubmitted),
    fileMeta: serializeFileMeta(file),
    extractedJsonRaw: typeof extractedJsonRaw === 'string' ? extractedJsonRaw : null,
    updatedAt: Date.now(),
  };
}
