const LOCAL_UPLOAD_PATTERN = /^\/uploads\/[a-zA-Z0-9._/-]+$/;

export function isStoredImagePath(value) {
  return typeof value === "string" && LOCAL_UPLOAD_PATTERN.test(value.trim()) && !value.includes("..");
}

export async function uploadImageFile(api, file) {
  const body = new FormData();
  body.append("file", file);
  const response = await api.post("/upload", body, { headers: { "Content-Type": "multipart/form-data" } });
  return response.data.data.url;
}

export async function importImageUrl(api, value) {
  const url = String(value || "").trim();
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
