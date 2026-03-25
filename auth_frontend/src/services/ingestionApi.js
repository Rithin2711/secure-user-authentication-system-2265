/**
 * Ingestion API client.
 *
 * IMPORTANT (behavior split):
 * - "Workflow ingestion output page" (IngestionOutputPage) uses fetchIngestionResult().
 * - The Orchestrator "Ingestion" TAB (agent selector) should use fetchMockRequiredIngestionFields()
 *   to call GET /mock and render "Required Ingestion field".
 *
 * Env resolution:
 * - Prefer REACT_APP_BACKEND_URL (or REACT_APP_API_BASE) when set.
 * - Fall back to the explicit preview URL provided in the task to keep the UI working.
 */

function normalizeEndpoint(url) {
  const u = String(url || "").trim();
  // Keep exactly one trailing slash for consistency, but do not change the path.
  return u.endsWith("/") ? u : `${u}/`;
}

const DEFAULT_ENDPOINT = "https://vscode-internal-38518-beta.beta01.cloud.kavia.ai:3001/";

const ENDPOINT = normalizeEndpoint(process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_BASE || DEFAULT_ENDPOINT);

async function tryReadJson(resp) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

async function buildError(resp, url) {
  const data = await tryReadJson(resp);

  // Try to extract meaningful text for common "Not Found" HTML/plaintext responses.
  let bodyText = "";
  try {
    bodyText = await resp.clone().text();
  } catch {
    bodyText = "";
  }

  const msg =
    data?.detail ||
    data?.message ||
    (bodyText && bodyText.length < 240 ? bodyText : "") ||
    `Request failed (${resp.status})`;

  const where = url ? ` (${url})` : "";
  return new Error(`${msg}${where}`);
}

function joinUrl(baseWithTrailingSlash, pathNoLeadingSlash) {
  return `${String(baseWithTrailingSlash || "")}${String(pathNoLeadingSlash || "").replace(/^\/+/, "")}`;
}

// PUBLIC_INTERFACE
export async function fetchMockRequiredIngestionFields() {
  /**
   * Fetch required ingestion fields from the backend mock endpoint.
   *
   * This is used by the Orchestrator "Ingestion" tab (NOT the workflow ingestion output page).
   *
   * Endpoint:
   * - GET {ENDPOINT}/mock
   *
   * @returns {Promise<any>} Parsed JSON response from /mock
   */
  const url = joinUrl(ENDPOINT, "mock");

  let resp;
  try {
    resp = await fetch(url, { method: "GET" });
  } catch {
    throw new Error(`Unable to reach server (${url}). Please try again.`);
  }

  if (!resp.ok) {
    throw await buildError(resp, url);
  }

  const data = await tryReadJson(resp);
  if (data === null) throw new Error(`Unexpected server response (not JSON) from ${url}.`);
  return data;
}

// PUBLIC_INTERFACE
export async function fetchIngestionResult({ payload } = {}) {
  /**
   * Fetch ingestion result JSON from backend.
   *
   * This remains the function used by IngestionOutputPage (workflow ingestion output page).
   *
   * Implementation:
   * - First try GET ENDPOINT (common for simple "return JSON" endpoints).
   * - If backend rejects method (405) or endpoint expects POST, try POST with JSON payload.
   *
   * @param {object} params
   * @param {any} params.payload - Optional JSON payload for POST fallback.
   * @returns {Promise<any>} Parsed JSON response from backend.
   */
  // GET
  let resp;
  try {
    resp = await fetch(ENDPOINT, { method: "GET" });
  } catch {
    throw new Error("Unable to reach ingestion backend. Please try again.");
  }

  if (resp.ok) {
    const data = await tryReadJson(resp);
    if (data === null) throw new Error("Unexpected server response (not JSON).");
    return data;
  }

  // If backend doesn't allow GET or expects payload, try POST fallback.
  if (![404, 405].includes(resp.status)) {
    throw await buildError(resp);
  }

  // POST
  try {
    resp = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
  } catch {
    throw new Error("Unable to reach ingestion backend. Please try again.");
  }

  if (!resp.ok) {
    throw await buildError(resp);
  }

  const data = await tryReadJson(resp);
  if (data === null) throw new Error("Unexpected server response (not JSON).");
  return data;
}
