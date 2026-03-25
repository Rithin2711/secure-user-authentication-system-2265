/**
 * Ingestion API client.
 *
 * This module supports a backend that may return either:
 * - JSON (application/json) representing an ingestion result, OR
 * - plain text (text/plain) representing an error/feedback prompt.
 *
 * The Workflow → Ingestion UI is responsible for choosing the correct rendering:
 * - JSON => render as tables
 * - text => show the text + an input box + a submit button
 */
import { apiFetchJson, apiFetchText, getBackendBaseUrl } from "./apiClient";

const ENDPOINT = getBackendBaseUrl();

/**
 * Attempt to parse a string as JSON, returning undefined if parsing fails.
 * Kept internal to avoid changing other code paths.
 */
function tryParseJson(text) {
  if (text === null || text === undefined) return undefined;
  const t = String(text).trim();
  if (!t) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

// PUBLIC_INTERFACE
export async function fetchIngestionWorkspaceResponse({ payload } = {}) {
  /**
   * Fetch the ingestion workspace response from backend.
   *
   * The backend may respond with JSON or plain text; this function normalizes the result to:
   *  - { kind: "json", data: any } OR
   *  - { kind: "text", text: string }
   *
   * Strategy:
   * 1) Try GET / first as TEXT (so we can handle either content-type).
   * 2) If GET fails with 404/405, try POST / with optional payload as TEXT.
   * 3) Classify by attempting to parse JSON; fallback to text.
   *
   * @param {object} params
   * @param {any} params.payload - Optional payload sent on POST fallback.
   * @returns {Promise<{kind:"json", data:any} | {kind:"text", text:string}>}
   */
  const baseUrl = ENDPOINT;

  // GET base (root) as text so we can interpret either JSON or text responses.
  let res = await apiFetchText("", { method: "GET", baseUrl, allowRelative: false });

  if (!res || typeof res !== "object") {
    throw new Error("Unable to load ingestion response (unexpected client response).");
  }

  if (!res.ok) {
    // Fallback to POST only when GET is not allowed/missing.
    if (![404, 405].includes(res.status)) {
      throw new Error(res.error?.message || "Ingestion request failed.");
    }

    res = await apiFetchText("", { method: "POST", baseUrl, allowRelative: false, body: payload ?? {} });

    if (!res || typeof res !== "object") {
      throw new Error("Unable to load ingestion response (unexpected client response).");
    }
    if (!res.ok) {
      throw new Error(res.error?.message || "Ingestion request failed.");
    }
  }

  const rawText = String(res.data ?? "").trim();
  const parsed = tryParseJson(rawText);

  if (parsed !== undefined) {
    return { kind: "json", data: parsed };
  }

  // If backend returns empty string, treat as empty message.
  return { kind: "text", text: rawText };
}

// PUBLIC_INTERFACE
export async function submitIngestionWorkspaceInput(userText) {
  /**
   * Submit user input back to backend for the ingestion workspace.
   *
   * NOTE: The backend contract for this is not currently represented in the OpenAPI spec.
   * We implement a conservative best-effort:
   * - POST /ingestion-input with JSON body { text: string }
   * - If that endpoint is missing, the UI will show a friendly error.
   *
   * @param {string} userText - User-provided text input.
   * @returns {Promise<{kind:"json", data:any} | {kind:"text", text:string}>} Same classification as fetchIngestionWorkspaceResponse.
   */
  const text = String(userText ?? "").trim();
  if (!text) {
    return { kind: "text", text: "Please enter a value before submitting." };
  }

  const baseUrl = ENDPOINT;

  // Prefer sending JSON; still parse response as text so we can handle either.
  const res = await apiFetchText("ingestion-input", {
    method: "POST",
    baseUrl,
    allowRelative: false,
    body: { text },
  });

  if (!res || typeof res !== "object") {
    throw new Error("Unable to submit ingestion input (unexpected client response).");
  }

  if (!res.ok) {
    throw new Error(res.error?.message || "Unable to submit ingestion input.");
  }

  const rawText = String(res.data ?? "").trim();
  const parsed = tryParseJson(rawText);
  if (parsed !== undefined) return { kind: "json", data: parsed };
  return { kind: "text", text: rawText };
}

// PUBLIC_INTERFACE
export async function fetchBackendErrorMessage() {
  /**
   * Legacy helper (kept for compatibility with OrchestratorResultsPage).
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

// PUBLIC_INTERFACE
export async function fetchIngestionResult({ payload } = {}) {
  /**
   * Backward-compatible API: fetch ingestion JSON (or throw).
   *
   * Existing pages may still expect JSON; we keep this wrapper and throw if
   * backend returned plain text.
   *
   * @param {object} params
   * @param {any} params.payload - Optional JSON payload for POST fallback.
   * @returns {Promise<any>} Parsed JSON response from backend.
   */
  const r = await fetchIngestionWorkspaceResponse({ payload });
  if (r.kind !== "json") {
    throw new Error(r.text || "Ingestion returned non-JSON response.");
  }
  return r.data;
}
