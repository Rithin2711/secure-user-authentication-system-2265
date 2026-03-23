/**
 * sessionStorage-backed state store for the Upload page.
 *
 * Why sessionStorage?
 * - Persists across hash-route navigation (Upload -> Ingestion -> Back).
 * - Clears automatically when the tab is closed (appropriate for transient upload data).
 *
 * Notes:
 * - We do not attempt to persist the actual File object (not serializable). Instead we store
 *   basic file metadata (name/size/type/lastModified) to show that a file was selected.
 * - Email contents, selected upload type, extracted JSON, and orchestrator UI state are persisted.
 */

const STORAGE_KEY = "upload_page_state_v1";

/**
 * Safe JSON parse helper.
 */
function safeJsonParse(raw) {
  try {
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Create a minimal, serializable representation of a File.
 */
function serializeFileMeta(file) {
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
 */
export function loadUploadPageState() {
  /**
   * Loads the persisted Upload page state from sessionStorage (if present).
   * Returns null if not found or invalid.
   */
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return safeJsonParse(raw);
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 */
export function saveUploadPageState(state) {
  /**
   * Persists the Upload page state to sessionStorage.
   * Silently ignores storage errors (e.g., storage quota, disabled storage).
   */
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * PUBLIC_INTERFACE
 */
export function clearUploadPageState() {
  /**
   * Clears persisted Upload page state from sessionStorage.
   */
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * PUBLIC_INTERFACE
 */
export function buildPersistedUploadState({ docType, file, emailContents, hasSubmitted, extractedJsonRaw }) {
  /**
   * Builds the canonical persisted-state object for the Upload page.
   *
   * extractedJsonRaw:
   * - Should be a string (already JSON.stringify-ed) or null/undefined.
   * - Kept as string to avoid parse/stringify churn and to preserve exact data.
   */
  return {
    docType: docType || "excel",
    emailContents: emailContents || "",
    hasSubmitted: Boolean(hasSubmitted),
    fileMeta: serializeFileMeta(file),
    extractedJsonRaw: typeof extractedJsonRaw === "string" ? extractedJsonRaw : null,
    updatedAt: Date.now(),
  };
}
