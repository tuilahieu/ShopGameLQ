import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { ArrowLeft, Gamepad2, LockKeyhole, ShieldCheck } from "lucide-react";
import { AuthCard, AuthField } from "../../components/client/AuthUi";
import { Skeleton } from "../../components/ui/skeleton";
import ThemeToggle from "../../components/ThemeToggle";
import { utf8ByteLength } from "../../utils/browserCompat";

function AdminGateShell({ children }) {
  return (
    <main className="admin-gate-page">
      <div className="admin-gate-tools"><ThemeToggle compact /></div>
      <div className="admin-gate-shell">
        <header className="admin-gate-intro">
          <div className="admin-gate-brand">
            <span className="admin-gate-brand-mark" aria-hidden="true">S</span>
            <strong>SHOP Liên Quân</strong>
          </div>
        </header>
        <section className="admin-gate-card-area" aria-label="Biểu mẫu xác minh quản trị">
          {children}
        </section>
      </div>
    </main>
  );
}

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
    if (mode === "setup" && (Array.from(form.secondPassword).length < 12 || utf8ByteLength(form.secondPassword) > 72)) {
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
  if (mode === "loading") return (
    <AdminGateShell><AuthCard
      title="Đang kiểm tra…"
      footer={<Link className="admin-gate-home-link" to="/"><ArrowLeft size={16} aria-hidden="true" /> Về cửa hàng</Link>}
    >
      <div className="ui-dashboard-loading admin-gate-loading" role="status" aria-label="Đang tải">
        <Skeleton className="ui-skeleton-line" />
        <Skeleton className="ui-skeleton-line" />
        <Skeleton className="ui-skeleton-line" />
      </div>
    </AuthCard></AdminGateShell>
  );
  if (mode === "error") return (
    <AdminGateShell><AuthCard
      title="Không thể xác minh"
      error={error}
      footer={<Link className="admin-gate-home-link" to="/"><ArrowLeft size={16} aria-hidden="true" /> Về cửa hàng</Link>}
    /></AdminGateShell>
  );

  return (
    <AdminGateShell><AuthCard
      title={mode === "setup" ? "Tạo mật khẩu cấp 2" : "Xác minh quản trị"}
      error={error}
      footer={<Link className="admin-gate-home-link" to="/"><ArrowLeft size={16} aria-hidden="true" /> Về cửa hàng</Link>}
    >
      <form className="auth-form" autoComplete="off" onSubmit={submit}>
        {mode === "setup" && (
          <AuthField
            id="admin-current-password"
            icon={LockKeyhole}
            label="Mật khẩu đăng nhập hiện tại"
            name="currentPassword"
            type="password"
            autoComplete="off"
            placeholder="Nhập mật khẩu hiện tại"
            value={form.currentPassword}
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            required
          />
        )}
        <AuthField
          id="admin-second-password"
          icon={LockKeyhole}
          label="Mật khẩu cấp 2"
          name="secondPassword"
          type="password"
          autoComplete="off"
          minLength={mode === "setup" ? 12 : undefined}
          maxLength={72}
          placeholder={mode === "setup" ? "Tối thiểu 12 ký tự" : "Nhập mật khẩu cấp 2"}
          value={form.secondPassword}
          onChange={(event) => setForm({ ...form, secondPassword: event.target.value })}
          required
        />
        {mode === "setup" && (
          <AuthField
            id="admin-confirm-password"
            icon={LockKeyhole}
            label="Nhập lại mật khẩu cấp 2"
            name="confirmPassword"
            type="password"
            autoComplete="off"
            minLength={12}
            maxLength={72}
            placeholder="Nhập lại mật khẩu cấp 2"
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            required
          />
        )}
        <button className="btn-primary auth-submit" type="submit" disabled={busy} aria-busy={busy}>
          {busy ? <Gamepad2 size={18} aria-hidden="true" /> : <ShieldCheck size={18} aria-hidden="true" />}
          {busy ? "Đang xử lý…" : mode === "setup" ? "Lưu mật khẩu" : "Tiếp tục"}
        </button>
      </form>
    </AuthCard></AdminGateShell>
  );
}
