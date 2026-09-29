const STORED_IMAGE_PATH = /^\/uploads\/[a-zA-Z0-9._/-]+$/u;

export function normalizeStoredImagePath(value, fieldName = "Ảnh") {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") throw Object.assign(new Error(`${fieldName} không hợp lệ`), { status: 400, code: "INVALID_IMAGE_PATH" });
  const normalized = value.trim();
  if (!normalized) return "";
  if (!STORED_IMAGE_PATH.test(normalized) || normalized.includes("..")) {
    throw Object.assign(new Error(`${fieldName} phải được tải lên hệ thống trước khi lưu`), { status: 400, code: "REMOTE_IMAGE_NOT_IMPORTED" });
  }
  return normalized;
}

export function normalizeStoredImageList(value, fieldName = "Danh sách ảnh") {
  if (value === null || value === undefined) return value;
  if (value === 0 || value === "0" || value === "") return "0";

  let images = value;
  if (typeof value === "string") {
    try { images = JSON.parse(value); }
    catch { throw Object.assign(new Error(`${fieldName} phải là JSON array`), { status: 400, code: "INVALID_IMAGE_LIST" }); }
  }
  if (!Array.isArray(images) || images.length > 20) {
    throw Object.assign(new Error(`${fieldName} phải là JSON array tối đa 20 ảnh`), { status: 400, code: "INVALID_IMAGE_LIST" });
  }
  return JSON.stringify(images.map((image, index) => normalizeStoredImagePath(image, `${fieldName} #${index + 1}`)));
}
