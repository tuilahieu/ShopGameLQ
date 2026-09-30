import { useEffect, useRef, useState } from "react";
import { RefreshCw, ShoppingBag } from "lucide-react";
import api from "../../api/api";
import { AdminError, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable, DataTablePagination } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";

export default function CtvOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const loadSequence = useRef(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPage: 1 });

  async function loadOrders(page = 1) {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get(`/ctv/orders?page=${page}&limit=20`);
      if (sequence !== loadSequence.current) return;
      setOrders(res.data.data.orders || []);
      setPagination(res.data.data.pagination || { page, limit: 20, total: 0, totalPage: 1 });
    } catch (err) {
      if (sequence === loadSequence.current) setLoadError(err.response?.data?.message || "Không thể tải đơn hàng.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const columns = [
    { id: "id", header: "Đơn hàng", sortable: true, accessor: (order) => Number(order.id), cell: (order) => <span className="ui-table-primary">#{order.id}</span> },
    { id: "account", header: "Account", sortable: true, accessor: (order) => Number(order.acc_id), cell: (order) => <span className="ui-table-code">#{order.acc_id}</span> },
    { id: "original", header: "Giá gốc", sortable: true, accessor: (order) => Number(order.original_price || 0), cell: (order) => <span className="ui-table-price">{Number(order.original_price || 0).toLocaleString("vi-VN")}đ</span> },
    { id: "sale", header: "Flash sale", accessor: (order) => Number(order.sale_price || 0), cell: (order) => <span className="ui-table-secondary">{order.sale_price ? `${Number(order.sale_price).toLocaleString("vi-VN")}đ` : "—"}</span> },
    { id: "discount", header: "Giảm giá", accessor: (order) => Number(order.discount_amount || 0), cell: (order) => <span className={order.discount_amount ? "ui-table-success" : "ui-table-secondary"}>{order.discount_amount ? `-${Number(order.discount_amount).toLocaleString("vi-VN")}đ` : "—"}</span> },
    { id: "final", header: "Thực nhận", sortable: true, accessor: (order) => Number(order.final_price || 0), cell: (order) => <span className="ui-table-price">{Number(order.final_price || 0).toLocaleString("vi-VN")}đ</span> },
    { id: "buyer", header: "Người mua", sortable: true, accessor: (order) => order.user?.username || `User ${order.user_id || ""}`, cell: (order) => order.user ? <span className="ui-table-primary">{order.user.username}</span> : order.user_id ? <span className="ui-table-secondary">User #{order.user_id}</span> : <span className="ui-table-secondary">—</span> },
    { id: "status", header: "Trạng thái", cell: (order) => <Badge variant={Number(order.status) === 1 ? "success" : "warning"}>{Number(order.status) === 1 ? "Thành công" : `Mã ${order.status}`}</Badge> },
    { id: "time", header: "Thời gian mua", sortable: true, accessor: (order) => new Date(order.createdAt || order.created_at).getTime(), cell: (order) => <span className="ui-table-secondary">{new Date(order.createdAt || order.created_at).toLocaleString("vi-VN")}</span> },
  ];

  return (
    <div className="ctv-orders-page admin-accounts-page">
      <AdminPageHeader eyebrow="Cộng tác viên · Kinh doanh" title="Đơn hàng đã bán" description="Theo dõi người mua, giá trị đơn và số tiền được ghi nhận." actions={<Button variant="outline" onClick={() => loadOrders(pagination.page)} disabled={loading}><RefreshCw size={16} aria-hidden="true" /> Làm mới</Button>} />

      <Card className="ctv-list-card">
        <CardHeader><CardTitle id="ctv-order-list-title">Lịch sử bán hàng</CardTitle><CardDescription>{pagination.total.toLocaleString("vi-VN")} đơn hàng phát sinh từ kho của bạn</CardDescription></CardHeader>
        <CardContent>
          {loadError ? <AdminError message={loadError} onRetry={() => loadOrders(pagination.page)} /> : <><DataTable columns={columns} data={orders} loading={loading} caption="Danh sách đơn hàng cộng tác viên" empty={<Empty><EmptyMedia><ShoppingBag size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Chưa có đơn hàng</EmptyTitle><EmptyDescription>Đơn phát sinh từ tài khoản của bạn sẽ xuất hiện tại đây.</EmptyDescription></EmptyHeader></Empty>} /><DataTablePagination page={pagination.page} totalPages={pagination.totalPage} total={pagination.total} pageSize={pagination.limit} onPageChange={loadOrders} /></>}
        </CardContent>
      </Card>
    </div>
  );
}
