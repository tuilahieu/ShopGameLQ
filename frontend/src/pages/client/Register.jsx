import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { User, Lock, UserPlus, AlertCircle, Gamepad2 } from "lucide-react";
import { updateSEO } from "../../utils/seo";
import TurnstileCaptcha from "../../components/TurnstileCaptcha";

export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    updateSEO({
      title: "Đăng Ký Tài Khoản Mới",
      description: "Đăng ký tài khoản mới nhanh chóng trong 10 giây để mua nick game tự động, bảo hành uy tín.",
      keywords: "dang ky, register shop acc, mua acc game"
    });
  }, []);

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: ""
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

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (captchaEnabled && !captchaToken) {
      setErrorMsg("Vui lòng hoàn tất xác minh captcha.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        username: form.username,
        password: form.password,
        captcha_token: captchaToken || undefined,
      });
      alert("Đăng ký thành công! Hãy đăng nhập để tiếp tục mua acc.");
      navigate("/login");
    } catch (error) {
      captchaResetRef.current?.();
      setErrorMsg(error.response?.data?.message || "Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header-logo">
          <div className="auth-game-mark"><Gamepad2 size={27} aria-hidden="true" /></div>
          <h1>Tạo tài khoản</h1>
          <p>Đăng ký miễn phí để mua acc và nhận thông tin tự động.</p>
        </div>

        {errorMsg && (
          <div className="alert-error auth-alert" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <div className="form-group-premium">
            <label htmlFor="register-username" className="auth-field-label">
              <User size={15} aria-hidden="true" /> Tên đăng nhập
            </label>
            <input
              id="register-username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              minLength={4}
              maxLength={16}
              placeholder="Tên đăng nhập (4 - 16 ký tự)"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label htmlFor="register-password" className="auth-field-label">
              <Lock size={15} aria-hidden="true" /> Mật khẩu
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={4}
              maxLength={16}
              placeholder="Mật khẩu (4 - 16 ký tự)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label htmlFor="register-password-confirm" className="auth-field-label">
              <Lock size={15} aria-hidden="true" /> Xác nhận mật khẩu
            </label>
            <input
              id="register-password-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={4}
              maxLength={16}
              placeholder="Nhập lại mật khẩu"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          <TurnstileCaptcha onToken={onCaptchaToken} resetRef={captchaResetRef} />

          <button disabled={loading || (captchaEnabled && !captchaToken)} aria-busy={loading} className="btn-primary auth-submit">
            <UserPlus size={18} aria-hidden="true" /> {loading ? "Đang xử lý…" : "Tạo tài khoản"}
          </button>
        </form>

        <div className="auth-footer-text">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
}
