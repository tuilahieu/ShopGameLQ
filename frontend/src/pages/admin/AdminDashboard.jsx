import { useCallback, useEffect, useState } from "react";
import { Boxes, CircleDollarSign, Gamepad2, History, PackageSearch, Plus, RefreshCw, Settings2, ShoppingBag, Tag, Users, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { AdminError, AdminPageHeader } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError("");
    try { const res = await api.get("/admin/dashboard"); setData(res.data.data); setLastUpdated(new Date()); } catch (err) { setError(err.response?.data?.message || "Không thể tải số liệu tổng quan."); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (!data && loading && !error) return <Card><CardHeader><CardTitle>Đang tải tổng quan hệ thống</CardTitle><CardDescription>Đang đồng bộ các số liệu vận hành…</CardDescription></CardHeader><CardContent className="ui-dashboard-loading"><Skeleton className="ui-skeleton-line" /><Skeleton className="ui-skeleton-line" /><Skeleton className="ui-skeleton-line" /></CardContent></Card>;

  const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");
  const stockPercent = data?.totalAccounts ? Math.min(100, Math.round((Number(data.sellingAccounts || 0) / Number(data.totalAccounts)) * 100)) : 0;

  return (
    <div className="admin-dashboard-page admin-accounts-page">
      <AdminPageHeader eyebrow="Dashboard" title="Tổng quan cửa hàng" description="Theo dõi nhanh kho tài khoản, đơn hàng và doanh thu." actions={<div className="ui-admin-page-header-actions"><span className="ui-table-secondary">{lastUpdated ? `Cập nhật ${lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : ""}</span><Button variant="outline" onClick={loadDashboard} disabled={loading} aria-busy={loading}><RefreshCw size={15} aria-hidden="true" /> {loading ? "Đang cập nhật" : "Làm mới"}</Button></div>} />
      <AdminError message={error} onRetry={loadDashboard} />
      {data && <section className="admin-overview-grid" aria-label="Các chỉ số tổng quan">
        <Card className="admin-overview-card admin-store-card"><CardContent><div className="admin-store-identity"><span className="admin-store-avatar">S</span><span><strong>Shop Liên Quân</strong><small><i /> Hệ thống đang hoạt động</small></span></div><dl><div><dt>Thành viên</dt><dd>{formatNumber(data.totalUsers)}</dd></div><div><dt>Tổng tài khoản</dt><dd>{formatNumber(data.totalAccounts)}</dd></div><div><dt>Trạng thái</dt><dd className="is-success">Bình thường</dd></div></dl></CardContent></Card>
        <Card className="admin-overview-card"><CardContent><div className="admin-metric-label"><Boxes size={17} aria-hidden="true" /> Kho tài khoản</div><div className="admin-metric-value">{formatNumber(data.sellingAccounts)} <small>/ {formatNumber(data.totalAccounts)}</small></div><div className="admin-progress" role="progressbar" aria-label="Tỷ lệ tài khoản đang bán" aria-valuemin="0" aria-valuemax="100" aria-valuenow={stockPercent}><span style={{ transform: `scaleX(${stockPercent / 100})` }} /></div><p><span>{stockPercent}% sẵn sàng bán</span><b className="admin-status-chip">Bình thường</b></p><div className="admin-card-split"><span><small>Đã bán</small><strong>{formatNumber(data.soldAccounts)}</strong></span><span><small>Đã ẩn</small><strong>{formatNumber(data.hiddenAccounts)}</strong></span></div></CardContent></Card>
        <Card className="admin-overview-card"><CardContent><div className="admin-metric-label"><ShoppingBag size={17} aria-hidden="true" /> Đơn hàng</div><div className="admin-metric-value">{formatNumber(data.totalOrders)}</div><div className="admin-progress" aria-hidden="true"><span style={{ transform: `scaleX(${data.totalOrders ? Math.min(1, Number(data.soldAccounts || 0) / Number(data.totalOrders)) : 0})` }} /></div><p><span>Tổng đơn đã tạo</span></p><div className="admin-card-split"><span><small>Đã giao</small><strong>{formatNumber(data.soldAccounts)}</strong></span><span><small>Giao dịch</small><strong>{formatNumber(data.totalTransactions)}</strong></span></div></CardContent></Card>
        <Card className="admin-overview-card"><CardContent><div className="admin-metric-label"><CircleDollarSign size={17} aria-hidden="true" /> Doanh thu</div><div className="admin-metric-value is-currency">{formatNumber(data.revenue)}đ</div><div className="admin-progress admin-progress-static" aria-hidden="true"><span /></div><p><span>Tổng doanh thu ghi nhận</span><b className="admin-status-chip">Ổn định</b></p><div className="admin-card-split"><span><small>Giao dịch</small><strong>{formatNumber(data.totalTransactions)}</strong></span><span><small>Đơn hàng</small><strong>{formatNumber(data.totalOrders)}</strong></span></div></CardContent></Card>
      </section>}
      <Card className="admin-quick-actions"><CardHeader><div><CardTitle>Thao tác thường dùng</CardTitle><CardDescription>Đi nhanh đến các khu vực quản trị chính.</CardDescription></div><small>Toàn bộ công cụ nằm trong sidebar bên trái</small></CardHeader><CardContent><div className="admin-quick-action-grid">
        <Link to="/admin/accounts" className="admin-quick-action"><span className="admin-quick-action-icon"><Plus size={19} aria-hidden="true" /></span><span><strong>Thêm tài khoản</strong><small>Đưa sản phẩm mới vào kho</small></span></Link>
        <Link to="/admin/accounts" className="admin-quick-action"><span className="admin-quick-action-icon"><Gamepad2 size={19} aria-hidden="true" /></span><span><strong>Kho tài khoản</strong><small>Quản lý sản phẩm đang bán</small></span></Link>
        <Link to="/admin/orders" className="admin-quick-action"><span className="admin-quick-action-icon"><PackageSearch size={19} aria-hidden="true" /></span><span><strong>Đơn hàng</strong><small>Kiểm tra trạng thái đơn mới</small></span></Link>
        <Link to="/admin/transactions" className="admin-quick-action"><span className="admin-quick-action-icon"><WalletCards size={19} aria-hidden="true" /></span><span><strong>Giao dịch</strong><small>Đối soát biến động số dư</small></span></Link>
        <Link to="/admin/users" className="admin-quick-action"><span className="admin-quick-action-icon"><Users size={19} aria-hidden="true" /></span><span><strong>Người dùng</strong><small>Quản lý thành viên hệ thống</small></span></Link>
        <Link to="/admin/discounts" className="admin-quick-action"><span className="admin-quick-action-icon"><Tag size={19} aria-hidden="true" /></span><span><strong>Mã giảm giá</strong><small>Tạo và theo dõi ưu đãi</small></span></Link>
        <Link to="/admin/logs" className="admin-quick-action"><span className="admin-quick-action-icon"><History size={19} aria-hidden="true" /></span><span><strong>Nhật ký</strong><small>Xem hoạt động gần đây</small></span></Link>
        <Link to="/admin/setting" className="admin-quick-action"><span className="admin-quick-action-icon"><Settings2 size={19} aria-hidden="true" /></span><span><strong>Cấu hình</strong><small>Thông tin và thiết lập shop</small></span></Link>
      </div></CardContent></Card>
    </div>
  );
}
