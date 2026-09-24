import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import api from "../../api/api";
import { AdminError, AdminPageHeader } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable } from "../../components/ui/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/ui/empty";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { id: "id", header: "ID", accessor: (log) => log.id, sortable: true, cell: (log) => <span className="ui-table-code">#{log.id}</span> },
    { id: "user", header: "Thành viên", accessor: (log) => log.user?.username || "", sortable: true, cell: (log) => <span className="ui-table-primary">{log.user?.username || "—"}</span> },
    { id: "content", header: "Nội dung", accessor: (log) => log.noidung || "", sortable: true, cell: (log) => <span className="ui-table-detail">{log.noidung || "—"}</span> },
    { id: "ip", header: "IP", accessor: (log) => log.ip || "", sortable: true, cell: (log) => <span className="ui-table-code">{log.ip || "—"}</span> },
    { id: "created", header: "Thời gian", accessor: (log) => log.created_at || "", sortable: true, cell: (log) => <span className="ui-table-secondary">{log.created_at || "—"}</span> },
  ];

  return (
    <div className="admin-logs-page admin-accounts-page">
      <AdminPageHeader eyebrow="Hệ thống · Admin" title="Nhật ký hoạt động" description="Audit trail của các hành động quản trị và sự kiện quan trọng trong hệ thống." actions={<Button variant="outline" onClick={load} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Làm mới</Button>} />
      <AdminError message={error} onRetry={load} />
      <Card className="ui-data-table-card"><CardHeader><CardTitle>Activity log</CardTitle><CardDescription>{loading ? "Đang đồng bộ dữ liệu…" : `${logs.length} sự kiện được tải.`}</CardDescription></CardHeader><CardContent><DataTable data={logs} loading={loading} columns={columns} caption="Bảng nhật ký hoạt động" empty={<Empty><EmptyMedia><Activity size={20} aria-hidden="true" /></EmptyMedia><EmptyHeader><EmptyTitle>Chưa có nhật ký</EmptyTitle><EmptyDescription>Các hoạt động quản trị mới sẽ được ghi nhận tại đây.</EmptyDescription></EmptyHeader></Empty>} /></CardContent></Card>
    </div>
  );
}
