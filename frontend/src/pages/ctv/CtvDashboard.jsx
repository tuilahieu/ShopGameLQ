import { useEffect, useState } from "react";
import api from "../../api/api";
import { Gamepad2, ShoppingBag, Eye, EyeOff, CheckSquare } from "lucide-react";
import { PageHeading, StatCard, StatusMessage } from "../../components/Ui";
import SkeletonLoading from "../../components/SkeletonLoading";

export default function CtvDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/ctv/dashboard")
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        console.error("Failed to load CTV dashboard:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <SkeletonLoading variant="stats" items={6} label="Đang tải số liệu cộng tác viên" />;
  }

  if (!data) {
    return <StatusMessage title="Không thể tải dữ liệu thống kê" description="Vui lòng tải lại trang để thử lại." />;
  }

  return (
    <div>
      <PageHeading description="Theo dõi tài khoản đang bán và các đơn hàng của bạn.">Tổng quan cộng tác viên</PageHeading>

      <div className="card-grid">
        <StatCard label="Tổng tài khoản đăng" value={data.totalAccounts} icon={Gamepad2} />
        <StatCard label="Tài khoản đang bán" value={data.sellingAccounts} icon={Eye} tone="success" />
        <StatCard label="Tài khoản đã bán" value={data.soldAccounts} icon={CheckSquare} tone="price" />
        <StatCard label="Tài khoản đã ẩn" value={data.hiddenAccounts} icon={EyeOff} />
        <StatCard label="Tổng tiền đã bán" value={`${Number(data.totalEarned || 0).toLocaleString()}đ`} icon={ShoppingBag} tone="price" />
        <StatCard label="Đơn hàng đã bán" value={`${data.totalOrders} đơn hàng`} icon={ShoppingBag} />
      </div>
    </div>
  );
}
