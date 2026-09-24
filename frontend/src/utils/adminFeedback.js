const ERROR_WORDS = /lỗi|thất bại|không thể|không hợp lệ|vui lòng|cần |phải |từ chối|không được/i;
const SUCCESS_WORDS = /thành công|đã |cập nhật|tạo |lưu |thêm |xóa |ẩn /i;

export function notifyAdmin(message, tone) {
  if (typeof window === "undefined") return;

  const cleanMessage = String(message || "Đã cập nhật.")
    .replace(/[!！]+(?=\s|$)/g, ".")
    .trim();
  const inferredTone = tone || (ERROR_WORDS.test(cleanMessage)
    ? "error"
    : SUCCESS_WORDS.test(cleanMessage) ? "success" : "info");

  window.dispatchEvent(new CustomEvent("admin-toast", {
    detail: { message: cleanMessage, tone: inferredTone },
  }));
}
