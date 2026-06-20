import { useEffect, useState } from "react";
import api from "../../api/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPage: 1
  });

  async function load() {
    try {
      const res = await api.get("/admin/users", {
        params: {
          page,
          limit: 20,
          search: search || undefined
        }
      });
      setUsers(res.data.data.users || []);
      if (res.data.data.pagination) {
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function updateUser(id, body) {
    try {
      await api.put(`/admin/users/${id}`, body);
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi cập nhật người dùng");
    }
  }

  async function money(id, type) {
    const amount = prompt("Nhập số tiền:");
    if (!amount) return;

    try {
      await api.post(`/admin/users/${id}/money`, {
        type,
        amount: Number(amount),
        description: type === "add" ? "Admin cộng tiền" : "Admin trừ tiền",
      });
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi giao dịch tiền");
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function handleReset() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > pagination.totalPage) return;
    setPage(newPage);
  }

  useEffect(() => {
    load();
  }, [page, search]);

  return (
    <div>
      <h1 className="page-title">Quản lý người dùng (Users)</h1>

      {/* Search Bar */}
      <div className="filter-wrapper" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", alignItems: "center", flexGrow: 1 }}>
          <input
            type="text"
            placeholder="Tìm kiếm username..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="filter-input"
            style={{ maxWidth: "300px", margin: 0 }}
          />
          <button type="submit" className="small-btn">
            Tìm kiếm
          </button>
          {search && (
            <button type="button" className="btn-outline" onClick={handleReset} style={{ padding: "8px 16px" }}>
              Reset
            </button>
          )}
        </form>
        <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Tổng số: <strong>{pagination.total}</strong> thành viên
        </div>
      </div>

      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Level</th>
              <th>Money</th>
              <th>Banned</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>
                  <span style={{ 
                    fontWeight: "bold",
                    color: Number(u.level) === 99 ? "var(--accent-color)" : Number(u.level) === 1 ? "var(--cyan-color)" : "var(--text-primary)"
                  }}>
                    {Number(u.level) === 99 ? "Admin" : Number(u.level) === 1 ? "CTV" : "Thành viên"}
                  </span>
                </td>
                <td>{Number(u.money).toLocaleString()}đ</td>
                <td>
                  <span style={{ 
                    fontWeight: "bold", 
                    color: Number(u.banned) === 1 ? "var(--accent-color)" : "var(--green-color)"
                  }}>
                    {Number(u.banned) === 1 ? "Đang khóa" : "Hoạt động"}
                  </span>
                </td>
                <td className="action-row">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <button
                      className="small-btn"
                      onClick={() => money(u.id, "add")}
                    >
                      + Tiền
                    </button>
                    <button
                      className="small-btn danger-btn"
                      onClick={() => money(u.id, "sub")}
                    >
                      - Tiền
                    </button>
                    <button
                      className="small-btn"
                      onClick={() => updateUser(u.id, { level: 0 })}
                      disabled={Number(u.level) === 0}
                    >
                      Set User
                    </button>
                    <button
                      className="small-btn"
                      onClick={() => updateUser(u.id, { level: 1 })}
                      disabled={Number(u.level) === 1}
                    >
                      Set CTV
                    </button>
                    <button
                      className="small-btn"
                      onClick={() => updateUser(u.id, { level: 99 })}
                      disabled={Number(u.level) === 99}
                    >
                      Set Admin
                    </button>
                    <button
                      className="small-btn danger-btn"
                      onClick={() =>
                        updateUser(u.id, { banned: Number(u.banned) === 1 ? 0 : 1 })
                      }
                    >
                      {Number(u.banned) === 1 ? "Mở khóa" : "Khóa"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                  Không tìm thấy người dùng nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPage > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "24px" }}>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn-outline"
            style={{ padding: "6px 12px", opacity: pagination.page === 1 ? 0.5 : 1, cursor: pagination.page === 1 ? "not-allowed" : "pointer" }}
          >
            Trước
          </button>
          <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Trang <strong>{pagination.page}</strong> / {pagination.totalPage}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPage}
            className="btn-outline"
            style={{ padding: "6px 12px", opacity: pagination.page === pagination.totalPage ? 0.5 : 1, cursor: pagination.page === pagination.totalPage ? "not-allowed" : "pointer" }}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
