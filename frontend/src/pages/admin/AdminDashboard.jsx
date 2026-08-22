import { useEffect, useState } from "react";
import api from "../../api/api";
import { Users, Gamepad2, Eye, EyeOff, ShoppingBag, History, Landmark } from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setError("");
    try {
      const res = await api.get("/admin/dashboard");
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Không thể tải số liệu tổng quan.");
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  if (!data && !error) return <div className="empty-state">Đang tải số liệu tổng quan...</div>;
  if (error) return <div className="empty-state"><p>{error}</p><button className="btn-primary" onClick={loadDashboard}>Thử lại</button></div>;

  return (
    <div>
      <h1 className="page-title">Tổng quan hệ thống</h1>

      <div className="card-grid">
        <div className="dashboard-card">
          <h3>Thành viên</h3>
          <strong>{data.totalUsers}</strong>
          <Users className="card-icon" size={36} />
        </div>
        <div className="dashboard-card">
          <h3>Tổng tài khoản</h3>
          <strong>{data.totalAccounts}</strong>
          <Gamepad2 className="card-icon" size={36} />
        </div>
        <div className="dashboard-card">
          <h3>Đang bán</h3>
          <strong style={{ color: "var(--green-color)" }}>{data.sellingAccounts}</strong>
          <Eye className="card-icon" size={36} style={{ color: "var(--green-color)" }} />
        </div>
        <div className="dashboard-card">
          <h3>Đã bán</h3>
          <strong style={{ color: "var(--gold-color)" }}>{data.soldAccounts}</strong>
          <EyeOff className="card-icon" size={36} style={{ color: "var(--gold-color)" }} />
        </div>
        <div className="dashboard-card">
          <h3>Đã ẩn</h3>
          <strong>{data.hiddenAccounts}</strong>
          <EyeOff className="card-icon" size={36} />
        </div>
        <div className="dashboard-card">
          <h3>Đơn hàng</h3>
          <strong>{data.totalOrders}</strong>
          <ShoppingBag className="card-icon" size={36} />
        </div>
        <div className="dashboard-card">
          <h3>Giao dịch</h3>
          <strong>{data.totalTransactions}</strong>
          <History className="card-icon" size={36} />
        </div>
        <div className="dashboard-card">
          <h3>Doanh thu</h3>
          <strong style={{ color: "var(--green-color)" }}>{Number(data.revenue).toLocaleString()}đ</strong>
          <Landmark className="card-icon" size={36} style={{ color: "var(--green-color)" }} />
        </div>
      </div>
    </div>
  );
}
