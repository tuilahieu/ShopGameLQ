import { useEffect, useState } from "react";
import api from "../../api/api";

export default function AdminDiscounts() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    magiamgia: "",
    giamgia: "",
    theo: "phantram",
    soluong: 1,
    status: 1
  });

  async function load() {
    try {
      const res = await api.get("/admin/discounts");
      setItems(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function save(e) {
    e.preventDefault();
    if (!form.magiamgia) return alert("Vui lòng nhập mã giảm giá");
    if (!form.giamgia) return alert("Vui lòng nhập số tiền hoặc phần trăm giảm");

    try {
      if (editingId) {
        await api.put(`/admin/discounts/${editingId}`, form);
        alert("Cập nhật mã giảm giá thành công");
      } else {
        await api.post("/admin/discounts", form);
        alert("Tạo mã giảm giá thành công");
      }
      resetForm();
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi lưu mã giảm giá");
    }
  }

  async function remove(id) {
    if (!window.confirm("Bạn có chắc chắn muốn tắt mã giảm giá này?")) return;
    try {
      await api.delete(`/admin/discounts/${id}`);
      alert("Đã tắt mã giảm giá");
      load();
    } catch (err) {
      console.error(err);
      alert("Lỗi tắt mã giảm giá");
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      magiamgia: item.magiamgia || "",
      giamgia: item.giamgia || "",
      theo: item.theo || "phantram",
      soluong: item.soluong !== undefined ? Number(item.soluong) : 1,
      status: item.status !== undefined ? Number(item.status) : 1
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      magiamgia: "",
      giamgia: "",
      theo: "phantram",
      soluong: 1,
      status: 1
    });
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h1 className="page-title">Quản lý Mã giảm giá</h1>

      <div className="card">
        <h3>{editingId ? `Chỉnh sửa mã #${editingId}` : "Tạo mã giảm giá mới"}</h3>
        <form onSubmit={save} className="form-grid" style={{ marginTop: "16px" }}>
          <div className="form-group-premium">
            <label>Mã giảm giá</label>
            <input
              placeholder="Ví dụ: LICHMINH, GIAM10K..."
              value={form.magiamgia}
              onChange={(e) => setForm({ ...form, magiamgia: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label>Giá trị giảm</label>
            <input
              type="number"
              placeholder="Nhập số..."
              value={form.giamgia}
              onChange={(e) => setForm({ ...form, giamgia: e.target.value })}
              required
            />
          </div>

          <div className="form-group-premium">
            <label>Hình thức giảm</label>
            <select
              value={form.theo}
              onChange={(e) => setForm({ ...form, theo: e.target.value })}
            >
              <option value="phantram">Giảm theo %</option>
              <option value="tienmat">Giảm tiền mặt (VND)</option>
            </select>
          </div>

          <div className="form-group-premium">
            <label>Số lượng sử dụng</label>
            <input
              type="number"
              placeholder="Số lượt áp dụng tối đa"
              value={form.soluong}
              onChange={(e) => setForm({ ...form, soluong: Number(e.target.value) })}
              required
            />
          </div>

          <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
            <label>Trạng thái mã</label>
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
              {editingId ? "Cập nhật" : "Tạo mã"}
            </button>
            {(editingId || form.magiamgia) && (
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
              <th>Mã</th>
              <th>Mức giảm</th>
              <th>Theo loại</th>
              <th>SL còn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {items.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td><code>{d.magiamgia}</code></td>
                <td><strong>{Number(d.giamgia).toLocaleString()}</strong></td>
                <td>{d.theo === "phantram" ? "%" : "VND"}</td>
                <td>{d.soluong}</td>
                <td>
                  <span style={{ 
                    color: Number(d.status) === 1 ? "var(--green-color)" : "var(--accent-color)",
                    fontWeight: "bold"
                  }}>
                    {Number(d.status) === 1 ? "Đang bật" : "Đang tắt"}
                  </span>
                </td>
                <td>
                  <div className="action-row" style={{ display: "flex", gap: "6px" }}>
                    <button className="small-btn" onClick={() => startEdit(d)}>
                      Sửa
                    </button>
                    {Number(d.status) === 1 && (
                      <button className="danger-btn" onClick={() => remove(d.id)}>
                        Tắt
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
