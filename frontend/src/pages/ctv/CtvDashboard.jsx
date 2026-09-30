import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { ArrowRight, Boxes, CheckCircle2, CircleDollarSign, EyeOff, Gamepad2, Plus, ShoppingBag } from "lucide-react";
import { AdminError, AdminPageHeader } from "../../components/admin/AdminUi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

function CtvDashboardSkeleton() {
  return (
    <div className="ctv-dashboard-page admin-accounts-page" aria-busy="true" aria-label="Đang tải số liệu cộng tác viên">
      <AdminPageHeader eyebrow="Cộng tác viên" title="Tổng quan bán hàng" description="Đang đồng bộ kho tài khoản, đơn hàng và doanh thu…" />
      <section className="ctv-overview-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => <Card key={item} className="ctv-overview-card ctv-dashboard-skeleton-card"><CardContent><Skeleton className="ui-skeleton-line" /><Skeleton className="ctv-dashboard-skeleton-value" /><Skeleton className="ctv-dashboard-skeleton-copy" /><Skeleton className="ctv-dashboard-skeleton-foot" /></CardContent></Card>)}
      </section>
      <Card className="ctv-start-card"><CardHeader><CardTitle>Tiếp tục công việc</CardTitle><CardDescription>Đang chuẩn bị các lối tắt của bạn.</CardDescription></CardHeader><CardContent><div className="ctv-start-grid"><Skeleton /><Skeleton /></div></CardContent></Card>
    </div>
  );
}

export default function CtvDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/ctv/dashboard");
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <CtvDashboardSkeleton />;

  if (!data) {
    return <div className="ctv-dashboard-page admin-accounts-page"><AdminPageHeader eyebrow="Cộng tác viên" title="Tổng quan bán hàng" description="Theo dõi kho tài khoản, đơn hàng và doanh thu của bạn." /><AdminError message={error || "Không thể tải dữ liệu thống kê."} onRetry={load} /></div>;
  }

  const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");
  const availablePercent = data.totalAccounts
    ? Math.min(100, Math.round((Number(data.sellingAccounts || 0) / Number(data.totalAccounts)) * 100))
    : 0;

  return (
    <div className="ctv-dashboard-page admin-accounts-page">
      <AdminPageHeader eyebrow="Cộng tác viên" title="Tổng quan bán hàng" description="Theo dõi kho tài khoản, đơn hàng và doanh thu của bạn." />
      <AdminError message={error} onRetry={load} />

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
