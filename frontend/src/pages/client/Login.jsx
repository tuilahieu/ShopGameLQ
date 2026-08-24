import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../../api/api";
import { User, Lock, LogIn, AlertCircle, Gamepad2 } from "lucide-react";
import { updateSEO } from "../../utils/seo";
import TurnstileCaptcha from "../../components/TurnstileCaptcha";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    updateSEO({
      title: "Đăng Nhập Tài Khoản",
      description: "Đăng nhập hệ thống để thực hiện mua acc game Liên Quân Mobile tự động, an toàn và bảo mật.",
      keywords: "dang nhap, login shop acc, mua acc game"
    });
  }, []);

  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaResetRef = useRef(null);
  const captchaEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const onCaptchaToken = useCallback((token) => setCaptchaToken(token), []);

  async function submit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (captchaEnabled && !captchaToken) {
      setErrorMsg("Vui lòng hoàn tất xác minh captcha.");
      return;
    }
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { ...form, captcha_token: captchaToken || undefined });
      const data = res.data.data;

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      const lvl = Number(data.user.level);
      if (lvl === 99) {
        navigate("/admin");
      } else if (lvl === 1) {
        navigate("/ctv");
      } else {
        const redirect = new URLSearchParams(location.search).get("redirect");
        navigate(redirect?.startsWith("/") ? redirect : "/");
      }
      window.location.reload(); // Reload to refresh layout wallet context
    } catch (error) {
      captchaResetRef.current?.();
      setErrorMsg(error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header-logo">
          <div className="auth-game-mark"><Gamepad2 size={27} aria-hidden="true" /></div>
          <h1>Đăng nhập</h1>
          <p>Vào tài khoản để mua acc và xem đơn hàng.</p>
        </div>

        {errorMsg && (
          <div className="alert-error auth-alert" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <div className="form-group-premium">
            <label htmlFor="login-username" className="auth-field-label">
              <User size={15} aria-hidden="true" /> Tên đăng nhập
            </label>
            <input
              id="login-username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              placeholder="Nhập tên đăng nhập"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label htmlFor="login-password" className="auth-field-label">
              <Lock size={15} aria-hidden="true" /> Mật khẩu
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <TurnstileCaptcha onToken={onCaptchaToken} resetRef={captchaResetRef} />

          <button disabled={loading || (captchaEnabled && !captchaToken)} aria-busy={loading} className="btn-primary auth-submit">
            <LogIn size={18} aria-hidden="true" /> {loading ? "Đang xử lý…" : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-footer-text">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
