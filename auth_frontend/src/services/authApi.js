/**
 * Auth API client for the frontend.
 *
 * Uses REACT_APP_API_BASE from the frontend .env (already present in this project).
 */

const API_BASE =
  (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");

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
   * Backend spec: POST /api/signup expects {email, password}.
   * The current backend template persists only email/password. We still collect
   * name/phone per UI requirement; these are sent as extra fields but may be ignored
   * by backend validation if it is strict.
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
