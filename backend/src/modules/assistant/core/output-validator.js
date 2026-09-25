const ALLOWED_LINKS = new Set(["/accounts", "/my-orders", "/nap-tien", "/terms", "/contact"]);

export function sanitizeAssistantText(value, maxLength = 320) {
  if (typeof value !== "string") return "";
  const clean = value
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/<script[\s\S]*?<\/script>/giu, " ")
    .replace(/<style[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]*>/gu, " ")
    .replace(/(?:https?:\/\/|www\.)\S+/giu, "")
    .replace(/[\u0000-\u001F\u007F]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return clean.slice(0, maxLength).trim();
}

function safeImage(value) {
  if (typeof value !== "string") return null;
  const image = value.trim().slice(0, 500);
  return image.startsWith("/uploads/") || /^https:\/\//iu.test(image) ? image : null;
}

function validateAccount(value) {
  const id = Number(value?.id);
  const price = Number(value?.price);
  const originalPrice = Number(value?.original_price);
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(price) || price < 0) return null;
  return {
    id,
    title: `Acc Liên Quân #${id}`,
    category: sanitizeAssistantText(value?.category, 80) || "Tài khoản Liên Quân",
    price,
    original_price: Number.isSafeInteger(originalPrice) && originalPrice >= price ? originalPrice : price,
    is_sale: value?.is_sale === true,
    image: safeImage(value?.image),
    href: `/account/${id}`,
  };
}

export function validateAssistantAccounts(values) {
  if (!Array.isArray(values)) return [];
  return values.slice(0, 4).map(validateAccount).filter(Boolean);
}

export function validateAssistantAnswer(value, fallbackText) {
  const text = sanitizeAssistantText(value?.text) || sanitizeAssistantText(fallbackText);
  const answer = { text, accounts: validateAssistantAccounts(value?.accounts) };
  const href = typeof value?.link?.href === "string" ? value.link.href : "";
  if (ALLOWED_LINKS.has(href)) {
    answer.link = {
      href,
      label: sanitizeAssistantText(value.link?.label, 60) || "Mở trang hỗ trợ",
    };
  }
  return answer;
}
