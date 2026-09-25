// Each skill is a bounded customer-support capability with a fixed local route.
// Add new skills here without exposing private database fields to a model.
export const ASSISTANT_SKILLS = Object.freeze([
  { id: "warranty", pattern: /bảo hành|bao hanh|điều khoản|dieu khoan/u, text: "Bạn xem chính sách bảo hành với điều khoản ở đây giúp mình nhá.", label: "Xem điều khoản", href: "/terms" },
  { id: "orders", pattern: /đơn hàng|don hang|đã mua|da mua/u, text: "Đơn với acc đã mua nằm trong mục Đã mua nè, mình gửi bạn luôn nhé.", label: "Xem đơn đã mua", href: "/my-orders" },
  { id: "topup", pattern: /nạp tiền|nap tien|chuyển khoản|chuyen khoan/u, text: "Bạn vào trang Nạp tiền để xem hướng dẫn với tạo mã nạp nha.", label: "Đến trang nạp tiền", href: "/nap-tien" },
  { id: "contact", pattern: /liên hệ|lien he|zalo|gặp admin|gap admin|nói chuyện với admin|noi chuyen voi admin|gặp người thật|gap nguoi that|nhân viên tư vấn|nhan vien tu van|admin hỗ trợ|admin ho tro/u, text: "Bạn nhắn Zalo của shop để admin hỗ trợ trực tiếp nha. Mình gửi trang liên hệ ở đây nè.", label: "Mở trang liên hệ", href: "/contact" },
]);

export function getAssistantSkillResponse(id) {
  const skill = ASSISTANT_SKILLS.find((item) => item.id === id);
  return skill ? {
    text: skill.text,
    accounts: [],
    link: { label: skill.label, href: skill.href },
  } : null;
}

export function matchAssistantSkill(message) {
  const normalized = message.toLocaleLowerCase("vi-VN");
  const skill = ASSISTANT_SKILLS.find((item) => item.pattern.test(normalized));
  return skill ? getAssistantSkillResponse(skill.id) : null;
}
