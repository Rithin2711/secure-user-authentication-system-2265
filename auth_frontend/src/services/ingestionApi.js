/**
 * Ingestion API client.
 *
 * IMPORTANT (behavior split):
 * - "Workflow ingestion output page" (IngestionOutputPage) uses fetchDateTimeMissingErrorMessage()
 *   to call GET /error/date-time-missing and render the returned plain-text error message.
 *
 * This module must never return an undefined "response" object. It should either:
 * - return parsed JSON/text, or
 * - throw an Error with a friendly message.
 */
import { apiFetchJson, getBackendBaseUrl } from "./apiClient";

const ENDPOINT = getBackendBaseUrl();

/**
 * Read plain-text responses from backend.
 *
 * This is intentionally separate from apiFetchJson because the new ingestion
 * error endpoint returns plain text and should not be parsed as JSON.
 */
async function apiFetchText(path, { method = "GET", headers, body, baseUrl, allowRelative = false } = {}) {
  const normalizedBase = baseUrl ? String(baseUrl).trim().replace(/\/?$/, "/") : "";
  const normalizedPath = String(path || "").replace(/^\/+/, "");

  if (!normalizedBase && !allowRelative) {
    return {
      ok: false,
      status: 0,
      data: "",
      error:
        "Backend URL is not configured. Set REACT_APP_BACKEND_URL (or REACT_APP_API_BASE) to your backend base URL (e.g. https://your-backend.example.com/).",
      url: normalizedPath,
    };
  }

  const url = normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath;

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
    return { ok: false, status: 0, data: "", error: `Unable to reach server (${url}). Please try again.`, url };
  }

  let text = "";
  try {
    text = await resp.text();
  } catch {
    text = "";
  }

  if (!resp.ok) {
    // Prefer the body if present; otherwise a generic status message.
    const message = (text || "").trim() || `Request failed (${resp.status})`;
    return { ok: false, status: resp.status, data: text, error: `${message} (${url})`, url };
  }

  return { ok: true, status: resp.status, data: text, error: null, url };
}

// PUBLIC_INTERFACE
export async function fetchMockRequiredIngestionFields() {
  /**
   * Fetch required ingestion fields from the backend mock endpoint.
   *
   * Endpoint:
   * - GET {REACT_APP_BACKEND_URL || REACT_APP_API_BASE}/mock
   *
   * @returns {Promise<any>} Parsed JSON response from /mock (unmodified)
   */
  const res = await apiFetchJson("mock", { method: "GET", baseUrl: ENDPOINT, allowRelative: false });

  if (!res.ok) {
    throw new Error(res.error?.message || "Unable to load /mock payload.");
  }

  return res.data;
}

// PUBLIC_INTERFACE
export async function fetchDateTimeMissingErrorMessage() {
  /**
   * Fetch the plain-text ingestion error message from the backend.
   *
   * Endpoint:
   * - GET {REACT_APP_BACKEND_URL || REACT_APP_API_BASE}/error/date-time-missing
   *
   * Expected response:
   * - text/plain, e.g. "Error: Date and time is missing"
   *
   * @returns {Promise<string>} Plain-text error message returned by the endpoint.
   */
  const res = await apiFetchText("error/date-time-missing", { method: "GET", baseUrl: ENDPOINT, allowRelative: false });

  if (!res.ok) {
    throw new Error(res.error || "Unable to load error message.");
  }

  return String(res.data || "").trim();
}

// PUBLIC_INTERFACE
export async function fetchIngestionResult({ payload } = {}) {
  /**
   * Fetch ingestion result JSON from backend.
   *
   * @param {object} params
   * @param {any} params.payload - Optional JSON payload for POST fallback.
   * @returns {Promise<any>} Parsed JSON response from backend.
   */
  // Keep existing behavior, but do it with the consistent client shape.
  // Note: This app's ingestion "real" endpoint is not defined; /mock is the stable UI dependency.
  const baseUrl = ENDPOINT;

  // GET base (root)
  let res = await apiFetchJson("", { method: "GET", baseUrl, allowRelative: false });
  if (res.ok) return res.data;

  // If backend doesn't allow GET or expects payload, try POST fallback.
  if (![404, 405].includes(res.status)) {
    throw new Error(res.error?.message || "Ingestion request failed.");
  }

  // POST base (root)
  res = await apiFetchJson("", { method: "POST", baseUrl, allowRelative: false, body: payload ?? {} });
  if (!res.ok) throw new Error(res.error?.message || "Ingestion request failed.");
  return res.data;
}
