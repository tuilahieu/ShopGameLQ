import { useCallback, useEffect, useRef, useState } from "react";
import { EyeOff, Layers, Pencil, Plus, Trash2, Upload } from "lucide-react";
import api from "../../api/api";
import SafeImage from "../../components/SafeImage";
import { AdminConfirmDialog, AdminError, AdminField, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { notifyAdmin } from "../../utils/adminFeedback";

const emptyForm = { danhmuc_id: "", name: "", img: "", noidung: "", camket: "", status: 1 };

export default function AdminAccountTypes() {
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const imageRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [typeRes, categoryRes] = await Promise.all([api.get("/account-types?all=true"), api.get("/categories?all=true")]);
      const nextCategories = categoryRes.data.data || [];
      setTypes(typeRes.data.data || []);
      setCategories(nextCategories);
      setForm((previous) => previous.danhmuc_id ? previous : { ...previous, danhmuc_id: nextCategories[0]?.id || "" });
    } catch (err) {
      setLoadError(err.response?.data?.message || "Lỗi tải loại tài khoản");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((previous) => ({ ...previous, img: res.data.data.url }));
      notifyAdmin("Đã tải ảnh lên");
    } catch {
      notifyAdmin("Tải ảnh lên thất bại. Vui lòng thử lại.");
    }
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    if (!form.danhmuc_id) return notifyAdmin("Vui lòng chọn danh mục cha");
    if (!form.name.trim()) return notifyAdmin("Vui lòng nhập tên loại tài khoản");
    setSaving(true);
    try {
      if (editingId) await api.put(`/account-types/${editingId}`, form);
      else await api.post("/account-types", form);
      notifyAdmin(editingId ? "Cập nhật loại tài khoản thành công" : "Thêm loại tài khoản thành công");
      resetForm();
      load();
    } catch (err) {
      notifyAdmin(err.response?.data?.message || "Lỗi lưu loại tài khoản");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(type) {
    setEditingId(type.id);
    setForm({ danhmuc_id: type.danhmuc_id || "", name: type.name || "", img: type.img || "", noidung: type.noidung || "", camket: type.camket || "", status: type.status !== undefined ? Number(type.status) : 1 });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, danhmuc_id: categories[0]?.id || "" });
    if (imageRef.current) imageRef.current.value = "";
  }

  function ask(action, title, description, destructive = false) { setConfirmation({ action, title, description, destructive }); }
  async function confirmAction() { if (!confirmation || confirming) return; setConfirming(true); try { await confirmation.action(); setConfirmation(null); } finally { setConfirming(false); } }
  function hide(id) { ask(async () => { try { const res = await api.patch(`/account-types/${id}/hide`); notifyAdmin(res.data?.message || "Đã ẩn loại tài khoản"); load(); } catch (err) { notifyAdmin(err.response?.data?.message || "Lỗi ẩn loại tài khoản"); } }, "Ẩn loại tài khoản?", "Loại tài khoản sẽ được giữ lại nhưng không còn hiển thị với khách hàng."); }
  function remove(id) { ask(async () => { try { const res = await api.delete(`/account-types/${id}`); notifyAdmin(res.data?.message || "Đã xóa hẳn loại tài khoản"); load(); } catch (err) { notifyAdmin(err.response?.data?.message || "Lỗi xóa hẳn loại tài khoản"); } }, "Xóa hẳn loại tài khoản?", "Chỉ xóa được khi loại này không còn tài khoản game.", true); }

  useEffect(() => { load(); }, [load]);

  const categoryName = (id) => categories.find((category) => Number(category.id) === Number(id))?.name || `DM #${id}`;
  const columns = [
    { id: "id", header: "ID", accessor: (type) => type.id, sortable: true, cell: (type) => <span className="ui-table-code">#{type.id}</span> },
    { id: "category", header: "Danh mục cha", accessor: (type) => categoryName(type.danhmuc_id), sortable: true, cell: (type) => <Badge variant="outline">{categoryName(type.danhmuc_id)}</Badge> },
    { id: "name", header: "Tên loại", accessor: (type) => type.name || "", sortable: true, cell: (type) => <strong className="ui-table-primary">{type.name}</strong> },
    { id: "image", header: "Ảnh", cell: (type) => <div className="ui-table-media"><SafeImage src={type.img} alt={`Ảnh loại tài khoản ${type.name}`} width={60} height={35} fallbackLabel="Chưa có ảnh" /></div> },
    { id: "description", header: "Mô tả", accessor: (type) => type.noidung || "", cell: (type) => <span className="ui-table-detail">{type.noidung || "—"}</span> },
    { id: "commitment", header: "Cam kết", accessor: (type) => type.camket || "", cell: (type) => <span className="ui-table-detail">{type.camket || "—"}</span> },
    { id: "status", header: "Trạng thái", accessor: (type) => Number(type.status) === 1 ? "Hiển thị" : "Đã ẩn", sortable: true, cell: (type) => <Badge variant={Number(type.status) === 1 ? "success" : "secondary"}>{Number(type.status) === 1 ? "Hiển thị" : "Đã ẩn"}</Badge> },
    { id: "actions", header: "Thao tác", cell: (type) => <div className="ui-table-actions"><Button size="sm" variant="outline" onClick={() => startEdit(type)}><Pencil size={14} aria-hidden="true" /> Sửa</Button>{Number(type.status) === 1 && <Button size="sm" variant="secondary" onClick={() => hide(type.id)}><EyeOff size={14} aria-hidden="true" /> Ẩn</Button>}<Button size="sm" variant="destructive" onClick={() => remove(type.id)}><Trash2 size={14} aria-hidden="true" /> Xóa</Button></div> },
  ];

  return (
    <div className="admin-account-types-page admin-accounts-page">
      <AdminPageHeader eyebrow="Sản phẩm · Admin" title="Quản lý loại tài khoản" description="Khai báo các loại account thuộc từng danh mục, kèm ảnh, mô tả và cam kết bán hàng." actions={<Button onClick={resetForm}><Plus size={15} aria-hidden="true" /> Loại tài khoản mới</Button>} />
      <Card><CardHeader><CardTitle>{editingId ? `Chỉnh sửa loại nick #${editingId}` : "Thêm loại nick mới"}</CardTitle><CardDescription>Thông tin này được dùng trên trang danh mục và thẻ sản phẩm.</CardDescription></CardHeader><form onSubmit={save}><CardContent><div className="ui-form-grid"><AdminField id="admin-type-category" label="Danh mục cha" required><Select id="admin-type-category" value={form.danhmuc_id} onChange={(event) => setForm({ ...form, danhmuc_id: event.target.value })} required><option value="">Chọn danh mục…</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></AdminField><AdminField id="admin-type-name" label="Tên loại tài khoản" required><Input id="admin-type-name" placeholder="Ví dụ: Túi mù 50k, VIP…" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></AdminField><div className="ui-field ui-field-full"><AdminField id="admin-type-image" label="Ảnh đại diện"><div className="ui-upload-row"><Input id="admin-type-image" type="url" placeholder="Nhập link ảnh" value={form.img} onChange={(event) => setForm({ ...form, img: event.target.value })} /><label className="ui-upload-trigger" htmlFor="admin-type-upload"><Upload size={15} aria-hidden="true" /> Upload<input ref={imageRef} id="admin-type-upload" type="file" accept="image/*" onChange={handleUpload} /></label></div>{form.img && <div className="ui-image-preview"><SafeImage src={form.img} alt="Xem trước ảnh loại tài khoản" width={214} height={120} fallbackLabel="Ảnh không tải được" /></div>}</AdminField></div><AdminField id="admin-type-description" label="Mô tả ngắn"><Input id="admin-type-description" placeholder="Mô tả về loại account…" value={form.noidung} onChange={(event) => setForm({ ...form, noidung: event.target.value })} /></AdminField><AdminField id="admin-type-commitment" label="Cam kết của shop"><Input id="admin-type-commitment" placeholder="Ví dụ: Đúng mật khẩu 100%…" value={form.camket} onChange={(event) => setForm({ ...form, camket: event.target.value })} /></AdminField><AdminField id="admin-type-status" label="Trạng thái"><Select id="admin-type-status" value={form.status} onChange={(event) => setForm({ ...form, status: Number(event.target.value) })}><option value={1}>Hiển thị</option><option value={0}>Ẩn</option></Select></AdminField></div></CardContent><CardFooter><Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Đặt lại</Button><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Đang lưu…" : editingId ? "Cập nhật" : "Thêm mới"}</Button></CardFooter></form></Card>
      <AdminError message={loadError} onRetry={load} />
      <Card className="ui-data-table-card"><CardHeader><CardTitle>Account type table</CardTitle><CardDescription>{loading ? "Đang đồng bộ dữ liệu…" : `${types.length} loại tài khoản.`}</CardDescription></CardHeader><CardContent><DataTable data={types} loading={loading} columns={columns} caption="Bảng loại tài khoản" empty={<Empty><EmptyMedia><Layers size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Chưa có loại tài khoản</EmptyTitle><EmptyDescription>Tạo loại tài khoản đầu tiên để kết nối với kho account.</EmptyDescription></EmptyHeader><Button size="sm" onClick={resetForm}><Plus size={14} aria-hidden="true" /> Thêm loại</Button></Empty>} /></CardContent></Card>
      <AdminConfirmDialog open={Boolean(confirmation)} title={confirmation?.title} description={confirmation?.description} destructive={confirmation?.destructive} pending={confirming} onClose={() => setConfirmation(null)} onConfirm={confirmAction} confirmLabel={confirmation?.destructive ? "Xóa hẳn" : "Xác nhận"} />
    </div>
  );
}
