import { useEffect, useState } from "react";
import api from "../../api/api";
import { Upload } from "lucide-react";

export default function AdminAccountTypes() {
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [form, setForm] = useState({
    danhmuc_id: "",
    name: "",
    img: "",
    noidung: "",
    camket: "",
    status: 1
  });
  const [editingId, setEditingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [typeRes, catRes] = await Promise.all([
        api.get("/account-types?all=true"),
        api.get("/categories?all=true")
      ]);
      setTypes(typeRes.data.data || []);
      setCategories(catRes.data.data || []);
      
      // Default danhmuc_id to first category if form is empty
      const cats = catRes.data.data || [];
      if (cats.length > 0 && !form.danhmuc_id) {
        setForm(prev => ({ ...prev, danhmuc_id: cats[0].id }));
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi tải loại tài khoản");
    } finally {
      setLoading(false);
    }
  }

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

  async function save(e) {
    e.preventDefault();
    if (!form.danhmuc_id) return alert("Vui lòng chọn danh mục cha");
    if (!form.name) return alert("Vui lòng nhập tên loại tài khoản");

    try {
      if (editingId) {
        await api.put(`/account-types/${editingId}`, form);
        alert("Cập nhật loại tài khoản thành công");
      } else {
        await api.post("/account-types", form);
        alert("Thêm loại tài khoản thành công");
      }
      // Reset form but keep selected category as default for faster data entry
      setForm(prev => ({
        ...prev,
        name: "",
        img: "",
        noidung: "",
        camket: "",
        status: 1
      }));
      setEditingId(null);
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi lưu loại tài khoản");
    }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setForm({
      danhmuc_id: t.danhmuc_id || "",
      name: t.name || "",
      img: t.img || "",
      noidung: t.noidung || "",
      camket: t.camket || "",
      status: t.status !== undefined ? Number(t.status) : 1
    });
  }

  async function remove(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa loại tài khoản này? Hành động này không thể hoàn tác.")) return;
    try {
      const res = await api.delete(`/account-types/${id}`);
      alert(res.data?.message || "Xóa loại tài khoản thành công");
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi xóa loại tài khoản");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="page-title">Quản lý Loại tài khoản</h1>

      {/* Editor Card */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3>{editingId ? `Chỉnh sửa loại nick #${editingId}` : "Thêm loại nick mới"}</h3>
        <form onSubmit={save} className="form-grid" style={{ marginTop: "16px" }}>
          
          <div className="form-group-premium">
            <label>Danh mục cha</label>
            <select
              value={form.danhmuc_id}
              onChange={(e) => setForm({ ...form, danhmuc_id: e.target.value })}
              required
            >
              <option value="">Chọn danh mục...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-premium">
            <label>Tên loại tài khoản</label>
            <input
              placeholder="Ví dụ: Túi mù 50k, Thử vận may VIP..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
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
              <img
                src={form.img}
                alt="Preview"
                style={{ width: "120px", height: "70px", objectFit: "cover", borderRadius: "8px", marginTop: "10px", border: "1px solid var(--border-color)" }}
              />
            )}
          </div>

          <div className="form-group-premium">
            <label>Mô tả ngắn</label>
            <input
              placeholder="Mô tả về loại acc..."
              value={form.noidung}
              onChange={(e) => setForm({ ...form, noidung: e.target.value })}
            />
          </div>

          <div className="form-group-premium">
            <label>Cam kết của shop</label>
            <input
              placeholder="Ví dụ: Đúng mật khẩu 100%, Trúng nick VIP 50%..."
              value={form.camket}
              onChange={(e) => setForm({ ...form, camket: e.target.value })}
            />
          </div>

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
                  setForm({
                    danhmuc_id: categories[0]?.id || "",
                    name: "",
                    img: "",
                    noidung: "",
                    camket: "",
                    status: 1
                  });
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
          <p>Đang tải loại tài khoản...</p>
        ) : types.length === 0 ? (
          <p>Không có loại tài khoản nào.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Danh mục cha</th>
                <th>Tên loại</th>
                <th>Ảnh</th>
                <th>Mô tả</th>
                <th>Cam kết</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => {
                const parentCat = categories.find((c) => Number(c.id) === Number(t.danhmuc_id));
                return (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td><span style={{ color: "blue", fontWeight: "bold" }}>{parentCat?.name || `DM #${t.danhmuc_id}`}</span></td>
                    <td><strong>{t.name}</strong></td>
                    <td>
                      {t.img ? (
                        <img src={t.img} alt="" style={{ width: "60px", height: "35px", objectFit: "cover", borderRadius: "4px" }} />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td>{t.noidung || "N/A"}</td>
                    <td>{t.camket || "N/A"}</td>
                    <td>
                      <span style={{ color: Number(t.status) === 1 ? "green" : "red", fontWeight: "bold" }}>
                        {Number(t.status) === 1 ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button onClick={() => startEdit(t)} className="small-btn">
                          Sửa
                        </button>
                        <button onClick={() => remove(t.id)} className="small-btn danger-btn">
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
