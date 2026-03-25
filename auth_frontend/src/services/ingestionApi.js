/**
 * Ingestion API client.
 *
 * This module must never return an undefined "response" object. It should either:
 * - return parsed JSON/text, or
 * - throw an Error with a friendly message.
 *
 * NOTE:
 * - The Workflow → Ingestion UI must no longer call `/mock`.
 * - The only ingestion-specific UI call kept is GET `/error-message` (plain text).
 */
import { apiFetchJson, apiFetchText, getBackendBaseUrl } from "./apiClient";

const ENDPOINT = getBackendBaseUrl();

// PUBLIC_INTERFACE
export async function fetchIngestionResult({ payload } = {}) {
  /**
   * Fetch ingestion result JSON from backend.
   *
   * @param {object} params
   * @param {any} params.payload - Optional JSON payload for POST fallback.
   * @returns {Promise<any>} Parsed JSON response from backend.
   */
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

// PUBLIC_INTERFACE
export async function fetchBackendErrorMessage() {
  /**
   * Fetches the backend error message (plain text) for display in the Workflow → Ingestion workspace.
   *
   * Endpoint:
   * - GET {REACT_APP_BACKEND_URL || REACT_APP_API_BASE}/error-message
   *
   * Expected response:
   * - text/plain (an error string). We display it as-is (trimmed).
   *
   * @returns {Promise<string>} Error message text (may be empty string).
   */
  const res = await apiFetchText("error-message", { method: "GET", baseUrl: ENDPOINT, allowRelative: false });

  if (!res || typeof res !== "object") {
    throw new Error("Unable to load /error-message (unexpected client response).");
  }

  if (!res.ok) {
    throw new Error(res.error?.message || "Unable to load /error-message.");
  }

  return String(res.data || "").trim();
}
