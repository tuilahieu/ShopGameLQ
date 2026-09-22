import { BarChart2, Database, FolderKanban, Gamepad2, History, Landmark, Layers, Percent, Settings, ShoppingBag, Tag, Users } from "lucide-react";
import WorkspaceLayout from "../../components/WorkspaceLayout";

const links = [
  { to: "/admin", label: "Tổng quan", icon: BarChart2, end: true },
  { to: "/admin/categories", label: "Danh mục", icon: FolderKanban },
  { to: "/admin/account-types", label: "Loại tài khoản", icon: Layers },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/accounts", label: "Kho tài khoản", icon: Gamepad2 },
  { to: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag },
  { to: "/admin/transactions", label: "Giao dịch", icon: History },
  { to: "/admin/sales", label: "Khuyến mãi", icon: Percent },
  { to: "/admin/discounts", label: "Mã giảm giá", icon: Tag },
  { to: "/admin/setting", label: "Cấu hình", icon: Settings },
  { to: "/admin/logs", label: "Nhật ký", icon: Database },
  { to: "/admin/banks", label: "Quản lý Bank", icon: Landmark },
];

export default function AdminLayout() {
  return <WorkspaceLayout title="Quản trị hệ thống" role="Quản trị viên" links={links} />;
}
