import { BarChart2, Database, FolderKanban, Gamepad2, History, Landmark, Layers, Percent, Settings, ShoppingBag, Tag, Users } from "lucide-react";
import WorkspaceLayout from "../../components/WorkspaceLayout";

const links = [
  { to: "/admin", label: "Tổng quan", icon: BarChart2, end: true, group: "Điều hành" },
  { to: "/admin/accounts", label: "Kho tài khoản", icon: Gamepad2, group: "Sản phẩm" },
  { to: "/admin/categories", label: "Danh mục", icon: FolderKanban, group: "Sản phẩm" },
  { to: "/admin/account-types", label: "Loại tài khoản", icon: Layers, group: "Sản phẩm" },
  { to: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag, group: "Kinh doanh" },
  { to: "/admin/transactions", label: "Giao dịch", icon: History, group: "Kinh doanh" },
  { to: "/admin/sales", label: "Khuyến mãi", icon: Percent, group: "Kinh doanh" },
  { to: "/admin/discounts", label: "Mã giảm giá", icon: Tag, group: "Kinh doanh" },
  { to: "/admin/users", label: "Người dùng", icon: Users, group: "Hệ thống" },
  { to: "/admin/banks", label: "Ngân hàng", icon: Landmark, group: "Hệ thống" },
  { to: "/admin/logs", label: "Nhật ký", icon: Database, group: "Hệ thống" },
  { to: "/admin/setting", label: "Cấu hình", icon: Settings, group: "Hệ thống" },
];

export default function AdminLayout() {
  return <WorkspaceLayout title="Quản trị hệ thống" role="Quản trị viên" links={links} />;
}
