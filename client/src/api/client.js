// The ONE place the React app talks to the StudySlot API.
// Every request goes through apiRequest(), so URLs, headers, the login token,
// timeouts, and error handling are handled the same way everywhere.

// Public configuration (not a secret): set in client/.env locally and in Netlify later.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

// The free Render server can take ~1 minute to wake up after being idle,
// so the first request of a session gets a generous timeout.
const DEFAULT_TIMEOUT_MS = 60000;

/** An error from the API (or from failing to reach it), in a shape the UI can show. */
export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // HTTP status, or 0 when the server couldn't be reached
    this.details = details; // [{ field, message }] for validation errors
  }

  /** Field errors as { fieldName: message }, handy for showing messages next to inputs. */
  get fieldErrors() {
    return Object.fromEntries(this.details.map((detail) => [detail.field, detail.message]));
  }
}

// ===== Login token =====
// The auth context (Step 24) calls setAuthToken() after login/logout.
// Keeping it here means pages never have to pass the token around themselves.
let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

// Lets the auth context react when the server says the login is no longer valid.
let unauthorizedHandler = null;

export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

// ===== Helpers =====

function buildUrl(path, query) {
  // The second argument lets a relative base such as "/api" (local dev proxy) work;
  // it is ignored when API_BASE_URL is a full URL (production).
  const url = new URL(API_BASE_URL + path, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      // Skip empty filters so "?subject=" is never sent.
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url;
}

// Reads the body safely: some responses have no body, and a proxy error page may not be JSON.
async function readBody(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Sends a request to the API and returns the parsed JSON body.
 * Throws ApiError for any failure: HTTP errors, network errors, and timeouts.
 *
 * @param {string} path        e.g. '/services' or `/bookings/${id}`
 * @param {object} [options]
 * @param {string} [options.method]  'GET' (default), 'POST', or 'PATCH'
 * @param {object} [options.body]    sent as JSON
 * @param {object} [options.query]   added to the URL as ?key=value
 * @param {AbortSignal} [options.signal]  lets a component cancel the request (e.g. on unmount)
 * @param {number} [options.timeoutMs]
 */
export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, query, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  if (!API_BASE_URL) {
    throw new ApiError(0, 'The app is missing its API address (VITE_API_BASE_URL).');
  }

  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  // Stop waiting after timeoutMs, OR when the caller cancels, whichever comes first.
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: combinedSignal,
    });
  } catch (error) {
    // The caller cancelled on purpose (e.g. the page changed): let them ignore it.
    if (signal && signal.aborted) {
      throw error;
    }
    if (timeoutSignal.aborted) {
      throw new ApiError(0, 'The server took too long to respond. Please try again.');
    }
    throw new ApiError(0, "Can't reach the StudySlot server. Check your connection and try again.");
  }

  const data = await readBody(response);

  if (!response.ok) {
    if (response.status === 401 && authToken && unauthorizedHandler) {
      unauthorizedHandler(); // e.g. token expired: log out and send to the login page
    }
    const message =
      (data && data.error) || `Something went wrong (error ${response.status}). Please try again.`;
    throw new ApiError(response.status, message, (data && data.details) || []);
  }

  return data;
}
