/**
 * api.js — Thin HTTP client around fetch with JWT support.
 */
import { API_BASE, API_PREFIX, STORAGE_KEYS } from "./config.js";

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const url = `${API_BASE}${API_PREFIX}${path}`;
  let res;
  try {
    res = await fetch(url, opts);
  } catch (err) {
    throw new ApiError("Sin conexión con el servidor", 0);
  }

  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Error ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }
  return data;
}

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  del: (path) => request("DELETE", path),
};
