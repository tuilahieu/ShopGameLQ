import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../../api/api";
import { User, Lock, LogIn } from "lucide-react";
import TurnstileCaptcha from "../../components/TurnstileCaptcha";
import { AuthCard, AuthField } from "../../components/client/AuthUi";
import usePageSeo from "../../hooks/usePageSeo";
import useTurnstileCaptcha from "../../hooks/useTurnstileCaptcha";
import { getApiErrorMessage } from "../../utils/apiError";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  usePageSeo({
    title: "Đăng Nhập Tài Khoản",
    description: "Đăng nhập hệ thống để thực hiện mua acc game Liên Quân Mobile tự động, an toàn và bảo mật.",
    keywords: "dang nhap, login shop acc, mua acc game",
  });

  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { captchaToken, captchaResetRef, captchaEnabled, onCaptchaToken, resetCaptcha } = useTurnstileCaptcha();

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

      sessionStorage.removeItem("adminSession");
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
      resetCaptcha();
      setErrorMsg(getApiErrorMessage(error, "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Đăng nhập"
      description="Vào tài khoản để mua acc và xem đơn hàng."
      error={errorMsg}
      footer={<>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></>}
    >
      <form onSubmit={submit} className="auth-form">
          <AuthField
              id="login-username"
              icon={User}
              label="Tên đăng nhập"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              maxLength={16}
              placeholder="Nhập tên đăng nhập"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          <AuthField
              id="login-password"
              icon={Lock}
              label="Mật khẩu"
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={16}
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

          <TurnstileCaptcha onToken={onCaptchaToken} resetRef={captchaResetRef} />

          <button disabled={loading || (captchaEnabled && !captchaToken)} aria-busy={loading} className="btn-primary auth-submit">
            <LogIn size={18} aria-hidden="true" /> {loading ? "Đang xử lý…" : "Đăng nhập"}
          </button>
      </form>
    </AuthCard>
  );
}
