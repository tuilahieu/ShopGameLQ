import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/api";
import { EyeOff, Pencil, Plus, RefreshCw, ShoppingBag, Trash2, Upload, X } from "lucide-react";
import SafeImage from "../../components/SafeImage";
import CurrencyInput from "../../components/CurrencyInput";
import Modal from "../../components/Modal";
import { notifyAdmin } from "../../utils/adminFeedback";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable, DataTablePagination } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";

const STATUS_MAP = {
  0: { label: "Đang bán", variant: "success" },
  1: { label: "Đã bán", variant: "secondary" },
  2: { label: "Đã ẩn", variant: "warning" },
};

function buildDefaultThongTin() {
  return "Đổi được thông tin\nHỗ trợ bảo hành";
}

function buildDefaultLogin(zalo) {
  return `liên hệ zalo ${zalo || "admin"} | để được hỗ trợ`;
}

function validImageUrl(value) {
  if (!value || /^\/?uploads\//i.test(value)) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function Field({ id, label, required = false, helper, className = "", children }) {
  return (
    <div className={`ui-field ${className}`.trim()}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="is-required" aria-hidden="true">*</span>}
      </Label>
      {children}
      {helper && <p className="ui-field-helper">{helper}</p>}
    </div>
  );
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [types, setTypes] = useState([]);
  const [setting, setSetting] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ loai_id: "", status: "", page: 1 });
  const [pagination, setPagination] = useState({ total: 0, totalPage: 1 });
  const [selected, setSelected] = useState(new Set());
  const [confirmation, setConfirmation] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const imgRef = useRef();
  const loadSequence = useRef(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState("");
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState("");
  const [metadataRetry, setMetadataRetry] = useState(0);

  function makeEmpty(zalo) {
    return {
      loai_id: "",
      thong_tin: buildDefaultThongTin(),
      list_thong_tin: "0",
      img: "",
      list_img: "0",
      login: buildDefaultLogin(zalo),
      gia: "",
      is_sale: false,
      sale_price: "",
      status: 0,
    };
  }

  const [form, setForm] = useState(makeEmpty(""));

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const loadData = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const params = { page: filters.page, limit: 20 };
      if (filters.loai_id) params.loai_id = filters.loai_id;
      if (filters.status !== "") params.status = filters.status;

      const accRes = await api.get("/admin/accounts", { params });
      if (sequence !== loadSequence.current) return;

      setAccounts(accRes.data?.data?.accounts || accRes.data?.data || []);
      if (accRes.data?.data?.pagination) setPagination(accRes.data.data.pagination);
      setSelected(new Set());
    } catch (error) {
      if (sequence === loadSequence.current) setLoadError(error.response?.data?.message || "Không thể tải kho tài khoản.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let active = true;
    setMetadataLoading(true);
    setMetadataError("");
    Promise.all([api.get("/account-types"), api.get("/home")]).then(([typeRes, settingRes]) => {
      if (!active) return;
      setTypes(typeRes.data?.data || []);
      const nextSetting = settingRes.data?.data?.setting || {};
      setSetting(nextSetting);
      setForm((prev) => (
        prev.login === buildDefaultLogin("") || prev.login === buildDefaultLogin("admin")
          ? { ...prev, login: buildDefaultLogin(nextSetting.sdt_admin) }
          : prev
      ));
    }).catch((error) => {
      if (active) setMetadataError(error.response?.data?.message || "Không thể tải loại tài khoản và cài đặt.");
    }).finally(() => {
      if (active) setMetadataLoading(false);
    });
    return () => { active = false; };
  }, [metadataRetry]);

  async function uploadImage(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data.data.url;
  }

  async function handleMainImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      set("img", url);
      notifyAdmin("Đã tải ảnh lên");
    } catch {
      notifyAdmin("Upload ảnh thất bại");
    }
  }

  async function saveAccount(event) {
    event.preventDefault();
    if (saving) return;
    if (!form.loai_id) return notifyAdmin("Vui lòng chọn loại tài khoản!");
    if (!form.gia) return notifyAdmin("Vui lòng nhập giá bán!");
    const imageUrl = form.img.trim();
    if (!validImageUrl(imageUrl)) return notifyAdmin("URL ảnh phải bắt đầu bằng http:// hoặc https://.");
    if (form.is_sale && (!form.sale_price || Number(form.sale_price) >= Number(form.gia))) {
      return notifyAdmin("Giá sale phải lớn hơn 0 và thấp hơn giá bán gốc.");
    }

    const payload = { ...form, img: imageUrl, sale_price: form.is_sale ? form.sale_price : null };
    delete payload.is_sale;
    delete payload.status;

    setSaving(true);
    setSaveProgress("Đang lưu tài khoản…");
    try {
      if (editingId) {
        await api.put(`/accounts/${editingId}`, payload);
        notifyAdmin("Cập nhật tài khoản thành công");
        closeForm();
        loadData();
        return;
      }

      const lines = form.login.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length === 0) lines.push(form.login.trim() || buildDefaultLogin(setting.sdt_admin));

      let success = 0;
      let failed = 0;
      for (const loginLine of lines) {
        setSaveProgress(`Đang thêm ${success + failed + 1}/${lines.length} tài khoản…`);
        try {
          await api.post("/accounts", { ...payload, login: loginLine });
          success++;
        } catch {
          failed++;
        }
      }

      notifyAdmin(failed > 0 ? `Đã thêm ${success}/${lines.length} tài khoản. ${failed} dòng bị lỗi.` : `Đã thêm thành công ${success} tài khoản.`);
      closeForm();
      loadData();
    } catch (error) {
      notifyAdmin(error?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
      setSaveProgress("");
    }
  }

  function askConfirmation(config) {
    setConfirmation(config);
  }

  async function confirmAction() {
    if (!confirmation || confirming) return;
    setConfirming(true);
    try {
      await confirmation.action();
      setConfirmation(null);
    } finally {
      setConfirming(false);
    }
  }

  function hideAccount(id) {
    askConfirmation({
      title: `Ẩn tài khoản #${id}?`,
      description: "Tài khoản sẽ được giữ lại trong kho nhưng không còn hiển thị ở danh sách bán.",
      confirmLabel: "Ẩn tài khoản",
      variant: "default",
      action: async () => {
        try {
          await api.patch(`/accounts/${id}/hide`);
          notifyAdmin(`Đã ẩn tài khoản #${id}`);
          loadData();
        } catch (error) {
          notifyAdmin(error.response?.data?.message || "Lỗi ẩn tài khoản");
        }
      },
    });
  }

  function deleteAccount(id) {
    askConfirmation({
      title: `Xóa hẳn tài khoản #${id}?`,
      description: "Không thể hoàn tác. Tài khoản đã có đơn hàng sẽ được hệ thống từ chối xóa.",
      confirmLabel: "Xóa hẳn",
      variant: "destructive",
      action: async () => {
        try {
          await api.delete(`/accounts/${id}`);
          notifyAdmin(`Đã xóa tài khoản #${id}`);
          loadData();
        } catch (error) {
          notifyAdmin(error.response?.data?.message || "Lỗi xóa hẳn tài khoản");
        }
      },
    });
  }

  function deleteSelected() {
    if (selected.size === 0) return;
    const ids = [...selected];
    askConfirmation({
      title: `Xóa ${ids.length} tài khoản đã chọn?`,
      description: "Không thể hoàn tác. Các tài khoản đã có đơn hàng sẽ không bị xóa.",
      confirmLabel: `Xóa ${ids.length} mục`,
      variant: "destructive",
      action: async () => {
        let ok = 0;
        let fail = 0;
        for (const id of ids) {
          try {
            await api.delete(`/accounts/${id}`);
            ok++;
          } catch {
            fail++;
          }
        }
        notifyAdmin(fail > 0 ? `Đã xóa ${ok}/${ids.length}, ${fail} lỗi.` : `Đã xóa ${ok} tài khoản.`);
        loadData();
      },
    });
  }

  function openEdit(account) {
    setEditingId(account.id);
    setForm({
      loai_id: account.loai_id || "",
      thong_tin: account.thong_tin || buildDefaultThongTin(),
      list_thong_tin: account.list_thong_tin ?? "0",
      img: account.img || "",
      list_img: account.list_img ?? "0",
      login: account.login || "",
      gia: account.gia || "",
      is_sale: Number(account.sale_price) > 0,
      sale_price: account.sale_price || "",
      status: account.status ?? 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCreate() {
    setEditingId(null);
    setForm(makeEmpty(setting.sdt_admin));
    setShowForm(true);
  }

  function closeForm() {
    setEditingId(null);
    setForm(makeEmpty(setting.sdt_admin));
    setShowForm(false);
  }

  const typeName = (id) => types.find((type) => type.id == id)?.name || id || "Chưa phân loại";
  const pageCount = accounts.length;
  const sellingCount = accounts.filter((account) => Number(account.status) === 0).length;
  const soldCount = accounts.filter((account) => Number(account.status) === 1).length;
  const hiddenCount = accounts.filter((account) => Number(account.status) === 2).length;
  const summaryRows = [
    { id: "selling", label: "Đang bán", value: sellingCount },
    { id: "sold", label: "Đã bán", value: soldCount },
    { id: "hidden", label: "Đã ẩn", value: hiddenCount },
    { id: "total", label: "Tổng kho", value: pagination.total ?? accounts.length },
  ];

  const columns = [
    { id: "id", header: "ID", accessor: (account) => account.id, sortable: true, cell: (account) => <span className="ui-table-code">#{account.id}</span> },
    { id: "image", header: "Ảnh", cell: (account) => <div className="ui-table-media"><SafeImage src={account.img} alt={`Ảnh tài khoản mã số ${account.id}`} width={60} height={44} fallbackLabel="Chưa có ảnh" /></div> },
    { id: "type", header: "Loại tài khoản", accessor: (account) => typeName(account.loai_id), sortable: true, cell: (account) => <span className="ui-table-primary">{typeName(account.loai_id)}</span> },
    {
      id: "price",
      header: "Giá bán",
      accessor: (account) => Number(account.sale_price) > 0 && Number(account.sale_price) < Number(account.gia) ? Number(account.sale_price) : Number(account.gia || 0),
      sortable: true,
      cell: (account) => Number(account.sale_price) > 0 && Number(account.sale_price) < Number(account.gia) ? <span className="ui-table-price-sale"><del>{Number(account.gia).toLocaleString()}đ</del><strong>{Number(account.sale_price).toLocaleString()}đ</strong></span> : <span className="ui-table-price">{Number(account.gia || 0).toLocaleString()}đ</span>,
    },
    { id: "details", header: "Thông tin", accessor: (account) => account.thong_tin || "", cell: (account) => <span className="ui-table-detail">{account.thong_tin || "—"}</span> },
    { id: "status", header: "Trạng thái", accessor: (account) => STATUS_MAP[account.status]?.label || account.status, sortable: true, cell: (account) => <Badge variant={STATUS_MAP[account.status]?.variant || "outline"}>{STATUS_MAP[account.status]?.label || account.status}</Badge> },
    {
      id: "buyer",
      header: "Người mua",
      accessor: (account) => account.buyer?.username || account.buyer_id || "",
      sortable: true,
      cell: (account) => account.buyer ? <span><strong className="ui-table-primary">{account.buyer.username}</strong><br /><small className="ui-table-secondary">{Number(account.buyer.level) === 99 ? "Admin" : Number(account.buyer.level) === 1 ? "CTV" : "Thành viên"}</small></span> : account.buyer_id ? <span className="ui-table-secondary">User #{account.buyer_id}</span> : <span className="ui-table-secondary">—</span>,
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: (account) => <div className="ui-table-actions"><Button size="sm" variant="outline" onClick={() => openEdit(account)} aria-label={`Sửa tài khoản #${account.id}`}><Pencil size={14} aria-hidden="true" /> Sửa</Button><Button size="sm" variant="destructive" onClick={() => deleteAccount(account.id)} aria-label={`Xóa tài khoản #${account.id}`}><Trash2 size={14} aria-hidden="true" /> Xóa</Button>{Number(account.status) !== 1 && <Button size="sm" variant="secondary" onClick={() => hideAccount(account.id)} aria-label={`Ẩn tài khoản #${account.id}`}><EyeOff size={14} aria-hidden="true" /> Ẩn</Button>}</div>,
    },
  ];
  const summaryColumns = [
    { id: "label", header: "Chỉ số", accessor: (row) => row.label, sortable: true, cell: (row) => <span className="ui-table-primary">{row.label}</span> },
    { id: "value", header: "Số lượng", accessor: (row) => row.value, sortable: true, cell: (row) => <strong className="ui-table-price">{row.value}</strong> },
  ];

  return (
    <div className="admin-accounts-page">
      <header className="ui-admin-page-header">
        <div className="ui-admin-page-header-copy"><p className="ui-admin-page-header-eyebrow">Kho sản phẩm · Admin</p><h1>Quản lý Tài khoản Game</h1><p>Quản lý kho, giá bán, trạng thái và thông tin bàn giao tài khoản trên cùng một workspace.</p></div>
        <Button size="lg" onClick={openCreate}><Plus size={17} aria-hidden="true" /> Thêm account mới</Button>
      </header>

      {showForm && <Card>
        <CardHeader><div className="ui-admin-page-header"><div><CardTitle>{editingId ? `Sửa account #${editingId}` : "Thêm account mới"}</CardTitle><CardDescription>{editingId ? "Cập nhật thông tin sản phẩm và trạng thái hiển thị." : "Nhập nhiều dòng đăng nhập để tạo nhiều account cùng lúc."}</CardDescription></div><Button type="button" variant="ghost" size="icon" onClick={closeForm} aria-label="Đóng biểu mẫu tài khoản"><X size={18} aria-hidden="true" /></Button></div></CardHeader>
        <form onSubmit={saveAccount}>
          <CardContent><div className="ui-form-grid">
            <Field id="admin-account-type" label="Loại tài khoản" required><Select id="admin-account-type" value={form.loai_id} onChange={(event) => set("loai_id", event.target.value)} required><option value="">-- Chọn loại --</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</Select></Field>
            <Field id="admin-account-price" label="Giá bán (đ)" required><CurrencyInput id="admin-account-price" placeholder="Ví dụ: 50.000" value={form.gia} onChange={(event) => set("gia", event.target.value)} required /></Field>
            <Field id="admin-account-status" label="Trạng thái"><Select id="admin-account-status" value={form.status} onChange={(event) => set("status", Number(event.target.value))}><option value={0}>Đang bán</option><option value={1}>Đã bán</option><option value={2}>Ẩn</option></Select></Field>
            <div className="ui-field"><Label htmlFor="listing-sale-enabled">Giá sale riêng account</Label><div className="ui-switch-card"><Switch id="listing-sale-enabled" checked={form.is_sale} onChange={(event) => setForm((prev) => ({ ...prev, is_sale: event.target.checked, sale_price: event.target.checked ? prev.sale_price : "" }))} /><span><strong>Bật giá giảm</strong><small>Hiện giá sale trên thẻ và trang chi tiết.</small></span></div></div>
            {form.is_sale && <Field id="listing-sale-price" label="Giá sale" helper={`Giá gốc hiện tại: ${Number(form.gia || 0).toLocaleString()}đ`}><CurrencyInput id="listing-sale-price" name="sale_price" placeholder="Ví dụ: 100.000" value={form.sale_price} onChange={(event) => set("sale_price", event.target.value)} /></Field>}
            <div className="ui-field ui-field-full"><Label htmlFor="admin-account-image">Ảnh đại diện</Label><div className="ui-upload-row"><label className="ui-upload-trigger" htmlFor="admin-account-image-upload"><Upload size={15} aria-hidden="true" /> Tải ảnh lên<input ref={imgRef} id="admin-account-image-upload" type="file" accept="image/*" onChange={handleMainImage} /></label>{form.img && <Button type="button" variant="outline" size="sm" onClick={() => { set("img", ""); if (imgRef.current) imgRef.current.value = ""; }}>Xóa ảnh</Button>}</div><Input id="admin-account-image" type="url" inputMode="url" placeholder="Hoặc dán URL ảnh, ví dụ https://example.com/anh.jpg" value={form.img} onChange={(event) => set("img", event.target.value)} />{form.img && <div className="ui-image-preview"><SafeImage src={form.img} alt="Xem trước ảnh tài khoản" width={214} height={120} fallbackLabel="Ảnh không tải được" /></div>}</div>
            <Field id="admin-account-details" className="ui-field-full" label="Thông tin hiển thị (thong_tin)" helper="Mỗi dòng là một tag thông tin. Dùng dấu phẩy hoặc | để phân tách."><Textarea id="admin-account-details" rows={4} value={form.thong_tin} onChange={(event) => set("thong_tin", event.target.value)} /></Field>
            <Field id="admin-account-login" className="ui-field-full" label="Thông tin đăng nhập (login) — chỉ hiện sau khi mua" helper={!editingId ? "Mỗi dòng tạo một tài khoản riêng — cùng loại, giá và thông tin." : undefined}><Textarea id="admin-account-login" rows={editingId ? 3 : 8} placeholder={editingId ? "username:password hoặc link drive..." : "Mỗi dòng = 1 tài khoản được tạo\n\nVí dụ:\nuser1:pass1\nuser2:pass2"} value={form.login} onChange={(event) => set("login", event.target.value)} /></Field>
            <Field id="admin-account-list-details" label="list_thong_tin" helper={'Để "0" nếu không dùng.'}><Input id="admin-account-list-details" placeholder="0 hoặc JSON array" value={form.list_thong_tin} onChange={(event) => set("list_thong_tin", event.target.value)} /></Field>
            <Field id="admin-account-list-images" label="list_img" helper={'Để "0" nếu không dùng.'}><Input id="admin-account-list-images" placeholder="0 hoặc JSON array URL ảnh" value={form.list_img} onChange={(event) => set("list_img", event.target.value)} /></Field>
          </div></CardContent>
          <CardFooter className="ui-form-actions">{saveProgress && <span className="ui-save-progress" role="status">{saveProgress}</span>}<Button type="button" variant="outline" onClick={closeForm} disabled={saving}>Hủy</Button><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Đang lưu…" : editingId ? "Cập nhật tài khoản" : "Thêm tài khoản"}</Button></CardFooter>
        </form>
      </Card>}

      {metadataLoading && <Card><CardContent><Skeleton className="ui-skeleton-line" /></CardContent></Card>}
      {metadataError && <Card><CardContent className="ui-inline-error" role="alert"><span>{metadataError}</span><Button size="sm" variant="outline" onClick={() => setMetadataRetry((count) => count + 1)}><RefreshCw size={14} aria-hidden="true" /> Thử lại</Button></CardContent></Card>}

      <Card className="ui-filter-card"><CardHeader><CardTitle>Bộ lọc kho tài khoản</CardTitle><CardDescription>Lọc theo loại và trạng thái; dữ liệu được tải theo từng trang.</CardDescription></CardHeader><CardContent><div className="ui-filter-grid"><Field id="admin-account-filter-type" label="Loại tài khoản"><Select id="admin-account-filter-type" value={filters.loai_id} onChange={(event) => setFilters({ ...filters, loai_id: event.target.value, page: 1 })}><option value="">Tất cả loại</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</Select></Field><Field id="admin-account-filter-status" label="Trạng thái"><Select id="admin-account-filter-status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value, page: 1 })}><option value="">Tất cả</option><option value="0">Đang bán</option><option value="1">Đã bán</option><option value="2">Đã ẩn</option></Select></Field><div className="ui-filter-summary"><span>Toàn bộ kho</span><strong>{pagination.total ?? accounts.length} account</strong></div></div></CardContent></Card>

      <Card><CardHeader><CardTitle>Thống kê kho</CardTitle><CardDescription>Trang hiện tại có {pageCount} bản ghi đang hiển thị.</CardDescription></CardHeader><CardContent><DataTable data={summaryRows} columns={summaryColumns} caption="Bảng thống kê kho tài khoản" /></CardContent></Card>

      {selected.size > 0 && <div className="ui-selection-bar" role="region" aria-label="Thao tác tài khoản đã chọn"><span><ShoppingBag size={16} aria-hidden="true" /> Đã chọn {selected.size} tài khoản</span><div className="ui-selection-bar-actions"><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Bỏ chọn</Button><Button size="sm" variant="destructive" onClick={deleteSelected}><Trash2 size={14} aria-hidden="true" /> Xóa đã chọn</Button></div></div>}
      {loadError && <Card><CardContent className="ui-inline-error" role="alert"><span>{loadError}</span><Button size="sm" variant="outline" onClick={loadData}><RefreshCw size={14} aria-hidden="true" /> Thử lại</Button></CardContent></Card>}

      <Card className="ui-data-table-card"><CardHeader><div className="ui-data-table-toolbar-title"><span>Inventory table</span><strong>Danh sách tài khoản</strong></div><CardDescription>{loading ? "Đang đồng bộ dữ liệu…" : `Hiển thị ${accounts.length} bản ghi trên trang ${filters.page}.`}</CardDescription></CardHeader><CardContent><DataTable selectable selectedIds={selected} onSelectionChange={setSelected} data={accounts} loading={loading} columns={columns} caption="Bảng kho tài khoản game" empty={<Empty><EmptyMedia><ShoppingBag size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Không có tài khoản nào</EmptyTitle><EmptyDescription>Thử đổi bộ lọc hoặc thêm account mới vào kho.</EmptyDescription></EmptyHeader><Button size="sm" onClick={openCreate}><Plus size={14} aria-hidden="true" /> Thêm account</Button></Empty>} /><DataTablePagination page={filters.page} totalPages={pagination.totalPage} total={pagination.total ?? accounts.length} pageSize={20} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} /></CardContent></Card>

      <Modal isOpen={Boolean(confirmation)} onClose={() => !confirming && setConfirmation(null)} title={confirmation?.title || "Xác nhận thao tác"} className="admin-confirm-modal" footer={<><Button variant="outline" onClick={() => setConfirmation(null)} disabled={confirming}>Hủy</Button><Button variant={confirmation?.variant === "destructive" ? "destructive" : "default"} onClick={confirmAction} disabled={confirming} aria-busy={confirming}>{confirming ? "Đang xử lý…" : confirmation?.confirmLabel || "Xác nhận"}</Button></>}><p className="modal-description">{confirmation?.description}</p></Modal>
    </div>
  );
}
