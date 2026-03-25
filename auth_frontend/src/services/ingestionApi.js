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
import { apiFetchText, getBackendBaseUrl } from "./apiClient";

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
export async function fetchIngestionWorkspaceResponse() {
  /**
   * Fetch the ingestion workspace response from backend.
   *
   * Authoritative instruction (user_input_ref):
   * - Use the backend mock endpoint: GET /mock
   * - Response is JSON (but we still fetch as text and classify defensively).
   *
   * The backend may respond with JSON or plain text; this function normalizes the result to:
   *  - { kind: "json", data: any } OR
   *  - { kind: "text", text: string }
   *
   * @returns {Promise<{kind:"json", data:any} | {kind:"text", text:string}>}
   */
  const res = await apiFetchText("mock", { method: "GET", baseUrl: ENDPOINT, allowRelative: false });

  if (!res || typeof res !== "object") {
    throw new Error("Unable to load ingestion response (unexpected client response).");
  }

  if (!res.ok) {
    throw new Error(res.error?.message || "Ingestion request failed.");
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
   * Submit user input for ingestion workspace.
   *
   * IMPORTANT:
   * The provided backend OpenAPI (and the user_input_ref) do not define any submit endpoint
   * for ingestion. To avoid making extra endpoint assumptions, this function does not perform
   * a network request. The UI can still show the textbox + Submit button (required behavior).
   *
   * @param {string} userText - User-provided text input.
   * @returns {Promise<{kind:"text", text:string}>}
   */
  const text = String(userText ?? "").trim();
  if (!text) {
    return { kind: "text", text: "Please enter a value before submitting." };
  }

  return { kind: "text", text: `Submitted input: ${text}` };
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
export async function fetchIngestionResult() {
  /**
   * Backward-compatible API: fetch ingestion JSON (or throw).
   *
   * Existing pages may still expect JSON; we keep this wrapper and throw if
   * backend returned plain text.
   *
   * @returns {Promise<any>} Parsed JSON response from backend.
   */
  const r = await fetchIngestionWorkspaceResponse();
  if (r.kind !== "json") {
    throw new Error(r.text || "Ingestion returned non-JSON response.");
  }
  return r.data;
}
