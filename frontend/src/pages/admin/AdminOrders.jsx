import { useEffect, useState } from "react";
import api from "../../api/api";
import TableLoadingRows from "../../components/TableLoadingRows";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="page-title">Đơn hàng</h1>

      {error && <div className="table-load-error" role="alert">{error} <button type="button" className="btn-outline" onClick={load}>Thử lại</button></div>}
      <div className="table-box" aria-busy={loading}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Thành viên</th>
              <th>Tài khoản</th>
              <th>Giá gốc</th>
              <th>Giá sale</th>
              <th>Giảm giá</th>
              <th>Thành tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>

          <tbody>
            {loading && orders.length === 0 && <TableLoadingRows columns={8} />}
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.user?.username || o.user_id}</td>
                <td>{o.acc_id}</td>
                <td>{Number(o.original_price).toLocaleString()}đ</td>
                <td>
                  {o.sale_price
                    ? Number(o.sale_price).toLocaleString() + "đ"
                    : "-"}
                </td>
                <td>{Number(o.discount_amount).toLocaleString()}đ</td>
                <td>{Number(o.final_price).toLocaleString()}đ</td>
                <td>{o.status}</td>
              </tr>
            ))}
            {!loading && !error && orders.length === 0 && <tr><td colSpan="8" className="table-empty-cell">Chưa có đơn hàng nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
