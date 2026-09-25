import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { ArrowRight, Clock3, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { AdminField } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";

function AdminGateFrame({ children }) {
  return (
    <div className="auth-page-wrapper admin-gate-page">
      <div className="admin-gate-shell">
        <section className="admin-gate-intro" aria-label="Thông tin khu quản trị">
          <div className="admin-gate-brand">
            <span className="admin-gate-brand-mark" aria-hidden="true">S</span>
            <span><small>SHOP LIÊN QUÂN</small><strong>Admin console</strong></span>
          </div>
          <div className="admin-gate-intro-copy">
            <span className="admin-gate-eyebrow"><ShieldCheck size={15} aria-hidden="true" /> Khu vực bảo mật</span>
            <h1>Xác minh trước khi vào khu quản trị</h1>
            <p>Một bước kiểm tra ngắn giúp bảo vệ kho tài khoản, giao dịch và cấu hình quan trọng của shop.</p>
          </div>
          <div className="admin-gate-trust-list">
            <div><span className="admin-gate-trust-icon"><Clock3 size={17} aria-hidden="true" /></span><span><strong>Phiên riêng trong 30 phút</strong><small>Hết hạn tự động khi không còn sử dụng</small></span></div>
            <div><span className="admin-gate-trust-icon"><KeyRound size={17} aria-hidden="true" /></span><span><strong>Tách biệt mật khẩu đăng nhập</strong><small>Giảm rủi ro với các thao tác nhạy cảm</small></span></div>
          </div>
        </section>
        <section className="admin-gate-card-area">{children}</section>
      </div>
    </div>
  );
}

export default function AdminGate({ children }) {
  const [mode, setMode] = useState("loading");
  const [expiresAt, setExpiresAt] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSecondPassword, setShowSecondPassword] = useState(false);
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
  if (mode === "loading") return <AdminGateFrame><Card className="auth-card"><CardHeader><CardTitle>Đang kiểm tra quyền quản trị</CardTitle></CardHeader><CardContent className="ui-dashboard-loading"><Skeleton className="ui-skeleton-line" /><Skeleton className="ui-skeleton-line" /></CardContent></Card></AdminGateFrame>;
  if (mode === "error") return <AdminGateFrame><Card className="auth-card" role="alert"><CardContent><div className="admin-gate-error-mark"><ShieldCheck size={22} aria-hidden="true" /></div><p className="admin-gate-error-copy">{error}</p><Link className="admin-gate-home-link" to="/">Về trang chủ <ArrowRight size={15} aria-hidden="true" /></Link></CardContent></Card></AdminGateFrame>;
  return (
    <AdminGateFrame>
      <Card className="auth-card">
        <div className="admin-gate-card-icon" aria-hidden="true"><ShieldCheck size={22} /></div>
        <div className="auth-header-logo">
          <h1>{mode === "setup" ? "Thiết lập mật khẩu cấp 2" : "Xác minh quản trị viên"}</h1>
          <p>{mode === "setup"
            ? "Mỗi admin cần đặt một mật khẩu cấp 2 riêng trước khi truy cập khu quản trị. Mật khẩu này phải khác mật khẩu đăng nhập."
            : "Nhập mật khẩu cấp 2 để mở khu quản trị trong 30 phút."}</p>
        </div>
        {error && <div className="alert-error auth-alert" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          {mode === "setup" && <AdminField id="admin-current-password" label="Mật khẩu đăng nhập hiện tại" required>
            <Input id="admin-current-password" type="password" autoComplete="current-password" required
              value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          </AdminField>}
          <AdminField id="admin-second-password" label="Mật khẩu cấp 2" required helper={mode === "setup" ? "Tối thiểu 12 ký tự, tối đa 72 byte." : "Phiên quản trị sẽ tự hết hạn sau 30 phút."}>
            <div className="admin-gate-password-control">
              <Input id="admin-second-password" type={showSecondPassword ? "text" : "password"} autoComplete={mode === "setup" ? "new-password" : "current-password"}
                required minLength={mode === "setup" ? 12 : undefined} maxLength={72}
                value={form.secondPassword} onChange={(e) => setForm({ ...form, secondPassword: e.target.value })} />
              <button type="button" onClick={() => setShowSecondPassword((visible) => !visible)} aria-label={showSecondPassword ? "Ẩn mật khẩu cấp 2" : "Hiện mật khẩu cấp 2"} aria-pressed={showSecondPassword}>
                {showSecondPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </div>
          </AdminField>
          {mode === "setup" && <AdminField id="admin-confirm-password" label="Nhập lại mật khẩu cấp 2" required>
            <Input id="admin-confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={72}
              value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </AdminField>}
          <Button className="auth-submit" type="submit" disabled={busy}>
            {busy ? "Đang xử lý…" : mode === "setup" ? "Lưu mật khẩu cấp 2" : "Xác minh và vào quản trị"}
          </Button>
        </form>
        <p className="auth-footer-text"><Link to="/">Về trang chủ</Link></p>
      </Card>
    </AdminGateFrame>
  );
}
