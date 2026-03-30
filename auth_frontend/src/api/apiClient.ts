/**
 * Minimal fetch helper used by frontend API modules.
 *
 * Guarantees:
 * - NEVER returns `undefined`
 * - Always returns a consistent shape: ApiResult<T>
 */
import type { ApiResult } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────

function joinUrl(base: string, path: string): string {
  return `${base}${path.replace(/^\/+/, '')}`;
}

function normalizeEndpoint(url: string): string {
  const u = String(url || '').trim();
  return u.endsWith('/') ? u : `${u}/`;
}

async function tryReadJson(resp: Response): Promise<unknown> {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

async function tryReadText(resp: Response): Promise<string> {
  try {
    return await resp.text();
  } catch {
    return '';
  }
}

function toErrorMessage(params: { json: unknown; text: string; status: number }): string {
  const { json, text, status } = params;
  if (json && typeof json === 'object') {
    const j = json as Record<string, unknown>;
    if (typeof j['detail'] === 'string' && j['detail'].trim()) return j['detail'].trim();
    if (typeof j['message'] === 'string' && j['message'].trim()) return j['message'].trim();
    if (typeof j['error'] === 'string' && j['error'].trim()) return j['error'].trim();
  }
  if (text && text.trim() && text.trim().length < 240) return text.trim();
  return `Request failed (${status})`;
}

// ─── Public helpers ───────────────────────────────────────────────────────

/**
 * PUBLIC_INTERFACE
 * Returns the configured backend base URL with trailing slash.
 * Reads VITE_BACKEND_URL or VITE_API_BASE env vars.
 */
export function getBackendBaseUrl(): string {
  const base =
    (import.meta.env['VITE_BACKEND_URL'] as string | undefined) ||
    (import.meta.env['VITE_API_BASE'] as string | undefined);
  return base ? normalizeEndpoint(base) : '';
}

/**
 * PUBLIC_INTERFACE
 * Fetch plain text from an API endpoint with a consistent ApiResult return shape.
 */
export async function apiFetchText(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    baseUrl?: string;
    allowRelative?: boolean;
  } = {},
): Promise<ApiResult<string>> {
  const { method = 'GET', headers, body, baseUrl, allowRelative = false } = options;

  const normalizedBase = baseUrl ? normalizeEndpoint(baseUrl) : '';
  const normalizedPath = String(path || '');

  if (!normalizedBase && !allowRelative) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: {
        message:
          'Backend URL is not configured. Set VITE_BACKEND_URL (or VITE_API_BASE) to your backend base URL.',
      },
      url: normalizedPath,
    };
  }

  const url = normalizedBase ? joinUrl(normalizedBase, normalizedPath) : normalizedPath;

  const finalHeaders: Record<string, string> = { ...(headers || {}) };
  let finalBody: string | undefined;

  if (body !== undefined && body !== null && typeof body !== 'string') {
    finalBody = JSON.stringify(body);
    if (!finalHeaders['Content-Type']) finalHeaders['Content-Type'] = 'application/json';
  } else if (typeof body === 'string') {
    finalBody = body;
  }

  try {
    const resp = await fetch(url, { method, headers: finalHeaders, body: finalBody });
    const text = await tryReadText(resp);

    if (resp.ok) {
      return { ok: true, status: resp.status, data: text ?? '', error: null, url };
    }

    const json = await tryReadJson(new Response(text, { headers: resp.headers }));
    const message = `${toErrorMessage({ json, text, status: resp.status })} (${url})`;

    return {
      ok: false,
      status: resp.status,
      data: text ?? '',
      error: { message, details: json || text || null },
      url,
    };
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e || '');
    return {
      ok: false,
      status: 0,
      data: null,
      error: { message: `Unable to reach server (${url}). Please try again.`, details },
      url,
    };
  }
}

/**
 * PUBLIC_INTERFACE
 * Fetch JSON from an API endpoint with a consistent ApiResult return shape.
 */
export async function apiFetchJson<T = unknown>(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    baseUrl?: string;
    allowRelative?: boolean;
  } = {},
): Promise<ApiResult<T>> {
  const { method = 'GET', headers, body, baseUrl, allowRelative = false } = options;

  const normalizedBase = baseUrl ? normalizeEndpoint(baseUrl) : '';
  const normalizedPath = String(path || '');

  if (!normalizedBase && !allowRelative) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: {
        message:
          'Backend URL is not configured. Set VITE_BACKEND_URL (or VITE_API_BASE) to your backend base URL.',
      },
      url: normalizedPath,
    };
  }

  const url = normalizedBase ? joinUrl(normalizedBase, normalizedPath) : normalizedPath;

  const finalHeaders: Record<string, string> = { ...(headers || {}) };
  let finalBody: string | undefined;

  if (body !== undefined && body !== null && typeof body !== 'string') {
    finalBody = JSON.stringify(body);
    if (!finalHeaders['Content-Type']) finalHeaders['Content-Type'] = 'application/json';
  } else if (typeof body === 'string') {
    finalBody = body;
  }

  try {
    const resp = await fetch(url, { method, headers: finalHeaders, body: finalBody });
    const json = (await tryReadJson(resp)) as T | null;

    if (resp.ok) {
      if (json === null) {
        const text = await tryReadText(resp.clone());
        return {
          ok: false,
          status: resp.status,
          data: null,
          error: { message: `Unexpected server response (not JSON) from ${url}.`, details: text || null },
          url,
        };
      }
      return { ok: true, status: resp.status, data: json, error: null, url };
    }

    const text = json === null ? await tryReadText(resp.clone()) : '';
    return {
      ok: false,
      status: resp.status,
      data: json,
      error: {
        message: `${toErrorMessage({ json, text, status: resp.status })} (${url})`,
        details: json || text || null,
      },
      url,
    };
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e || '');
    return {
      ok: false,
      status: 0,
      data: null,
      error: { message: `Unable to reach server (${url}). Please try again.`, details },
      url,
    };
  }
}
