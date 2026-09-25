import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { ArrowRight, Boxes, CheckCircle2, CircleDollarSign, EyeOff, Gamepad2, Plus, ShoppingBag } from "lucide-react";
import { StatusMessage } from "../../components/Ui";
import { AdminPageHeader } from "../../components/admin/AdminUi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import SkeletonLoading from "../../components/SkeletonLoading";

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
    return <SkeletonLoading variant="stats" items={4} label="Đang tải số liệu cộng tác viên" />;
  }

  if (!data) {
    return <StatusMessage title="Không thể tải dữ liệu thống kê" description="Vui lòng tải lại trang để thử lại." />;
  }

  const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");
  const availablePercent = data.totalAccounts
    ? Math.min(100, Math.round((Number(data.sellingAccounts || 0) / Number(data.totalAccounts)) * 100))
    : 0;

  return (
    <div className="ctv-dashboard-page admin-accounts-page">
      <AdminPageHeader eyebrow="Cộng tác viên" title="Tổng quan bán hàng" description="Theo dõi kho tài khoản, đơn hàng và doanh thu của bạn." />

      <section className="ctv-overview-grid" aria-label="Các chỉ số cộng tác viên">
        <Card className="ctv-overview-card ctv-overview-primary"><CardContent><div className="ctv-metric-heading"><span><Gamepad2 size={18} aria-hidden="true" /></span><small>Tổng tài khoản</small></div><strong>{formatNumber(data.totalAccounts)}</strong><p>Tất cả tài khoản bạn đã đăng lên hệ thống</p><div className="ctv-metric-foot"><span className="is-success"><CheckCircle2 size={14} aria-hidden="true" /> {formatNumber(data.sellingAccounts)} đang bán</span></div></CardContent></Card>
        <Card className="ctv-overview-card"><CardContent><div className="ctv-metric-heading"><span><Boxes size={18} aria-hidden="true" /></span><small>Kho đang bán</small></div><strong>{formatNumber(data.sellingAccounts)}</strong><div className="admin-progress" role="progressbar" aria-label="Tỷ lệ tài khoản đang bán" aria-valuemin="0" aria-valuemax="100" aria-valuenow={availablePercent}><span style={{ transform: `scaleX(${availablePercent / 100})` }} /></div><p>{availablePercent}% kho đang hiển thị với khách</p><div className="ctv-metric-foot"><span>{formatNumber(data.hiddenAccounts)} tài khoản đã ẩn</span></div></CardContent></Card>
        <Card className="ctv-overview-card"><CardContent><div className="ctv-metric-heading"><span><ShoppingBag size={18} aria-hidden="true" /></span><small>Đơn đã bán</small></div><strong>{formatNumber(data.totalOrders)}</strong><p>Tổng đơn hàng đã phát sinh từ kho của bạn</p><div className="ctv-metric-foot"><span className="is-success"><CheckCircle2 size={14} aria-hidden="true" /> {formatNumber(data.soldAccounts)} tài khoản đã giao</span></div></CardContent></Card>
        <Card className="ctv-overview-card"><CardContent><div className="ctv-metric-heading"><span><CircleDollarSign size={18} aria-hidden="true" /></span><small>Tổng tiền đã bán</small></div><strong className="is-currency">{formatNumber(data.totalEarned)}đ</strong><p>Giá trị đơn hàng được ghi nhận trên hệ thống</p><div className="ctv-metric-foot"><span><EyeOff size={14} aria-hidden="true" /> Dữ liệu chỉ bạn nhìn thấy</span></div></CardContent></Card>
      </section>

      <Card className="ctv-start-card"><CardHeader><div><CardTitle>Tiếp tục công việc</CardTitle><CardDescription>Các thao tác thường dùng của cộng tác viên.</CardDescription></div></CardHeader><CardContent><div className="ctv-start-grid"><Link to="/ctv/accounts" className="ctv-start-action"><span><Plus size={19} aria-hidden="true" /></span><div><strong>Đăng tài khoản mới</strong><small>Thêm sản phẩm vào kho đang bán</small></div><ArrowRight size={17} aria-hidden="true" /></Link><Link to="/ctv/orders" className="ctv-start-action"><span><ShoppingBag size={19} aria-hidden="true" /></span><div><strong>Xem đơn đã bán</strong><small>Kiểm tra người mua và số tiền thực nhận</small></div><ArrowRight size={17} aria-hidden="true" /></Link></div></CardContent></Card>
    </div>
  );
}
