export function readStoredJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
}
