const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

function getApiOrigin() {
  if (!/^https?:\/\//i.test(API_BASE_URL)) return "";

  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
}

const API_ORIGIN = getApiOrigin();

/**
 * Resolves media served by this backend without keeping the host that happened
 * to receive the upload request. This keeps legacy localhost/LAN upload URLs
 * usable from phones, tunnels and HTTPS deployments.
 */
export function resolveMediaUrl(value) {
  const source = typeof value === "string" ? value.trim() : "";
  if (!source || source === "0" || source.toLowerCase() === "null") return "";
  if (/^(data:|blob:)/i.test(source)) return source;

  try {
    const parsed = new URL(source, window.location.origin);
    if (parsed.pathname.startsWith("/uploads/")) {
      const uploadPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return API_ORIGIN ? `${API_ORIGIN}${uploadPath}` : uploadPath;
    }
  } catch {
    // Leave non-URL values to the browser so SafeImage can show its fallback.
  }

  if (/^uploads\//i.test(source)) {
    const uploadPath = `/${source}`;
    return API_ORIGIN ? `${API_ORIGIN}${uploadPath}` : uploadPath;
  }

  return source;
}

