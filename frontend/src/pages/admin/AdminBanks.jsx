import { useEffect, useState } from "react";
import { Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../api/api";
import { AdminConfirmDialog, AdminError, AdminField, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { notifyAdmin } from "../../utils/adminFeedback";

const emptyForm = { name: "", account_no: "", account_name: "", bank_id: "", status: 1 };

export default function AdminBanks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmation, setConfirmation] = useState(null);
  const [confirming, setConfirming] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError("");
    try { const res = await api.get("/admin/banks"); setItems(res.data.data || []); } catch (err) { setLoadError(err.response?.data?.message || "Không thể tải tài khoản ngân hàng."); } finally { setLoading(false); }
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    if (!form.name || !form.account_no || !form.account_name || !form.bank_id) return notifyAdmin("Vui lòng nhập đầy đủ thông tin ngân hàng!");
    setSaving(true);
    try {
      if (editingId) await api.put(`/admin/banks/${editingId}`, form); else await api.post("/admin/banks", form);
      notifyAdmin(editingId ? "Cập nhật tài khoản ngân hàng thành công" : "Thêm tài khoản ngân hàng thành công"); resetForm(); load();
    } catch (err) { notifyAdmin(err.response?.data?.message || "Lỗi lưu thông tin ngân hàng"); } finally { setSaving(false); }
  }

  function remove(id) {
    setConfirmation({ title: "Ẩn tài khoản ngân hàng?", description: "Tài khoản sẽ không còn xuất hiện trên trang nạp tiền.", action: async () => { try { await api.delete(`/admin/banks/${id}`); notifyAdmin("Đã ẩn tài khoản ngân hàng"); load(); } catch (err) { notifyAdmin(err.response?.data?.message || "Lỗi khi ẩn ngân hàng"); } } });
  }

  function startEdit(item) { setEditingId(item.id); setForm({ name: item.name || "", account_no: item.account_no || "", account_name: item.account_name || "", bank_id: item.bank_id || "", status: item.status !== undefined ? Number(item.status) : 1 }); }
  function resetForm() { setEditingId(null); setForm(emptyForm); }
  async function confirmAction() { if (!confirmation || confirming) return; setConfirming(true); try { await confirmation.action(); setConfirmation(null); } finally { setConfirming(false); } }
  useEffect(() => { load(); }, []);

  const columns = [
    { id: "id", header: "ID", accessor: (item) => item.id, sortable: true, cell: (item) => <span className="ui-table-code">#{item.id}</span> },
    { id: "name", header: "Cổng ngân hàng", accessor: (item) => item.name || "", sortable: true, cell: (item) => <span className="ui-table-primary"><Landmark size={15} aria-hidden="true" /> {item.name}</span> },
    { id: "account", header: "Số tài khoản", accessor: (item) => item.account_no || "", sortable: true, cell: (item) => <span className="ui-table-code">{item.account_no}</span> },
    { id: "owner", header: "Chủ tài khoản", accessor: (item) => item.account_name || "", sortable: true, cell: (item) => item.account_name },
    { id: "qr", header: "Mã QR", accessor: (item) => item.bank_id || "", sortable: true, cell: (item) => <Badge variant="outline">{item.bank_id}</Badge> },
    { id: "status", header: "Trạng thái", accessor: (item) => Number(item.status) === 1 ? "Hoạt động" : "Tạm khóa", sortable: true, cell: (item) => <Badge variant={Number(item.status) === 1 ? "success" : "secondary"}>{Number(item.status) === 1 ? "Hoạt động" : "Tạm khóa"}</Badge> },
    { id: "actions", header: "Thao tác", cell: (item) => <div className="ui-table-actions"><Button size="sm" variant="outline" onClick={() => startEdit(item)}><Pencil size={14} aria-hidden="true" /> Sửa</Button><Button size="sm" variant="destructive" onClick={() => remove(item.id)}><Trash2 size={14} aria-hidden="true" /> Ẩn</Button></div> },
  ];

  return (
    <div className="admin-banks-page admin-accounts-page">
      <AdminPageHeader eyebrow="Hệ thống · Admin" title="Quản lý tài khoản ngân hàng" description="Cấu hình các cổng nhận tiền hiển thị cho khách khi nạp tiền." actions={<Button onClick={resetForm}><Plus size={15} aria-hidden="true" /> Tài khoản mới</Button>} />
      <Card><CardHeader><CardTitle>{editingId ? `Chỉnh sửa cổng #${editingId}` : "Thêm cổng thanh toán mới"}</CardTitle><CardDescription>Thông tin tài khoản được dùng để tạo mã QR và đối soát giao dịch.</CardDescription></CardHeader><form onSubmit={save}><CardContent><div className="ui-form-grid"><AdminField id="admin-bank-name" label="Tên ngân hàng" required><Input id="admin-bank-name" placeholder="Ví dụ: MB Bank" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></AdminField><AdminField id="admin-bank-account-no" label="Số tài khoản / Số ví" required><Input id="admin-bank-account-no" placeholder="Ví dụ: 9999686868" value={form.account_no} onChange={(event) => setForm({ ...form, account_no: event.target.value })} required /></AdminField><AdminField id="admin-bank-account-name" label="Chủ tài khoản" required helper="Nên nhập tên viết hoa không dấu."><Input id="admin-bank-account-name" placeholder="NGUYEN VAN A" value={form.account_name} onChange={(event) => setForm({ ...form, account_name: event.target.value })} required /></AdminField><AdminField id="admin-bank-id" label="Mã nhận diện QR" required helper="Ví dụ: mbbank, momo, vcb, acb…"><Input id="admin-bank-id" placeholder="Mã ngân hàng / ví" value={form.bank_id} onChange={(event) => setForm({ ...form, bank_id: event.target.value })} required /></AdminField><AdminField id="admin-bank-status" label="Trạng thái"><Select id="admin-bank-status" value={form.status} onChange={(event) => setForm({ ...form, status: Number(event.target.value) })}><option value={1}>Kích hoạt</option><option value={0}>Tạm khóa</option></Select></AdminField></div></CardContent><CardFooter><Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Đặt lại</Button><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Đang lưu…" : editingId ? "Cập nhật" : "Thêm mới"}</Button></CardFooter></form></Card>
      <AdminError message={loadError} onRetry={load} />
      <Card className="ui-data-table-card"><CardHeader><CardTitle>Bank account table</CardTitle><CardDescription>{loading ? "Đang đồng bộ dữ liệu…" : `${items.length} tài khoản ngân hàng.`}</CardDescription></CardHeader><CardContent><DataTable data={items} loading={loading} columns={columns} caption="Bảng tài khoản ngân hàng" empty={<Empty><EmptyMedia><Landmark size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Chưa cấu hình ngân hàng</EmptyTitle><EmptyDescription>Thêm một tài khoản để bật luồng nạp tiền cho khách.</EmptyDescription></EmptyHeader><Button size="sm" onClick={resetForm}><Plus size={14} aria-hidden="true" /> Thêm tài khoản</Button></Empty>} /></CardContent></Card>
      <AdminConfirmDialog open={Boolean(confirmation)} title={confirmation?.title} description={confirmation?.description} pending={confirming} onClose={() => setConfirmation(null)} onConfirm={confirmAction} confirmLabel="Ẩn tài khoản" />
    </div>
  );
}
