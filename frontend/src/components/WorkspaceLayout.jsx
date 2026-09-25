import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Bell, CheckCircle2, ChevronRight, Info, LockKeyhole, LogOut, Menu, UserRound, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import api from "../api/api";
import AppLoader from "./AppLoader";
import useMotionReveal from "../hooks/useMotionReveal";
import { notifyAdmin } from "../utils/adminFeedback";

export default function WorkspaceLayout({ title, role, links }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const menuButtonRef = useRef(null);
  const sidebarRef = useRef(null);
  const mainRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const routeKey = `${location.pathname}${location.search}`;
  const groupedLinks = useMemo(() => {
    const groups = new Map();
    links.forEach((link) => {
      const group = link.group || "Điều hướng";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(link);
    });
    return [...groups.entries()].map(([label, items]) => ({ label, items }));
  }, [links]);
  const activeLink = [...links]
    .sort((a, b) => b.to.length - a.to.length)
    .find((link) => link.end ? location.pathname === link.to : location.pathname.startsWith(link.to));
  const workspaceRoleClass = role === "Cộng tác viên" ? " workspace-ctv" : " workspace-admin";

  useMotionReveal(mainRef, routeKey);

  useEffect(() => {
    // A few legacy workspace forms still call alert(). Route those messages
    // through the non-blocking toast while keeping the pages backward compatible.
    const nativeAlert = window.alert;
    window.alert = (message) => notifyAdmin(message);
    return () => { window.alert = nativeAlert; };
  }, []);

  useEffect(() => {
    function handleToast(event) {
      const toast = event.detail || {};
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((current) => [...current, { id, message: toast.message, tone: toast.tone || "info" }].slice(-4));
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 4200);
    }

    window.addEventListener("admin-toast", handleToast);
    return () => window.removeEventListener("admin-toast", handleToast);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
    <div className={`admin-container workspace-shell${workspaceRoleClass}`}>
      <a className="skip-link" href="#workspace-main">Bỏ qua điều hướng</a>
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-session-status"><LockKeyhole size={15} aria-hidden="true" /><span>Đang đăng nhập với tư cách: <strong>{user.username || "Quản trị viên"}</strong></span></div>
          <div className="admin-topbar-actions">
            <NavLink to="/" className="admin-topbar-store" title="Mở cửa hàng"><ArrowLeft size={15} aria-hidden="true" /><span>Về cửa hàng</span></NavLink>
            <button type="button" className="admin-topbar-logout" onClick={logout}><LogOut size={15} aria-hidden="true" /><span>Thoát</span></button>
          </div>
        </div>
        <div className="admin-utilitybar">
          <div className="admin-utilitybar-actions">
            <ThemeToggle compact />
            <button type="button" className="admin-notification-button" aria-label="Thông báo"><Bell size={17} aria-hidden="true" /><span aria-hidden="true">1</span></button>
            <div className="admin-utility-user"><span><UserRound size={16} aria-hidden="true" /></span><strong>{user.username || "Quản trị viên"}</strong></div>
          </div>
        </div>
      </header>
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
          <div><small>SHOP</small><h2>Liên Quân</h2></div>
        </div>
        <button type="button" className="admin-drawer-close" onClick={() => setMenuOpen(false)} aria-label={`Đóng menu ${role}`}><X size={20} aria-hidden="true" /></button>
        <nav className="admin-nav-links" aria-label={`Các trang ${role}`}>
          {groupedLinks.map(({ label, items }) => (
            <Fragment key={label}>
              <span className="workspace-nav-group-label">{label}</span>
              {items.map(({ to, label: itemLabel, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? "active" : ""}>
                  <Icon size={18} aria-hidden="true" /><span>{itemLabel}</span><ChevronRight className="workspace-nav-chevron" size={15} aria-hidden="true" />
                </NavLink>
              ))}
            </Fragment>
          ))}
        </nav>
        <div className="workspace-sidebar-footer">
          <div className="workspace-account"><span><UserRound size={16} aria-hidden="true" /></span><div><small>{role}</small><strong>{user.username || "Tài khoản"}</strong></div></div>
          <button type="button" onClick={logout} className="btn-ghost workspace-sidebar-logout" aria-label="Đăng xuất"><LogOut size={17} aria-hidden="true" /></button>
        </div>
      </aside>
      <main ref={mainRef} id="workspace-main" tabIndex={-1} className="admin-content workspace-content">
        <header className="workspace-contextbar">
          <div><small>{activeLink?.group || role}</small><strong>{activeLink?.label || title}</strong></div>
          <span>Xin chào, <b>{user.username || "Quản trị viên"}</b></span>
        </header>
        <div className="workspace-route-stage" key={routeKey}><Suspense fallback={<AppLoader inline />}><Outlet /></Suspense></div>
      </main>
      <div className="admin-toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertCircle : Info;
          return (
            <div key={toast.id} className={`admin-toast is-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
              <Icon size={18} aria-hidden="true" />
              <span>{toast.message}</span>
              <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} aria-label="Đóng thông báo">
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
