/**
 * Ingestion API client.
 *
 * IMPORTANT (behavior split):
 * - "Workflow ingestion output page" (IngestionOutputPage) uses fetchMockRequiredIngestionFields()
 *   to call GET /mock and render the returned JSON.
 *
 * This module must never return an undefined "response" object. It should either:
 * - return parsed JSON, or
 * - throw an Error with a friendly message.
 */
import { apiFetchJson, apiFetchText, getBackendBaseUrl } from "./apiClient";

const ENDPOINT = getBackendBaseUrl();

// PUBLIC_INTERFACE
export async function fetchMockRequiredIngestionFields() {
  /**
   * Fetch required ingestion fields from the backend mock endpoint.
   *
   * Endpoint:
   * - GET {REACT_APP_BACKEND_URL || REACT_APP_API_BASE}/mock
   *
   * Expected successful response shape (authoritative reference from user_input_ref):
   * {
   *   request_id: string,
   *   version: string,
   *   generated_at: string (ISO),
   *   advertiser_and_product_information: object,
   *   campaign_details: object,
   *   budget_and_financials: object,
   *   linear_details: object,
   *   digital_details: object
   * }
   *
   * Safety contract:
   * - Must never attempt to read `.ok` from an undefined value.
   * - Returns parsed JSON on success.
   * - Throws an Error with a friendly message on failure.
   *
   * @returns {Promise<any>} Parsed JSON response from /mock (unmodified)
   */
  const res = await apiFetchJson("mock", { method: "GET", baseUrl: ENDPOINT, allowRelative: false });

  // Defensive guard: if an unexpected value is returned, do not crash.
  if (!res || typeof res !== "object") {
    throw new Error("Unable to load /mock payload (unexpected client response).");
  }

  if (!res.ok) {
    throw new Error(res.error?.message || "Unable to load /mock payload.");
  }

  return res.data;
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
