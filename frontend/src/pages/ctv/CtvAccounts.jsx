import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/api";
import { Edit2, EyeOff, Gamepad2, Upload, RefreshCw } from "lucide-react";
import SafeImage from "../../components/SafeImage";
import CurrencyInput from "../../components/CurrencyInput";
import { AdminConfirmDialog, AdminError, AdminField, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable, DataTablePagination } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";
import { importImageList, importImageUrl, uploadImageFile } from "../../utils/imageUpload";
import { notifyAdmin } from "../../utils/adminFeedback";

function makeEmptyForm(firstTypeId = "") {
  return {
    loai_id: firstTypeId,
    thong_tin: "Đổi được thông tin và mật khẩu\nHỗ trợ bảo hành",
    list_thong_tin: "0",
    img: "",
    list_img: "0",
    login: "liên hệ Zalo admin | để được nhận account #ID",
    gia: "",
    is_sale: false,
    sale_price: "",
  };
}

export default function CtvAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [hiding, setHiding] = useState(false);
  const [hideTarget, setHideTarget] = useState(null);
  const loadSequence = useRef(0);
  const formErrorRef = useRef(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPage: 1 });
  const [filterStatus, setFilterStatus] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(makeEmptyForm());

  const loadData = useCallback(async (page = 1) => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const statusQuery = filterStatus !== "" ? `&status=${filterStatus}` : "";
      const [accRes, typeRes] = await Promise.all([
        api.get(`/ctv/accounts?page=${page}&limit=20${statusQuery}`),
        api.get("/account-types"),
      ]);
      if (sequence !== loadSequence.current) return;

      setAccounts(accRes.data.data.accounts || []);
      setPagination(accRes.data.data.pagination || { page, limit: 20, total: 0, totalPage: 1 });
      setTypes(typeRes.data.data || []);
      
      if (typeRes.data.data?.length > 0) {
        setForm((prev) => prev.loai_id ? prev : { ...prev, loai_id: typeRes.data.data[0].id });
      }
    } catch (error) {
      if (sequence === loadSequence.current) setLoadError(error.response?.data?.message || "Không thể tải danh sách tài khoản.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const url = await uploadImageFile(api, file);
      setForm((prev) => ({
        ...prev,
        img: url,
      }));
    } catch {
      notifyAdmin("Tải ảnh lên thất bại. Vui lòng thử lại.", "error");
    }
  }

  function showFormError(message) {
    setFormError(message);
    window.requestAnimationFrame(() => formErrorRef.current?.focus());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setFormError("");
    if (!form.loai_id) return showFormError("Vui lòng chọn loại tài khoản.");
    if (!form.gia || Number(form.gia) < 0) return showFormError("Vui lòng nhập giá bán hợp lệ.");
    if (!form.login.trim()) return showFormError("Vui lòng điền thông tin bàn giao.");
    if (form.is_sale && (!form.sale_price || Number(form.sale_price) >= Number(form.gia))) {
      return showFormError("Giá sale phải lớn hơn 0 và thấp hơn giá bán gốc.");
    }
    const payload = { ...form, sale_price: form.is_sale ? form.sale_price : null };
    delete payload.is_sale;

    setSaving(true);
    try {
      payload.img = await importImageUrl(api, form.img);
      payload.list_img = await importImageList(api, form.list_img);
      if (editingId) {
        await api.put(`/accounts/${editingId}`, payload);
        notifyAdmin("Đã cập nhật tài khoản.", "success");
      } else {
        await api.post("/accounts", payload);
        notifyAdmin("Đã đăng bán tài khoản.", "success");
      }
      resetForm();
      loadData(pagination.page);
    } catch (err) {
      showFormError(err.response?.data?.message || err.message || "Không thể lưu tài khoản. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!hideTarget || hiding) return;
    setHiding(true);
    try {
      await api.patch(`/accounts/${hideTarget.id}/hide`);
      notifyAdmin("Đã ẩn tài khoản khỏi cửa hàng.", "success");
      setHideTarget(null);
      loadData(pagination.page);
    } catch {
      notifyAdmin("Không thể ẩn tài khoản. Vui lòng thử lại.", "error");
    } finally {
      setHiding(false);
    }
  }

  function startEdit(acc) {
    setEditingId(acc.id);
    setForm({
      loai_id: acc.loai_id || "",
      thong_tin: acc.thong_tin || "",
      list_thong_tin: acc.list_thong_tin || "0",
      img: acc.img || "",
      list_img: acc.list_img || "0",
      login: acc.login || "",
      gia: acc.gia || "",
      is_sale: Number(acc.sale_price) > 0,
      sale_price: acc.sale_price || "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setFormError("");
    setForm(makeEmptyForm(types[0]?.id || ""));
  }

  const accountColumns = [
    { id: "id", header: "ID", sortable: true, accessor: (account) => Number(account.id), cell: (account) => <span className="ui-table-code">#{account.id}</span> },
    { id: "image", header: "Ảnh", cell: (account) => <span className="ui-table-media"><SafeImage src={account.img} alt={`Ảnh tài khoản mã số ${account.id}`} width={65} height={38} fallbackLabel="Chưa có ảnh" /></span> },
    { id: "type", header: "Loại nick", sortable: true, accessor: (account) => types.find((type) => Number(type.id) === Number(account.loai_id))?.name || "", cell: (account) => <span className="ui-table-primary">{types.find((type) => Number(type.id) === Number(account.loai_id))?.name || `Loại #${account.loai_id}`}</span> },
    { id: "price", header: "Giá bán", sortable: true, accessor: (account) => Number(account.sale_price || account.gia || 0), cell: (account) => Number(account.sale_price) > 0 && Number(account.sale_price) < Number(account.gia) ? <span className="ui-table-price-sale"><del>{Number(account.gia).toLocaleString("vi-VN")}đ</del><strong>{Number(account.sale_price).toLocaleString("vi-VN")}đ</strong></span> : <span className="ui-table-price">{Number(account.gia).toLocaleString("vi-VN")}đ</span> },
    { id: "description", header: "Mô tả", cell: (account) => <span className="ui-table-detail" title={account.thong_tin || "Không có mô tả"}>{account.thong_tin || "Chưa có mô tả"}</span> },
    { id: "status", header: "Trạng thái", sortable: true, accessor: (account) => Number(account.status), cell: (account) => <Badge variant={Number(account.status) === 0 ? "success" : Number(account.status) === 1 ? "warning" : "secondary"}>{Number(account.status) === 0 ? "Đang bán" : Number(account.status) === 1 ? "Đã bán" : "Đã ẩn"}</Badge> },
    { id: "buyer", header: "Người mua", cell: (account) => account.buyer ? <span className="ui-table-primary">{account.buyer.username}</span> : account.buyer_id ? <span className="ui-table-secondary">User #{account.buyer_id}</span> : <span className="ui-table-secondary">—</span> },
    { id: "actions", header: "Thao tác", cell: (account) => Number(account.status) === 0 ? <div className="ui-table-actions"><Button size="sm" variant="outline" onClick={() => startEdit(account)}><Edit2 size={14} aria-hidden="true" /> Sửa</Button><Button size="sm" variant="destructive" onClick={() => setHideTarget(account)}><EyeOff size={14} aria-hidden="true" /> Ẩn</Button></div> : <span className="ui-table-secondary">Không có thao tác</span> },
  ];

  return (
    <div className="ctv-accounts-page admin-accounts-page">
      <AdminPageHeader eyebrow="Cộng tác viên · Kho sản phẩm" title="Kho tài khoản của tôi" description="Đăng sản phẩm mới, chỉnh sửa giá bán và theo dõi trạng thái kho của bạn." />

      <Card className="ctv-editor-card">
        <CardHeader><CardTitle>{editingId ? `Chỉnh sửa tài khoản #${editingId}` : "Đăng bán tài khoản mới"}</CardTitle><CardDescription>Thông tin bàn giao chỉ hiển thị sau khi khách thanh toán thành công.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="ui-form-grid ctv-account-form" autoComplete="off" noValidate>
            {formError && <div ref={formErrorRef} className="ctv-form-error ui-field-full" role="alert" tabIndex={-1}>{formError}</div>}

            <AdminField id="ctv-account-type" label="Loại tài khoản" required>
              <Select id="ctv-account-type" value={form.loai_id} onChange={(event) => setForm({ ...form, loai_id: event.target.value })} required>
                <option value="">Chọn loại nick</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </Select>
            </AdminField>

            <AdminField id="ctv-account-price" label="Giá bán (VND)" required>
              <CurrencyInput className="ui-input" id="ctv-account-price" placeholder="Ví dụ: 500.000" value={form.gia} onChange={(event) => setForm({ ...form, gia: event.target.value })} required />
            </AdminField>

            <AdminField id="ctv-listing-sale-enabled" label="Giá sale" helper={form.is_sale ? `Giá gốc ${Number(form.gia || 0).toLocaleString("vi-VN")}đ · Giá sale phải thấp hơn giá gốc.` : "Bật khi muốn hiển thị giá giảm riêng cho tài khoản này."}>
              <div className="ui-switch-card"><Switch id="ctv-listing-sale-enabled" checked={form.is_sale} onChange={(event) => setForm((previous) => ({ ...previous, is_sale: event.target.checked, sale_price: event.target.checked ? previous.sale_price : "" }))} /><span><strong>{form.is_sale ? "Đang áp dụng giá sale" : "Dùng giá bán thông thường"}</strong><small>Khách sẽ thấy rõ giá gốc và giá giảm.</small></span></div>
              {form.is_sale && <CurrencyInput className="ui-input" id="ctv-listing-sale-price" name="sale_price" placeholder="Ví dụ: 450.000" value={form.sale_price} onChange={(event) => setForm({ ...form, sale_price: event.target.value })} />}
            </AdminField>

            <AdminField id="ctv-account-image" label="Ảnh đại diện" helper="URL ngoài sẽ được sao chép vào kho ảnh của hệ thống trước khi lưu." className="ui-field-full">
              <div className="ctv-upload-row"><Input id="ctv-account-image" placeholder="Dán URL ảnh" value={form.img} onChange={(event) => setForm({ ...form, img: event.target.value })} /><label className="ui-upload-trigger"><Upload size={16} aria-hidden="true" /> Chọn tệp<input type="file" accept="image/*" autoComplete="off" onChange={handleUpload} /></label></div>
              {form.img && <div className="ctv-image-preview"><SafeImage src={form.img} alt="Xem trước ảnh tài khoản" width={160} height={90} fallbackLabel="Ảnh không tải được" /></div>}
            </AdminField>

            <AdminField id="ctv-account-description" label="Thông tin chi tiết" className="ui-field-full">
              <Textarea id="ctv-account-description" placeholder="Nhập các điểm nổi bật của tài khoản" value={form.thong_tin} onChange={(event) => setForm({ ...form, thong_tin: event.target.value })} rows={3} />
            </AdminField>

            <AdminField id="ctv-account-details-list" label="Danh sách thông tin" helper="Nhập 0 hoặc dữ liệu JSON hợp lệ."><Input id="ctv-account-details-list" placeholder="0 hoặc JSON array" value={form.list_thong_tin} onChange={(event) => setForm({ ...form, list_thong_tin: event.target.value })} /></AdminField>
            <AdminField id="ctv-account-images-list" label="Danh sách ảnh" helper="Nhập 0 hoặc danh sách URL ảnh dạng JSON."><Input id="ctv-account-images-list" placeholder="0 hoặc JSON array" value={form.list_img} onChange={(event) => setForm({ ...form, list_img: event.target.value })} /></AdminField>

            <AdminField id="ctv-account-login" label="Thông tin bàn giao" required helper="Tài khoản, mật khẩu và 2FA chỉ hiển thị cho người mua sau khi thanh toán." className="ui-field-full">
              <Textarea id="ctv-account-login" placeholder="Nhập tài khoản, mật khẩu và hướng dẫn bàn giao" value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} required rows={3} />
            </AdminField>

            <div className="ui-form-actions ui-field-full"><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Đang lưu…" : editingId ? "Lưu thay đổi" : "Đăng tài khoản"}</Button>{(editingId || form.gia) && <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Hủy thay đổi</Button>}</div>
          </form>
        </CardContent>
      </Card>

      <Card className="ctv-list-card">
        <CardHeader className="ctv-list-card-header"><div><CardTitle id="ctv-account-list-title">Tài khoản đã đăng</CardTitle><CardDescription>{pagination.total.toLocaleString("vi-VN")} sản phẩm trong kho của bạn</CardDescription></div><div className="ctv-list-actions"><Select aria-label="Lọc tài khoản theo trạng thái" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="0">Đang bán</option><option value="1">Đã bán</option><option value="2">Đã ẩn</option></Select><Button type="button" variant="outline" size="icon" onClick={() => loadData(pagination.page)} aria-label="Làm mới danh sách tài khoản"><RefreshCw size={16} aria-hidden="true" /></Button></div></CardHeader>
        <CardContent>
          {loadError ? <AdminError message={loadError} onRetry={() => loadData(pagination.page)} /> : <><DataTable columns={accountColumns} data={accounts} loading={loading} caption="Danh sách tài khoản cộng tác viên" empty={<Empty><EmptyMedia><Gamepad2 size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Chưa có tài khoản phù hợp</EmptyTitle><EmptyDescription>Đổi bộ lọc hoặc đăng tài khoản mới ở biểu mẫu phía trên.</EmptyDescription></EmptyHeader></Empty>} /><DataTablePagination page={pagination.page} totalPages={pagination.totalPage} total={pagination.total} pageSize={pagination.limit} onPageChange={loadData} /></>}
        </CardContent>
      </Card>
      <AdminConfirmDialog
        open={Boolean(hideTarget)}
        title="Ẩn tài khoản khỏi cửa hàng?"
        description={hideTarget ? `Tài khoản #${hideTarget.id} sẽ ngừng hiển thị với khách. Bạn vẫn có thể xem lại trong danh sách đã ẩn.` : ""}
        confirmLabel="Ẩn tài khoản"
        destructive
        pending={hiding}
        onClose={() => setHideTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
