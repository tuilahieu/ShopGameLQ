import { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import { Upload, Eye, EyeOff } from "lucide-react";

const BACKEND = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

function ImageUploadField({ label, fieldKey, value, onChange }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(fieldKey, res.data.data.url);
    } catch {
      alert("Upload thất bại!");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
      <label>{label}</label>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          placeholder="Nhập URL hoặc upload file"
          value={value || ""}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          style={{ flexGrow: 1 }}
        />
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            cursor: uploading ? "not-allowed" : "pointer",
            padding: "10px 14px",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            opacity: uploading ? 0.6 : 1,
            transition: "var(--transition-smooth)"
          }}
        >
          <Upload size={14} />
          {uploading ? "Đang tải..." : "Upload"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: "none" }}
            disabled={uploading}
          />
        </label>
      </div>
      {value && (
        <img
          src={value}
          alt={label}
          style={{
            maxHeight: "100px",
            marginTop: "10px",
            display: "block",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            objectFit: "contain",
            background: "var(--bg-primary)",
            padding: "4px",
          }}
        />
      )}
    </div>
  );
}

export default function AdminSetting() {
  const [form, setForm] = useState({});
  const [showSecret, setShowSecret] = useState(false);

  async function load() {
    const res = await api.get("/admin/setting");
    setForm(res.data.data || {});
  }

  async function save() {
    try {
      await api.put("/admin/setting", form);
      alert("Đã lưu cấu hình thành công!");
    } catch {
      alert("Lưu thất bại, vui lòng thử lại.");
    }
  }

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <h1 className="page-title">Cấu hình Hệ thống</h1>

      {/* ── Thông tin website ── */}
      <div className="card">
        <h3>Thông tin Website</h3>
        <div className="form-grid" style={{ marginTop: "16px" }}>
          <div className="form-group-premium">
            <label>Tên Website</label>
            <input
              placeholder="VD: ShopGameLiQi"
              value={form.ten_web || ""}
              onChange={(e) => set("ten_web", e.target.value)}
            />
          </div>

          <div className="form-group-premium">
            <label>Email liên hệ</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={form.email || ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div className="form-group-premium">
            <label>Facebook Admin</label>
            <input
              placeholder="https://facebook.com/..."
              value={form.fb_admin || ""}
              onChange={(e) => set("fb_admin", e.target.value)}
            />
          </div>

          <div className="form-group-premium">
            <label>Số điện thoại / Zalo</label>
            <input
              placeholder="0xxx xxx xxx"
              value={form.sdt_admin || ""}
              onChange={(e) => set("sdt_admin", e.target.value)}
            />
          </div>

          <ImageUploadField
            label="Logo Website"
            fieldKey="logo"
            value={form.logo}
            onChange={set}
          />

          <ImageUploadField
            label="Favicon (icon tab trình duyệt)"
            fieldKey="favicon"
            value={form.favicon}
            onChange={set}
          />

          <ImageUploadField
            label="Ảnh Banner trang chủ"
            fieldKey="banner"
            value={form.banner}
            onChange={set}
          />

          <ImageUploadField
            label="Ảnh Background (nền website)"
            fieldKey="background"
            value={form.background}
            onChange={set}
          />

          <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
            <label>Thông báo hiển thị trên trang chủ</label>
            <textarea
              className="full"
              placeholder="Nhập nội dung thông báo..."
              value={form.thongbao || ""}
              onChange={(e) => set("thongbao", e.target.value)}
              rows={6}
              style={{ resize: "vertical", minHeight: "130px" }}
            />
          </div>

          <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
            <label>Custom JavaScript (chèn vào cuối &lt;body&gt;)</label>
            <textarea
              className="full"
              placeholder="<script>...</script>"
              value={form.js_web || ""}
              onChange={(e) => set("js_web", e.target.value)}
              rows={3}
              style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }}
            />
          </div>
        </div>
      </div>

      {/* ── Thanh toán & CTV ── */}
      <div className="card">
        <h3>Thanh toán & Cộng tác viên</h3>
        <div className="form-grid" style={{ marginTop: "16px" }}>
          <div className="form-group-premium">
            <label>Sepay Webhook Secret</label>
            <div style={{ position: "relative" }}>
              <input
                type={showSecret ? "text" : "password"}
                placeholder="Nhập secret key từ Sepay"
                value={form.sepay_secret || ""}
                onChange={(e) => set("sepay_secret", e.target.value)}
                style={{ paddingRight: "44px", width: "100%" }}
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group-premium">
            <label>Hoa hồng CTV (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="VD: 10"
              value={form.ck_ctv ?? ""}
              onChange={(e) => set("ck_ctv", Number(e.target.value))}
            />
            <small style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
              Phần trăm hoa hồng cộng tác viên nhận được khi giới thiệu khách mua hàng
            </small>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "8px" }}>
        <button className="small-btn" onClick={save} style={{ padding: "12px 28px", fontSize: "0.95rem" }}>
          💾 Lưu toàn bộ cấu hình
        </button>
      </div>
    </>
  );
}
