import { Fragment, Suspense, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, LogOut, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import api from "../api/api";
import AppLoader from "./AppLoader";
import useMotionReveal from "../hooks/useMotionReveal";

export default function WorkspaceLayout({ title, role, links }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const sidebarRef = useRef(null);
  const mainRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const routeKey = `${location.pathname}${location.search}`;
  const activeLink = [...links]
    .sort((a, b) => b.to.length - a.to.length)
    .find((link) => link.end ? location.pathname === link.to : location.pathname.startsWith(link.to));

  useMotionReveal(mainRef, routeKey);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    const sidebar = sidebarRef.current;
    const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])";
    document.body.style.overflow = "hidden";
    sidebar?.querySelector(focusableSelector)?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") { setMenuOpen(false); return; }
      if (event.key !== "Tab" || !sidebar) return;
      const items = [...sidebar.querySelectorAll(focusableSelector)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [menuOpen]);

  async function logout() {
    try { await api.post("/auth/logout"); } catch { /* Clear expired local sessions too. */ }
    localStorage.clear();
    sessionStorage.removeItem("adminSession");
    navigate("/login");
  }

  return (
    <div className="admin-container workspace-shell">
      <a className="skip-link" href="#workspace-main">Bỏ qua điều hướng</a>
      <header className="admin-mobile-topbar">
        <div><small>{role}</small><strong>{activeLink?.label || title}</strong></div>
        <button ref={menuButtonRef} type="button" className="admin-mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label={`Mở menu ${role}`} aria-expanded={menuOpen} aria-controls="workspace-sidebar">
          <Menu size={20} aria-hidden="true" />
        </button>
      </header>
      {menuOpen && <button type="button" className="admin-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label={`Đóng menu ${role}`} />}
      <aside id="workspace-sidebar" ref={sidebarRef} className={`admin-sidebar workspace-sidebar ${menuOpen ? "is-open" : ""}`} aria-label={`Điều hướng ${role}`}>
        <div className="workspace-brand">
          <span className="workspace-brand-mark" aria-hidden="true">S</span>
          <div><small>SHOP LIÊN QUÂN</small><h2>{title}</h2></div>
        </div>
        <button type="button" className="admin-drawer-close" onClick={() => setMenuOpen(false)} aria-label={`Đóng menu ${role}`}><X size={20} aria-hidden="true" /></button>
        <div className="workspace-account">
          <span>{role}</span>
          <strong>{user.username || "Tài khoản"}</strong>
        </div>
        <nav className="admin-nav-links" aria-label={`Các trang ${role}`}>
          {links.map(({ to, label, icon: Icon, end, group }, index) => (
            <Fragment key={to}>
              {group && group !== links[index - 1]?.group && <span className="workspace-nav-group-label">{group}</span>}
              <NavLink to={to} end={end} className={({ isActive }) => isActive ? "active" : ""}>
                <Icon size={18} aria-hidden="true" /><span>{label}</span><ChevronRight className="workspace-nav-chevron" size={15} aria-hidden="true" />
              </NavLink>
            </Fragment>
          ))}
        </nav>
        <div className="workspace-sidebar-footer">
          <ThemeToggle />
          <NavLink to="/" className="btn-outline workspace-footer-link"><ArrowLeft size={16} aria-hidden="true" /> Về cửa hàng</NavLink>
          <button type="button" onClick={logout} className="btn-ghost workspace-footer-link"><LogOut size={16} aria-hidden="true" /> Đăng xuất</button>
        </div>
      </aside>
      <main ref={mainRef} id="workspace-main" tabIndex={-1} className="admin-content workspace-content">
        <header className="workspace-contextbar">
          <div><small>{activeLink?.group || role}</small><strong>{activeLink?.label || title}</strong></div>
          <span>Xin chào, <b>{user.username || "Quản trị viên"}</b></span>
        </header>
        <div className="workspace-route-stage" key={routeKey}><Suspense fallback={<AppLoader inline />}><Outlet /></Suspense></div>
      </main>
    </div>
  );
}
