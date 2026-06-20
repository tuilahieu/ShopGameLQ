import { useEffect, useState } from "react";
import api from "../../api/api";
import { X, Search } from "lucide-react";

export default function AdminSales() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    acc_id: "",
    sale_price: "",
    batdau: "",
    ketthuc: "",
    status: 1
  });

  // Modal selector states
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [modalAccounts, setModalAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [modalSearch, setModalSearch] = useState("");
  const [modalTypeFilter, setModalTypeFilter] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Selected account detail cache for helper hints
  const [selectedAccDetails, setSelectedAccDetails] = useState(null);

  async function load() {
    try {
      const res = await api.get("/admin/sales");
      setItems(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAccountTypes() {
    try {
      const res = await api.get("/account-types");
      setAccountTypes(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchModalAccounts() {
    setModalLoading(true);
    try {
      // Fetch unsold accounts (status 0)
      const res = await api.get("/admin/accounts", {
        params: {
          status: 0,
          limit: 100
        }
      });
      const data = res.data?.data?.accounts || res.data?.data || [];
      setModalAccounts(data);
    } catch (err) {
      console.error("Failed to load modal accounts:", err);
    } finally {
      setModalLoading(false);
    }
  }

  // Filter accounts loaded in modal dynamically
  const filteredModalAccounts = modalAccounts.filter(acc => {
    const matchesSearch = modalSearch ? acc.id.toString().includes(modalSearch) : true;
    const matchesType = modalTypeFilter ? acc.loai_id.toString() === modalTypeFilter : true;
    return matchesSearch && matchesType;
  });

  function selectAccount(acc) {
    setForm(prev => ({
      ...prev,
      acc_id: acc.id,
      sale_price: prev.sale_price || acc.gia // Autofill with original price as default starting point
    }));
    setSelectedAccDetails(acc);
    setIsSelectModalOpen(false);
  }

  async function save(e) {
    e.preventDefault();
    if (!form.acc_id) return alert("Vui lòng chọn tài khoản");
    if (!form.sale_price) return alert("Vui lòng nhập giá flash sale");
    if (!form.batdau || !form.ketthuc) return alert("Vui lòng nhập thời gian bắt đầu và kết thúc");

    try {
      if (editingId) {
        await api.put(`/admin/sales/${editingId}`, form);
        alert("Cập nhật flash sale thành công");
      } else {
        await api.post("/admin/sales", form);
        alert("Tạo flash sale thành công");
      }
      resetForm();
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi lưu flash sale");
    }
  }

  async function remove(id) {
    if (!window.confirm("Bạn có chắc chắn muốn tắt flash sale này?")) return;
    try {
      await api.delete(`/admin/sales/${id}`);
      alert("Đã tắt flash sale");
      load();
    } catch (err) {
      console.error(err);
      alert("Lỗi tắt flash sale");
    }
  }

  function startEdit(item) {
    const formatDate = (dStr) => {
      if (!dStr) return "";
      const d = new Date(dStr);
      const pad = (num) => String(num).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setEditingId(item.id);
    setForm({
      acc_id: item.acc_id || "",
      sale_price: item.sale_price || "",
      batdau: formatDate(item.batdau),
      ketthuc: formatDate(item.ketthuc),
      status: item.status !== undefined ? Number(item.status) : 1
    });

    // Fetch account details to show hints if editing
    api.get(`/accounts/${item.acc_id}`).then(res => {
      setSelectedAccDetails(res.data.data);
    }).catch(() => {});
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      acc_id: "",
      sale_price: "",
      batdau: "",
      ketthuc: "",
      status: 1
    });
    setSelectedAccDetails(null);
  }

  useEffect(() => {
    load();
    loadAccountTypes();
  }, []);

  useEffect(() => {
    if (isSelectModalOpen) {
      fetchModalAccounts();
    }
  }, [isSelectModalOpen]);

  return (
    <>
      <h1 className="page-title">Quản lý Flash Sales</h1>

      <div className="card">
        <h3>{editingId ? `Chỉnh sửa Flash Sale #${editingId}` : "Tạo chương trình Flash Sale mới"}</h3>
        <form onSubmit={save} className="form-grid" style={{ marginTop: "16px" }}>
          
          <div className="form-group-premium">
            <label>Tài khoản khuyến mãi (Account)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Bấm nút chọn tài khoản bên phải..."
                value={form.acc_id ? `Tài khoản #${form.acc_id} ${selectedAccDetails ? `(Gốc: ${Number(selectedAccDetails.gia).toLocaleString()}đ)` : ""}` : ""}
                readOnly
                required
                style={{ flexGrow: 1 }}
              />
              <button 
                type="button" 
                className="btn-outline" 
                onClick={() => setIsSelectModalOpen(true)}
                style={{ padding: "8px 16px", whiteSpace: "nowrap" }}
              >
                Chọn tài khoản
              </button>
            </div>
          </div>

          <div className="form-group-premium">
            <label>Giá Sale (VND)</label>
            <input
              type="number"
              placeholder="Nhập giá khuyến mãi..."
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label>Bắt đầu lúc</label>
            <input
              type="datetime-local"
              value={form.batdau}
              onChange={(e) => setForm({ ...form, batdau: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label>Kết thúc lúc</label>
            <input
              type="datetime-local"
              value={form.ketthuc}
              onChange={(e) => setForm({ ...form, ketthuc: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
            <label>Trạng thái sale</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
            >
              <option value="1">Kích hoạt (Active)</option>
              <option value="0">Tạm tắt (Inactive)</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
            <button type="submit" className="small-btn">
              {editingId ? "Cập nhật" : "Tạo Sale"}
            </button>
            {(editingId || form.acc_id) && (
              <button type="button" className="btn-outline" onClick={resetForm} style={{ padding: "8px 16px" }}>
                Hủy / Reset
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Mã Account</th>
              <th>Giá Flash Sale</th>
              <th>Thời gian Flash Sale</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td><code>#{s.acc_id}</code></td>
                <td style={{ color: "var(--gold-color)", fontWeight: "bold" }}>
                  {Number(s.sale_price).toLocaleString()}đ
                </td>
                <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Từ: {new Date(s.batdau).toLocaleString()}<br />
                  Đến: {new Date(s.ketthuc).toLocaleString()}
                </td>
                <td>
                  <span style={{ 
                    color: Number(s.status) === 1 ? "var(--green-color)" : "var(--accent-color)",
                    fontWeight: "bold"
                  }}>
                    {Number(s.status) === 1 ? "Đang chạy" : "Tắt / Hết hạn"}
                  </span>
                </td>
                <td>
                  <div className="action-row" style={{ display: "flex", gap: "6px" }}>
                    <button className="small-btn" onClick={() => startEdit(s)}>
                      Sửa
                    </button>
                    {Number(s.status) === 1 && (
                      <button className="danger-btn" onClick={() => remove(s.id)}>
                        Tắt
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                  Không có chương trình khuyến mãi nào được tìm thấy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Account Selection Modal */}
      {isSelectModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div className="card" style={{
            maxWidth: "750px",
            width: "100%",
            maxHeight: "85vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Chọn tài khoản game (Chưa bán)</h3>
              <button 
                type="button" 
                className="danger-btn" 
                onClick={() => setIsSelectModalOpen(false)}
                style={{ padding: "6px 12px" }}
              >
                Đóng
              </button>
            </div>

            {/* Modal filters */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Tìm theo ID tài khoản..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="filter-input"
                style={{ maxWidth: "200px", margin: 0 }}
              />
              <select
                value={modalTypeFilter}
                onChange={(e) => setModalTypeFilter(e.target.value)}
                className="filter-input"
                style={{ maxWidth: "200px", margin: 0 }}
              >
                <option value="">Tất cả loại acc</option>
                {accountTypes.map(t => (
                  <option key={t.id} value={t.id.toString()}>{t.name}</option>
                ))}
              </select>
              <button 
                type="button" 
                className="small-btn"
                onClick={fetchModalAccounts}
              >
                Tải lại
              </button>
            </div>

            {/* List */}
            <div style={{ flexGrow: 1, overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              {modalLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Đang tải danh sách tài khoản chưa bán...</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: "0.85rem" }}>ID</th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: "0.85rem" }}>Loại Acc</th>
                      <th style={{ padding: "10px", textAlign: "right", fontSize: "0.85rem" }}>Giá gốc</th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: "0.85rem" }}>Chi tiết / Mô tả</th>
                      <th style={{ padding: "10px", textAlign: "center", fontSize: "0.85rem" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModalAccounts.map(acc => {
                      const type = accountTypes.find(t => t.id === acc.loai_id);
                      return (
                        <tr key={acc.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "10px" }}><code>#{acc.id}</code></td>
                          <td style={{ padding: "10px", fontSize: "0.9rem" }}>{type ? type.name : `Loại #${acc.loai_id}`}</td>
                          <td style={{ padding: "10px", textAlign: "right", color: "var(--gold-color)", fontWeight: "bold", fontSize: "0.9rem" }}>
                            {Number(acc.gia).toLocaleString()}đ
                          </td>
                          <td style={{ padding: "10px", fontSize: "0.8rem", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={acc.list_thong_tin || acc.login}>
                            {acc.list_thong_tin || acc.login}
                          </td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <button
                              type="button"
                              className="small-btn"
                              onClick={() => selectAccount(acc)}
                              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                            >
                              Chọn
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredModalAccounts.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                          Không tìm thấy tài khoản chưa bán nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
