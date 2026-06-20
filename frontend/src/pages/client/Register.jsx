import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { User, Lock, UserPlus, AlertCircle } from "lucide-react";
import { updateSEO } from "../../utils/seo";

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

  async function submit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        username: form.username,
        password: form.password
      });
      alert("Đăng ký thành công! Hãy đăng nhập để tiếp tục mua acc.");
      navigate("/login");
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header-logo">
          <div style={{ fontSize: "2.5rem" }}>🎮</div>
          <h2>ĐĂNG KÝ THÀNH VIÊN</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Tạo tài khoản mua nick Liên Quân hoàn toàn miễn phí</p>
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
              placeholder="Nhập username mong muốn"
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
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={14} /> Xác nhận mật khẩu
            </label>
            <input
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button disabled={loading} className="btn-primary" style={{ width: "100%", padding: "12px", marginTop: "8px" }}>
            <UserPlus size={16} /> {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
          </button>
        </form>

        <div className="auth-footer-text">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
}
