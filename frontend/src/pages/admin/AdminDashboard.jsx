import { useEffect, useState } from "react";
import api from "../../api/api";
import { Users, Gamepad2, Eye, EyeOff, ShoppingBag, History, Landmark } from "lucide-react";
import { PageHeading, StatCard, StatusMessage } from "../../components/Ui";

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

  if (!data && !error) return <StatusMessage title="Đang tải số liệu tổng quan…" />;
  if (error) return <StatusMessage title="Không thể tải tổng quan" description={error} action={<button className="btn-primary" onClick={loadDashboard}>Thử lại</button>} />;

  return (
    <div>
      <PageHeading description="Theo dõi hoạt động cửa hàng và xử lý công việc hằng ngày.">Tổng quan hệ thống</PageHeading>

      <div className="card-grid">
        <StatCard label="Thành viên" value={data.totalUsers} icon={Users} />
        <StatCard label="Tổng tài khoản" value={data.totalAccounts} icon={Gamepad2} />
        <StatCard label="Đang bán" value={data.sellingAccounts} icon={Eye} tone="success" />
        <StatCard label="Đã bán" value={data.soldAccounts} icon={EyeOff} tone="price" />
        <StatCard label="Đã ẩn" value={data.hiddenAccounts} icon={EyeOff} />
        <StatCard label="Đơn hàng" value={data.totalOrders} icon={ShoppingBag} />
        <StatCard label="Giao dịch" value={data.totalTransactions} icon={History} />
        <StatCard label="Doanh thu" value={`${Number(data.revenue).toLocaleString()}đ`} icon={Landmark} tone="success" />
      </div>
    </div>
  );
}
