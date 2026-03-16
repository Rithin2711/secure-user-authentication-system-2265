/**
 * Auth API client for the frontend.
 *
 * Routing note:
 * - In preview deployments, the gateway often routes same-origin `/api/*` to the backend.
 *   Using a relative base avoids 404s caused by port/host mismatches.
 * - In local CRA dev, `package.json -> proxy` forwards `/api/*` to the backend server.
 * - If REACT_APP_API_BASE/REACT_APP_BACKEND_URL is set to an actual backend origin,
 *   we will use it.
 */

function normalizeBase(base) {
  return String(base || "").trim().replace(/\/*$/, "");
}

function isLikelyFrontendOrigin(url) {
  try {
    return Boolean(url && window?.location?.origin && new URL(url).origin === window.location.origin);
  } catch {
    return false;
  }
}

const ENV_BASE = normalizeBase(process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL);

/**
 * Prefer explicit backend base if it looks different from the current origin.
 * Otherwise fall back to same-origin relative calls (API_BASE="").
 */
const API_BASE = ENV_BASE && !isLikelyFrontendOrigin(ENV_BASE) ? ENV_BASE : "";

/**
 * Attempt to extract a helpful error message from a failed fetch response.
 */
async function readErrorMessage(resp) {
  try {
    const data = await resp.json();
    if (data && typeof data.detail === "string") return data.detail;
    if (data && typeof data.message === "string") return data.message;
    return `Request failed (${resp.status})`;
  } catch {
    return `Request failed (${resp.status})`;
  }
}

// PUBLIC_INTERFACE
export async function signup({ name, email, phone, password }) {
  /**
   * Backend spec: POST /api/signup expects {name, phone, email, password}.
   */
  const url = `${API_BASE}/api/signup`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, password }),
  });

  if (!resp.ok) {
    throw new Error(await readErrorMessage(resp));
  }
  return resp.json();
}

// PUBLIC_INTERFACE
export async function login({ email, password }) {
  const url = `${API_BASE}/api/login`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    throw new Error(await readErrorMessage(resp));
  }
  return resp.json();
}

// PUBLIC_INTERFACE
export function persistAuth(authResponse) {
  /**
   * Persists token for later authenticated calls.
   * This project currently only needs persistence of login/signup result.
   */
  localStorage.setItem("auth_access_token", authResponse.access_token);
  localStorage.setItem("auth_email", authResponse.email);
  localStorage.setItem("auth_user_id", String(authResponse.user_id));
}
