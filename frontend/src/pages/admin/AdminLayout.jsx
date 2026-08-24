import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  BarChart2, FolderKanban, Layers, Users, Gamepad2, 
  ShoppingBag, History, Percent, Tag, Settings, Database, LogOut, ArrowLeft, Landmark, Menu, X
} from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import api from "../../api/api";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  async function logout() {
    try { await api.post("/auth/logout"); } catch { /* Clear the local session regardless. */ }
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div className="admin-container">
      <header className="admin-mobile-topbar">
        <strong>Quản trị hệ thống</strong>
        <button
          type="button"
          className="admin-mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Mở menu quản trị"
          aria-expanded={mobileMenuOpen}
        >
          <Menu size={20} />
        </button>
      </header>
      {mobileMenuOpen && (
        <button
          type="button"
          className="admin-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Đóng menu quản trị"
        />
      )}
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "is-open" : ""}`}>
        <h2>
          <span>QUẢN TRỊ HỆ THỐNG</span>
        </h2>
        <button
          type="button"
          className="admin-drawer-close"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Đóng menu quản trị"
        >
          <X size={18} />
        </button>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Quản trị viên</span>
          <strong style={{ color: "var(--cyan-color)", fontSize: "1.1rem" }}>{user.username}</strong>
        </div>

        <div style={{ marginTop: "8px", marginBottom: "4px" }}>
          <ThemeToggle />
        </div>

        <hr style={{ border: "0", borderTop: "1px solid rgba(255,255,255,0.05)", margin: "4px 0" }} />

        <nav className="admin-nav-links" onClick={() => setMobileMenuOpen(false)}>
          <NavLink to="/admin" end className={({ isActive }) => isActive ? "active" : ""}>
            <BarChart2 size={16} /> Tổng quan
          </NavLink>

          <NavLink to="/admin/categories" className={({ isActive }) => isActive ? "active" : ""}>
            <FolderKanban size={16} /> Danh mục
          </NavLink>

          <NavLink to="/admin/account-types" className={({ isActive }) => isActive ? "active" : ""}>
            <Layers size={16} /> Loại tài khoản
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => isActive ? "active" : ""}>
            <Users size={16} /> Người dùng
          </NavLink>

          <NavLink to="/admin/accounts" className={({ isActive }) => isActive ? "active" : ""}>
            <Gamepad2 size={16} /> Kho tài khoản
          </NavLink>

          <NavLink to="/admin/orders" className={({ isActive }) => isActive ? "active" : ""}>
            <ShoppingBag size={16} /> Đơn hàng
          </NavLink>

          <NavLink to="/admin/transactions" className={({ isActive }) => isActive ? "active" : ""}>
            <History size={16} /> Giao dịch
          </NavLink>

          <NavLink to="/admin/sales" className={({ isActive }) => isActive ? "active" : ""}>
            <Percent size={16} /> Khuyến mãi
          </NavLink>

          <NavLink to="/admin/discounts" className={({ isActive }) => isActive ? "active" : ""}>
            <Tag size={16} /> Mã giảm giá
          </NavLink>

          <NavLink to="/admin/setting" className={({ isActive }) => isActive ? "active" : ""}>
            <Settings size={16} /> Cấu hình
          </NavLink>

          <NavLink to="/admin/logs" className={({ isActive }) => isActive ? "active" : ""}>
            <Database size={16} /> Nhật ký
          </NavLink>
          <NavLink to="/admin/banks" className={({ isActive }) => isActive ? "active" : ""}>
            <Landmark size={16} /> Quản lý Bank
          </NavLink>
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button 
            onClick={() => navigate("/")} 
            className="btn-outline" 
            style={{ width: "100%", padding: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <ArrowLeft size={14} /> Về trang chủ
          </button>
          
          <button 
            onClick={logout} 
            className="btn-primary" 
            style={{ width: "100%", padding: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
