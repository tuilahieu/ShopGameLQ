const LOCAL_UPLOAD_PATTERN = /^\/uploads\/[a-zA-Z0-9._/-]+$/;

/**
 * Converts current/legacy absolute upload URLs back to the deploy-safe path
 * stored by the API. These files already belong to this application and must
 * not be sent through the remote-image importer (which correctly blocks LAN
 * and localhost hosts).
 */
export function normalizeStoredImagePath(value) {
  const source = typeof value === "string" ? value.trim() : "";
  if (!source) return "";

  const directPath = source.startsWith("uploads/") ? `/${source}` : source;
  if (LOCAL_UPLOAD_PATTERN.test(directPath) && !directPath.includes("..")) return directPath;

  try {
    const parsed = new URL(source);
    if (LOCAL_UPLOAD_PATTERN.test(parsed.pathname) && !parsed.pathname.includes("..")) {
      return parsed.pathname;
    }
  } catch {
    // Non-URL values continue through normal validation/import handling.
  }

  return source;
}

export function isStoredImagePath(value) {
  const normalized = normalizeStoredImagePath(value);
  return LOCAL_UPLOAD_PATTERN.test(normalized) && !normalized.includes("..");
}

export async function uploadImageFile(api, file) {
  const body = new FormData();
  body.append("file", file);
  const response = await api.post("/upload", body, { headers: { "Content-Type": "multipart/form-data" } });
  return response.data.data.url;
}

export async function importImageUrl(api, value) {
  const url = normalizeStoredImagePath(String(value || ""));
  if (!url || isStoredImagePath(url)) return url;
  const response = await api.post("/upload/remote", { url });
  return response.data.data.url;
}

export async function importImageList(api, value) {
  if (value === null || value === undefined || value === "" || value === "0" || value === 0) return "0";
  let images = value;
  if (typeof images === "string") {
    try { images = JSON.parse(images); }
    catch { throw new Error("Danh sách ảnh phải là JSON array hợp lệ."); }
  }
  if (!Array.isArray(images)) throw new Error("Danh sách ảnh phải là JSON array hợp lệ.");
  if (images.length > 20) throw new Error("Danh sách ảnh chỉ hỗ trợ tối đa 20 ảnh.");
  return JSON.stringify(await Promise.all(images.map((image) => importImageUrl(api, image))));
}
