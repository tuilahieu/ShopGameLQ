import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { BarChart2, Gamepad2, ShoppingBag, LogOut, ArrowLeft, Menu, X } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import api from "../api/api";

export default function CtvLayout() {
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
        <strong>Trung tâm cộng tác viên</strong>
        <button
          type="button"
          className="admin-mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Mở menu cộng tác viên"
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
          aria-label="Đóng menu cộng tác viên"
        />
      )}
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "is-open" : ""}`}>
        <h2>
          <span>TRUNG TÂM CỘNG TÁC VIÊN</span>
        </h2>
        <button
          type="button"
          className="admin-drawer-close"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Đóng menu cộng tác viên"
        >
          <X size={18} />
        </button>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Cộng tác viên</span>
          <strong style={{ color: "var(--cyan-color)", fontSize: "1.1rem" }}>{user.username}</strong>
        </div>

        <div style={{ marginTop: "8px", marginBottom: "4px" }}>
          <ThemeToggle />
        </div>

        <hr style={{ border: "0", borderTop: "1px solid rgba(255,255,255,0.05)", margin: "4px 0" }} />

        <nav className="admin-nav-links" onClick={() => setMobileMenuOpen(false)}>
          <NavLink to="/ctv" end className={({ isActive }) => isActive ? "active" : ""}>
            <BarChart2 size={16} /> Tổng quan
          </NavLink>

          <NavLink to="/ctv/accounts" className={({ isActive }) => isActive ? "active" : ""}>
            <Gamepad2 size={16} /> Quản lý tài khoản
          </NavLink>

          <NavLink to="/ctv/orders" className={({ isActive }) => isActive ? "active" : ""}>
            <ShoppingBag size={16} /> Đơn hàng đã bán
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
