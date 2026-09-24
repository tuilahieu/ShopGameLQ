import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgePercent, Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import api from "../../api/api";
import Modal from "../../components/Modal";
import { AdminConfirmDialog, AdminError, AdminField, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { notifyAdmin } from "../../utils/adminFeedback";

const emptyForm = { acc_id: "", sale_price: "", batdau: "", ketthuc: "", status: 1 };

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminSales() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmation, setConfirmation] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [modalAccounts, setModalAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [modalSearch, setModalSearch] = useState("");
  const [modalTypeFilter, setModalTypeFilter] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedAccDetails, setSelectedAccDetails] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError("");
    try { const res = await api.get("/admin/sales"); setItems(res.data.data || []); } catch (err) { setLoadError(err.response?.data?.message || "Không thể tải flash sale."); } finally { setLoading(false); }
  }, []);

  const loadAccountTypes = useCallback(async () => {
    try { const res = await api.get("/account-types"); setAccountTypes(res.data.data || []); } catch { notifyAdmin("Không thể tải loại tài khoản"); }
  }, []);

  async function fetchModalAccounts() {
    setModalLoading(true);
    try { const res = await api.get("/admin/accounts", { params: { status: 0, limit: 100 } }); setModalAccounts(res.data?.data?.accounts || res.data?.data || []); } catch (err) { notifyAdmin(err.response?.data?.message || "Không thể tải danh sách account chưa bán"); } finally { setModalLoading(false); }
  }

  const filteredModalAccounts = useMemo(() => modalAccounts.filter((account) => {
    const searchMatch = modalSearch ? String(account.id).includes(modalSearch.trim()) : true;
    const typeMatch = modalTypeFilter ? String(account.loai_id) === String(modalTypeFilter) : true;
    return searchMatch && typeMatch;
  }), [modalAccounts, modalSearch, modalTypeFilter]);

  function selectAccount(account) {
    setForm((previous) => ({ ...previous, acc_id: account.id }));
    setSelectedAccDetails(account);
    setIsSelectModalOpen(false);
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    if (!form.acc_id) return notifyAdmin("Vui lòng chọn tài khoản");
    if (!form.sale_price) return notifyAdmin("Vui lòng nhập giá flash sale");
    if (!form.batdau || !form.ketthuc) return notifyAdmin("Vui lòng nhập thời gian bắt đầu và kết thúc");
    if (selectedAccDetails && Number(form.sale_price) >= Number(selectedAccDetails.gia)) return notifyAdmin("Giá sale phải thấp hơn giá bán gốc.");
    setSaving(true);
    try { if (editingId) await api.put(`/admin/sales/${editingId}`, form); else await api.post("/admin/sales", form); notifyAdmin(editingId ? "Cập nhật flash sale thành công" : "Tạo flash sale thành công"); resetForm(); load(); } catch (err) { notifyAdmin(err.response?.data?.message || "Lỗi lưu flash sale"); } finally { setSaving(false); }
  }

  function remove(id) {
    setConfirmation({ title: "Tắt flash sale?", description: "Chương trình sẽ không còn áp dụng cho account này.", action: async () => { try { await api.delete(`/admin/sales/${id}`); notifyAdmin("Đã tắt flash sale"); load(); } catch (err) { notifyAdmin(err.response?.data?.message || "Lỗi tắt flash sale"); } } });
  }

  function startEdit(item) {
    setEditingId(item.id); setForm({ acc_id: item.acc_id || "", sale_price: item.sale_price || "", batdau: formatDateInput(item.batdau), ketthuc: formatDateInput(item.ketthuc), status: item.status !== undefined ? Number(item.status) : 1 });
    api.get("/admin/accounts", { params: { id: item.acc_id, limit: 1 } }).then((res) => setSelectedAccDetails(res.data.data?.accounts?.[0] || null)).catch(() => setSelectedAccDetails(null));
  }

  function resetForm() { setEditingId(null); setForm(emptyForm); setSelectedAccDetails(null); }
  async function confirmAction() { if (!confirmation || confirming) return; setConfirming(true); try { await confirmation.action(); setConfirmation(null); } finally { setConfirming(false); } }

  useEffect(() => { load(); loadAccountTypes(); }, [load, loadAccountTypes]);
  useEffect(() => { if (isSelectModalOpen) fetchModalAccounts(); }, [isSelectModalOpen]);

  const typeName = (id) => accountTypes.find((type) => Number(type.id) === Number(id))?.name || `Loại #${id}`;
  const columns = [
    { id: "id", header: "ID", accessor: (item) => item.id, sortable: true, cell: (item) => <span className="ui-table-code">#{item.id}</span> },
    { id: "account", header: "Mã account", accessor: (item) => item.acc_id, sortable: true, cell: (item) => <span className="ui-table-code">#{item.acc_id}</span> },
    { id: "price", header: "Giá flash sale", accessor: (item) => Number(item.sale_price || 0), sortable: true, cell: (item) => <strong className="ui-table-price">{Number(item.sale_price || 0).toLocaleString()}đ</strong> },
    { id: "period", header: "Thời gian", accessor: (item) => item.batdau || "", sortable: true, cell: (item) => <span className="ui-table-secondary">Từ: {item.batdau ? new Date(item.batdau).toLocaleString("vi-VN") : "—"}<br />Đến: {item.ketthuc ? new Date(item.ketthuc).toLocaleString("vi-VN") : "—"}</span> },
    { id: "status", header: "Trạng thái", accessor: (item) => Number(item.status) === 1 ? "Đang chạy" : "Tắt / Hết hạn", sortable: true, cell: (item) => <Badge variant={Number(item.status) === 1 ? "success" : "secondary"}>{Number(item.status) === 1 ? "Đang chạy" : "Tắt / Hết hạn"}</Badge> },
    { id: "actions", header: "Thao tác", cell: (item) => <div className="ui-table-actions"><Button size="sm" variant="outline" onClick={() => startEdit(item)}><Pencil size={14} aria-hidden="true" /> Sửa</Button>{Number(item.status) === 1 && <Button size="sm" variant="destructive" onClick={() => remove(item.id)}><Trash2 size={14} aria-hidden="true" /> Tắt</Button>}</div> },
  ];
  const accountColumns = [
    { id: "id", header: "ID", accessor: (account) => account.id, sortable: true, cell: (account) => <span className="ui-table-code">#{account.id}</span> },
    { id: "type", header: "Loại account", accessor: (account) => typeName(account.loai_id), sortable: true, cell: (account) => <span className="ui-table-primary">{typeName(account.loai_id)}</span> },
    { id: "price", header: "Giá gốc", accessor: (account) => Number(account.gia || 0), sortable: true, cell: (account) => <strong className="ui-table-price">{Number(account.gia || 0).toLocaleString()}đ</strong> },
    { id: "details", header: "Thông tin", accessor: (account) => account.list_thong_tin || account.login || "", cell: (account) => <span className="ui-table-detail">{account.list_thong_tin || account.login || "—"}</span> },
    { id: "action", header: "Chọn", cell: (account) => <Button size="sm" onClick={() => selectAccount(account)}><Check size={14} aria-hidden="true" /> Chọn</Button> },
  ];

  return (
    <div className="admin-sales-page admin-accounts-page">
      <AdminPageHeader eyebrow="Kinh doanh · Admin" title="Quản lý Flash Sale" description="Tạo chương trình giảm giá theo từng account với thời gian bắt đầu và kết thúc rõ ràng." actions={<Button onClick={resetForm}><Plus size={15} aria-hidden="true" /> Flash sale mới</Button>} />
      <Card><CardHeader><CardTitle>{editingId ? `Chỉnh sửa Flash Sale #${editingId}` : "Tạo chương trình Flash Sale mới"}</CardTitle><CardDescription>Giá sale phải thấp hơn giá gốc để mức giảm hiển thị chính xác.</CardDescription></CardHeader><form onSubmit={save}><CardContent><div className="ui-form-grid"><AdminField id="admin-sale-account" label="Tài khoản khuyến mãi" required className="ui-field-full"><div className="ui-upload-row"><Input id="admin-sale-account" value={form.acc_id ? `Tài khoản #${form.acc_id}${selectedAccDetails ? ` · Giá gốc ${Number(selectedAccDetails.gia).toLocaleString()}đ` : ""}` : ""} placeholder="Chọn account chưa bán…" readOnly required /><Button type="button" variant="outline" onClick={() => setIsSelectModalOpen(true)}><Search size={15} aria-hidden="true" /> Chọn account</Button></div></AdminField><AdminField id="admin-sale-price" label="Giá sale (VND)" required helper={selectedAccDetails ? `Giá gốc: ${Number(selectedAccDetails.gia).toLocaleString()}đ · Giá sale phải thấp hơn giá gốc.` : undefined}><Input id="admin-sale-price" type="number" min="1" value={form.sale_price} onChange={(event) => setForm({ ...form, sale_price: event.target.value })} placeholder="Nhập giá khuyến mãi" required /></AdminField><AdminField id="admin-sale-start" label="Bắt đầu lúc" required><Input id="admin-sale-start" type="datetime-local" value={form.batdau} onChange={(event) => setForm({ ...form, batdau: event.target.value })} required /></AdminField><AdminField id="admin-sale-end" label="Kết thúc lúc" required><Input id="admin-sale-end" type="datetime-local" value={form.ketthuc} onChange={(event) => setForm({ ...form, ketthuc: event.target.value })} required /></AdminField><AdminField id="admin-sale-status" label="Trạng thái"><Select id="admin-sale-status" value={form.status} onChange={(event) => setForm({ ...form, status: Number(event.target.value) })}><option value={1}>Kích hoạt</option><option value={0}>Tạm tắt</option></Select></AdminField></div></CardContent><CardFooter><Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Đặt lại</Button><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Đang lưu…" : editingId ? "Cập nhật" : "Tạo Sale"}</Button></CardFooter></form></Card>
      <AdminError message={loadError} onRetry={load} />
      <Card className="ui-data-table-card"><CardHeader><CardTitle>Flash sale table</CardTitle><CardDescription>{loading ? "Đang đồng bộ dữ liệu…" : `${items.length} chương trình.`}</CardDescription></CardHeader><CardContent><DataTable data={items} loading={loading} columns={columns} caption="Bảng chương trình flash sale" empty={<Empty><EmptyMedia><BadgePercent size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Chưa có flash sale</EmptyTitle><EmptyDescription>Tạo chương trình đầu tiên để làm nổi bật account trong kho.</EmptyDescription></EmptyHeader><Button size="sm" onClick={resetForm}><Plus size={14} aria-hidden="true" /> Tạo flash sale</Button></Empty>} /></CardContent></Card>

      <Modal isOpen={isSelectModalOpen} onClose={() => setIsSelectModalOpen(false)} title="Chọn account chưa bán" className="admin-sale-selector-modal" footer={<Button variant="outline" onClick={() => setIsSelectModalOpen(false)}><X size={15} aria-hidden="true" /> Đóng</Button>}><div className="ui-filter-grid"><AdminField id="admin-sale-account-search" label="Tìm theo ID"><Input id="admin-sale-account-search" value={modalSearch} onChange={(event) => setModalSearch(event.target.value)} placeholder="Ví dụ: 1024" /></AdminField><AdminField id="admin-sale-account-type" label="Loại account"><Select id="admin-sale-account-type" value={modalTypeFilter} onChange={(event) => setModalTypeFilter(event.target.value)}><option value="">Tất cả loại</option>{accountTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</Select></AdminField><div className="ui-filter-summary"><Button type="button" variant="outline" onClick={fetchModalAccounts}>Tải lại</Button></div></div><div className="ui-modal-table-space"><DataTable data={filteredModalAccounts} loading={modalLoading} columns={accountColumns} caption="Account chưa bán" empty={<Empty><EmptyMedia><BadgePercent size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Không có account phù hợp</EmptyTitle><EmptyDescription>Thử đổi bộ lọc hoặc thêm account mới vào kho.</EmptyDescription></EmptyHeader></Empty>} /></div></Modal>
      <AdminConfirmDialog open={Boolean(confirmation)} title={confirmation?.title} description={confirmation?.description} pending={confirming} onClose={() => setConfirmation(null)} onConfirm={confirmAction} confirmLabel="Tắt flash sale" />
    </div>
  );
}
