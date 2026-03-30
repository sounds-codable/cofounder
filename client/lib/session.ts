const ACCESS_TOKEN_KEY = 'cofounder-access-token';
const AUTH_EVENT_NAME = 'cofounder-auth-changed';
const listeners = new Set<() => void>();
let initialized = false;

function emitAuthChanged() {
  listeners.forEach((listener) => listener());
}

function ensureInitialized() {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  window.addEventListener('storage', (event) => {
    if (event.key === ACCESS_TOKEN_KEY) {
      emitAuthChanged();
    }
  });
  window.addEventListener(AUTH_EVENT_NAME, () => emitAuthChanged());
  initialized = true;
}

export function getStoredAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  ensureInitialized();

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function subscribeAccessToken(listener: () => void) {
  ensureInitialized();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function setStoredAccessToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME));
}

export function clearStoredAccessToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME));
}
