export type LocalSession = {
  email: string;
  role: 'student' | 'admin';
};

const KEY = 'studyvault_session';

export function getSession(): LocalSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as LocalSession; } catch { return null; }
}

export function setSession(session: LocalSession) {
  localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('studyvault-auth-updated'));
}

export function clearSession() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('studyvault-auth-updated'));
}
