import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/api";
import { Upload, Pencil, Trash2, Plus, X, ShoppingBag, EyeOff } from "lucide-react";
import SafeImage from "../../components/SafeImage";
import CurrencyInput from "../../components/CurrencyInput";
import TableLoadingRows from "../../components/TableLoadingRows";
import { SkeletonBlock } from "../../components/SkeletonLoading";

const STATUS_MAP = {
  0: { label: "Đang bán", color: "var(--green-color)" },
  1: { label: "Đã bán", color: "var(--text-muted)" },
  2: { label: "Đã ẩn", color: "var(--accent-color)" },
};

function buildDefaultThongTin() {
  return `Đổi được thông tin\nHỗ trợ bảo hành`;
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

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [types, setTypes] = useState([]);
  const [setting, setSetting] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ loai_id: "", status: "", page: 1 });
  const [pagination, setPagination] = useState({ total: 0, totalPage: 1 });
  const [selected, setSelected] = useState(new Set());
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

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const loadData = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const params = {};
      if (filters.loai_id) params.loai_id = filters.loai_id;
      if (filters.status !== "") params.status = filters.status;
      params.page = filters.page;
      params.limit = 20;

      const accRes = await api.get("/admin/accounts", { params });
      if (sequence !== loadSequence.current) return;

      setAccounts(accRes.data?.data?.accounts || accRes.data?.data || []);
      if (accRes.data?.data?.pagination) setPagination(accRes.data.data.pagination);
      setSelected(new Set()); // clear selection on reload
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
      setForm((prev) =>
        prev.login === buildDefaultLogin("") || prev.login === buildDefaultLogin("admin")
          ? { ...prev, login: buildDefaultLogin(nextSetting.sdt_admin) }
          : prev
      );
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

  async function handleMainImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      set("img", url);
    } catch { alert("Upload ảnh thất bại"); }
  }

  async function saveAccount() {
    if (saving) return;
    if (!form.loai_id) return alert("Vui lòng chọn loại tài khoản!");
    if (!form.gia) return alert("Vui lòng nhập giá bán!");
    const imageUrl = form.img.trim();
    if (!validImageUrl(imageUrl)) return alert("URL ảnh phải bắt đầu bằng http:// hoặc https://.");
    if (form.is_sale && (!form.sale_price || Number(form.sale_price) >= Number(form.gia))) {
      return alert("Giá sale phải lớn hơn 0 và thấp hơn giá bán gốc.");
    }
    const payload = { ...form, img: imageUrl, sale_price: form.is_sale ? form.sale_price : null };
    delete payload.is_sale;
    delete payload.status;

    setSaving(true);
    setSaveProgress("Đang lưu tài khoản…");
    try {
      if (editingId) {
        // Update mode — single account
        await api.put(`/accounts/${editingId}`, payload);
        alert("Cập nhật thành công!");
        closeForm();
        loadData();
        return;
      }

      // Add mode — split login by newline → create one account per line
      const lines = form.login
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

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

      if (failed > 0) {
        alert(`Đã thêm ${success}/${lines.length} tài khoản. ${failed} dòng bị lỗi.`);
      } else {
        alert(`Đã thêm thành công ${success} tài khoản.`);
      }

      closeForm();
      loadData();
    } catch (error) {
      alert(error?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
      setSaveProgress("");
    }
  }

  async function hideAccount(id) {
    if (!window.confirm("Ẩn tài khoản #" + id + " khỏi danh sách bán? Dữ liệu vẫn được giữ lại.")) return;
    try {
      await api.patch(`/accounts/${id}/hide`);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi ẩn tài khoản");
    }
  }

  async function deleteAccount(id) {
    if (!window.confirm("XÓA HẲN tài khoản #" + id + "? Không thể hoàn tác và account đã có order sẽ bị từ chối.")) return;
    try {
      await api.delete(`/accounts/${id}`);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi xóa hẳn tài khoản");
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!window.confirm(`XÓA HẲN ${selected.size} tài khoản đã chọn? Tài khoản đã có order sẽ không bị xóa.`)) return;
    let ok = 0, fail = 0;
    for (const id of selected) {
      try { await api.delete(`/accounts/${id}`); ok++; }
      catch { fail++; }
    }
    alert(fail > 0 ? `Đã xóa hẳn ${ok}/${selected.size}, ${fail} lỗi.` : `Đã xóa hẳn ${ok} tài khoản.`);
    loadData();
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === accounts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(accounts.map((a) => a.id)));
    }
  }

  function openEdit(acc) {
    setEditingId(acc.id);
    setForm({
      loai_id: acc.loai_id || "",
      thong_tin: acc.thong_tin || buildDefaultThongTin(),
      list_thong_tin: acc.list_thong_tin ?? "0",
      img: acc.img || "",
      list_img: acc.list_img ?? "0",
      login: acc.login || "",
      gia: acc.gia || "",
      is_sale: Number(acc.sale_price) > 0,
      sale_price: acc.sale_price || "",
      status: acc.status ?? 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setEditingId(null);
    setForm(makeEmpty(setting.sdt_admin));
    setShowForm(false);
  }

  const typeName = (id) => types.find((t) => t.id == id)?.name || id;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h1 className="page-title" style={{ margin: 0 }}>Quản lý Tài khoản Game</h1>
        <button
          className="small-btn"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          onClick={() => { setShowForm(true); setEditingId(null); setForm(makeEmpty(setting.sdt_admin)); }}
        >
          <Plus size={15} /> Thêm account mới
        </button>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div className="card" style={{ marginBottom: "28px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0 }}>{editingId ? `Sửa account #${editingId}` : "Thêm account mới"}</h3>
            <button onClick={closeForm} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
              <X size={20} />
            </button>
          </div>

          <div className="form-grid">
            {/* Loại acc */}
            <div className="form-group-premium">
              <label>Loại tài khoản *</label>
              <select value={form.loai_id} onChange={(e) => set("loai_id", e.target.value)}>
                <option value="">-- Chọn loại --</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Giá */}
            <div className="form-group-premium">
              <label>Giá bán (đ) *</label>
              <CurrencyInput
                placeholder="VD: 50.000"
                value={form.gia}
                onChange={(e) => set("gia", e.target.value)}
              />
            </div>

            {/* Trạng thái */}
            <div className="form-group-premium">
              <label>Trạng thái</label>
              <select value={form.status} onChange={(e) => set("status", Number(e.target.value))}>
                <option value={0}>Đang bán</option>
                <option value={1}>Đã bán</option>
                <option value={2}>Ẩn</option>
              </select>
            </div>

            <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="listing-sale-enabled">Sale giá cho riêng account này</label>
              <label className="admin-listing-sale-toggle" htmlFor="listing-sale-enabled">
                <input
                  id="listing-sale-enabled"
                  type="checkbox"
                  checked={form.is_sale}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_sale: e.target.checked, sale_price: e.target.checked ? prev.sale_price : "" }))}
                />
                <span>Hiện giá giảm trực tiếp trên thẻ acc và trang chi tiết</span>
              </label>
              {form.is_sale && (
                <>
                  <CurrencyInput
                    id="listing-sale-price"
                    name="sale_price"
                    placeholder="Ví dụ: 100.000"
                    value={form.sale_price}
                    onChange={(e) => set("sale_price", e.target.value)}
                    aria-describedby="listing-sale-price-help"
                  />
                  <small id="listing-sale-price-help" className="form-hint">
                    Giá gốc {Number(form.gia || 0).toLocaleString()}đ · Nhập giá sale thấp hơn giá gốc.
                  </small>
                </>
              )}
            </div>

            {/* Ảnh đại diện */}
            <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
              <label>Ảnh đại diện</label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <label style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "10px 18px",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  transition: "var(--transition-smooth)"
                }}>
                  <Upload size={15} /> Tải ảnh lên
                  <input ref={imgRef} type="file" accept="image/*" onChange={handleMainImage} style={{ display: "none" }} />
                </label>
                {form.img && (
                  <button
                    type="button"
                    className="danger-btn"
                    style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                    onClick={() => {
                      set("img", "");
                      if (imgRef.current) imgRef.current.value = "";
                    }}
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>
              <input
                type="text"
                inputMode="url"
                aria-label="URL ảnh đại diện"
                placeholder="Hoặc dán URL ảnh, ví dụ https://example.com/anh.jpg"
                value={form.img}
                onChange={(e) => set("img", e.target.value)}
                style={{ marginTop: "12px" }}
              />
              {form.img && (
                <div style={{ marginTop: "12px" }}>
                  <SafeImage
                    src={form.img}
                    alt="Xem trước ảnh tài khoản"
                    width={214}
                    height={120}
                    fallbackLabel="Ảnh không tải được"
                    style={{
                      maxHeight: "120px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      objectFit: "cover"
                    }}
                  />
                </div>
              )}
            </div>

            {/* Thông tin hiển thị */}
            <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
              <label>Thông tin hiển thị (thong_tin)</label>
              <textarea
                rows={4}
                style={{ resize: "vertical" }}
                value={form.thong_tin}
                onChange={(e) => set("thong_tin", e.target.value)}
              />
              <small style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
                Mỗi dòng = 1 tag thông tin. Dùng dấu phẩy hoặc | để phân tách.
              </small>
            </div>

            {/* Thông tin đăng nhập */}
            <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Thông tin đăng nhập (login) — chỉ hiện sau khi mua</span>
                {!editingId && (
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent-color)", background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: "20px" }}>
                    💡 Nhiều dòng = nhiều tài khoản
                  </span>
                )}
              </label>
              <textarea
                rows={editingId ? 3 : 8}
                placeholder={editingId
                  ? "username:password hoặc link drive..."
                  : "Mỗi dòng = 1 tài khoản được tạo\n\nVí dụ:\nuser1:pass1\nuser2:pass2\nuser3:pass3\n\nHoặc để mặc định: liên hệ zalo để hỗ trợ"}
                style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.88rem" }}
                value={form.login}
                onChange={(e) => set("login", e.target.value)}
              />
              {!editingId && (
                <small style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
                  Nhập nhiều dòng để tạo nhiều acc cùng lúc — cùng loại, cùng giá, cùng thông tin. Mỗi dòng sẽ là 1 tài khoản riêng.
                </small>
              )}
            </div>

            {/* list_thong_tin & list_img */}
            <div className="form-group-premium">
              <label>list_thong_tin</label>
              <input
                placeholder="0 hoặc JSON array"
                value={form.list_thong_tin}
                onChange={(e) => set("list_thong_tin", e.target.value)}
              />
              <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>Để "0" nếu không dùng</small>
            </div>

            <div className="form-group-premium">
              <label>list_img</label>
              <input
                placeholder="0 hoặc JSON array URL ảnh"
                value={form.list_img}
                onChange={(e) => set("list_img", e.target.value)}
              />
              <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>Để "0" nếu không dùng</small>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button className="small-btn" onClick={saveAccount} disabled={saving} aria-busy={saving}>
              {saving ? saveProgress : editingId ? "Cập nhật" : "Thêm mới"}
            </button>
            <button className="btn-outline" onClick={closeForm} disabled={saving} style={{ padding: "8px 16px" }}>Hủy</button>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      {metadataLoading && <div role="status" aria-label="Đang tải loại tài khoản và cài đặt" className="workspace-inline-skeleton"><SkeletonBlock className="is-line is-45" /></div>}
      {metadataError && <div className="table-load-error" role="alert">{metadataError} <button type="button" className="btn-outline" onClick={() => setMetadataRetry((count) => count + 1)}>Thử lại</button></div>}
      <div className="card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group-premium" style={{ margin: 0, minWidth: "180px" }}>
            <label style={{ marginBottom: "4px", display: "block", fontSize: "0.8rem" }}>Lọc loại acc</label>
            <select value={filters.loai_id} onChange={(e) => setFilters({ ...filters, loai_id: e.target.value, page: 1 })}>
              <option value="">Tất cả loại</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group-premium" style={{ margin: 0, minWidth: "140px" }}>
            <label style={{ marginBottom: "4px", display: "block", fontSize: "0.8rem" }}>Trạng thái</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
              <option value="">Tất cả</option>
              <option value="0">Đang bán</option>
              <option value="1">Đã bán</option>
              <option value="2">Đã ẩn</option>
            </select>
          </div>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.88rem", paddingBottom: "2px" }}>
            Tổng: <strong style={{ color: "var(--text-primary)" }}>{pagination.total ?? accounts.length}</strong> acc
          </span>
        </div>
      </div>

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div style={{
          position: "sticky", top: "70px", zIndex: 40,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "12px", padding: "12px 20px",
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "12px", marginBottom: "16px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
        }}>
          <span style={{ fontWeight: 700, color: "var(--accent-color)", fontSize: "0.9rem" }}>
            ✓ Đã chọn {selected.size} tài khoản
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-outline"
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => setSelected(new Set())}
            >
              Bỏ chọn
            </button>
            <button
              className="danger-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", fontSize: "0.85rem" }}
              onClick={deleteSelected}
            >
              <Trash2 size={14} /> Xóa hẳn {selected.size} mục
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {loadError && <div className="table-load-error" role="alert">{loadError} <button type="button" className="btn-outline" onClick={loadData}>Thử lại</button></div>}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-premium" aria-busy={loading} style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ width: "40px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={accounts.length > 0 && selected.size === accounts.length}
                    ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < accounts.length; }}
                    onChange={toggleAll}
                    style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "var(--accent-color)" }}
                  />
                </th>
                <th>ID</th>
                <th>Ảnh</th>
                <th>Loại</th>
                <th>Giá</th>
                <th>Thông tin</th>
                <th>Trạng thái</th>
                <th>Người mua</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && accounts.length === 0 ? <TableLoadingRows columns={9} /> : !loadError && accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                    <ShoppingBag size={32} style={{ opacity: 0.3, marginBottom: "8px", display: "block", margin: "0 auto 8px" }} />
                    Không có tài khoản nào
                  </td>
                </tr>
              ) : accounts.map((acc) => (
                <tr
                  key={acc.id}
                  style={{
                    background: selected.has(acc.id) ? "rgba(239,68,68,0.06)" : undefined,
                    transition: "background 0.15s",
                  }}
                >
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selected.has(acc.id)}
                      onChange={() => toggleSelect(acc.id)}
                      style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "var(--accent-color)" }}
                    />
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.85rem" }}>#{acc.id}</td>

                  <td>
                    <SafeImage
                      src={acc.img}
                      alt={`Ảnh tài khoản mã số ${acc.id}`}
                      width={60}
                      height={44}
                      fallbackClassName="table-image-fallback"
                      style={{ width: "60px", height: "44px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                      fallbackLabel="Chưa có ảnh"
                    />
                  </td>

                  <td>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{typeName(acc.loai_id)}</span>
                  </td>

                  <td>
                    {Number(acc.sale_price) > 0 && Number(acc.sale_price) < Number(acc.gia) ? (
                      <div>
                        <del style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{Number(acc.gia).toLocaleString()}đ</del>
                        <div style={{ color: "var(--accent-color)", fontWeight: 700, fontSize: "0.95rem" }}>{Number(acc.sale_price).toLocaleString()}đ</div>
                      </div>
                    ) : <strong style={{ color: "var(--gold-color)" }}>{Number(acc.gia || 0).toLocaleString()}đ</strong>}
                  </td>

                  <td style={{ maxWidth: "220px" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, whiteSpace: "pre-wrap", maxHeight: "60px", overflow: "hidden" }}>
                      {acc.thong_tin || <span style={{ opacity: 0.4 }}>—</span>}
                    </div>
                  </td>

                  <td>
                    <span style={{ color: STATUS_MAP[acc.status]?.color, fontWeight: 700, fontSize: "0.85rem" }}>
                      {STATUS_MAP[acc.status]?.label || acc.status}
                    </span>
                  </td>

                  <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    {acc.buyer ? (
                      <div>
                        <div style={{ color: "var(--cyan-color)", fontWeight: 600 }}>{acc.buyer.username}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {Number(acc.buyer.level) === 99 ? "Admin" : Number(acc.buyer.level) === 1 ? "CTV" : "Thành viên"}
                        </div>
                      </div>
                    ) : acc.buyer_id ? (
                      <span style={{ color: "var(--text-muted)" }}>User #{acc.buyer_id}</span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="small-btn" onClick={() => openEdit(acc)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px" }}>
                        <Pencil size={12} /> Sửa
                      </button>
                      <button className="danger-btn" onClick={() => deleteAccount(acc.id)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px" }}>
                        <Trash2 size={12} /> Xóa
                      </button>
                      {Number(acc.status) !== 1 && (
                        <button className="small-btn" onClick={() => hideAccount(acc.id)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px" }}>
                          <EyeOff size={12} /> Ẩn
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPage > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "16px", borderTop: "1px solid var(--border-color)" }}>
            <button className="btn-outline" style={{ padding: "6px 14px" }} disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>← Trước</button>
            <span style={{ padding: "6px 12px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              {filters.page} / {pagination.totalPage}
            </span>
            <button className="btn-outline" style={{ padding: "6px 14px" }} disabled={filters.page >= pagination.totalPage} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Sau →</button>
          </div>
        )}
      </div>
    </>
  );
}
