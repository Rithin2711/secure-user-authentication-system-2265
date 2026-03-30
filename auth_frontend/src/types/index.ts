/**
 * Shared TypeScript type definitions for WBD Frontend.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────

/** Response returned after successful signup/login */
export interface AuthResponse {
  access_token: string;
  token_type?: string;
  email: string;
  user_id: number;
  message: string;
}

/** Standard error response from backend */
export interface ErrorResponse {
  detail: string;
  code?: string | null;
}

/** Payload for signup */
export interface SignupPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

/** Payload for login */
export interface LoginPayload {
  email: string;
  password: string;
}

// ─── API Client ───────────────────────────────────────────────────────────

/** Normalized API fetch result */
export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error: { message: string; details?: unknown } | null;
  url: string;
}

// ─── Ingestion ────────────────────────────────────────────────────────────

/** Result of fetching ingestion workspace response */
export type IngestionResult =
  | { kind: 'json'; data: unknown }
  | { kind: 'text'; text: string };

// ─── Upload ───────────────────────────────────────────────────────────────

/** Upload document type */
export type DocType = 'excel' | 'pdf' | 'email';

/** Serializable file metadata (File object is not serializable) */
export interface FileMeta {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

/** Persisted upload page state */
export interface PersistedUploadState {
  docType: DocType;
  emailContents: string;
  hasSubmitted: boolean;
  fileMeta: FileMeta | null;
  extractedJsonRaw: string | null;
  updatedAt: number;
}

// ─── Agent ────────────────────────────────────────────────────────────────

/** Agent status for visual display */
export type AgentStatus = 'idle' | 'running' | 'success' | 'warning' | 'error';

/** Agent definition */
export interface Agent {
  key: string;
  title: string;
  subtitle: string;
  status: AgentStatus;
}
