/**
 * Ingestion API client.
 *
 * Calls the backend ingestion endpoint and returns the parsed JSON response.
 *
 * Env resolution:
 * - Prefer REACT_APP_BACKEND_URL (or REACT_APP_API_BASE) when set.
 * - Fall back to the explicit URL provided in the task to keep the UI working in preview.
 *
 * IMPORTANT:
 * - The user-provided backend URL is itself the endpoint that returns JSON.
 *   So we call it directly (GET preferred; POST fallback) and do not append extra paths.
 */

function normalizeEndpoint(url) {
  const u = String(url || "").trim();
  // Keep exactly one trailing slash for consistency, but do not change the path.
  return u.endsWith("/") ? u : `${u}/`;
}

const DEFAULT_ENDPOINT = "https://vscode-internal-35939-beta.beta01.cloud.kavia.ai:3001/";

const ENDPOINT = normalizeEndpoint(process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_BASE || DEFAULT_ENDPOINT);

async function tryReadJson(resp) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

async function buildError(resp) {
  const data = await tryReadJson(resp);
  const msg = data?.detail || data?.message || `Request failed (${resp.status})`;
  return new Error(msg);
}

// PUBLIC_INTERFACE
export async function fetchIngestionResult({ payload } = {}) {
  /**
   * Fetch ingestion result JSON from backend.
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
