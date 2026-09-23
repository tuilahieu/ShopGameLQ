import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { Upload, Eye, EyeOff } from "lucide-react";
import SafeImage from "../../components/SafeImage";
import { StatusMessage } from "../../components/Ui";
import SkeletonLoading from "../../components/SkeletonLoading";

function ImageUploadField({ label, fieldKey, value, onChange }) {
  const inputRef = useRef();
  const inputId = `admin-setting-${fieldKey}`;
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
      <label htmlFor={inputId}>{label}</label>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          id={inputId}
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
        <SafeImage
          src={value}
          alt={label}
          width={180}
          height={100}
          fallbackLabel="Ảnh không tải được"
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [sepaySecretInput, setSepaySecretInput] = useState("");
  const [securityForm, setSecurityForm] = useState({ currentPassword: "", oldSecondPassword: "", newSecondPassword: "", confirmPassword: "" });
  const [securityError, setSecurityError] = useState("");
  const [securityBusy, setSecurityBusy] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/admin/setting");
      setForm(res.data.data || {});
    } catch (error) {
      setLoadError(error.response?.data?.message || "Không thể tải cấu hình hệ thống.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const settings = { ...form };
      delete settings.sepay_secret;
      const res = await api.put("/admin/setting", {
        ...settings,
        ...(sepaySecretInput.trim() && { sepay_secret: sepaySecretInput.trim() }),
      });
      if (res.data?.data) {
        setForm(res.data.data);
      }
      setSepaySecretInput("");
      setShowSecret(false);
      alert("Đã lưu cấu hình thành công!");
    } catch {
      alert("Lưu thất bại, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function changeSecondPassword(event) {
    event.preventDefault();
    setSecurityError("");
    if (securityForm.newSecondPassword !== securityForm.confirmPassword) {
      setSecurityError("Hai lần nhập mật khẩu cấp 2 mới chưa khớp.");
      return;
    }
    if (Array.from(securityForm.newSecondPassword).length < 12 || new TextEncoder().encode(securityForm.newSecondPassword).length > 72) {
      setSecurityError("Mật khẩu cấp 2 mới cần ít nhất 12 ký tự và tối đa 72 byte.");
      return;
    }
    setSecurityBusy(true);
    try {
      await api.post("/auth/admin-security/change", {
        currentPassword: securityForm.currentPassword,
        oldSecondPassword: securityForm.oldSecondPassword,
        newSecondPassword: securityForm.newSecondPassword,
      });
      setSecurityForm({ currentPassword: "", oldSecondPassword: "", newSecondPassword: "", confirmPassword: "" });
      sessionStorage.removeItem("adminSession");
      window.dispatchEvent(new Event("admin-session-expired"));
    } catch (error) {
      setSecurityError(error.response?.data?.message || "Không thể đổi mật khẩu cấp 2.");
    } finally {
      setSecurityBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <SkeletonLoading variant="form" items={6} label="Đang tải cấu hình hệ thống" />;
  if (loadError) return <StatusMessage title="Không thể tải cấu hình" description={loadError} action={<button type="button" className="btn-primary" onClick={load}>Thử lại</button>} />;

  const apiBase = new URL(api.defaults.baseURL, window.location.origin);
  const webhookUrl = new URL("payments/sepay/webhook", `${apiBase.href.replace(/\/?$/, "/")}`).href;

  return (
    <>
      <h1 className="page-title">Cấu hình Hệ thống</h1>

      <div className="card">
        <h3>Bảo mật quản trị viên</h3>
        <p>Đổi mật khẩu cấp 2 của tài khoản admin này. Sau khi đổi, bạn cần xác minh lại để tiếp tục quản trị.</p>
        {securityError && <div className="alert-error auth-alert" role="alert">{securityError}</div>}
        <form className="auth-form" onSubmit={changeSecondPassword} style={{ maxWidth: "480px" }}>
          <div className="form-group-premium">
            <label htmlFor="security-primary-password">Mật khẩu đăng nhập hiện tại</label>
            <input id="security-primary-password" type="password" autoComplete="current-password" required
              value={securityForm.currentPassword} onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })} />
          </div>
          <div className="form-group-premium">
            <label htmlFor="security-old-second">Mật khẩu cấp 2 hiện tại</label>
            <input id="security-old-second" type="password" autoComplete="off" required
              value={securityForm.oldSecondPassword} onChange={(e) => setSecurityForm({ ...securityForm, oldSecondPassword: e.target.value })} />
          </div>
          <div className="form-group-premium">
            <label htmlFor="security-new-second">Mật khẩu cấp 2 mới</label>
            <input id="security-new-second" type="password" autoComplete="new-password" required minLength={12} maxLength={72}
              value={securityForm.newSecondPassword} onChange={(e) => setSecurityForm({ ...securityForm, newSecondPassword: e.target.value })} />
          </div>
          <div className="form-group-premium">
            <label htmlFor="security-confirm-second">Nhập lại mật khẩu cấp 2 mới</label>
            <input id="security-confirm-second" type="password" autoComplete="new-password" required minLength={12} maxLength={72}
              value={securityForm.confirmPassword} onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} />
          </div>
          <button className="btn-primary" type="submit" disabled={securityBusy}>
            {securityBusy ? "Đang đổi…" : "Đổi mật khẩu cấp 2"}
          </button>
        </form>
      </div>

      {/* ── Thông tin website ── */}
      <div className="card">
        <h3>Thông tin Website</h3>
        <div className="form-grid" style={{ marginTop: "16px" }}>
          <div className="form-group-premium">
            <label htmlFor="admin-setting-site-name">Tên Website</label>
            <input
              id="admin-setting-site-name"
              placeholder="VD: ShopGameLiQi"
              value={form.ten_web || ""}
              onChange={(e) => set("ten_web", e.target.value)}
            />
          </div>

          <div className="form-group-premium">
            <label htmlFor="admin-setting-email">Email liên hệ</label>
            <input
              id="admin-setting-email"
              type="email"
              placeholder="admin@example.com"
              value={form.email || ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div className="form-group-premium">
            <label htmlFor="admin-setting-facebook">Facebook Admin</label>
            <input
              id="admin-setting-facebook"
              placeholder="https://facebook.com/..."
              value={form.fb_admin || ""}
              onChange={(e) => set("fb_admin", e.target.value)}
            />
          </div>

          <div className="form-group-premium">
            <label htmlFor="admin-setting-phone">Số điện thoại / Zalo</label>
            <input
              id="admin-setting-phone"
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
            <label htmlFor="admin-setting-home-notice">Thông báo hiển thị trên trang chủ</label>
            <textarea
              id="admin-setting-home-notice"
              className="full"
              placeholder="Nhập nội dung thông báo..."
              value={form.thongbao || ""}
              onChange={(e) => set("thongbao", e.target.value)}
              rows={6}
              style={{ resize: "vertical", minHeight: "130px" }}
            />
          </div>

        </div>
      </div>

      {/* ── Thanh toán & CTV ── */}
      <div className="card">
        <h3>Thanh toán & Cộng tác viên</h3>
        <div className="form-grid" style={{ marginTop: "16px" }}>
          <div className="form-group-premium">
            <label htmlFor="admin-setting-sepay-secret">Khóa bảo mật webhook SePay</label>
            <p role="status" style={{ margin: "0 0 8px", color: "var(--text-secondary)" }}>
              {form.sepay_configured ? "Nạp tự động đã được cấu hình." : "Chưa có khóa SePay. Nạp tự động đang tắt."}
            </p>
            <div style={{ position: "relative" }}>
              <input
                id="admin-setting-sepay-secret"
                type={showSecret ? "text" : "password"}
                autoComplete="new-password"
                minLength={16}
                placeholder={form.sepay_secret_saved ? "Để trống nếu không đổi khóa" : "Dán khóa HMAC từ SePay"}
                value={sepaySecretInput}
                onChange={(e) => setSepaySecretInput(e.target.value)}
                style={{ paddingRight: "44px", width: "100%" }}
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                aria-label={showSecret ? "Ẩn khóa bí mật SePay" : "Hiện khóa bí mật SePay"}
                aria-pressed={showSecret}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <small style={{ color: "var(--text-secondary)", display: "block", marginTop: "8px" }}>
              Khóa chỉ được gửi khi bạn lưu, sau đó không hiển thị lại trong Admin hoặc API.
              Webhook: {webhookUrl}
            </small>
            <Link to="/admin/banks" style={{ marginTop: "8px", display: "inline-block" }}>Cấu hình tài khoản ngân hàng nhận tiền</Link>
          </div>

          <div className="form-group-premium">
            <label htmlFor="admin-setting-ctv-rate">Hoa hồng CTV (%)</label>
            <input
              id="admin-setting-ctv-rate"
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
        <button className="small-btn" onClick={save} disabled={saving} aria-busy={saving} style={{ padding: "12px 28px", fontSize: "0.95rem" }}>
          {saving ? "Đang lưu cấu hình…" : "Lưu toàn bộ cấu hình"}
        </button>
      </div>
    </>
  );
}
