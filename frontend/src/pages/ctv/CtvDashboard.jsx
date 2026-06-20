import { useEffect, useState } from "react";
import api from "../../api/api";
import { Gamepad2, ShoppingBag, Eye, EyeOff, CheckSquare } from "lucide-react";

export default function CtvDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/ctv/dashboard")
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        console.error("Failed to load CTV dashboard:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: "var(--text-secondary)", padding: "24px" }}>Đang tải thống kê...</div>;
  }

  if (!data) {
    return <div style={{ color: "var(--accent-color)", padding: "24px" }}>Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.</div>;
  }

  return (
    <div>
      <h1 className="page-title">Dashboard Cộng Tác Viên</h1>

      <div className="card-grid">
        <div className="dashboard-card">
          <h3>Tổng accounts đăng</h3>
          <strong>{data.totalAccounts}</strong>
          <Gamepad2 className="card-icon" size={36} style={{ color: "var(--cyan-color)" }} />
        </div>

        <div className="dashboard-card">
          <h3>Accounts đang bán</h3>
          <strong style={{ color: "var(--green-color)" }}>{data.sellingAccounts}</strong>
          <Eye className="card-icon" size={36} style={{ color: "var(--green-color)" }} />
        </div>

        <div className="dashboard-card">
          <h3>Accounts đã bán</h3>
          <strong style={{ color: "var(--gold-color)" }}>{data.soldAccounts}</strong>
          <CheckSquare className="card-icon" size={36} style={{ color: "var(--gold-color)" }} />
        </div>

        <div className="dashboard-card">
          <h3>Accounts đã ẩn</h3>
          <strong>{data.hiddenAccounts}</strong>
          <EyeOff className="card-icon" size={36} style={{ color: "var(--text-secondary)" }} />
        </div>

        <div className="dashboard-card">
          <h3>Tổng tiền đã bán</h3>
          <strong style={{ color: "var(--gold-color)" }}>{Number(data.totalEarned || 0).toLocaleString()}đ</strong>
          <ShoppingBag className="card-icon" size={36} style={{ color: "var(--accent-color)" }} />
        </div>

        <div className="dashboard-card">
          <h3>Đơn hàng đã bán</h3>
          <strong>{data.totalOrders} đơn hàng</strong>
          <ShoppingBag className="card-icon" size={36} />
        </div>
      </div>
    </div>
  );
}
