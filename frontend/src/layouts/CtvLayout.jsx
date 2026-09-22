import { BarChart2, Gamepad2, ShoppingBag } from "lucide-react";
import WorkspaceLayout from "../components/WorkspaceLayout";

const links = [
  { to: "/ctv", label: "Tổng quan", icon: BarChart2, end: true },
  { to: "/ctv/accounts", label: "Quản lý tài khoản", icon: Gamepad2 },
  { to: "/ctv/orders", label: "Đơn hàng đã bán", icon: ShoppingBag },
];

export default function CtvLayout() {
  return <WorkspaceLayout title="Trung tâm cộng tác viên" role="Cộng tác viên" links={links} />;
}
