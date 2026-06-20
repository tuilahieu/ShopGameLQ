import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const res = await api.post("/auth/login", form);

      const data = res.data?.data;

      if (res.data.success && data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (Number(data.user.level) !== 99) {
          setMessage("Tài khoản này không có quyền admin");
          localStorage.clear();
          return;
        }

        navigate("/admin");
      } else {
        setMessage(res.data.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <p>Đăng nhập quản trị hệ thống</p>

        {message && <div className="alert">{message}</div>}

        <label>Tên đăng nhập</label>
        <input
          value={form.username}
          onChange={(e) =>
            setForm({
              ...form,
              username: e.target.value,
            })
          }
          placeholder="admin123"
        />

        <label>Mật khẩu</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
          placeholder="********"
        />

        <button disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
