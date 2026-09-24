import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { User, Lock, UserPlus } from "lucide-react";
import TurnstileCaptcha from "../../components/TurnstileCaptcha";
import { AuthCard, AuthField } from "../../components/client/AuthUi";
import usePageSeo from "../../hooks/usePageSeo";
import useTurnstileCaptcha from "../../hooks/useTurnstileCaptcha";
import { getApiErrorMessage } from "../../utils/apiError";

export default function Register() {
  const navigate = useNavigate();

  usePageSeo({
    title: "Đăng Ký Tài Khoản Mới",
    description: "Đăng ký tài khoản mới nhanh chóng trong 10 giây để mua nick game tự động, bảo hành uy tín.",
    keywords: "dang ky, register shop acc, mua acc game",
  });

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { captchaToken, captchaResetRef, captchaEnabled, onCaptchaToken, resetCaptcha } = useTurnstileCaptcha();

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
      resetCaptcha();
      setErrorMsg(getApiErrorMessage(error, "Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Tạo tài khoản"
      description="Đăng ký miễn phí để mua acc và nhận thông tin tự động."
      error={errorMsg}
      footer={<>Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></>}
    >
      <form onSubmit={submit} className="auth-form">
          <AuthField
              id="register-username"
              icon={User}
              label="Tên đăng nhập"
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
          <AuthField
              id="register-password"
              icon={Lock}
              label="Mật khẩu"
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
          <AuthField
              id="register-password-confirm"
              icon={Lock}
              label="Xác nhận mật khẩu"
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

          <TurnstileCaptcha onToken={onCaptchaToken} resetRef={captchaResetRef} />

          <button disabled={loading || (captchaEnabled && !captchaToken)} aria-busy={loading} className="btn-primary auth-submit">
            <UserPlus size={18} aria-hidden="true" /> {loading ? "Đang xử lý…" : "Tạo tài khoản"}
          </button>
      </form>
    </AuthCard>
  );
}
