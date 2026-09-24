import { useEffect, useState } from "react";
import { Pencil, Plus, Tag, PowerOff } from "lucide-react";
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

const emptyForm = { magiamgia: "", giamgia: "", theo: "phantram", soluong: 1, status: 1 };

export default function AdminDiscounts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmation, setConfirmation] = useState(null);
  const [confirming, setConfirming] = useState(false);

  async function load() {
    setLoading(true); setLoadError("");
    try { const res = await api.get("/admin/discounts"); setItems(res.data.data || []); } catch (err) { setLoadError(err.response?.data?.message || "Không thể tải mã giảm giá."); } finally { setLoading(false); }
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    if (!form.magiamgia.trim()) return notifyAdmin("Vui lòng nhập mã giảm giá");
    if (!form.giamgia) return notifyAdmin("Vui lòng nhập số tiền hoặc phần trăm giảm");
    setSaving(true);
    try { if (editingId) await api.put(`/admin/discounts/${editingId}`, form); else await api.post("/admin/discounts", form); notifyAdmin(editingId ? "Cập nhật mã giảm giá thành công" : "Tạo mã giảm giá thành công"); resetForm(); load(); } catch (err) { notifyAdmin(err.response?.data?.message || "Lỗi lưu mã giảm giá"); } finally { setSaving(false); }
  }

  function remove(id) { setConfirmation({ title: "Tắt mã giảm giá?", description: "Mã sẽ không còn được áp dụng cho các đơn hàng mới.", action: async () => { try { await api.delete(`/admin/discounts/${id}`); notifyAdmin("Đã tắt mã giảm giá"); load(); } catch (err) { notifyAdmin(err.response?.data?.message || "Lỗi tắt mã giảm giá"); } } }); }
  function startEdit(item) { setEditingId(item.id); setForm({ magiamgia: item.magiamgia || "", giamgia: item.giamgia || "", theo: item.theo || "phantram", soluong: item.soluong !== undefined ? Number(item.soluong) : 1, status: item.status !== undefined ? Number(item.status) : 1 }); }
  function resetForm() { setEditingId(null); setForm(emptyForm); }
  async function confirmAction() { if (!confirmation || confirming) return; setConfirming(true); try { await confirmation.action(); setConfirmation(null); } finally { setConfirming(false); } }
  useEffect(() => { load(); }, []);

  const columns = [
    { id: "id", header: "ID", accessor: (item) => item.id, sortable: true, cell: (item) => <span className="ui-table-code">#{item.id}</span> },
    { id: "code", header: "Mã", accessor: (item) => item.magiamgia || "", sortable: true, cell: (item) => <code className="ui-table-code">{item.magiamgia}</code> },
    { id: "value", header: "Mức giảm", accessor: (item) => Number(item.giamgia || 0), sortable: true, cell: (item) => <strong className="ui-table-price">{Number(item.giamgia || 0).toLocaleString()}{item.theo === "phantram" ? "%" : "đ"}</strong> },
    { id: "type", header: "Hình thức", accessor: (item) => item.theo || "", sortable: true, cell: (item) => <Badge variant="outline">{item.theo === "phantram" ? "Phần trăm" : "Tiền mặt"}</Badge> },
    { id: "quantity", header: "SL còn", accessor: (item) => Number(item.soluong || 0), sortable: true, cell: (item) => item.soluong },
    { id: "status", header: "Trạng thái", accessor: (item) => Number(item.status) === 1 ? "Đang bật" : "Đang tắt", sortable: true, cell: (item) => <Badge variant={Number(item.status) === 1 ? "success" : "secondary"}>{Number(item.status) === 1 ? "Đang bật" : "Đang tắt"}</Badge> },
    { id: "actions", header: "Thao tác", cell: (item) => <div className="ui-table-actions"><Button size="sm" variant="outline" onClick={() => startEdit(item)}><Pencil size={14} aria-hidden="true" /> Sửa</Button>{Number(item.status) === 1 && <Button size="sm" variant="destructive" onClick={() => remove(item.id)}><PowerOff size={14} aria-hidden="true" /> Tắt</Button>}</div> },
  ];

  return (
    <div className="admin-discounts-page admin-accounts-page">
      <AdminPageHeader eyebrow="Kinh doanh · Admin" title="Quản lý mã giảm giá" description="Tạo, theo dõi và tắt các mã khuyến mãi đang được áp dụng trên cửa hàng." actions={<Button onClick={resetForm}><Plus size={15} aria-hidden="true" /> Mã giảm giá mới</Button>} />
      <Card><CardHeader><CardTitle>{editingId ? `Chỉnh sửa mã #${editingId}` : "Tạo mã giảm giá mới"}</CardTitle><CardDescription>Thiết lập giá trị giảm, giới hạn lượt dùng và trạng thái mã.</CardDescription></CardHeader><form onSubmit={save}><CardContent><div className="ui-form-grid"><AdminField id="admin-discount-code" label="Mã giảm giá" required><Input id="admin-discount-code" placeholder="Ví dụ: LICHMINH, GIAM10K…" value={form.magiamgia} onChange={(event) => setForm({ ...form, magiamgia: event.target.value })} required /></AdminField><AdminField id="admin-discount-value" label="Giá trị giảm" required><Input id="admin-discount-value" type="number" min="0" placeholder="Nhập số" value={form.giamgia} onChange={(event) => setForm({ ...form, giamgia: event.target.value })} required /></AdminField><AdminField id="admin-discount-type" label="Hình thức giảm"><Select id="admin-discount-type" value={form.theo} onChange={(event) => setForm({ ...form, theo: event.target.value })}><option value="phantram">Giảm theo %</option><option value="tienmat">Giảm tiền mặt (VND)</option></Select></AdminField><AdminField id="admin-discount-quantity" label="Số lượng sử dụng"><Input id="admin-discount-quantity" type="number" min="1" value={form.soluong} onChange={(event) => setForm({ ...form, soluong: Number(event.target.value) })} required /></AdminField><AdminField id="admin-discount-status" label="Trạng thái"><Select id="admin-discount-status" value={form.status} onChange={(event) => setForm({ ...form, status: Number(event.target.value) })}><option value={1}>Kích hoạt</option><option value={0}>Tạm tắt</option></Select></AdminField></div></CardContent><CardFooter><Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Đặt lại</Button><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Đang lưu…" : editingId ? "Cập nhật" : "Tạo mã"}</Button></CardFooter></form></Card>
      <AdminError message={loadError} onRetry={load} />
      <Card className="ui-data-table-card"><CardHeader><CardTitle>Discount table</CardTitle><CardDescription>{loading ? "Đang đồng bộ dữ liệu…" : `${items.length} mã giảm giá.`}</CardDescription></CardHeader><CardContent><DataTable data={items} loading={loading} columns={columns} caption="Bảng mã giảm giá" empty={<Empty><EmptyMedia><Tag size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Chưa có mã giảm giá</EmptyTitle><EmptyDescription>Tạo mã đầu tiên để triển khai chương trình ưu đãi.</EmptyDescription></EmptyHeader><Button size="sm" onClick={resetForm}><Plus size={14} aria-hidden="true" /> Tạo mã</Button></Empty>} /></CardContent></Card>
      <AdminConfirmDialog open={Boolean(confirmation)} title={confirmation?.title} description={confirmation?.description} pending={confirming} onClose={() => setConfirmation(null)} onConfirm={confirmAction} confirmLabel="Tắt mã" />
    </div>
  );
}
