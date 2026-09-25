import { BarChart2, Gamepad2, ShoppingBag } from "lucide-react";
import WorkspaceLayout from "../components/WorkspaceLayout";

const links = [
  { to: "/ctv", label: "Tổng quan", icon: BarChart2, end: true, group: "Cộng tác viên" },
  { to: "/ctv/accounts", label: "Kho tài khoản", icon: Gamepad2, group: "Cộng tác viên" },
  { to: "/ctv/orders", label: "Đơn hàng đã bán", icon: ShoppingBag, group: "Cộng tác viên" },
];

export default function CtvLayout() {
  return <WorkspaceLayout title="Trung tâm cộng tác viên" role="Cộng tác viên" links={links} />;
}
