const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

export async function api(path, options = {}) {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  };

  const response = await fetch(`${API_BASE}${path}`, config);
  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || response.statusText };
  }

  if (!response.ok) {
    const error = new Error(data.message || data.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function shortUrl(slug) {
  return `${window.location.origin}/api/url/${encodeURIComponent(slug)}`;
}
