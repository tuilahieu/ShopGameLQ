import { useEffect, useState } from "react";
import { FolderKanban, Pencil, Plus, Trash2, EyeOff } from "lucide-react";
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

const emptyForm = { name: "", noidung: "", type: "", status: 1 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [confirming, setConfirming] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/categories?all=true");
      setCategories(res.data.data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Lỗi tải danh mục");
    } finally {
      setLoading(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim()) return notifyAdmin("Vui lòng nhập tên danh mục");
    setSaving(true);
    try {
      if (editingId) await api.put(`/categories/${editingId}`, form);
      else await api.post("/categories", form);
      notifyAdmin(editingId ? "Cập nhật danh mục thành công" : "Thêm danh mục thành công");
      resetForm();
      load();
    } catch (err) {
      notifyAdmin(err.response?.data?.message || "Lỗi lưu danh mục");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category) {
    setEditingId(category.id);
    setForm({ name: category.name || "", noidung: category.noidung || "", type: category.type || "", status: category.status !== undefined ? Number(category.status) : 1 });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function ask(action, title, description, destructive = false) {
    setConfirmation({ action, title, description, destructive });
  }

  async function confirmAction() {
    if (!confirmation || confirming) return;
    setConfirming(true);
    try { await confirmation.action(); setConfirmation(null); } finally { setConfirming(false); }
  }

  function hide(id) {
    ask(async () => { try { const res = await api.patch(`/categories/${id}/hide`); notifyAdmin(res.data?.message || "Đã ẩn danh mục"); load(); } catch (err) { notifyAdmin(err.response?.data?.message || "Lỗi ẩn danh mục"); } }, "Ẩn danh mục?", "Danh mục sẽ được giữ lại nhưng không còn hiển thị với khách hàng.");
  }

  function remove(id) {
    ask(async () => { try { const res = await api.delete(`/categories/${id}`); notifyAdmin(res.data?.message || "Đã xóa hẳn danh mục"); load(); } catch (err) { notifyAdmin(err.response?.data?.message || "Lỗi xóa hẳn danh mục"); } }, "Xóa hẳn danh mục?", "Chỉ thực hiện được khi danh mục không còn loại tài khoản.", true);
  }

  useEffect(() => { load(); }, []);

  const columns = [
    { id: "id", header: "ID", accessor: (category) => category.id, sortable: true, cell: (category) => <span className="ui-table-code">#{category.id}</span> },
    { id: "name", header: "Tên danh mục", accessor: (category) => category.name || "", sortable: true, cell: (category) => <strong className="ui-table-primary">{category.name}</strong> },
    { id: "type", header: "Mã", accessor: (category) => category.type || "", sortable: true, cell: (category) => <span className="ui-table-code">{category.type || "N/A"}</span> },
    { id: "description", header: "Mô tả", accessor: (category) => category.noidung || "", cell: (category) => <span className="ui-table-detail">{category.noidung || "N/A"}</span> },
    { id: "status", header: "Trạng thái", accessor: (category) => Number(category.status) === 1 ? "Active" : "Hidden", sortable: true, cell: (category) => <Badge variant={Number(category.status) === 1 ? "success" : "secondary"}>{Number(category.status) === 1 ? "Hiển thị" : "Đã ẩn"}</Badge> },
    { id: "actions", header: "Thao tác", cell: (category) => <div className="ui-table-actions"><Button size="sm" variant="outline" onClick={() => startEdit(category)}><Pencil size={14} aria-hidden="true" /> Sửa</Button>{Number(category.status) === 1 && <Button size="sm" variant="secondary" onClick={() => hide(category.id)}><EyeOff size={14} aria-hidden="true" /> Ẩn</Button>}<Button size="sm" variant="destructive" onClick={() => remove(category.id)}><Trash2 size={14} aria-hidden="true" /> Xóa</Button></div> },
  ];

  return (
    <div className="admin-categories-page admin-accounts-page">
      <AdminPageHeader eyebrow="Sản phẩm · Admin" title="Quản lý danh mục tài khoản" description="Tổ chức các nhóm sản phẩm và kiểm soát trạng thái hiển thị trên storefront." actions={<Button onClick={resetForm}><Plus size={15} aria-hidden="true" /> Danh mục mới</Button>} />
      <Card><CardHeader><CardTitle>{editingId ? `Chỉnh sửa danh mục #${editingId}` : "Thêm danh mục mới"}</CardTitle><CardDescription>Dùng mã danh mục ổn định để kết nối với loại tài khoản.</CardDescription></CardHeader><form onSubmit={save}><CardContent><div className="ui-form-grid"><AdminField id="admin-category-name" label="Tên danh mục" required><Input id="admin-category-name" placeholder="Ví dụ: Acc Liên Quân VIP" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></AdminField><AdminField id="admin-category-type" label="Mã danh mục" helper="Ví dụ: lienquan, tuimu…"><Input id="admin-category-type" placeholder="Mã dùng trong hệ thống" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} /></AdminField><AdminField id="admin-category-description" label="Mô tả" className="ui-field-full"><Input id="admin-category-description" placeholder="Mô tả chi tiết về danh mục" value={form.noidung} onChange={(event) => setForm({ ...form, noidung: event.target.value })} /></AdminField><AdminField id="admin-category-status" label="Trạng thái"><Select id="admin-category-status" value={form.status} onChange={(event) => setForm({ ...form, status: Number(event.target.value) })}><option value={1}>Hiển thị</option><option value={0}>Ẩn</option></Select></AdminField></div></CardContent><CardFooter><Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Đặt lại</Button><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Đang lưu…" : editingId ? "Cập nhật" : "Thêm mới"}</Button></CardFooter></form></Card>
      <AdminError message={loadError} onRetry={load} />
      <Card className="ui-data-table-card"><CardHeader><CardTitle>Category table</CardTitle><CardDescription>{loading ? "Đang đồng bộ dữ liệu…" : `${categories.length} danh mục.`}</CardDescription></CardHeader><CardContent><DataTable data={categories} loading={loading} columns={columns} caption="Bảng danh mục tài khoản" empty={<Empty><EmptyMedia><FolderKanban size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Chưa có danh mục</EmptyTitle><EmptyDescription>Tạo danh mục đầu tiên để bắt đầu xây dựng kho sản phẩm.</EmptyDescription></EmptyHeader><Button size="sm" onClick={resetForm}><Plus size={14} aria-hidden="true" /> Thêm danh mục</Button></Empty>} /></CardContent></Card>
      <AdminConfirmDialog open={Boolean(confirmation)} title={confirmation?.title} description={confirmation?.description} destructive={confirmation?.destructive} pending={confirming} onClose={() => setConfirmation(null)} onConfirm={confirmAction} confirmLabel={confirmation?.destructive ? "Xóa hẳn" : "Xác nhận"} />
    </div>
  );
}
