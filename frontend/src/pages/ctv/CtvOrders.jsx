import { useEffect, useRef, useState } from "react";
import { RefreshCw, ShoppingBag } from "lucide-react";
import api from "../../api/api";
import PanelLoading from "../../components/PanelLoading";
import { PageHeading } from "../../components/Ui";

export default function CtvOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const loadSequence = useRef(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPage: 1 });

  async function loadOrders(page = 1) {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get(`/ctv/orders?page=${page}&limit=20`);
      if (sequence !== loadSequence.current) return;
      setOrders(res.data.data.orders || []);
      setPagination(res.data.data.pagination || { page, limit: 20, total: 0, totalPage: 1 });
    } catch (err) {
      if (sequence === loadSequence.current) setLoadError(err.response?.data?.message || "Không thể tải đơn hàng.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="ctv-orders-page">
      <PageHeading description="Theo dõi người mua, giá trị đơn và số tiền được ghi nhận.">Đơn hàng đã bán</PageHeading>

      <section className="ctv-list-section" aria-labelledby="ctv-order-list-title">
        <div className="ctv-list-toolbar">
          <div><h2 id="ctv-order-list-title">Lịch sử bán hàng</h2><p>{pagination.total.toLocaleString("vi-VN")} đơn hàng</p></div>
          <button type="button" className="btn-outline ctv-refresh-button" onClick={() => loadOrders(pagination.page)} aria-label="Làm mới danh sách đơn hàng"><RefreshCw size={16} aria-hidden="true" /></button>
        </div>

      <div className="table-box">
        {loading ? (
          <PanelLoading label="Đang tải danh sách đơn hàng" />
        ) : loadError ? (
          <div className="table-load-error" role="alert">{loadError} <button type="button" className="btn-outline" onClick={() => loadOrders(pagination.page)}>Thử lại</button></div>
        ) : orders.length === 0 ? (
          <div className="ctv-empty-state"><ShoppingBag size={22} aria-hidden="true" /><strong>Chưa có đơn hàng</strong><span>Đơn phát sinh từ tài khoản của bạn sẽ xuất hiện tại đây.</span></div>
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
                    <td className="ctv-table-price">
                      {Number(o.final_price).toLocaleString()}đ
                    </td>
                    <td>
                      {o.user ? (
                        <span className="ctv-table-buyer">{o.user.username}</span>
                      ) : o.user_id ? (
                        `User #${o.user_id}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`ctv-status is-${o.status === 1 ? "sold" : "pending"}`}>
                        {o.status === 1 ? "Thành công" : `Mã ${o.status}`}
                      </span>
                    </td>
                    <td className="ctv-table-muted">
                      {new Date(o.createdAt || o.created_at).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPage > 1 && (
              <nav className="pagination ctv-pagination" aria-label="Phân trang đơn hàng">
                {Array.from({ length: pagination.totalPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => loadOrders(p)}
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
    </div>
  );
}
