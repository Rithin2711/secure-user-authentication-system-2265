/**
 * Auth API client for WBD Frontend.
 *
 * On success: returns parsed JSON (AuthResponse).
 * On failure: throws an Error with a user-friendly message.
 *
 * Routing:
 * - If VITE_API_BASE / VITE_BACKEND_URL is set to a different origin, use it.
 * - Otherwise fall back to same-origin relative calls (proxy via vite.config.ts).
 */
import type { AuthResponse, SignupPayload, LoginPayload } from '../types';

function normalizeBase(base: string | undefined): string {
  return String(base || '').trim().replace(/\/*$/, '');
}

function isLikelyFrontendOrigin(url: string): boolean {
  try {
    return Boolean(url && window?.location?.origin && new URL(url).origin === window.location.origin);
  } catch {
    return false;
  }
}

const ENV_BASE = normalizeBase(
  (import.meta.env['VITE_API_BASE'] as string | undefined) ||
  (import.meta.env['VITE_BACKEND_URL'] as string | undefined),
);

/** Use explicit backend base only if it differs from the current origin. */
const API_BASE = ENV_BASE && !isLikelyFrontendOrigin(ENV_BASE) ? ENV_BASE : '';

/** Extract a helpful error message from a failed fetch Response. */
async function readErrorMessage(resp: Response): Promise<string> {
  try {
    const data = (await resp.json()) as Record<string, unknown>;
    if (typeof data['detail'] === 'string') return data['detail'];
    if (typeof data['message'] === 'string') return data['message'];
    return `Request failed (${resp.status})`;
  } catch {
    return `Request failed (${resp.status})`;
  }
}

/** Low-level POST helper that returns JSON or throws Error. */
async function postJson<T>(url: string, payload: unknown): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to reach server. Please try again.');
  }

  if (!resp.ok) {
    throw new Error(await readErrorMessage(resp));
  }

  try {
    return (await resp.json()) as T;
  } catch {
    throw new Error('Unexpected server response.');
  }
}

/**
 * PUBLIC_INTERFACE
 * Register a new user account.
 * POST /api/signup → AuthResponse
 */
export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const url = `${API_BASE}/api/signup`;
  return postJson<AuthResponse>(url, payload);
}

/**
 * PUBLIC_INTERFACE
 * Login with email and password.
 * POST /api/login → AuthResponse
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const url = `${API_BASE}/api/login`;
  return postJson<AuthResponse>(url, payload);
}

/**
 * PUBLIC_INTERFACE
 * Persist auth response data to localStorage for later use.
 */
export function persistAuth(authResponse: Partial<AuthResponse>): void {
  if (!authResponse || typeof authResponse !== 'object') return;
  if (authResponse.access_token) localStorage.setItem('auth_access_token', authResponse.access_token);
  if (authResponse.email) localStorage.setItem('auth_email', authResponse.email);
  if (authResponse.user_id !== undefined && authResponse.user_id !== null) {
    localStorage.setItem('auth_user_id', String(authResponse.user_id));
  }
}
