import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { AdminField } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true); setMessage("");
    try {
      const res = await api.post("/auth/login", form);
      const data = res.data?.data;
      if (res.data.success && data?.accessToken) {
        sessionStorage.removeItem("adminSession");
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (Number(data.user.level) !== 99) { setMessage("Tài khoản này không có quyền admin"); localStorage.clear(); return; }
        navigate("/admin");
      } else setMessage(res.data.message || "Đăng nhập thất bại");
    } catch (error) { setMessage(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại"); } finally { setLoading(false); }
  }

  return <div className="admin-login-page admin-gate-page"><Card className="auth-card"><CardHeader><div className="admin-gate-card-icon" aria-hidden="true"><ShieldCheck size={22} /></div><CardTitle>Admin Login</CardTitle><CardDescription>Đăng nhập quản trị hệ thống</CardDescription></CardHeader><CardContent><form className="auth-form" onSubmit={handleSubmit}>{message && <div className="alert-error auth-alert" role="alert">{message}</div>}<AdminField id="admin-login-username" label="Tên đăng nhập" required><Input id="admin-login-username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="admin123" required /></AdminField><AdminField id="admin-login-password" label="Mật khẩu" required><Input id="admin-login-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="••••••••" autoComplete="current-password" required /></AdminField><Button className="auth-submit" type="submit" disabled={loading}>{loading ? "Đang đăng nhập…" : "Đăng nhập"}</Button></form></CardContent></Card></div>;
}
