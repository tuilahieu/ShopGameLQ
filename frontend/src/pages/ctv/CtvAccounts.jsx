import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/api";
import { Edit2, EyeOff, Gamepad2, Upload, RefreshCw } from "lucide-react";
import SafeImage from "../../components/SafeImage";
import CurrencyInput from "../../components/CurrencyInput";
import PanelLoading from "../../components/PanelLoading";
import { PageHeading } from "../../components/Ui";
import { AdminConfirmDialog } from "../../components/admin/AdminUi";

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
  const [hiding, setHiding] = useState(false);
  const [hideTarget, setHideTarget] = useState(null);
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
        alert("Cập nhật tài khoản thành công.");
      } else {
        await api.post("/accounts", payload);
        alert("Đăng bán tài khoản thành công.");
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

  async function handleDelete() {
    if (!hideTarget || hiding) return;
    setHiding(true);
    try {
      await api.patch(`/accounts/${hideTarget.id}/hide`);
      alert("Ẩn tài khoản thành công.");
      setHideTarget(null);
      loadData(pagination.page);
    } catch (err) {
      console.error(err);
      alert("Xóa/Ẩn tài khoản thất bại");
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
    setForm(makeEmptyForm(types[0]?.id || ""));
  }

  return (
    <div className="ctv-accounts-page">
      <PageHeading description="Đăng sản phẩm mới, chỉnh sửa giá bán và theo dõi trạng thái kho của bạn.">Kho tài khoản của tôi</PageHeading>

      <section className="card ctv-editor-card">
        <h3>{editingId ? `Chỉnh sửa tài khoản #${editingId}` : "Đăng bán tài khoản mới"}</h3>
        <form onSubmit={handleSubmit} className="form-grid ctv-account-form">
          <div className="form-group-premium">
            <label htmlFor="ctv-account-type">Loại tài khoản</label>
            <select
              id="ctv-account-type"
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
            <label htmlFor="ctv-account-price">Giá bán (VND) *</label>
            <CurrencyInput
              id="ctv-account-price"
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

          <div className="form-group-premium ctv-form-full">
            <label htmlFor="ctv-account-image" className="ctv-field-label-icon">
              <Upload size={14} aria-hidden="true" /> Ảnh đại diện
            </label>
            <div className="ctv-upload-row">
              <input
                id="ctv-account-image"
                placeholder="Nhập link ảnh hoặc upload file"
                value={form.img}
                onChange={(e) => setForm({ ...form, img: e.target.value })}
              />
              <label className="btn-outline ctv-upload-button">
                <Upload size={16} aria-hidden="true" /> Chọn tệp
                <input type="file" accept="image/*" onChange={handleUpload} />
              </label>
            </div>
            {form.img && (
              <div className="ctv-image-preview"><SafeImage src={form.img} alt="Xem trước ảnh tài khoản" width={160} height={90} fallbackLabel="Ảnh không tải được" /></div>
            )}
          </div>

          <div className="form-group-premium ctv-form-full">
            <label htmlFor="ctv-account-description">Thông tin chi tiết tài khoản</label>
            <textarea
              id="ctv-account-description"
              placeholder="Nhập mô tả nổi bật"
              value={form.thong_tin}
              onChange={(e) => setForm({ ...form, thong_tin: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group-premium">
            <label htmlFor="ctv-account-details-list">Danh sách thông tin</label>
            <input
              id="ctv-account-details-list"
              placeholder="0 hoặc JSON array"
              value={form.list_thong_tin}
              onChange={(e) => setForm({ ...form, list_thong_tin: e.target.value })}
            />
          </div>

          <div className="form-group-premium">
            <label htmlFor="ctv-account-images-list">Danh sách ảnh</label>
            <input
              id="ctv-account-images-list"
              placeholder="0 hoặc JSON array"
              value={form.list_img}
              onChange={(e) => setForm({ ...form, list_img: e.target.value })}
            />
          </div>

          <div className="form-group-premium ctv-form-full">
            <label htmlFor="ctv-account-login">Thông tin bàn giao</label>
            <textarea
              id="ctv-account-login"
              placeholder="Nhập thông tin đăng nhập..."
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              required
              rows={2}
            />
            <small className="form-hint">Tài khoản, mật khẩu và 2FA chỉ hiển thị cho người mua sau khi thanh toán.</small>
          </div>

          <div className="ctv-form-actions ctv-form-full">
            <button type="submit" className="small-btn" disabled={saving} aria-busy={saving}>
              {saving ? "Đang lưu…" : editingId ? "Cập nhật" : "Thêm mới"}
            </button>
            {(editingId || form.thong_tin !== "Đổi được thông tin và mật khẩu\nHỗ trợ bảo hành" || form.login !== "liên hệ Zalo admin | để được nhận account #ID" || form.gia) && (
              <button type="button" className="btn-outline" onClick={resetForm} disabled={saving}>
                Hủy thay đổi
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="ctv-list-section" aria-labelledby="ctv-account-list-title">
      <div className="ctv-list-toolbar">
        <div><h2 id="ctv-account-list-title">Tài khoản đã đăng</h2><p>{pagination.total.toLocaleString("vi-VN")} sản phẩm trong kho của bạn</p></div>
        <div className="ctv-list-actions">
          <select
            aria-label="Lọc tài khoản theo trạng thái"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="0">Đang bán</option>
            <option value="1">Đã bán</option>
            <option value="2">Đã ẩn</option>
          </select>
          <button type="button" onClick={() => loadData(pagination.page)} className="btn-outline ctv-refresh-button" aria-label="Làm mới danh sách tài khoản" title="Làm mới">
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="table-box">
        {loading ? (
          <PanelLoading label="Đang tải danh sách tài khoản" />
        ) : loadError ? (
          <div className="table-load-error" role="alert">{loadError} <button type="button" className="btn-outline" onClick={() => loadData(pagination.page)}>Thử lại</button></div>
        ) : accounts.length === 0 ? (
          <div className="ctv-empty-state"><Gamepad2 size={22} aria-hidden="true" /><strong>Chưa có tài khoản phù hợp</strong><span>Hãy đổi bộ lọc hoặc đăng tài khoản mới ở biểu mẫu phía trên.</span></div>
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
                          className="ctv-table-thumb"
                          fallbackClassName="table-image-fallback"
                          fallbackLabel="Chưa có ảnh"
                        />
                      </td>
                      <td><span className="ctv-table-category">{accType?.name || `Loại #${acc.loai_id}`}</span></td>
                      <td className="ctv-table-price">
                        {Number(acc.sale_price) > 0 && Number(acc.sale_price) < Number(acc.gia) ? (
                          <><del>{Number(acc.gia).toLocaleString()}đ</del><strong>{Number(acc.sale_price).toLocaleString()}đ</strong></>
                        ) : `${Number(acc.gia).toLocaleString()}đ`}
                      </td>
                      <td className="ctv-table-description" title={acc.thong_tin || "Không có mô tả"}>
                        {acc.thong_tin || "N/A"}
                      </td>
                      <td>
                        <span className={`ctv-status is-${acc.status === 0 ? "selling" : acc.status === 1 ? "sold" : "hidden"}`}>
                          {acc.status === 0 ? "Đang bán" : acc.status === 1 ? "Đã bán" : "Đã ẩn"}
                        </span>
                      </td>
                      <td>
                        {acc.buyer ? (
                          <span className="ctv-table-buyer">{acc.buyer.username}</span>
                        ) : acc.buyer_id ? (
                          <span className="ctv-table-muted">User #{acc.buyer_id}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div className="action-row">
                          {acc.status === 0 && (
                            <>
                              <button onClick={() => startEdit(acc)} className="small-btn">
                                <Edit2 size={13} aria-hidden="true" /> Sửa
                              </button>
                              <button onClick={() => setHideTarget(acc)} className="small-btn danger-btn">
                                <EyeOff size={13} aria-hidden="true" /> Ẩn đi
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
              <nav className="pagination ctv-pagination" aria-label="Phân trang tài khoản">
                {Array.from({ length: pagination.totalPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => loadData(p)}
                    className={pagination.page === p ? "small-btn" : "btn-outline"}
                    aria-current={pagination.page === p ? "page" : undefined}
                  >
                    {p}
                  </button>
                ))}
              </nav>
            )}
          </>
        )}
      </div>
      </section>
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
