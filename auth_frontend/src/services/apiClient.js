/**
 * Minimal fetch helper used by frontend services.
 *
 * Key guarantee:
 * - NEVER returns `undefined`
 * - Always returns a consistent shape:
 *   { ok: boolean, status: number, data: any|null, error: { message: string, details?: any } | null }
 *
 * This prevents UI bugs like: "Cannot read properties of undefined (reading 'ok')".
 */

function joinUrl(baseWithTrailingSlash, pathNoLeadingSlash) {
  return `${String(baseWithTrailingSlash || "")}${String(pathNoLeadingSlash || "").replace(/^\/+/, "")}`;
}

function normalizeEndpoint(url) {
  const u = String(url || "").trim();
  // Keep exactly one trailing slash for consistency.
  return u.endsWith("/") ? u : `${u}/`;
}

async function tryReadJson(resp) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

async function tryReadText(resp) {
  try {
    return await resp.text();
  } catch {
    return "";
  }
}

function toErrorMessage({ json, text, status }) {
  if (json && typeof json === "object") {
    if (typeof json.detail === "string" && json.detail.trim()) return json.detail.trim();
    if (typeof json.message === "string" && json.message.trim()) return json.message.trim();
    if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
  }
  if (text && text.trim() && text.trim().length < 240) return text.trim();
  return `Request failed (${status})`;
}

// PUBLIC_INTERFACE
export function getBackendBaseUrl() {
  /**
   * Returns the configured backend base URL with a trailing slash.
   *
   * Env resolution:
   * - Prefer REACT_APP_BACKEND_URL (or REACT_APP_API_BASE) when set.
   * - If unset, returns empty string; caller can decide whether to allow relative URLs.
   */
  const base = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_BASE;
  return base ? normalizeEndpoint(base) : "";
}

// PUBLIC_INTERFACE
export async function apiFetchJson(path, { method = "GET", headers, body, baseUrl, allowRelative = false } = {}) {
  /**
   * Fetch JSON from an API endpoint with a consistent return shape.
   *
   * @param {string} path - API path like "mock" or "/api/login"
   * @param {object=} options
   * @param {string=} options.method
   * @param {object=} options.headers
   * @param {any=} options.body - If provided and not a string, will be JSON.stringified and Content-Type set.
   * @param {string=} options.baseUrl - Base URL with or without trailing slash (optional)
   * @param {boolean=} options.allowRelative - If true, allows relative fetch when baseUrl is empty.
   *
   * @returns {Promise<{ok: boolean, status: number, data: any|null, error: {message: string, details?: any}|null, url: string}>}
   */
  const normalizedBase = baseUrl ? normalizeEndpoint(baseUrl) : "";
  const normalizedPath = String(path || "");

  if (!normalizedBase && !allowRelative) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: {
        message:
          "Backend URL is not configured. Set REACT_APP_BACKEND_URL (or REACT_APP_API_BASE) to your backend base URL (e.g. https://your-backend.example.com/).",
      },
      url: normalizedPath,
    };
  }

  const url = normalizedBase ? joinUrl(normalizedBase, normalizedPath) : normalizedPath;

  const finalHeaders = { ...(headers || {}) };
  let finalBody = body;

  if (body !== undefined && body !== null && typeof body !== "string") {
    finalBody = JSON.stringify(body);
    if (!finalHeaders["Content-Type"]) finalHeaders["Content-Type"] = "application/json";
  }

  let resp;
  try {
    resp = await fetch(url, { method, headers: finalHeaders, body: finalBody });
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      error: { message: `Unable to reach server (${url}). Please try again.` },
      url,
    };
  }

  const json = await tryReadJson(resp);
  if (resp.ok) {
    // Successful but non-JSON is considered an error for these APIs.
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

  const text = json === null ? await tryReadText(resp.clone()) : "";
  return {
    ok: false,
    status: resp.status,
    data: json, // may be null if non-JSON error
    error: { message: `${toErrorMessage({ json, text, status: resp.status })} (${url})`, details: json || text || null },
    url,
  };
}
