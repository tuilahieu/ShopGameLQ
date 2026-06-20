import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { BarChart2, Gamepad2, ShoppingBag, LogOut, ArrowLeft } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

export default function CtvLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  function logout() {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2>
          <span>🤝 PANEL CTV</span>
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Cộng tác viên</span>
          <strong style={{ color: "var(--cyan-color)", fontSize: "1.1rem" }}>{user.username}</strong>
        </div>

        <div style={{ marginTop: "8px", marginBottom: "4px" }}>
          <ThemeToggle />
        </div>

        <hr style={{ border: "0", borderTop: "1px solid rgba(255,255,255,0.05)", margin: "4px 0" }} />

        <nav className="admin-nav-links">
          <NavLink to="/ctv" end className={({ isActive }) => isActive ? "active" : ""}>
            <BarChart2 size={16} /> Dashboard
          </NavLink>

          <NavLink to="/ctv/accounts" className={({ isActive }) => isActive ? "active" : ""}>
            <Gamepad2 size={16} /> Quản lý Accounts
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
