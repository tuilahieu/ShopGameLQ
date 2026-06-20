import { useEffect, useState } from "react";
import api from "../../api/api";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  async function load() {
    const res = await api.get("/admin/orders");
    setOrders(res.data.data.orders);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="page-title">Orders</h1>

      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Acc</th>
              <th>Giá gốc</th>
              <th>Sale</th>
              <th>Discount</th>
              <th>Final</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
