import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/api";
import { Edit2, EyeOff, Upload, RefreshCw } from "lucide-react";
import SafeImage from "../../components/SafeImage";
import CurrencyInput from "../../components/CurrencyInput";
import PanelLoading from "../../components/PanelLoading";

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
  const loadSequence = useRef(0);
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
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setForm((prev) => ({
        ...prev,
        img: res.data.data.url,
      }));
    } catch (err) {
      console.error(err);
      alert("Tải ảnh lên thất bại. Vui lòng thử lại.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    if (!form.loai_id) return alert("Vui lòng chọn loại tài khoản");
    if (!form.gia || Number(form.gia) < 0) return alert("Vui lòng nhập giá bán hợp lệ");
    if (!form.login) return alert("Vui lòng điền thông tin đăng nhập");
    if (form.is_sale && (!form.sale_price || Number(form.sale_price) >= Number(form.gia))) {
      return alert("Giá sale phải lớn hơn 0 và thấp hơn giá bán gốc.");
    }
    const payload = { ...form, sale_price: form.is_sale ? form.sale_price : null };
    delete payload.is_sale;

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/accounts/${editingId}`, payload);
        alert("Cập nhật tài khoản thành công!");
      } else {
        await api.post("/accounts", payload);
        alert("Đăng bán tài khoản thành công!");
      }
      resetForm();
      loadData(pagination.page);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi lưu tài khoản");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc chắn muốn ẩn tài khoản này khỏi shop?")) return;
    try {
      await api.patch(`/accounts/${id}/hide`);
      alert("Ẩn tài khoản thành công!");
      loadData(pagination.page);
    } catch (err) {
      console.error(err);
      alert("Xóa/Ẩn tài khoản thất bại");
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
    setForm(makeEmptyForm(types[0]?.id || ""));
  }

  return (
    <div>
      <h1 className="page-title">Quản lý Tài Khoản Đăng Bán</h1>

      {/* Account Editor Form */}
      <div className="card">
        <h3>{editingId ? `Chỉnh sửa tài khoản #${editingId}` : "Đăng bán tài khoản mới"}</h3>
        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: "16px" }}>
          <div className="form-group-premium">
            <label>Loại tài khoản</label>
            <select
              value={form.loai_id}
              onChange={(e) => setForm({ ...form, loai_id: e.target.value })}
              required
            >
              <option value="">Chọn loại nick...</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-premium">
            <label>Giá bán (VND) *</label>
            <CurrencyInput
              placeholder="VD: 50.000"
              value={form.gia}
              onChange={(e) => setForm({ ...form, gia: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label htmlFor="ctv-listing-sale-enabled">Sale giá cho acc này</label>
            <label className="admin-listing-sale-toggle" htmlFor="ctv-listing-sale-enabled">
              <input
                id="ctv-listing-sale-enabled"
                type="checkbox"
                checked={form.is_sale}
                onChange={(e) => setForm((prev) => ({ ...prev, is_sale: e.target.checked, sale_price: e.target.checked ? prev.sale_price : "" }))}
              />
              <span>Hiện giá giảm cho khách</span>
            </label>
            {form.is_sale && (
              <>
                <CurrencyInput
                  id="ctv-listing-sale-price"
                  name="sale_price"
                  placeholder="Ví dụ: 100.000"
                  value={form.sale_price}
                  onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                  aria-describedby="ctv-listing-sale-price-help"
                />
                <small id="ctv-listing-sale-price-help" className="form-hint">Giá gốc {Number(form.gia || 0).toLocaleString()}đ · Giá sale phải thấp hơn giá gốc.</small>
              </>
            )}
          </div>

          <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Upload size={14} /> Ảnh đại diện (Thumbnail URL)
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                placeholder="Nhập link ảnh hoặc upload file"
                value={form.img}
                onChange={(e) => setForm({ ...form, img: e.target.value })}
                style={{ flexGrow: 1 }}
              />
              <label className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0, padding: "10px 16px" }}>
                <Upload size={16} /> Upload File
                <input type="file" onChange={handleUpload} style={{ display: "none" }} />
              </label>
            </div>
            {form.img && (
              <SafeImage
                src={form.img}
                alt="Xem trước ảnh tài khoản"
                width={120}
                height={70}
                fallbackLabel="Ảnh không tải được"
                style={{ width: "120px", height: "70px", objectFit: "cover", borderRadius: "8px", marginTop: "10px", border: "1px solid var(--border-color)" }}
              />
            )}
          </div>

          <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
            <label>Thông tin chi tiết tài khoản</label>
            <textarea
              placeholder="Nhập mô tả nổi bật"
              value={form.thong_tin}
              onChange={(e) => setForm({ ...form, thong_tin: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group-premium">
            <label>list_thong_tin</label>
            <input
              placeholder="0 hoặc JSON array"
              value={form.list_thong_tin}
              onChange={(e) => setForm({ ...form, list_thong_tin: e.target.value })}
            />
          </div>

          <div className="form-group-premium">
            <label>list_img</label>
            <input
              placeholder="0 hoặc JSON array"
              value={form.list_img}
              onChange={(e) => setForm({ ...form, list_img: e.target.value })}
            />
          </div>

          <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
            <label>Thông tin đăng nhập tài khoản (Tài khoản | Mật khẩu | 2FA) - Chỉ người mua nhìn thấy sau khi thanh toán</label>
            <textarea
              placeholder="Nhập thông tin đăng nhập..."
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              required
              rows={2}
            />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
            <button type="submit" className="small-btn" disabled={saving} aria-busy={saving}>
              {saving ? "Đang lưu…" : editingId ? "Cập nhật" : "Thêm mới"}
            </button>
            {(editingId || form.thong_tin !== "Đổi được thông tin và mật khẩu\nHỗ trợ bảo hành" || form.login !== "liên hệ Zalo admin | để được nhận account #ID" || form.gia) && (
              <button type="button" className="btn-outline" onClick={resetForm} disabled={saving} style={{ padding: "8px 16px" }}>
                Hủy / Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filter and List Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3>Danh sách accounts bạn đã đăng</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="0">Đang bán</option>
            <option value="1">Đã bán</option>
            <option value="2">Đã ẩn</option>
          </select>
          <button onClick={() => loadData(pagination.page)} className="btn-outline" style={{ padding: "8px" }} title="Làm mới">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="table-box">
        {loading ? (
          <PanelLoading label="Đang tải danh sách tài khoản" />
        ) : loadError ? (
          <div className="table-load-error" role="alert">{loadError} <button type="button" className="btn-outline" onClick={() => loadData(pagination.page)}>Thử lại</button></div>
        ) : accounts.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>Không tìm thấy tài khoản nào.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ảnh</th>
                  <th>Loại nick</th>
                  <th>Giá bán</th>
                  <th>Mô tả</th>
                  <th>Trạng thái</th>
                  <th>Người mua</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => {
                  const accType = types.find((t) => Number(t.id) === Number(acc.loai_id));
                  return (
                    <tr key={acc.id}>
                      <td>#{acc.id}</td>
                      <td>
                        <SafeImage
                          src={acc.img}
                          alt={`Ảnh tài khoản mã số ${acc.id}`}
                          width={65}
                          height={38}
                          fallbackClassName="table-image-fallback"
                          style={{ width: "65px", height: "38px", objectFit: "cover", borderRadius: "4px" }}
                          fallbackLabel="Chưa có ảnh"
                        />
                      </td>
                      <td><span style={{ color: "var(--cyan-color)", fontWeight: "600" }}>{accType?.name || `Loại #${acc.loai_id}`}</span></td>
                      <td style={{ fontWeight: "600" }}>
                        {Number(acc.sale_price) > 0 && Number(acc.sale_price) < Number(acc.gia) ? (
                          <><del style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginRight: "6px" }}>{Number(acc.gia).toLocaleString()}đ</del><strong style={{ color: "var(--accent-color)" }}>{Number(acc.sale_price).toLocaleString()}đ</strong></>
                        ) : `${Number(acc.gia).toLocaleString()}đ`}
                      </td>
                      <td style={{ fontSize: "0.9rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {acc.thong_tin || "N/A"}
                      </td>
                      <td>
                        <span style={{ 
                          color: acc.status === 0 ? "var(--green-color)" : acc.status === 1 ? "var(--gold-color)" : "var(--text-secondary)",
                          fontWeight: "bold"
                        }}>
                          {acc.status === 0 ? "Đang bán" : acc.status === 1 ? "Đã bán" : "Đã ẩn"}
                        </span>
                      </td>
                      <td>
                        {acc.buyer ? (
                          <span style={{ color: "var(--cyan-color)", fontWeight: "600" }}>{acc.buyer.username}</span>
                        ) : acc.buyer_id ? (
                          <span style={{ color: "var(--text-muted)" }}>User #{acc.buyer_id}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div className="action-row" style={{ display: "flex", gap: "6px" }}>
                          {acc.status === 0 && (
                            <>
                              <button onClick={() => startEdit(acc)} className="small-btn" style={{ padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <Edit2 size={13} /> Sửa
                              </button>
                              <button onClick={() => handleDelete(acc.id)} className="small-btn danger-btn" style={{ padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <EyeOff size={13} /> Ẩn đi
                              </button>
                            </>
                          )}
                          {acc.status !== 0 && "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {pagination.totalPage > 1 && (
              <div className="pagination" style={{ display: "flex", gap: "8px", marginTop: "20px", justifyContent: "center" }}>
                {Array.from({ length: pagination.totalPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => loadData(p)}
                    className={pagination.page === p ? "small-btn" : "btn-outline"}
                    style={{ padding: "6px 12px", minWidth: "35px" }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
