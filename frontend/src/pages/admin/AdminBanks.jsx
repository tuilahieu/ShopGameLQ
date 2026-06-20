import { useEffect, useState } from "react";
import api from "../../api/api";
import { Landmark } from "lucide-react";

export default function AdminBanks() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    account_no: "",
    account_name: "",
    bank_id: "",
    status: 1
  });

  async function load() {
    try {
      const res = await api.get("/admin/banks");
      setItems(res.data.data || []);
    } catch (err) {
      console.error("Failed to load banks list:", err);
    }
  }

  async function save(e) {
    e.preventDefault();
    if (!form.name || !form.account_no || !form.account_name || !form.bank_id) {
      return alert("Vui lòng nhập đầy đủ thông tin ngân hàng!");
    }

    try {
      if (editingId) {
        await api.put(`/admin/banks/${editingId}`, form);
        alert("Cập nhật tài khoản ngân hàng thành công!");
      } else {
        await api.post("/admin/banks", form);
        alert("Thêm tài khoản ngân hàng thành công!");
      }
      resetForm();
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi lưu thông tin ngân hàng");
    }
  }

  async function remove(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ngân hàng này?")) return;
    try {
      await api.delete(`/admin/banks/${id}`);
      alert("Đã xóa ngân hàng thành công!");
      load();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa ngân hàng");
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      account_no: item.account_no || "",
      account_name: item.account_name || "",
      bank_id: item.bank_id || "",
      status: item.status !== undefined ? Number(item.status) : 1
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      account_no: "",
      account_name: "",
      bank_id: "",
      status: 1
    });
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h1 className="page-title">Quản lý Tài khoản Ngân hàng</h1>

      <div className="card">
        <h3>{editingId ? `Chỉnh sửa cổng #${editingId}` : "Thêm cổng thanh toán mới"}</h3>
        <form onSubmit={save} className="form-grid" style={{ marginTop: "16px" }}>
          <div className="form-group-premium">
            <label>Tên ngân hàng (Hiển thị)</label>
            <input
              placeholder="Ví dụ: Ngân hàng Quân Đội (MB Bank)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label>Số tài khoản / Số điện thoại ví</label>
            <input
              placeholder="Ví dụ: 9999686868"
              value={form.account_no}
              onChange={(e) => setForm({ ...form, account_no: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label>Chủ tài khoản (Tên viết hoa không dấu)</label>
            <input
              placeholder="Ví dụ: NGUYEN VAN A"
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label>Mã nhận diện QR (ví dụ: mbbank, momo, vcb, acb...)</label>
            <input
              placeholder="MB: mbbank, Momo: momo, Vietcom: vcb..."
              value={form.bank_id}
              onChange={(e) => setForm({ ...form, bank_id: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
            <label>Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
            >
              <option value="1">Kích hoạt (Hoạt động)</option>
              <option value="0">Tạm khóa (Không hiển thị)</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
            <button type="submit" className="small-btn">
              {editingId ? "Cập nhật" : "Thêm mới"}
            </button>
            {(editingId || form.name) && (
              <button type="button" className="btn-outline" onClick={resetForm} style={{ padding: "8px 16px" }}>
                Hủy bỏ
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h3>Danh sách tài khoản ngân hàng</h3>
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cổng ngân hàng</th>
                <th>Số tài khoản</th>
                <th>Chủ tài khoản</th>
                <th>Mã QR</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    Chưa cấu hình tài khoản ngân hàng nào.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Landmark size={16} style={{ color: "var(--gold-color)" }} />
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td><code style={{ color: "var(--cyan-color)" }}>{item.account_no}</code></td>
                    <td>{item.account_name}</td>
                    <td><span className="tag-spec">{item.bank_id}</span></td>
                    <td>
                      <span 
                        style={{ 
                          color: Number(item.status) === 1 ? "var(--green-color)" : "var(--accent-color)",
                          fontWeight: "600"
                        }}
                      >
                        {Number(item.status) === 1 ? "Hoạt động" : "Tạm khóa"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="small-btn" onClick={() => startEdit(item)}>
                          Sửa
                        </button>
                        <button className="danger-btn" onClick={() => remove(item.id)}>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
