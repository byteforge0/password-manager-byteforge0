export const STORAGE_KEY = 'yazen_password_manager_v2';
export const AUTO_LOCK_MS = 2 * 60 * 1000;

export function loadStoredVault() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredVault(vault) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
}
