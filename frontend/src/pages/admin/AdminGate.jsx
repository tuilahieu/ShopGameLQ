import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";

export default function AdminGate({ children }) {
  const [mode, setMode] = useState("loading");
  const [expiresAt, setExpiresAt] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", secondPassword: "", confirmPassword: "" });

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const status = await api.get("/auth/admin-security/status");
        if (!active) return;
        if (!status.data.data.configured) {
          sessionStorage.removeItem("adminSession");
          setMode("setup");
          return;
        }
        if (!sessionStorage.getItem("adminSession")) {
          setMode("verify");
          return;
        }
        const session = await api.get("/auth/admin-security/session");
        if (active) {
          setExpiresAt(session.data.data.expiresAt);
          setMode("ready");
        }
      } catch (err) {
        if (!active) return;
        if (err.response?.data?.code === "ADMIN_SECOND_FACTOR_REQUIRED") {
          sessionStorage.removeItem("adminSession");
          setMode("verify");
        } else {
          setError(err.response?.data?.message || "Không thể kiểm tra phiên quản trị. Vui lòng tải lại trang.");
          setMode("error");
        }
      }
    }
    check();
    const invalidate = () => { sessionStorage.removeItem("adminSession"); setExpiresAt(null); setMode("verify"); };
    window.addEventListener("admin-session-expired", invalidate);
    return () => { active = false; window.removeEventListener("admin-session-expired", invalidate); };
  }, []);

  useEffect(() => {
    if (mode !== "ready" || !expiresAt) return;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      sessionStorage.removeItem("adminSession");
      setMode("verify");
      return;
    }
    const timer = window.setTimeout(() => {
      sessionStorage.removeItem("adminSession");
      setMode("verify");
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [mode, expiresAt]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (mode === "setup" && form.secondPassword !== form.confirmPassword) {
      setError("Hai lần nhập mật khẩu cấp 2 chưa khớp.");
      return;
    }
    if (mode === "setup" && (Array.from(form.secondPassword).length < 12 || new TextEncoder().encode(form.secondPassword).length > 72)) {
      setError("Mật khẩu cấp 2 cần ít nhất 12 ký tự và tối đa 72 byte.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "setup") {
        await api.post("/auth/admin-security/setup", {
          currentPassword: form.currentPassword,
          secondPassword: form.secondPassword,
        });
        setForm({ currentPassword: "", secondPassword: "", confirmPassword: "" });
        setMode("verify");
      } else {
        const response = await api.post("/auth/admin-security/verify", { secondPassword: form.secondPassword });
        sessionStorage.setItem("adminSession", response.data.data.adminSession);
        setExpiresAt(response.data.data.expiresAt);
        setForm({ currentPassword: "", secondPassword: "", confirmPassword: "" });
        setMode("ready");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xác minh. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "ready") return children;
  if (mode === "loading") return <div className="auth-page-wrapper"><div className="auth-card">Đang kiểm tra quyền quản trị…</div></div>;
  if (mode === "error") return <div className="auth-page-wrapper"><div className="auth-card" role="alert">{error}<p><Link to="/">Về trang chủ</Link></p></div></div>;
  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header-logo">
          <h1>{mode === "setup" ? "Thiết lập mật khẩu cấp 2" : "Xác minh quản trị viên"}</h1>
          <p>{mode === "setup"
            ? "Mỗi admin cần đặt một mật khẩu cấp 2 riêng trước khi truy cập khu quản trị. Mật khẩu này phải khác mật khẩu đăng nhập."
            : "Nhập mật khẩu cấp 2 để mở khu quản trị trong 30 phút."}</p>
        </div>
        {error && <div className="alert-error auth-alert" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          {mode === "setup" && <div className="form-group-premium">
            <label htmlFor="admin-current-password">Mật khẩu đăng nhập hiện tại</label>
            <input id="admin-current-password" type="password" autoComplete="current-password" required
              value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          </div>}
          <div className="form-group-premium">
            <label htmlFor="admin-second-password">Mật khẩu cấp 2</label>
            <input id="admin-second-password" type="password" autoComplete={mode === "setup" ? "new-password" : "off"}
              required minLength={mode === "setup" ? 12 : undefined} maxLength={72}
              value={form.secondPassword} onChange={(e) => setForm({ ...form, secondPassword: e.target.value })} />
          </div>
          {mode === "setup" && <div className="form-group-premium">
            <label htmlFor="admin-confirm-password">Nhập lại mật khẩu cấp 2</label>
            <input id="admin-confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={72}
              value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>}
          <button className="btn-primary auth-submit" type="submit" disabled={busy}>
            {busy ? "Đang xử lý…" : mode === "setup" ? "Lưu mật khẩu cấp 2" : "Xác minh và vào quản trị"}
          </button>
        </form>
        <p className="auth-footer-text"><Link to="/">Về trang chủ</Link></p>
      </div>
    </div>
  );
}
