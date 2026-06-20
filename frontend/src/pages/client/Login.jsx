import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { User, Lock, LogIn, AlertCircle } from "lucide-react";
import { updateSEO } from "../../utils/seo";

export default function Login() {
  const navigate = useNavigate();

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

  async function submit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
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
        navigate("/");
      }
      window.location.reload(); // Reload to refresh layout wallet context
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header-logo">
          <div style={{ fontSize: "2.5rem" }}>🎮</div>
          <h2>ĐĂNG NHẬP</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Nhập thông tin tài khoản của bạn để tiếp tục</p>
        </div>

        {errorMsg && (
          <div className="alert-error" style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group-premium">
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <User size={14} /> Tên đăng nhập
            </label>
            <input
              placeholder="Nhập username của bạn"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={14} /> Mật khẩu
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button disabled={loading} className="btn-primary" style={{ width: "100%", padding: "12px", marginTop: "8px" }}>
            <LogIn size={16} /> {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
          </button>
        </form>

        <div className="auth-footer-text">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
