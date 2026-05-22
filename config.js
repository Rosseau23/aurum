/**
 * config.js — API configuration
 * Centralised configuration for the frontend client.
 */

/**
 * Resolve API base URL.
 * - On Emergent preview: use the public REACT_APP_BACKEND_URL provided via window.__ENV__
 *   (we inject it at runtime via env.js) — falls back to current origin.
 * - For local Node/Express dev (port 4000), this can be overridden via window.__ENV__.API_BASE.
 */
function resolveApiBase() {
  if (typeof window !== "undefined" && window.__ENV__ && window.__ENV__.API_BASE) {
    return window.__ENV__.API_BASE.replace(/\/$/, "");
  }
  // Default: same-origin (the kubernetes ingress proxies /api/* to backend)
  return window.location.origin;
}

export const API_BASE = resolveApiBase();
export const API_PREFIX = "/api";

export const STORAGE_KEYS = {
  TOKEN: "aurum.token",
  USER: "aurum.user",
  ORDERS: "aurum.orders",
};
