import { useEffect, useState } from "react";
import api from "../../api/api";
import TableLoadingRows from "../../components/TableLoadingRows";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/logs");
      setLogs(res.data.data.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải nhật ký.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h1 className="page-title">Nhật ký hoạt động</h1>

      {error && <div className="table-load-error" role="alert">{error} <button type="button" className="btn-outline" onClick={load}>Thử lại</button></div>}
      <div className="table-box" aria-busy={loading}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Thành viên</th>
              <th>Nội dung</th>
              <th>IP</th>
              <th>Thời gian</th>
            </tr>
          </thead>

          <tbody>
            {loading && logs.length === 0 && <TableLoadingRows columns={5} />}
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.user?.username || "-"}</td>
                <td>{l.noidung}</td>
                <td>{l.ip}</td>
                <td>{l.created_at}</td>
              </tr>
            ))}
            {!loading && !error && logs.length === 0 && <tr><td colSpan="5" className="table-empty-cell">Chưa có nhật ký nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
