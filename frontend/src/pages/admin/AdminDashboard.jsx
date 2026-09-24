import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Gamepad2, History, Landmark, PackageSearch, Plus, RefreshCw, Settings2, ShoppingBag, Users } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { AdminError, AdminPageHeader } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";
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

  const metrics = data ? [
    { id: "users", label: "Thành viên", value: data.totalUsers, icon: Users, description: "Tổng tài khoản người dùng" },
    { id: "accounts", label: "Tổng tài khoản", value: data.totalAccounts, icon: Gamepad2, description: "Tổng sản phẩm trong kho" },
    { id: "selling", label: "Đang bán", value: data.sellingAccounts, icon: Eye, description: "Sẵn sàng để khách mua" },
    { id: "sold", label: "Đã bán", value: data.soldAccounts, icon: EyeOff, description: "Đã phát sinh đơn hàng" },
    { id: "hidden", label: "Đã ẩn", value: data.hiddenAccounts, icon: EyeOff, description: "Không hiển thị với khách" },
    { id: "orders", label: "Đơn hàng", value: data.totalOrders, icon: ShoppingBag, description: "Tổng đơn đã tạo" },
    { id: "transactions", label: "Giao dịch", value: data.totalTransactions, icon: History, description: "Tổng lịch sử biến động" },
    { id: "revenue", label: "Doanh thu", value: `${Number(data.revenue || 0).toLocaleString()}đ`, icon: Landmark, description: "Tổng doanh thu ghi nhận" },
  ] : [];

  const columns = [
    { id: "metric", header: "Chỉ số", accessor: (metric) => metric.label, sortable: true, cell: (metric) => { const Icon = metric.icon; return <span className="ui-table-primary"><Icon size={15} aria-hidden="true" /> {metric.label}</span>; } },
    { id: "value", header: "Giá trị", accessor: (metric) => typeof metric.value === "number" ? metric.value : Number.parseInt(metric.value, 10) || 0, sortable: true, cell: (metric) => <strong className="ui-table-price">{typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}</strong> },
    { id: "description", header: "Diễn giải", accessor: (metric) => metric.description, cell: (metric) => <span className="ui-table-secondary">{metric.description}</span> },
  ];

  return (
    <div className="admin-dashboard-page admin-accounts-page">
      <AdminPageHeader eyebrow="Điều hành · Admin" title="Tổng quan hệ thống" description="Theo dõi hoạt động cửa hàng và xử lý công việc hằng ngày." actions={<div className="ui-admin-page-header-actions"><span className="ui-table-secondary">{lastUpdated ? `Cập nhật ${lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : ""}</span><Button variant="outline" onClick={loadDashboard} disabled={loading} aria-busy={loading}><RefreshCw size={15} aria-hidden="true" /> {loading ? "Đang cập nhật" : "Cập nhật số liệu"}</Button></div>} />
      <AdminError message={error} onRetry={loadDashboard} />
      {data && <Card className="ui-data-table-card"><CardHeader><CardTitle>System metrics</CardTitle><CardDescription>Tất cả chỉ số vận hành được trình bày trong bảng để dễ đọc và đối chiếu.</CardDescription></CardHeader><CardContent><DataTable data={metrics} columns={columns} caption="Bảng thống kê tổng quan" empty={<Empty><EmptyMedia>—</EmptyMedia><EmptyHeader><EmptyTitle>Chưa có số liệu</EmptyTitle><EmptyDescription>Hệ thống chưa trả về dữ liệu tổng quan.</EmptyDescription></EmptyHeader></Empty>} /></CardContent></Card>}
      <Card className="admin-quick-actions"><CardHeader><CardTitle>Việc cần làm nhanh</CardTitle><CardDescription>Các khu vực thường dùng nhất trong vận hành.</CardDescription></CardHeader><CardContent><div className="admin-quick-action-grid"><Link to="/admin/accounts" className="admin-quick-action"><span className="admin-quick-action-icon"><Plus size={20} aria-hidden="true" /></span><span><strong>Thêm tài khoản</strong><small>Đưa account mới vào kho bán</small></span></Link><Link to="/admin/orders" className="admin-quick-action"><span className="admin-quick-action-icon is-warm"><PackageSearch size={20} aria-hidden="true" /></span><span><strong>Kiểm tra đơn hàng</strong><small>Xem giao dịch và trạng thái mới</small></span></Link><Link to="/admin/setting" className="admin-quick-action"><span className="admin-quick-action-icon is-mint"><Settings2 size={20} aria-hidden="true" /></span><span><strong>Cập nhật cửa hàng</strong><small>Banner, thông báo và hỗ trợ</small></span></Link></div></CardContent></Card>
    </div>
  );
}
