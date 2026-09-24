import { useCallback, useEffect, useRef, useState } from "react";
import { Ban, CircleDollarSign, Search, ShieldCheck, UserRound, X } from "lucide-react";
import api from "../../api/api";
import Modal from "../../components/Modal";
import CurrencyInput from "../../components/CurrencyInput";
import { AdminError, AdminField, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable, DataTablePagination } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { notifyAdmin } from "../../utils/adminFeedback";

const roleName = (level) => Number(level) === 99 ? "Admin" : Number(level) === 1 ? "CTV" : "Thành viên";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPage: 1 });
  const [adjustment, setAdjustment] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState({ amount: "", description: "" });
  const [adjustmentError, setAdjustmentError] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const adjustmentKeyRef = useRef(null);
  const loadSequence = useRef(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/admin/users", { params: { page, limit: 20, search: search || undefined } });
      if (sequence !== loadSequence.current) return;
      setUsers(res.data.data.users || []);
      if (res.data.data.pagination) setPagination(res.data.data.pagination);
    } catch (err) {
      if (sequence === loadSequence.current) setLoadError(err.response?.data?.message || "Không thể tải người dùng.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [page, search]);

  async function updateUser(id, body) {
    try {
      await api.put(`/admin/users/${id}`, body);
      notifyAdmin("Đã cập nhật người dùng");
      load();
    } catch (err) {
      notifyAdmin(err.response?.data?.message || "Lỗi cập nhật người dùng");
    }
  }

  async function submitAdjustment() {
    const amount = Number(adjustmentForm.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setAdjustmentError("Nhập số tiền nguyên dương hợp lệ.");
      return;
    }
    setAdjusting(true);
    setAdjustmentError("");
    try {
      adjustmentKeyRef.current ||= crypto.randomUUID();
      await api.post(`/admin/users/${adjustment.id}/money`, { type: adjustment.type, amount, description: adjustmentForm.description.trim() || (adjustment.type === "add" ? "Admin cộng tiền" : "Admin trừ tiền") }, { headers: { "Idempotency-Key": adjustmentKeyRef.current } });
      adjustmentKeyRef.current = null;
      setAdjustment(null);
      setAdjustmentForm({ amount: "", description: "" });
      notifyAdmin("Đã điều chỉnh số dư");
      load();
    } catch (err) {
      setAdjustmentError(err.response?.data?.message || "Không thể thực hiện điều chỉnh số dư.");
    } finally {
      setAdjusting(false);
    }
  }

  function openAdjustment(user, type) {
    setAdjustment({ id: user.id, username: user.username, balance: Number(user.money || 0), type });
    adjustmentKeyRef.current = crypto.randomUUID();
    setAdjustmentForm({ amount: "", description: "" });
    setAdjustmentError("");
  }

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
    { id: "id", header: "ID", accessor: (user) => user.id, sortable: true, cell: (user) => <span className="ui-table-code">#{user.id}</span> },
    { id: "username", header: "Tên đăng nhập", accessor: (user) => user.username || "", sortable: true, cell: (user) => <span className="ui-table-primary">{user.username}</span> },
    { id: "role", header: "Quyền", accessor: (user) => roleName(user.level), sortable: true, cell: (user) => <Badge variant={Number(user.level) === 99 ? "default" : Number(user.level) === 1 ? "success" : "secondary"}>{roleName(user.level)}</Badge> },
    { id: "money", header: "Số dư", accessor: (user) => Number(user.money || 0), sortable: true, cell: (user) => <strong className="ui-table-price">{Number(user.money || 0).toLocaleString()}đ</strong> },
    { id: "status", header: "Trạng thái", accessor: (user) => Number(user.banned) === 1 ? "Đang khóa" : "Hoạt động", sortable: true, cell: (user) => <Badge variant={Number(user.banned) === 1 ? "destructive" : "success"}>{Number(user.banned) === 1 ? "Đang khóa" : "Hoạt động"}</Badge> },
    {
      id: "actions",
      header: "Thao tác",
      cell: (user) => <div className="ui-table-actions"><Button size="sm" variant="outline" onClick={() => openAdjustment(user, "add")}><CircleDollarSign size={14} aria-hidden="true" /> + Tiền</Button><Button size="sm" variant="secondary" onClick={() => openAdjustment(user, "sub")}>− Tiền</Button><Button size="sm" variant="ghost" onClick={() => updateUser(user.id, { level: 0 })} disabled={Number(user.level) === 0}>User</Button><Button size="sm" variant="ghost" onClick={() => updateUser(user.id, { level: 1 })} disabled={Number(user.level) === 1}>CTV</Button><Button size="sm" variant="ghost" onClick={() => updateUser(user.id, { level: 99 })} disabled={Number(user.level) === 99}><ShieldCheck size={14} aria-hidden="true" /> Admin</Button><Button size="sm" variant="destructive" onClick={() => updateUser(user.id, { banned: Number(user.banned) === 1 ? 0 : 1 })}><Ban size={14} aria-hidden="true" /> {Number(user.banned) === 1 ? "Mở khóa" : "Khóa"}</Button></div>,
    },
  ];

  return (
    <div className="admin-users-page admin-accounts-page">
      <AdminPageHeader eyebrow="Hệ thống · Admin" title="Quản lý người dùng" description="Quản lý quyền, trạng thái tài khoản và điều chỉnh số dư với lịch sử rõ ràng." />
      <Card className="ui-filter-card"><CardContent><form className="ui-filter-grid" onSubmit={handleSearch}><AdminField id="admin-user-search" label="Tìm kiếm người dùng"><Input id="admin-user-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tên đăng nhập hoặc User ID" /></AdminField><div className="ui-filter-summary"><Button type="submit"><Search size={15} aria-hidden="true" /> Tìm kiếm</Button>{search && <Button type="button" variant="ghost" onClick={handleReset}><X size={15} aria-hidden="true" /> Đặt lại</Button>}</div><div className="ui-filter-summary"><span>Tổng thành viên</span><strong>{pagination.total}</strong></div></form></CardContent></Card>
      <AdminError message={loadError} onRetry={load} />
      <Card className="ui-data-table-card"><CardHeader><CardTitle>User table</CardTitle><CardDescription>{loading ? "Đang đồng bộ dữ liệu…" : `Trang ${pagination.page || page} · ${users.length} thành viên.`}</CardDescription></CardHeader><CardContent><DataTable data={users} loading={loading} columns={columns} caption="Bảng người dùng" empty={<Empty><EmptyMedia><UserRound size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Không tìm thấy người dùng</EmptyTitle><EmptyDescription>Thử thay đổi từ khóa tìm kiếm để xem kết quả khác.</EmptyDescription></EmptyHeader></Empty>} /><DataTablePagination page={pagination.page || page} totalPages={pagination.totalPage} total={pagination.total} pageSize={pagination.limit || 20} onPageChange={setPage} /></CardContent></Card>

      <Modal isOpen={Boolean(adjustment)} onClose={() => !adjusting && setAdjustment(null)} title={adjustment?.type === "add" ? "Cộng số dư" : "Trừ số dư"} className="admin-form-modal" footer={<><Button variant="outline" disabled={adjusting} onClick={() => setAdjustment(null)}>Hủy</Button><Button variant={adjustment?.type === "sub" ? "destructive" : "default"} disabled={adjusting} aria-busy={adjusting} onClick={submitAdjustment}>{adjusting ? "Đang lưu…" : "Xác nhận"}</Button></>}>
        <div className="ui-form-grid"><p className="ui-field-helper ui-field-full">Người dùng: <strong>{adjustment?.username}</strong> · Số dư hiện tại: <strong>{Number(adjustment?.balance || 0).toLocaleString()}đ</strong></p><AdminField id="admin-adjustment-amount" label="Số tiền (đ)" required><CurrencyInput id="admin-adjustment-amount" className="ui-input" autoFocus value={adjustmentForm.amount} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, amount: event.target.value })} placeholder="Ví dụ: 100.000" required /></AdminField><AdminField id="admin-adjustment-description" className="ui-field-full" label="Lý do điều chỉnh" helper="Bắt buộc ghi rõ lý do với điều chỉnh thủ công."><Textarea id="admin-adjustment-description" value={adjustmentForm.description} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, description: event.target.value })} placeholder="Ví dụ: hoàn tiền đơn hàng…" /></AdminField>{adjustmentError && <p className="ui-field-error ui-field-full" role="alert">{adjustmentError}</p>}</div>
      </Modal>
    </div>
  );
}
