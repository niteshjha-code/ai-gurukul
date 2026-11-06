const ORIGIN = import.meta.env.VITE_API_URL ?? '';
const BASE = `${ORIGIN}/api`;

// Turn an API-relative path (e.g. "/api/images/1?k=...") into a full URL.
export const assetUrl = (path) => `${ORIGIN}${path}`;

function storage(kind, key) {
  return {
    get() {
      try { return window[kind].getItem(key); } catch { return null; }
    },
    set(value) {
      try {
        if (value) window[kind].setItem(key, value);
        else window[kind].removeItem(key);
      } catch { /* storage unavailable (private mode) */ }
    },
  };
}

// The child's learning session lasts across visits.
export const tokenStore = storage('localStorage', 'gurukul_token');

// The parent session is short-lived and kept only for this browser tab.
const parentStorage = storage('sessionStorage', 'gurukul_parent');
const expiryOf = (jwt) => {
  try { return JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000; } catch { return 0; }
};
export const parentTokenStore = {
  get() {
    const token = parentStorage.get();
    return token && expiryOf(token) > Date.now() + 5000 ? token : null;
  },
  set: parentStorage.set,
};

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// `token` overrides the child's session token (used for parent-only calls).
export async function api(path, { method = 'GET', body, signal, token: override } = {}) {
  const token = override ?? tokenStore.get();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      signal,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError("Can't reach the Gurukul server. Please check that the backend is running.", 0);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && !override) window.dispatchEvent(new Event('gurukul:unauthorized'));
    if (data.code === 'PARENT_LOCKED') window.dispatchEvent(new Event('gurukul:parent-locked'));
    throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data.code);
  }
  return data;
}

// "2 days ago" for SQLite UTC timestamps.
export function timeAgo(sqlDate) {
  if (!sqlDate) return 'never';
  const seconds = (Date.now() - new Date(`${sqlDate.replace(' ', 'T')}Z`).getTime()) / 1000;
  if (seconds < 60) return 'just now';
  const units = [['year', 31_536_000], ['month', 2_592_000], ['week', 604_800], ['day', 86_400], ['hour', 3600], ['minute', 60]];
  const [unit, size] = units.find(([, s]) => seconds >= s);
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(-Math.floor(seconds / size), unit);
}
