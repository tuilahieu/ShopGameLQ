// Each skill is a bounded customer-support capability with a fixed local route.
// Add new skills here without exposing private database fields to a model.
export const ASSISTANT_SKILLS = Object.freeze([
  { id: "warranty", pattern: /bảo hành|bao hanh|điều khoản|dieu khoan/u, text: "Bạn xem chính sách bảo hành và điều khoản tại đây nhé.", label: "Xem điều khoản", href: "/terms" },
  { id: "orders", pattern: /đơn hàng|don hang|đã mua|da mua/u, text: "Bạn có thể xem các tài khoản đã mua trong mục Đã mua.", label: "Xem đơn đã mua", href: "/my-orders" },
  { id: "topup", pattern: /nạp tiền|nap tien|chuyển khoản|chuyen khoan/u, text: "Bạn có thể xem hướng dẫn và tạo mã nạp trên trang Nạp tiền.", label: "Đến trang nạp tiền", href: "/nap-tien" },
  { id: "contact", pattern: /liên hệ|lien he|zalo|hỗ trợ|ho tro|gặp admin|gap admin|nói chuyện với admin|noi chuyen voi admin|gặp người thật|gap nguoi that|nhân viên tư vấn|nhan vien tu van/u, text: "Dạ, bạn có thể nhắn Zalo của shop để được admin hỗ trợ trực tiếp. Mình gửi bạn trang liên hệ nhé.", label: "Mở trang liên hệ", href: "/contact" },
]);

export function matchAssistantSkill(message) {
  const normalized = message.toLocaleLowerCase("vi-VN");
  const skill = ASSISTANT_SKILLS.find((item) => item.pattern.test(normalized));
  return skill ? {
    text: skill.text,
    accounts: [],
    link: { label: skill.label, href: skill.href },
  } : null;
}
