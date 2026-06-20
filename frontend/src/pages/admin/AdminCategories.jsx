import { useEffect, useState } from "react";
import api from "../../api/api";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [form, setForm] = useState({
    name: "",
    noidung: "",
    type: "",
    status: 1
  });
  const [editingId, setEditingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      // Admin gets all categories (active & inactive)
      const res = await api.get("/categories?all=true");
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert("Lỗi tải danh mục");
    } finally {
      setLoading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    if (!form.name) return alert("Vui lòng nhập tên danh mục");

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form);
        alert("Cập nhật danh mục thành công");
      } else {
        await api.post("/categories", form);
        alert("Thêm danh mục thành công");
      }
      setForm({ name: "", noidung: "", type: "", status: 1 });
      setEditingId(null);
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi lưu danh mục");
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setForm({
      name: cat.name || "",
      noidung: cat.noidung || "",
      type: cat.type || "",
      status: cat.status !== undefined ? Number(cat.status) : 1
    });
  }

  async function remove(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.")) return;
    try {
      const res = await api.delete(`/categories/${id}`);
      alert(res.data?.message || "Xóa danh mục thành công");
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi xóa danh mục");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="page-title">Quản lý Danh mục tài khoản</h1>

      {/* Editor Form */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3>{editingId ? `Chỉnh sửa danh mục #${editingId}` : "Thêm danh mục mới"}</h3>
        <form onSubmit={save} className="form-grid" style={{ marginTop: "16px" }}>
          <input
            placeholder="Tên danh mục (ví dụ: Acc Liên Quân VIP, Túi mù...)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            placeholder="Mã danh mục (ví dụ: lienquan, tuimu...)"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />

          <input
            className="full"
            placeholder="Mô tả chi tiết về danh mục"
            value={form.noidung}
            onChange={(e) => setForm({ ...form, noidung: e.target.value })}
          />

          <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
            <label>Trạng thái hiển thị</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
            >
              <option value="1">Hiển thị (Active)</option>
              <option value="0">Ẩn (Inactive)</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
            <button type="submit" className="small-btn">
              {editingId ? "Cập nhật" : "Thêm mới"}
            </button>
            {editingId && (
              <button
                type="button"
                className="small-btn danger-btn"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", noidung: "", type: "", status: 1 });
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Table */}
      <div className="table-box">
        {loading ? (
          <p>Đang tải danh mục...</p>
        ) : categories.length === 0 ? (
          <p>Không có danh mục nào.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên danh mục</th>
                <th>Mã</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td><strong>{cat.name}</strong></td>
                  <td><code>{cat.type || "N/A"}</code></td>
                  <td>{cat.noidung || "N/A"}</td>
                  <td>
                    <span style={{ color: Number(cat.status) === 1 ? "green" : "red", fontWeight: "bold" }}>
                      {Number(cat.status) === 1 ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className="action-row">
                      <button onClick={() => startEdit(cat)} className="small-btn">
                        Sửa
                      </button>
                      <button onClick={() => remove(cat.id)} className="small-btn danger-btn">
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
