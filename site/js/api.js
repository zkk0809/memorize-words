const API_BASE = '/api';

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { ...options.headers };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data;
  } catch (err) {
    if (err.message === 'Invalid or expired token') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.hash = '#login';
    }
    throw err;
  }
}