import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/api";
import TableLoadingRows from "../../components/TableLoadingRows";

export default function AdminTransactions() {
  const [items, setItems] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPage: 1
  });
  const loadSequence = useRef(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/admin/transactions", {
        params: {
          page,
          limit: 20,
          search: search || undefined
        }
      });
      if (sequence !== loadSequence.current) return;
      setItems(res.data.data.transactions || []);
      if (res.data.data.pagination) {
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      if (sequence === loadSequence.current) setLoadError(err.response?.data?.message || "Không thể tải giao dịch.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [page, search]);

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
  }, [load]);

  return (
    <div>
      <h1 className="page-title">Lịch sử giao dịch</h1>

      {/* Search and Filters */}
      <div className="filter-wrapper" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", alignItems: "center", flexGrow: 1 }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo username hoặc User ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="filter-input"
            style={{ maxWidth: "320px", margin: 0 }}
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
          Tổng số giao dịch: <strong>{pagination.total}</strong>
        </div>
      </div>

      {loadError && <div className="table-load-error" role="alert">{loadError} <button type="button" className="btn-outline" onClick={load}>Thử lại</button></div>}
      <div className="table-box" aria-busy={loading}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Loại giao dịch</th>
              <th>Số tiền</th>
              <th>Số dư trước</th>
              <th>Số dư sau</th>
              <th>Mô tả chi tiết</th>
            </tr>
          </thead>

          <tbody>
            {loading && items.length === 0 && <TableLoadingRows columns={7} />}
            {items.map((t) => {
              const amount = Number(t.amount || 0);
              const isAdd = amount > 0;
              return <tr key={t.id}>
                <td>{t.id}</td>
                <td>
                  <span style={{ fontWeight: "600", color: "var(--cyan-color)" }}>
                    {t.user?.username || `ID: ${t.user_id}`}
                  </span>
                </td>
                <td>
                  <span style={{
                    color: isAdd ? "var(--green-color)" : "var(--danger-color)",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    fontSize: "0.8rem"
                  }}>
                    {t.type}
                  </span>
                </td>
                <td style={{ fontWeight: "bold" }}>
                  {isAdd ? "+" : "-"}{Math.abs(amount).toLocaleString()}đ
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{Number(t.balance_before).toLocaleString()}đ</td>
                <td style={{ color: "var(--text-secondary)" }}>{Number(t.balance_after).toLocaleString()}đ</td>
                <td style={{ fontSize: "0.9rem" }}>{t.description}</td>
              </tr>;
            })}
            {!loading && !loadError && items.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                  Không tìm thấy lịch sử giao dịch nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
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
