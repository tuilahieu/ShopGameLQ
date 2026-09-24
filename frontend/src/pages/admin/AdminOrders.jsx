import { useCallback, useEffect, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import api from "../../api/api";
import { AdminError, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";
import { Button } from "../../components/ui/button";

const statusVariant = (status) => {
  const value = String(status || "").toLowerCase();
  if (["completed", "success", "đã giao", "hoàn thành"].some((item) => value.includes(item))) return "success";
  if (["cancel", "failed", "hủy", "thất bại"].some((item) => value.includes(item))) return "destructive";
  return "warning";
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { id: "id", header: "ID", accessor: (order) => order.id, sortable: true, cell: (order) => <span className="ui-table-code">#{order.id}</span> },
    { id: "user", header: "Thành viên", accessor: (order) => order.user?.username || order.user_id, sortable: true, cell: (order) => <span className="ui-table-primary">{order.user?.username || `User #${order.user_id}`}</span> },
    { id: "account", header: "Tài khoản", accessor: (order) => order.acc_id, sortable: true, cell: (order) => <span className="ui-table-code">#{order.acc_id}</span> },
    { id: "original", header: "Giá gốc", accessor: (order) => Number(order.original_price || 0), sortable: true, cell: (order) => `${Number(order.original_price || 0).toLocaleString()}đ` },
    { id: "sale", header: "Giá sale", accessor: (order) => Number(order.sale_price || 0), sortable: true, cell: (order) => order.sale_price ? `${Number(order.sale_price).toLocaleString()}đ` : "—" },
    { id: "discount", header: "Giảm giá", accessor: (order) => Number(order.discount_amount || 0), sortable: true, cell: (order) => `${Number(order.discount_amount || 0).toLocaleString()}đ` },
    { id: "total", header: "Thành tiền", accessor: (order) => Number(order.final_price || 0), sortable: true, cell: (order) => <strong className="ui-table-price">{Number(order.final_price || 0).toLocaleString()}đ</strong> },
    { id: "status", header: "Trạng thái", accessor: (order) => order.status || "—", sortable: true, cell: (order) => <Badge variant={statusVariant(order.status)}>{order.status || "Chưa cập nhật"}</Badge> },
  ];

  return (
    <div className="admin-orders-page admin-accounts-page">
      <AdminPageHeader eyebrow="Kinh doanh · Admin" title="Đơn hàng" description="Theo dõi toàn bộ đơn hàng và giá trị thanh toán trong một bảng dữ liệu có thể sắp xếp." actions={<Button variant="outline" onClick={load} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Làm mới</Button>} />
      <AdminError message={error} onRetry={load} />
      <Card className="ui-data-table-card"><CardHeader><CardTitle>Danh sách đơn hàng</CardTitle><CardDescription>{loading ? "Đang đồng bộ dữ liệu…" : `${orders.length} đơn hàng được tải.`}</CardDescription></CardHeader><CardContent><DataTable data={orders} loading={loading} columns={columns} caption="Bảng đơn hàng" empty={<Empty><EmptyMedia><ClipboardList size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Chưa có đơn hàng</EmptyTitle><EmptyDescription>Đơn hàng mới sẽ xuất hiện ở đây sau khi khách hoàn tất mua.</EmptyDescription></EmptyHeader></Empty>} /></CardContent></Card>
    </div>
  );
}
