import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, MessageCircle } from "lucide-react";
import api from "../../api/api";
import { updateSEO } from "../../utils/seo";

export default function Contact() {
  const [setting, setSetting] = useState(() => {
    return JSON.parse(localStorage.getItem("setting") || "{}");
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get("/home");
        if (res.data?.data?.setting) {
          const updatedSetting = res.data.data.setting;
          setSetting(updatedSetting);
          localStorage.setItem("setting", JSON.stringify(updatedSetting));
        }
      } catch (err) {
        console.error("Failed to sync settings:", err);
      }
    }
    fetchSettings();
    updateSEO({
      title: "Liên Hệ Hỗ Trợ Khách Hàng 24/7",
      description: "Liên hệ ngay với ban quản trị website qua Hotline, Zalo, Facebook Messenger để được hỗ trợ giải quyết thắc mắc về đơn hàng, nạp tiền ví.",
      keywords: "lien he cskh, hotline ho tro, zalo ho tro, facebook admin, shop acc lien quan"
    });
  }, []);

  const zaloLink = setting.sdt_admin ? `https://zalo.me/${setting.sdt_admin.replace(/\D/g, "")}` : "https://zalo.me/0999999999";
  const phoneDisplay = setting.sdt_admin || "099.999.9999";
  const fbLink = setting.fb_admin || "https://m.me/shopgameliqi";

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ marginBottom: "32px" }}>LIÊN HỆ HỖ TRỢ KHÁCH HÀNG</h1>

      <div className="contact-card-container">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>💬</div>
          <h2 style={{ color: "white", marginBottom: "10px" }}>HỖ TRỢ TRỰC TUYẾN 24/7</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
            Nếu bạn có bất kỳ câu hỏi nào về việc giao dịch tài khoản, nạp tiền ví, hoặc cần bảo hành, vui lòng liên hệ với đội ngũ CSKH qua các kênh hỗ trợ trực tuyến bên dưới.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "16px 20px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="avatar-placeholder" style={{ width: "40px", height: "40px", fontSize: "1rem", background: "rgba(0,104,255,0.15)", borderColor: "#0068ff", color: "#0068ff" }}>
                Zalo
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Chat Zalo hỗ trợ</div>
                <strong style={{ color: "white" }}>{phoneDisplay}</strong>
              </div>
            </div>
            <a href={zaloLink} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
              Chat Zalo
            </a>
          </div>

          {setting.fb_admin && (
            <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "16px 20px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="avatar-placeholder" style={{ width: "40px", height: "40px", fontSize: "1rem", background: "rgba(24,119,242,0.15)", borderColor: "#1877f2", color: "#1877f2" }}>
                  <MessageCircle size={18} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Facebook Messenger</div>
                  <strong style={{ color: "white" }}>Messenger CSKH</strong>
                </div>
              </div>
              <a href={fbLink} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
                Gửi Tin Nhắn
              </a>
            </div>
          )}

          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "16px 20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="avatar-placeholder" style={{ width: "40px", height: "40px", fontSize: "1rem" }}>
              <Phone size={18} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Hotline hỗ trợ gấp</div>
              <strong style={{ color: "var(--gold-color)", fontSize: "1.1rem" }}>{phoneDisplay}</strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <Link to="/" className="btn-outline" style={{ padding: "10px 24px" }}>Quay về trang chủ</Link>
        </div>
      </div>
    </div>
  );
}
