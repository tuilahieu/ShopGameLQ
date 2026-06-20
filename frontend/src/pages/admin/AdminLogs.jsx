import { useEffect, useState } from "react";
import api from "../../api/api";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);

  async function load() {
    const res = await api.get("/admin/logs");
    setLogs(res.data.data.logs);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <h1>Logs</h1>

      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Nội dung</th>
              <th>IP</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.user?.username || "-"}</td>
                <td>{l.noidung}</td>
                <td>{l.ip}</td>
                <td>{l.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
