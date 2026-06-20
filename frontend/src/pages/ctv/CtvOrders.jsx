import { useEffect, useState } from "react";
import api from "../../api/api";

export default function CtvOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPage: 1 });

  async function loadOrders(page = 1) {
    setLoading(true);
    try {
      const res = await api.get(`/ctv/orders?page=${page}&limit=20`);
      setOrders(res.data.data.orders || []);
      setPagination(res.data.data.pagination || { page, limit: 20, total: 0, totalPage: 1 });
    } catch (err) {
      console.error("Failed to load CTV orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div>
      <h1 className="page-title">Đơn hàng đã bán</h1>

      <div className="table-box">
        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Đang tải danh sách đơn hàng...</p>
        ) : orders.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>Không có đơn hàng nào.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Đơn hàng</th>
                  <th>ID Account</th>
                  <th>Giá gốc</th>
                  <th>Flash Sale</th>
                  <th>Giảm giá</th>
                  <th>Thực nhận</th>
                  <th>Người mua</th>
                  <th>Trạng thái</th>
                  <th>Thời gian mua</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td><code>#{o.acc_id}</code></td>
                    <td>{Number(o.original_price).toLocaleString()}đ</td>
                    <td>{o.sale_price ? `${Number(o.sale_price).toLocaleString()}đ` : "—"}</td>
                    <td>{o.discount_amount ? `${Number(o.discount_amount).toLocaleString()}đ` : "—"}</td>
                    <td style={{ color: "var(--gold-color)", fontWeight: "bold" }}>
                      {Number(o.final_price).toLocaleString()}đ
                    </td>
                    <td>
                      {o.user ? (
                        <span style={{ color: "var(--cyan-color)", fontWeight: "600" }}>{o.user.username}</span>
                      ) : o.user_id ? (
                        `User #${o.user_id}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        color: o.status === 1 ? "var(--green-color)" : "var(--accent-color)", 
                        fontWeight: "600" 
                      }}>
                        {o.status === 1 ? "Thành công" : `Mã ${o.status}`}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {new Date(o.createdAt || o.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPage > 1 && (
              <div className="pagination" style={{ display: "flex", gap: "8px", marginTop: "20px", justifyContent: "center" }}>
                {Array.from({ length: pagination.totalPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => loadOrders(p)}
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
