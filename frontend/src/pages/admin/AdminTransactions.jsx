import { useCallback, useEffect, useRef, useState } from "react";
import { History, RefreshCw, Search, X } from "lucide-react";
import api from "../../api/api";
import { AdminError, AdminField, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable, DataTablePagination } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";
import { Input } from "../../components/ui/input";

export default function AdminTransactions() {
  const [items, setItems] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPage: 1 });
  const loadSequence = useRef(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/admin/transactions", { params: { page, limit: 20, search: search || undefined } });
      if (sequence !== loadSequence.current) return;
      setItems(res.data.data.transactions || []);
      if (res.data.data.pagination) setPagination(res.data.data.pagination);
    } catch (err) {
      if (sequence === loadSequence.current) setLoadError(err.response?.data?.message || "Không thể tải giao dịch.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [page, search]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleReset() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  useEffect(() => { load(); }, [load]);

  const columns = [
    { id: "id", header: "ID", accessor: (item) => item.id, sortable: true, cell: (item) => <span className="ui-table-code">#{item.id}</span> },
    { id: "user", header: "Người dùng", accessor: (item) => item.user?.username || item.user_id, sortable: true, cell: (item) => <span className="ui-table-primary">{item.user?.username || `User #${item.user_id}`}</span> },
    { id: "type", header: "Loại giao dịch", accessor: (item) => item.type || "", sortable: true, cell: (item) => <Badge variant={Number(item.amount || 0) >= 0 ? "success" : "destructive"}>{item.type || "—"}</Badge> },
    { id: "amount", header: "Số tiền", accessor: (item) => Number(item.amount || 0), sortable: true, cell: (item) => { const amount = Number(item.amount || 0); return <strong className={amount >= 0 ? "ui-table-success" : "ui-table-danger"}>{amount >= 0 ? "+" : "−"}{Math.abs(amount).toLocaleString()}đ</strong>; } },
    { id: "before", header: "Số dư trước", accessor: (item) => Number(item.balance_before || 0), sortable: true, cell: (item) => `${Number(item.balance_before || 0).toLocaleString()}đ` },
    { id: "after", header: "Số dư sau", accessor: (item) => Number(item.balance_after || 0), sortable: true, cell: (item) => `${Number(item.balance_after || 0).toLocaleString()}đ` },
    { id: "description", header: "Mô tả", accessor: (item) => item.description || "", cell: (item) => <span className="ui-table-detail">{item.description || "—"}</span> },
  ];

  return (
    <div className="admin-transactions-page admin-accounts-page">
      <AdminPageHeader eyebrow="Kinh doanh · Admin" title="Lịch sử giao dịch" description="Tra cứu biến động số dư và nguồn tiền theo người dùng hoặc User ID." actions={<Button variant="outline" onClick={load} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Làm mới</Button>} />
      <Card className="ui-filter-card"><CardContent><form className="ui-filter-grid" onSubmit={handleSearch}><AdminField id="admin-transaction-search" label="Tìm kiếm giao dịch" className="ui-field-full" helper="Nhập username hoặc User ID."><Input id="admin-transaction-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Ví dụ: hieu hoặc 123" /></AdminField><div className="ui-filter-summary"><Button type="submit"><Search size={15} aria-hidden="true" /> Tìm kiếm</Button>{search && <Button type="button" variant="ghost" onClick={handleReset}><X size={15} aria-hidden="true" /> Xóa lọc</Button>}</div><div className="ui-filter-summary"><span>Tổng giao dịch</span><strong>{pagination.total}</strong></div></form></CardContent></Card>
      <AdminError message={loadError} onRetry={load} />
      <Card className="ui-data-table-card"><CardHeader><CardTitle>Transaction table</CardTitle><CardDescription>{loading ? "Đang đồng bộ dữ liệu…" : `Trang ${pagination.page || page} · ${items.length} bản ghi.`}</CardDescription></CardHeader><CardContent><DataTable data={items} loading={loading} columns={columns} caption="Bảng lịch sử giao dịch" empty={<Empty><EmptyMedia><History size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Không tìm thấy giao dịch</EmptyTitle><EmptyDescription>Thử tìm kiếm với username hoặc User ID khác.</EmptyDescription></EmptyHeader></Empty>} /><DataTablePagination page={pagination.page || page} totalPages={pagination.totalPage} total={pagination.total} pageSize={pagination.limit || 20} onPageChange={setPage} /></CardContent></Card>
    </div>
  );
}
