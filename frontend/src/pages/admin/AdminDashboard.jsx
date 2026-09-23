import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { Users, Gamepad2, Eye, EyeOff, ShoppingBag, History, Landmark, Plus, PackageSearch, Settings2 } from "lucide-react";
import { PageHeading, StatCard, StatusMessage } from "../../components/Ui";
import SkeletonLoading from "../../components/SkeletonLoading";

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

  if (!data && !error) return <SkeletonLoading variant="stats" items={8} label="Đang tải số liệu tổng quan" />;
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
        <StatCard label="Doanh thu" value={`${Number(data.revenue).toLocaleString()}đ`} icon={Landmark} tone="success" className="ui-stat-card--wide-value" />
      </div>

      <section className="admin-quick-actions" aria-labelledby="admin-quick-actions-title">
        <div className="admin-section-heading">
          <div>
            <span className="admin-section-kicker">Lối tắt thao tác</span>
            <h2 id="admin-quick-actions-title">Việc cần làm nhanh</h2>
          </div>
          <span className="admin-section-hint">Các khu vực thường dùng nhất</span>
        </div>
        <div className="admin-quick-action-grid">
          <Link to="/admin/accounts" className="admin-quick-action">
            <span className="admin-quick-action-icon"><Plus size={20} aria-hidden="true" /></span>
            <span><strong>Thêm tài khoản</strong><small>Đưa acc mới vào kho bán</small></span>
          </Link>
          <Link to="/admin/orders" className="admin-quick-action">
            <span className="admin-quick-action-icon is-warm"><PackageSearch size={20} aria-hidden="true" /></span>
            <span><strong>Kiểm tra đơn hàng</strong><small>Xem giao dịch và trạng thái mới</small></span>
          </Link>
          <Link to="/admin/setting" className="admin-quick-action">
            <span className="admin-quick-action-icon is-mint"><Settings2 size={20} aria-hidden="true" /></span>
            <span><strong>Cập nhật cửa hàng</strong><small>Banner, thông báo và hỗ trợ</small></span>
          </Link>
        </div>
      </section>
    </div>
  );
}
